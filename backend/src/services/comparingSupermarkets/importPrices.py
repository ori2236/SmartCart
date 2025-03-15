import aiohttp
import asyncio
from bs4 import BeautifulSoup
import pandas as pd
from itertools import combinations
import re

def parse_discount_text(discount_text):
    required_quantity = 1

    sale_price_match = re.search(r"מחיר ליחידה (\d+\.\d+)", discount_text)
    
    if sale_price_match:
        quantity_match = re.search(r"(\d+) יחידות ב", discount_text)
        if quantity_match:
            required_quantity = int(quantity_match.group(1))
        else:
            sale_price_match = re.search(r"קנה אחד, קבל את השני ב", discount_text)
            if sale_price_match:
                required_quantity = 2
    else:    
        sale_price_match = re.search(r"קנה אחד, קבל את השני ב-(\d+\.\d+) ש״ח", discount_text)
        if sale_price_match:
            required_quantity = 2
        else:
            sale_price_match = re.search(r"(\d+\.\d+) ש״ח", discount_text)

    return required_quantity

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
                required_quantity = None
                discount_button = row.find("button", class_="btn-discount")
                if discount_button:
                    discount_text = discount_button["data-discount-desc"]
                    required_quantity = parse_discount_text(discount_text)
                    
                    
                stores[(store_name, address)] = {
                    "Regular Price": float(regular_price) if regular_price else None,
                    "Sale Price": float(sale_price) if sale_price else None,
                    "Required Quantity": required_quantity
                }

        return stores

async def fetch_all_products(product_list, shopping_address):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_store_data(session, product, shopping_address) for product in product_list]
        results = await asyncio.gather(*tasks)

    store_data, must_remove = {}, []
    for product, prices in zip(product_list, results):
        if prices:
            for (store, address), price_info in prices.items():
                store_data.setdefault((store, address), {"Store": store, "Address": address})[product] = price_info
        else:
            must_remove.append(product)

    return store_data, must_remove

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

def find_best_combinations(store_data, stores_missing_products, product_list):
    """
    store_data - supermarket branches and thier products
    stores_missing_products - what products in each supermarket branches
    product_list - all the products in the cart
    """
    
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
    store_data, must_remove = asyncio.run(fetch_all_products(product_list, shopping_address))
    filtered_data, stores_missing_products = filter_stores(store_data, product_list)
    
    # convert to DataFrame
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
    df = pd.DataFrame(records)

    # optimization suggestion if less then 5 supermarkets is suggesting
    recommended_removals = []
    if len(filtered_data) < 5:
        recommended_removals = find_best_combinations(store_data, stores_missing_products, product_list)

    return df, recommended_removals

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