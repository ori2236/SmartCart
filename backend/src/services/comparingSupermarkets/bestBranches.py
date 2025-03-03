import pandas as pd
import json
import sys
import base64
import math
from distance_calculator import calculate_distances
from importPrices import get_store_data

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
    
def round_price(price):
    rounded = round(math.ceil(price * 100) / 100, 2)
    if str(rounded)[-1] == "1": #the price after division shouldn't end with x.x1
        rounded = round(rounded - 0.01, 2)
    if str(rounded)[-1] == "9": #the price after division shouldn't end with x.x9
        rounded = round(rounded + 0.01, 2)
    return rounded # 2 digits


def calculate_unit_prices(row, cart):
        product_prices = {}
        for product in cart:
            if pd.notna(row[product]) and cart[product] > 0: #not NaN
                product_prices[product] = round_price(row[product] / cart[product])
            else:
                product_prices[product] = None
        return product_prices

def get_best_supermarkets(cart, address, alpha):

    df, recommended_removals = get_store_data(list(cart.keys()), address)

    if df.empty:
        return None, []


    # price columns (second and above)
    price_columns = df.columns[2:]  
    for product in cart:
        if product in df.columns:
            df[product] = df[product].apply(pd.to_numeric, errors='coerce') * cart[product]

    df['price'] = df[price_columns].sum(axis=1).apply(round_price)


    store_addresses = df['Address'].tolist()
    distance_results = calculate_distances(address, store_addresses)
    distance_map = {entry["Address"]: entry["Distance (km)"] for entry in distance_results}

    df['distance'] = df['Address'].map(distance_map)

    # scores
    max_price, min_price = df['price'].max(), df['price'].min()
    df['price_score'] = df['price'].apply(lambda x: price_score(x, max_price, min_price))
    df['distance_score'] = df['distance'].apply(distance_score)

    # final score
    df['final_score'] = (alpha * df['price_score'] + (1 - alpha) * df['distance_score'])
    df['final_score'] = df['final_score'].apply(lambda x: min(5, math.ceil(x / 2)))


    # add the price per product
    df['product_prices'] = df.apply(lambda row: calculate_unit_prices(row, cart), axis=1)


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

        supermarkets, recommendations = get_best_supermarkets(cart, address, alpha)
        output = {"supermarkets": supermarkets, "recommendations": recommendations}
        print(json.dumps(output))
    except Exception as e:
        print(json.dumps({"error": str(e)}))


