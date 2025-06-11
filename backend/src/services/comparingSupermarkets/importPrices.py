import aiohttp
import asyncio
from bs4 import BeautifulSoup
import pandas as pd
from itertools import combinations
from collections import defaultdict
import re
from pymongo import UpdateOne
from datetime import datetime, timezone
import sys
import os

"""
import time
from functools import wraps

def measure_time(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        elapsed_time = end_time - start_time
        print(f"{func.__name__} took {elapsed_time:.4f} seconds")
        return result
    return wrapper
"""

SEMAPHORE = asyncio.Semaphore(30)

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))
from src.db.index import get_db

db = get_db()
find_stores = db["findStores"]
find_prices = db["findPrices"]
not_found = db["notFoundStores"]


def parse_discount_text(discount_text):
    required_quantity = 1
    match = re.search(r"(?:(\d+) יחידות ב|קנה אחד, קבל את השני ב)|(\d+\.\d+) ש״ח", discount_text)
    
    if match:
        if match.group(1):  # match to quantity
            required_quantity = int(match.group(1))
        elif "קנה אחד, קבל את השני ב" in discount_text:
            required_quantity = 2
    
    return required_quantity

async def fetch_store_data(session, product_name, shopping_address):
    async with SEMAPHORE:
        url = "https://chp.co.il/main_page/compare_results"
        params = {"shopping_address": shopping_address, "product_name_or_barcode": product_name}

        async with session.get(url, params=params) as response:
            if response.status != 200:
                return None

            soup = BeautifulSoup(await response.text(), "html.parser")
            table = soup.find("table", {"class": "table results-table"})
            if not table:
                return None

            stores = {}
            for row in table.find_all("tr")[1:]:  # skip titles
                cols = [col.text.strip() for col in row.find_all("td")]
                if len(cols) >= 4:
                    store_name, address = cols[0], cols[2]
                    regular_price = cols[-1]
                    sale_price = re.sub(r"[^\d.]", "", cols[-2])  # only numbers and "."
                    required_quantity = None
                    discount_button = row.find("button", class_="btn-discount")
                    if discount_button:
                        discount_text = discount_button["data-discount-desc"]
                        required_quantity = parse_discount_text(discount_text)
                            
                    stores[(store_name, address)] = {
                        "Regular Price": float(regular_price) if regular_price else None,
                        "Sale Price": float(sale_price) if sale_price else None,
                        "Required Quantity": required_quantity,
                        "Last Updated": datetime.now(timezone.utc),
                    }

        return stores

def filterStores(store_data, product_list):
    filtered_data = defaultdict(dict)
    stores_missing_products = defaultdict(set)

    # change the structure of the store_data
    store_to_products = defaultdict(dict)
    for product, stores in store_data.items():
        for (store, address), data in stores.items():
            store_to_products[(store, address)][product] = data

    for (store, address), products in store_to_products.items():
        missing_products = set(product_list) - set(products.keys())

        if missing_products:
            for product in missing_products:
                stores_missing_products[product].add((store, address))
        else:
            filtered_data[(store, address)] = products
    return dict(filtered_data), dict(stores_missing_products)


def recommendedToRemove(store_data, stores_missing_products, product_list):
    problematic_products = list(stores_missing_products.keys())
    
    for r in range(1, len(problematic_products)):
        for combo in combinations(problematic_products, r):
            remaining_products = [p for p in product_list if p not in combo]
            
            #amount of supermarket branches that sells the remaining_products
            temp_filtered_data, _ = filterStores(store_data, remaining_products)
            new_store_count = len(temp_filtered_data)
            
            if new_store_count >= 5:
                return list(combo)

    return []

def clean_address(address):
    address = address.strip()
    if address.endswith("ישראל"):
        address = address[:-len("ישראל")].strip(", ").strip()
    address = address.rstrip(", ").strip()
    return address

def storesFromDB(shopping_address, products):
    docs = list(find_stores.find({
        "cart_address": shopping_address,
        "product_name": {"$in": products}
    }))
    return {d["product_name"]: d["stores"] for d in docs}


async def updateMissingStores(session, shopping_address, missing_products):
    now = datetime.utcnow()
    new_lists = {}
    bulkStores = []
    bulkPrices = []

    #fetch from CHP
    #stores: {(storeName, address) → {Regular Price, Sale Price, Required Quantity}}
    tasks = {
      p: fetch_store_data(session, p, shopping_address)
      for p in missing_products
    }
    results = await asyncio.gather(*tasks.values())
    
    for p, stores in zip(tasks.keys(), results):
        stores = stores or {}
        #the selling stores without http (no websites)
        sellingStores = [
            (sn, addr)
            for sn, addr in stores.keys()
            if "http" not in addr.lower()
        ]
        new_lists[p] = sellingStores

        #update findStore in database
        bulkStores.append(UpdateOne(
            {"cart_address": shopping_address, "product_name": p},
            {"$set": {"stores": sellingStores, "last_updated": now}},
            upsert=True
        ))
        #update findPrice in database
        for (sn, addr), prices in stores.items():
            bulkPrices.append(UpdateOne(
                {"product_name": p, "store_name": sn, "store_address": addr},
                {"$set": {
                    "regular_price": prices["Regular Price"],
                    "sale_price":   prices["Sale Price"],
                    "required_quantity": prices["Required Quantity"],
                    "last_updated": now
                }},
                upsert=True
            ))
    
    if bulkPrices:
        find_prices.bulk_write(bulkPrices)
    if bulkStores:
        find_stores.bulk_write(bulkStores)
    return new_lists

def pricesFromDB(products, sellingAllStores):
    findFromDB = list(find_prices.find({ "product_name": {"$in": products} }))

    #only the ones in sellingAllStores
    allowed = set(sellingAllStores)
    prices = {}
    for db in findFromDB:
        key = (db["product_name"], db["store_name"], db["store_address"])
        if (db["store_name"], db["store_address"]) in allowed:
            prices[key] = db

    return prices


async def updateMissingPrices(session, shopping_address, products, sellingStores, prices):
    now = datetime.utcnow()
    
    to_fetch_map = defaultdict(list)
    for p in products:
        for sn, addr in sellingStores:
            if (p, sn, addr) not in prices:
                to_fetch_map[p].append((sn, addr))

    tasks = {
        p: fetch_store_data(session, p, shopping_address)
        for p in to_fetch_map
    }
    results = await asyncio.gather(*tasks.values())


    for p, stores in zip(tasks.keys(), results):
        stores = stores or {}
        for sn, addr in to_fetch_map[p]:
            data = stores.get((sn, addr))
            if not data or "http" in addr.lower():
                continue
            prices[(p, sn, addr)] = {
                "regular_price": data["Regular Price"],
                "sale_price": data["Sale Price"],
                "required_quantity": data["Required Quantity"],
                "last_updated": now
            }

            find_prices.update_one(
                {"product_name": p, "store_name": sn, "store_address": addr},
                {"$set": prices[(p, sn, addr)]},
                upsert=True
            )
    return prices

async def get_store_data(shopping_address, cart_quantities):
    shopping_address = clean_address(shopping_address)
    products = list(cart_quantities.keys())

    async with aiohttp.ClientSession() as session:
        #import stores from the database per product in the cart area
        #{(storeName, address) → {Regular Price, Sale Price, Required Quantity}}
        store_lists = storesFromDB(shopping_address, products)

        not_found_docs = list(not_found.find({
            "cart_address": shopping_address
        }))
        not_found_set = {doc["productId"] for doc in not_found_docs}

        #fetch stores from CHP if not in the database
        missing_products = [
            p for p in products
            if p not in store_lists and p not in not_found_set
        ]

        if missing_products:
            #product -> list of (store, address)
            new_lists = await updateMissingStores(session, shopping_address, missing_products)
            store_lists.update(new_lists)


        #find the stores that selling all the products
        store_data = {
            p: {tuple(s): None for s in store_lists[p]}
            for p in products
        }
        filtered_data, stores_missing = filterStores(store_data, products)
        #without http (no websites)
        sellingAllStores = [
            (sn, addr)
            for sn, addr in filtered_data.keys()
            if "http" not in addr.lower()
        ]

        #find the prices from the database
        prices = pricesFromDB(products, sellingAllStores)

        #fetch prices if not in the database
        prices = await updateMissingPrices(session, shopping_address, products, sellingAllStores, prices)
        
        #build Dataframe
        records = []
        for sn, addr in sellingAllStores:
            row = {"Store": sn, "Address": addr}
            for p in products:
                price = prices.get((p, sn, addr))
                if not price:
                    break
                qty = cart_quantities[p]
                req = price["required_quantity"]
                row[p] = price["sale_price"] if req and qty >= req else price["regular_price"]
                row[f"{p} (Regular Price)"] = price["regular_price"]
                row[f"{p} (Sale Price)"] = price["sale_price"]
                row[f"{p} (Required Quantity)"] = req
            else:
                records.append(row)

        #optimization suggestion if less then 5 supermarkets is suggesting
        recommended_removals = []
        if len(records) < 5:
            recommended_removals = recommendedToRemove(
                store_data, stores_missing, products
            )

    return pd.DataFrame(records), recommended_removals

"""
if __name__ == "__main__":
    try:
        shopping_address = "יששכר 1, נתניה"
        cart_quantities = {"שוקולד חלב במילוי קרם ווניל ושבבי עוגיות אוראו, 100 גרם": 1,
                           "חלב תנובה טרי 3% בקרטון, 1 ליטר": 6,}
        df, recommended_removals = asyncio.run(
            get_store_data(shopping_address, cart_quantities)
        )
        # Save to CSV file
        df.to_csv('store_comparison_data.csv', index=False, encoding='utf-8-sig')
        
        print("Done")
    except Exception as e:
        print("error", e)
"""
