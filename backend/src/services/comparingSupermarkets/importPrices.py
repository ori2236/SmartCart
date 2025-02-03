import aiohttp
import asyncio
from bs4 import BeautifulSoup
import pandas as pd
from itertools import combinations
import re

async def fetch_store_data(session, product_name, shopping_address):
    """ Fetches price data for a specific product and address """
    url = "https://chp.co.il/main_page/compare_results"
    params = {
        "shopping_address": shopping_address,
        "product_name_or_barcode": product_name,
    }

    async with session.get(url, params=params) as response:
        if response.status == 200:
            content = await response.text()
            soup = BeautifulSoup(content, "html.parser")

            table = soup.find("table", {"class": "table results-table"})
            if table:
                rows = table.find_all("tr")
                stores = {}
                for row in rows[1:]:  # Skip the title row
                    cols = row.find_all("td")
                    cols = [col.text.strip() for col in cols]
                    if len(cols) >= 4:
                        store_name = cols[0]
                        address = cols[2]
                        regular_price = cols[-1]  # Regular price column
                        sale_price = re.sub(r"[^\d.]", "", cols[-2])  # Sale price column, clean only numbers and "."
                        
                        price = sale_price if sale_price and sale_price != "" else regular_price
                        stores[(store_name, address)] = price
                return stores
            else:
                return None
        else:
            return None

async def fetch_all_products(product_list, shopping_address):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_store_data(session, product, shopping_address) for product in product_list]
        results = await asyncio.gather(*tasks)
        
        store_data = {}
        missing_counts = {product: 0 for product in product_list}

        for product, product_prices in zip(product_list, results):
            if product_prices:
                for (store, address), price in product_prices.items():
                    if (store, address) not in store_data:
                        store_data[(store, address)] = {"Store": store, "Address": address}
                    store_data[(store, address)][product] = price
            else:
                missing_counts[product] += 1

        return store_data, missing_counts

def filter_stores(store_data, product_list):
    filtered_data = {}
    missing_counts = {product: 0 for product in product_list}
    stores_missing_products = {}

    for (store, address), data in store_data.items():
        missing_products = [product for product in product_list if product not in data]
        
        if not missing_products:
            filtered_data[(store, address)] = data
        else:
            for product in missing_products:
                missing_counts[product] += 1
                if product not in stores_missing_products:
                    stores_missing_products[product] = set()
                stores_missing_products[product].add((store, address))

    problematic_products = sorted([(product, count) for product, count in missing_counts.items() if count > 3], key=lambda x: x[1], reverse=True)

    return filtered_data, problematic_products, stores_missing_products

def find_best_combinations(store_data, product_list, problematic_products, stores_missing_products, current_store_count):
    for r in range(1, len(problematic_products) + 1):
        for combo in combinations([p[0] for p in problematic_products], r):
            stores_that_were_excluded = set()
            for product in combo:
                stores_that_were_excluded.update(stores_missing_products.get(product, set()))

            count_new_stores = 0
            for store in stores_that_were_excluded:
                remaining_missing = [p for p in product_list if p not in store_data.get(store, {}) and p not in combo]
                if not remaining_missing:
                    count_new_stores += 1

            # Check if we reach at least 5 stores
            if current_store_count + count_new_stores >= 5:
                return combo, count_new_stores

    return None, 0  # No viable combination found

def get_store_data(product_list, shopping_address):
    """ 
    Fetches store data for the given products and shopping address.
    Returns:
    - DataFrame with store prices
    - List of recommended products to remove (empty if no suggestions)
    """
    store_data, missing_counts = asyncio.run(fetch_all_products(product_list, shopping_address))
    filtered_data, problematic_products, stores_missing_products = filter_stores(store_data, product_list)

    records = []
    for (store, address), data in filtered_data.items():
        record = {"Store": store, "Address": address}
        for product in product_list:
            record[product] = data.get(product, "N/A")
        records.append(record)

    df = pd.DataFrame(records)

    recommended_removals = []
    if len(filtered_data) < 5:
        best_combo, best_combo_gain = find_best_combinations(store_data, product_list, problematic_products, stores_missing_products, len(filtered_data))
        if best_combo:
            recommended_removals = list(best_combo)

    return df, recommended_removals

if __name__ == "__main__":
    # Example usage
    product_list = [
        "חלב",
        "לחם",
        "גבינה",
        "ביצים",
        "שוקולד",
        "פסטה",
        "אורז",
        "קורנפלקס",
        "שמן",
        "סוכר",
        "קמח",
        "מלפפונים",
        "חומוס",
        "טחינה",
        "קפה",
        "תה",
        "מלח",
        "רוטב",
        "קטשופ",
        "מיונז",
        "מילקי",
        "קולה",
        "ספרייט",
        "במבה",
        "ביסלי",
        "שניצל",
        "פיצה",
        "יוגורט",
        "סויה",
        "עמק"
    ]

    shopping_address = "הרב משה צבי נריה 9 נתניה"

    df, recommended_removals = get_store_data(product_list, shopping_address)

    print("Stores selling all products:")
    print(df.to_string(index=False))

    if recommended_removals:
        print("\nOptimization suggestion:")
        print(f"Remove these products: {', '.join(recommended_removals)}")
        print(f"This will increase the number of stores to at least 5.")
    else:
        print("\nNo optimization suggestions available.")
