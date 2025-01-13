import requests
import os
os.environ['PYTHONDONTWRITEBYTECODE'] = "1"

def check_address_osm(address):
    base_url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": address + ", ישראל",
        "format": "json",
        "addressdetails": 1,
        "limit": 1
    }

    headers = {
        "User-Agent": "SmartCartApp (contact: your-email@example.com)"
    }

    try:
        response = requests.get(base_url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()

        if len(data) > 0:
            lat = float(data[0]["lat"])
            lon = float(data[0]["lon"])
            return True, (lat, lon)
        else:
            return False, "Address not found"
    except requests.RequestException as e:
        return False, f"Error accessing the API: {e}"
