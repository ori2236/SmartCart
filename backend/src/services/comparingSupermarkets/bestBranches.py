import pandas as pd
import math
from importPrices import get_store_data

from distance_calculator import calculate_distances
from src.db.index import get_db
from pymongo.errors import BulkWriteError

import asyncio

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

    @measure_time
"""
db = get_db()
distance_collection = db["distances"]

async def get_distances(cart_address, address_list):
    existing_docs = distance_collection.aggregate([
        {"$match": {"from": cart_address, "to": {"$in": address_list}}},
        {"$project": {"to": 1, "distance": 1, "_id": 0}}
    ])
    existing_map = {doc["to"]: doc["distance"] for doc in existing_docs}

    missing_addresses = [addr for addr in address_list if addr not in existing_map]

    result_distances = [
        {"from": cart_address, "to": addr, "distance": existing_map[addr]}
        for addr in existing_map
    ]

    if missing_addresses:
        new_distances_raw = await calculate_distances(cart_address, missing_addresses)
        new_docs = []
        for d in new_distances_raw:
            if d["Distance (km)"] is not None:
                doc = {
                    "from": cart_address,
                    "to": d["Address"],
                    "distance": d["Distance (km)"]
                }
                result_distances.append(doc)
                new_docs.append(doc)
                
        if new_docs:
            try:
                distance_collection.insert_many(new_docs, ordered=False)
            except BulkWriteError:
                pass
    return result_distances


def calculate_total_price(unit_price, quantity, sale_price, required_quantity):
    if (pd.isna(sale_price) or pd.isna(required_quantity)):
        return unit_price * quantity
    num_of_discount_groups = quantity // required_quantity  # times to use the discount
    remaining_units = quantity % required_quantity  # times to use regular price
    
    total_price = (num_of_discount_groups * sale_price * required_quantity) + (remaining_units * unit_price)
    return total_price

async def get_best_supermarkets(cart, address, alpha):
    df, recommended_removals = await get_store_data(address, cart) #send the products
    if df.empty:
        return [], recommended_removals
    # price columns (second and above)
    price_columns = df.columns[2:]  
    for product in cart:
        if product in price_columns:
            df[f"{product} (Total Price)"] = df.apply(
                lambda row: calculate_total_price(
                    unit_price=row[f"{product} (Regular Price)"],
                    quantity=cart[product],
                    sale_price=row[f"{product} (Sale Price)"],
                    required_quantity=row[f"{product} (Required Quantity)"]
                ),
                axis=1
            )
    df['price'] = df[[col for col in df.columns if "(Total Price)" in col]].sum(axis=1, min_count=1)
    store_addresses = df['Address'].tolist()
    
    distance_results = await get_distances(address, store_addresses)
    if not distance_results:
        return [], recommended_removals
    
    distance_map = {entry["to"]: entry["distance"] for entry in distance_results}

    df['distance'] = df['Address'].map(distance_map)

    df = df[df['distance'] <= 10]

    if df.empty:
        return [], recommended_removals

    # scores
    max_price, min_price = df['price'].max(), df['price'].min()
    if max_price == min_price:
        df['price_score'] = 10
    else:
        df['price_score'] = 10 - 9 * (df['price'] - min_price) / (max_price - min_price)

    too_far = 5  #maximum relevant distance in km
    df['distance_score'] = 10 - 9 * (df['distance'] / too_far)
    df['distance_score'] = df['distance_score'].clip(lower=1, upper=10) #scale score between 1 and 10

    # final score
    df['final_score'] = (alpha * df['price_score'] + (1 - alpha) * df['distance_score'])
    df['final_score'] = (df['final_score'] / 2).clip(upper=5).apply(math.ceil) #final_score to 1-5: dividing by 2 and rounding up, 5 max
    
    price_cols = [f"{product}" for product in cart]

    # make sure the column dtype can hold None
    df[price_cols] = df[price_cols].astype(object)

    #insert None if null
    df[price_cols] = df[price_cols].where(df[price_cols].notna(), other=None)
    
    #add the price per product
    df['product_prices'] = df[price_cols].to_dict(orient="records")

    #sort by final score (descending order) and return top 5
    columns_to_keep = ['Store', 'Address', 'price', 'distance', 'final_score', 'product_prices']
    top_5_supermarkets = df.sort_values(by='final_score', ascending=False).head(5)[columns_to_keep]
    return top_5_supermarkets.to_dict(orient="records"), recommended_removals


async def main():
    try:
        alpha = 0.5
        address = "יששכר 1, נתניה"
        """
        cart ={
            'נוטלה ממרח אגוז, 750 גרם': 5,
            'חלב דל לקטוז 2% קרטון, 1 ליטר': 2,
            'פיינט קרם עוגיות, 500 מ"ל': 1,
            'שקדי מרק, 400 גרם': 1,
            'קטשופ, 700 גרם': 1,
            'מילקי מעדן חלב בטעם שוקולד עם קצפת, 170 מ"ל': 1,
            'שוקולית אבקה להכנת משקה בטעם שוקו, 500 גרם': 2
        }
        """
        cart ={
            'חלב תנובה טרי 3% בקרטון, 1 ליטר': 5,
            'נוטלה ממרח אגוז, 750 גרם': 5,
            'קפה נמס רד מאג, 200 גרם': 1,
            'שוקולית אבקה להכנת משקה בטעם שוקו, 500 גרם': 1,
            'יין כרמל סלקטד מרלו, 750 מ"ל': 1
        }
        
        supermarkets, recommendations = await get_best_supermarkets(cart, address, alpha)
        output = {"supermarkets": supermarkets, "recommendations": recommendations}
        print(output)

    except Exception as e:
        print("error", e)

if __name__ == "__main__":
    asyncio.run(main())
