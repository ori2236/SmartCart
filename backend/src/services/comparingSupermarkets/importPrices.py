import aiohttp
import asyncio
from bs4 import BeautifulSoup
import pandas as pd
from itertools import combinations
from collections import defaultdict
import re
from pymongo import UpdateOne
from datetime import datetime, timezone, timedelta
import sys
import os

SEMAPHORE = asyncio.Semaphore(30)

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))
from src.db.db import get_db

db = get_db()
find_stores = db["FindStores"]
find_prices = db["FindPrices"]
find_stores.create_index([("cart_address", 1), ("product_name", 1)])
find_prices.create_index([("product_name", 1), ("store_name", 1), ("store_address", 1)])

def is_store_list_fresh(last_updated):
    if last_updated is None:
        return False
    last_updated = last_updated.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) - last_updated < timedelta(days=2)

def is_price_fresh(last_updated):
    if last_updated is None:
        return False
    last_updated = last_updated.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) - last_updated < timedelta(hours=2)


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

async def get_store_data_from_db(shopping_address, product_list):
    fresh_data = {}
    outdated_prices = []
    outdated_stores = []

    query = {"cart_address": shopping_address, "product_name": {"$in": product_list}}
    store_entries = {entry["product_name"]: entry for entry in find_stores.find(query)}
    price_entries = {
        (entry["product_name"], entry["store_name"], entry["store_address"]): entry
        for entry in find_prices.find({"product_name": {"$in": product_list}})
    }
    
    for product in product_list:
        store_entry = store_entries.get(product)
        if store_entry and is_store_list_fresh(store_entry.get("last_updated")):
            store_list = store_entry.get("stores", [])
        else:
            outdated_stores.append(product)
            store_list = []

        fresh_data[product] = {}

        
        for store_name, store_address in store_list:
            product_info = price_entries.get((product, store_name, store_address), None)
            
            if product_info and is_price_fresh(product_info.get("last_updated")):
                fresh_data[product][(store_name, store_address)] = {
                    "Regular Price": product_info["regular_price"],
                    "Sale Price": product_info["sale_price"],
                    "Required Quantity": product_info["required_quantity"]
                }
            else:
                outdated_prices.append((product, store_name, store_address))

    return fresh_data, set(outdated_prices), set(outdated_stores)

async def fetch_and_update_store_list(outdated_stores, shopping_address, store_data):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_store_data(session, product, shopping_address) for product in outdated_stores]
        results = await asyncio.gather(*tasks)

    bulk_updates_find_prices = []
    bulk_updates_find_stores = []
    for product, stores in zip(outdated_stores, results):
        if stores:
            store_list = list(stores.keys())  # [(store_name, store_address)]
            bulk_updates_find_stores.append(UpdateOne(
                {"cart_address": shopping_address, "product_name": product},
                {"$set": {"stores": store_list, "last_updated": datetime.now(timezone.utc)}},
                upsert=True
            ))

            for (store_name, store_address), data in stores.items():
                bulk_updates_find_prices.append(UpdateOne(
                    {"store_name": store_name, "store_address": store_address, "product_name": product},
                    {"$set": {
                        "regular_price": data["Regular Price"],
                        "sale_price": data["Sale Price"],
                        "required_quantity": data["Required Quantity"],
                        "last_updated": datetime.now(timezone.utc)
                    }},
                    upsert=True
                ))

                if product not in store_data:
                    store_data[product] = {}
                store_data[product][(store_name, store_address)] = {
                    "Regular Price": data["Regular Price"],
                    "Sale Price": data["Sale Price"],
                    "Required Quantity": data["Required Quantity"]
                }

    if bulk_updates_find_prices:
        find_prices.bulk_write(bulk_updates_find_prices)
    if bulk_updates_find_stores:
        find_stores.bulk_write(bulk_updates_find_stores)


async def fetch_and_update_db(outdated_prices, shopping_address, store_data):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_store_data(session, product, shopping_address) for product, _, _ in outdated_prices]
        results = await asyncio.gather(*tasks)

    for (product, store_name, store_address), stores in zip(outdated_prices, results):
        if stores and (store_name, store_address) in stores:
            data = stores[(store_name, store_address)]
            
            find_prices.update_one(
                {"store_name": store_name, "store_address": store_address, "product_name": product},
                {"$set": {
                    "regular_price": data["Regular Price"],
                    "sale_price": data["Sale Price"],
                    "required_quantity": data["Required Quantity"],
                    "last_updated": datetime.now(timezone.utc)
                }},
                upsert=True
            )

            if product not in store_data:
                store_data[product] = {}
            store_data[product][(store_name, store_address)] = {
                "Regular Price": data["Regular Price"],
                "Sale Price": data["Sale Price"],
                "Required Quantity": data["Required Quantity"]
            }


def filter_stores(store_data, product_list):
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




def find_best_combinations(store_data, stores_missing_products, product_list):
    problematic_products = list(stores_missing_products.keys())
    
    for r in range(1, len(problematic_products)):
        for combo in combinations(problematic_products, r):
            remaining_products = [p for p in product_list if p not in combo]
            
            #amount of supermarket branches that sells the remaining_products
            temp_filtered_data, _ = filter_stores(store_data, remaining_products)
            new_store_count = len(temp_filtered_data)
            
            if new_store_count >= 5:
                return list(combo)

    return []

def get_store_data(shopping_address, cart_quantities):
    product_list = list(cart_quantities.keys())
    store_data, outdated_prices, outdated_stores = asyncio.run(get_store_data_from_db(shopping_address, product_list))
    
    if outdated_stores:
        asyncio.run(fetch_and_update_store_list(outdated_stores, shopping_address, store_data))
    if outdated_prices:
        asyncio.run(fetch_and_update_db(outdated_prices, shopping_address, store_data))

    filtered_data, stores_missing_products = filter_stores(store_data, product_list)
    records = []
    for (store, address), data in filtered_data.items():
        row = {"Store": store, "Address": address}
        for product, price_info in data.items():
            if not isinstance(price_info, dict):  
                continue

            required_quantity = price_info.get("Required Quantity")
            user_quantity = cart_quantities.get(product, 0)

            if required_quantity and user_quantity >= required_quantity:
                row[product] = price_info["Sale Price"]
            else:
                row[product] = price_info["Regular Price"]

            row[f"{product} (Regular Price)"] = price_info["Regular Price"]
            row[f"{product} (Sale Price)"] = price_info["Sale Price"]
            row[f"{product} (Required Quantity)"] = required_quantity

        records.append(row)


    # optimization suggestion if less then 5 supermarkets is suggesting
    recommended_removals = []
    if len(filtered_data) < 5:
        recommended_removals = find_best_combinations(store_data, stores_missing_products, product_list)

    return pd.DataFrame(records), recommended_removals
"""
if __name__ == "__main__":
    try:
        shopping_address = "יששכר 1, נתניה"
        cart_quantities = {"שוקולד חלב במילוי קרם ווניל ושבבי עוגיות אוראו, 100 גרם": 1,
                           "טופי ממולא בטעמי פירות, 600 גרם": 2,
                           "חלב תנובה טרי 3% בקרטון, 1 ליטר": 6,
                           "טופי מקלוני טופי, 450 גרם": 1}
        df, recommended_removals = get_store_data(shopping_address, cart_quantities)
        
        # Save to CSV file
        df.to_csv('store_comparison_data.csv', index=False, encoding='utf-8-sig')
        
        print("Done")
    except Exception as e:
        print("error", e)
"""