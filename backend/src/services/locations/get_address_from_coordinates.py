import requests

def get_address_from_coordinates(lat, lon):
    """
    Function to retrieve an address based on coordinates (Reverse Geocoding)
    """
    base_url = "https://nominatim.openstreetmap.org/reverse"
    params = {
        "lat": lat,
        "lon": lon,
        "format": "json",
        "addressdetails": 1
    }

    headers = {
        "User-Agent": "SmartCartApp (contact: your-email@example.com)"
    }

    try:
        response = requests.get(base_url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()

        if "address" in data:
            return True, data["display_name"]
        else:
            return False, "Address not found for the given coordinates"
    except requests.RequestException as e:
        return False, f"Error accessing the API: {e}"

latitude = 32.3002049
longitude = 34.87710044177199

success, result = get_address_from_coordinates(latitude, longitude)

if success:
    print(f"The address is: {result}")
else:
    print(f"Error: {result}")
