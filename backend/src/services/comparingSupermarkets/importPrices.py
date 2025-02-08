import aiohttp
import asyncio
from bs4 import BeautifulSoup
import pandas as pd
from itertools import combinations
import re

async def fetch_store_data(session, product_name, shopping_address):
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
                price = sale_price if sale_price else regular_price
                stores[(store_name, address)] = price
        return stores

async def fetch_all_products(product_list, shopping_address):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_store_data(session, product, shopping_address) for product in product_list]
        results = await asyncio.gather(*tasks)

    store_data = {}
    for product, prices in zip(product_list, results):
        if prices:
            for (store, address), price in prices.items():
                store_data.setdefault((store, address), {"Store": store, "Address": address})[product] = price

    return store_data

def filter_stores(store_data, product_list):
    filtered_data, stores_missing_products = {}, {}

    for (store, address), data in store_data.items():
        missing_products = [p for p in product_list if p not in data]

        if not missing_products:
            filtered_data[(store, address)] = data
        else:
            for product in missing_products:
                stores_missing_products.setdefault(product, set()).add((store, address))

    return filtered_data, stores_missing_products


def find_best_combinations(store_data, stores_missing_products, current_store_count):
    problematic_products = list(stores_missing_products.keys())
    # 5 products top
    for r in range(1, min(len(problematic_products), 5) + 1):
        for combo in combinations(problematic_products, r):
            
            new_store_count = 0 
            for store in store_data:
                store_products = store_data.get(store, set())
                is_relevant = all(product not in store_products for product in combo)
                if is_relevant:
                    new_store_count += 1

            if current_store_count + new_store_count >= 5:
                return list(combo)
    
    return []

def get_store_data(product_list, shopping_address):
    store_data = asyncio.run(fetch_all_products(product_list, shopping_address))
    filtered_data, stores_missing_products = filter_stores(store_data, product_list)


    # convert to DataFrame
    records = [{"Store": store, "Address": address, **data} for (store, address), data in filtered_data.items()]

    df = pd.DataFrame(records)

    # optimization suggestion if less then 5 supermarkets is suggesting
    recommended_removals = []
    if len(filtered_data) < 5:
        recommended_removals = find_best_combinations(store_data, stores_missing_products, len(filtered_data))
    
    return df, recommended_removals