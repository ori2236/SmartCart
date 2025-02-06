import requests
import os
import re
import sys
sys.dont_write_bytecode = True
from dotenv import load_dotenv

load_dotenv()
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

def get_coordinates_from_google_maps(address):
    from urllib.parse import quote
    encoded_address = quote(address)
    url = f"https://www.google.com/maps/search/{encoded_address}"

    try:
        response = requests.get(url)
        if response.status_code == 200:
            text = response.text
            pattern = re.compile(r"\[\s*3,\s*([0-9]+\.[0-9]+),\s*([0-9]+\.[0-9]+)\s*\]")
            matches = pattern.findall(text)
            if matches:
                latitude, longitude = map(float, matches[0])
                return longitude, latitude
    except Exception:
        return None
    return None

def get_coordinates_from_openstreetmap(address):
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": address + ", ישראל", "format": "json"}
    headers = {"User-Agent": "MyProject/1.0 (contact: your_email@example.com)"}

    try:
        response = requests.get(url, params=params, headers=headers)
        data = response.json()
        if data:
            return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception:
        return None
    return None

def get_distance_from_google(origin, destinations):
    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        "origins": origin,
        "destinations": "|".join(destinations),
        "mode": "driving",
        "key": GOOGLE_MAPS_API_KEY
    }
    response = requests.get(url, params=params)
    data = response.json()

    if data["status"] == "OK":
        distances = {}
        for i, destination in enumerate(destinations):
            element = data["rows"][0]["elements"][i]
            distances[destination] = element["distance"]["value"] / 1000 if element["status"] == "OK" else None
        return distances
    return {dest: None for dest in destinations}

def calculate_distances(cart_address, address_list):
    distances = get_distance_from_google(cart_address, address_list)

    updated_distances = {}
    for addr, distance in distances.items():
        if distance is None or distance > 10:
            cart_coords = get_coordinates_from_google_maps(cart_address)
            store_coords = get_coordinates_from_openstreetmap(addr)

            if cart_coords is not None and store_coords is not None:
                lon1, lat1 = cart_coords
                lat2, lon2 = store_coords
                google_distance = get_distance_from_google(f"{lon1},{lat1}", [f"{lat2},{lon2}"])
                d = google_distance.get(f"{lat2},{lon2}", "N/A")
                if d != "N/A":
                    distance = d
                    

        updated_distances[addr] = distance

    return [{"Address": addr, "Distance (km)": dist} for addr, dist in updated_distances.items()]


"""
# example
if __name__ == "__main__":
    cart_address = "הרב נריה 9, נתניה"
    address_list = ["הנופר 4, נתניה", "הפלדה 13, נתניה", "נורדיה 1, נורדיה", "החרמון 6 נתניה", "קלאוזנר 1, נתניה", "יהונתן נתניהו 6, אור יהודה"]

    distances_table = calculate_distances(cart_address, address_list)

    for row in distances_table:
        print(f"Address: {row['Address']}, Distance (km): {row['Distance (km)']}")
"""