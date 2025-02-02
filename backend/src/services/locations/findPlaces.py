import pandas as pd
import os
import re
import requests
from bs4 import BeautifulSoup
import sys
import json
from dotenv import load_dotenv

load_dotenv()
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

sys.stdout.reconfigure(encoding="utf-8")
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))
os.environ['PYTHONDONTWRITEBYTECODE'] = "1"

from src.db.db import get_db
client = get_db()
collection = client["coordinates"]

def get_coordinates_from_db_batch(addresses):
    results = collection.find({"Address": {"$in": addresses}})
    db_results = {res["Address"]: (res["Latitude"], res["Longitude"]) for res in results}
    return {addr: db_results.get(addr, None) for addr in addresses}


def fetch_store_data(product_name, shopping_address):
    url = "https://chp.co.il/main_page/compare_results"
    params = {
        "shopping_address": shopping_address,
        "product_name_or_barcode": product_name,
    }

    response = requests.get(url, params=params)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, "html.parser")
        
        table = soup.find("table", {"class": "table results-table"})
        if table:
            rows = table.find_all("tr")
            stores = []
            for row in rows[1:]:  # skip on the titles
                cols = row.find_all("td")
                cols = [col.text.strip() for col in cols]
                if len(cols) >= 3:
                    store_name = cols[0]
                    address = cols[2]
                    price = cols[-1]
                    stores.append({"Store": store_name, "Address": address, "Price": price})
            return stores
        else:
            return {"error": "Table not found"}
    else:
        return {"error": f"Request failed with status code: {response.status_code}"}


def get_coordinates_from_openstreetmap(address):
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": address + ", ישראל",
        "format": "json",
    }

    try:
        response = requests.get(url, params=params)
        data = response.json()
        if len(data) > 0:
            lat = float(data[0]["lat"])
            lon = float(data[0]["lon"])
            return lat, lon
        else:
            return None
    except Exception as e:
        return None

def get_coordinates_from_google_maps(address):
    from urllib.parse import quote
    encoded_address = quote(address)
    url = f"https://www.google.com/maps/search/{encoded_address}"

    try:
        response = requests.get(url)
        if response.status_code == 200:
            text = response.text
            #find the coordinates inside the URL
            pattern = re.compile(r"\[\s*3,\s*([0-9]+\.[0-9]+),\s*([0-9]+\.[0-9]+)\s*\]")
            matches = pattern.findall(text)

            if matches:
                for match in matches:
                    longitude, latitude = match
                    return float(latitude), float(longitude)
            else:
                return None
        else:
            return None
    except Exception as e:
        return None
    
def get_coordinates_from_google_api(address):
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": address,
        "key": GOOGLE_MAPS_API_KEY
    }

    try:
        response = requests.get(url, params=params, timeout=5)
        data = response.json()

        if "results" in data and len(data["results"]) > 0:
            location = data["results"][0]["geometry"]["location"]
            return location["lat"], location["lng"]
        else:
            return None
    except Exception as e:
        return None
    
def get_coordinates(address, db_results):
    if address in db_results and db_results[address] is not None:
        return db_results[address]
    
    coordinates = get_coordinates_from_openstreetmap(address)
    if coordinates:
        return coordinates
    
    coordinates = get_coordinates_from_google_maps(address)
    if coordinates:
        return coordinates

    coordinates = get_coordinates_from_google_api(address)
    if coordinates:
        return coordinates

    return None


def get_supermarket_coordinates(product_name, cart_address):
    stores_data = fetch_store_data(product_name, cart_address)

    if "error" in stores_data:
        return pd.DataFrame()

    supermarkets = pd.DataFrame(stores_data)

    addresses = supermarkets["Address"].tolist()
    db_results = get_coordinates_from_db_batch(addresses)

    coordinates_list = []

    for addr in supermarkets["Address"]:
        coordinates_list.append(get_coordinates(addr, db_results))

    supermarkets["Coordinates"] = coordinates_list

    valid_supermarkets = supermarkets[supermarkets["Coordinates"].notnull()]
    return valid_supermarkets[['Store', 'Address', 'Coordinates']]

def run_supermarket_fetch(product_name, cart_address):
    result_table = get_supermarket_coordinates(product_name, cart_address)
    return result_table.to_dict(orient="records") if not result_table.empty else []


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python findPlaces.py <product_name> <cart_address>"}))
    else:
        product_name = sys.argv[1]
        cart_address = sys.argv[2]
        result = run_supermarket_fetch(product_name, cart_address)
        print(json.dumps(result, ensure_ascii=False))












"""
import pandas as pd
import os
import re
import requests
from bs4 import BeautifulSoup
import time
import sys
import json
sys.stdout.reconfigure(encoding="utf-8")

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from src.db.db import get_db

import json

os.environ['PYTHONDONTWRITEBYTECODE'] = "1"

GOOGLE_MAPS_API_KEY = "AIzaSyBxjDxmCW6c1uzmWBrbdg-S5OEQN4Qs2pA"

client = get_db()
collection = client["coordinates"]

def get_coordinates_from_db(addresses):
    results = collection.find({"Address": {"$in": addresses}})
    db_results = {res["Address"]: (res["Latitude"], res["Longitude"]) for res in results}
    return db_results

def fetch_store_data(product_name, shopping_address):
    url = "https://chp.co.il/main_page/compare_results"
    params = {
        "shopping_address": shopping_address,
        "product_name_or_barcode": product_name,
    }

    response = requests.get(url, params=params)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, "html.parser")
        
        table = soup.find("table", {"class": "table results-table"})
        if table:
            rows = table.find_all("tr")
            stores = []
            for row in rows[1:]:  # skip on the titles
                cols = row.find_all("td")
                cols = [col.text.strip() for col in cols]
                if len(cols) >= 3:
                    store_name = cols[0]
                    address = cols[2]
                    price = cols[-1]
                    stores.append({"Store": store_name, "Address": address, "Price": price})
            #print("Stores Data:")
            #for store in stores:
                #print(f"Store: {store['Store']}, Address: {store['Address']}, Price: {store['Price']}")
            return stores
        else:
            return {"error": "Table not found"}
    else:
        return {"error": f"Request failed with status code: {response.status_code}"}


def get_coordinates(address):
    cached_coords = get_coordinates_from_db([address])
    if address in cached_coords and cached_coords[address]:
        print(f"address: {address} - retrieved from cache (database). Coordinates: {cached_coords[address]}")
        return cached_coords[address]

    
    print(f"address: {address} - coordinates not found.")
    return None


def get_supermarket_coordinates(product_name, cart_address):
    stores_data = fetch_store_data(product_name, cart_address)

    if "error" in stores_data:
        #print(f"Error fetching store data: {stores_data['error']}")
        return pd.DataFrame()

    supermarkets = pd.DataFrame(stores_data)
    coordinates_list = []

    for addr in supermarkets["Address"]:
        coordinates_list.append(get_coordinates(addr))

    supermarkets["Coordinates"] = coordinates_list

    valid_supermarkets = supermarkets[supermarkets["Coordinates"].notnull()]
    print("amount", len(valid_supermarkets))
    print("the list:\n", valid_supermarkets.to_dict(orient="records"))

    invalid_addresses = supermarkets[supermarkets['Coordinates'].isnull()]['Address'].tolist()

    if invalid_addresses:
        print("\nInvalid addresses (not found by any geocoder):")
        for addr in invalid_addresses:
            print(f"- {addr}")
        print("\n")

    return valid_supermarkets[['Store', 'Address', 'Coordinates']]

def run_supermarket_fetch(product_name, cart_address):
    result_table = get_supermarket_coordinates(product_name, cart_address)
    return result_table.to_dict(orient="records") if not result_table.empty else []

def print_entire_database():
    results = collection.find()
    for res in results:
        print(res)



if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python findPlaces.py <product_name> <cart_address>"}))
    else:
        print("Printing all records in the database:")
        print_entire_database()
        product_name = "חלב תנובה טרי 3%",
        cart_address = "הרב משה צבי נריה 9 נתניה"
        result = run_supermarket_fetch(product_name, cart_address)
        print(json.dumps(result, ensure_ascii=False))
"""