import pandas as pd
import json
import sys
import base64
import math
import requests
from importPrices import get_store_data

import requests
import json

from distance_calculator import calculate_distances
from src.db.db import get_db
from pymongo.errors import BulkWriteError

db = get_db()
distance_collection = db["distances"]

def get_distances(cart_address, address_list):
    existing_docs = distance_collection.find({
        "from": cart_address,
        "to": {"$in": address_list}
    })

    existing_map = {doc["to"]: doc["distance"] for doc in existing_docs}
    missing_addresses = [addr for addr in address_list if addr not in existing_map]

    result_distances = [
        {"from": cart_address, "to": addr, "distance": existing_map[addr]}
        for addr in existing_map
    ]

    if missing_addresses:
        new_distances_raw = calculate_distances(cart_address, missing_addresses)

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
"""
from distance_calculator import calculate_distances

def get_distances(cart_address, address_list):
    url = "http://localhost:3000/api/distance/distances"
    payload = {
        "from": cart_address,
        "destinations": address_list
    }

    try:
        response = requests.post(url, json=payload)
        if response.status_code != 200:
            return []

        distances = response.json()
        return distances

    except requests.RequestException as e:
        return []
"""
def price_score(price, max_price, min_price):
    if max_price == min_price:
        return 10 
    return 10 - 9 * (price - min_price) / (max_price - min_price)

def distance_score(distance):
    too_far = 5  # maximum relevant distance in km
    if distance >= too_far:
        return 1  # too far
    elif distance <= 0:
        return 10  # very close
    else:
        return 10 - (distance / too_far) * 9  # scale score between 1 and 10


def calculate_total_price(unit_price, quantity, sale_price, required_quantity):
    if (pd.isna(sale_price) or pd.isna(required_quantity)):
        return unit_price * quantity
    num_of_discount_groups = quantity // required_quantity  # times to use the discount
    remaining_units = quantity % required_quantity  # times to use regular price
    
    total_price = (num_of_discount_groups * sale_price * required_quantity) + (remaining_units * unit_price)
    return total_price

def get_best_supermarkets(cart, address, alpha):
    df, recommended_removals = get_store_data(address, cart) #send the products
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
    distance_results = get_distances(address, store_addresses)
    
    if not distance_results:
        return [], recommended_removals
    
    distance_map = {entry["to"]: entry["distance"] for entry in distance_results}

    df['distance'] = df['Address'].map(distance_map)

    df = df[df['distance'] <= 10]

    if df.empty:
        return [], recommended_removals

    # scores
    max_price, min_price = df['price'].max(), df['price'].min()
    df['price_score'] = df['price'].apply(lambda x: price_score(x, max_price, min_price))
    df['distance_score'] = df['distance'].apply(distance_score)

    # final score
    df['final_score'] = (alpha * df['price_score'] + (1 - alpha) * df['distance_score'])
    df['final_score'] = df['final_score'].apply(lambda x: min(5, math.ceil(x / 2))) #final_score to 1-5: dividing by 2 and rounding up, 5 max


    # add the price per product
    df['product_prices'] = df[[f"{product}" for product in cart]].to_dict(orient="records")

    # sort by final score (descending order) and return top 5
    columns_to_keep = ['Store', 'Address', 'price', 'distance', 'final_score', 'product_prices']
    top_5_supermarkets = df.sort_values(by='final_score', ascending=False).head(5)[columns_to_keep]

    return top_5_supermarkets.to_dict(orient="records"), recommended_removals

def decode_base64(encoded_str):
    decoded_bytes = base64.b64decode(encoded_str)
    return json.loads(decoded_bytes.decode('utf-8'))

if __name__ == "__main__":
    try:
        
        cart = decode_base64(sys.argv[1])
        address = sys.argv[2]
        alpha = float(sys.argv[3])

        """
        alpha = 0.5
        address = "יששכר 1, נתניה"
        cart = {
            'חלב תנובה טרי 3% בקרטון, 1 ליטר': 7,
            'נוטלה ממרח אגוז, 750 גרם': 1
            }
        """

        supermarkets, recommendations = get_best_supermarkets(cart, address, alpha)
        output = {"supermarkets": supermarkets, "recommendations": recommendations}

        print(json.dumps(output), flush=True)

    except Exception as e:
        print(json.dumps({"error": str(e)}), flush=True)
