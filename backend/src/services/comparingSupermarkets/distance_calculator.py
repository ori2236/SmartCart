import math
from geocoding import check_address_osm


def haversine_distance(coord1, coord2):
    R = 6371  # Radius of the Earth in km
    lat1, lon1 = coord1
    lat2, lon2 = coord2

    # Convert degrees to radians
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    # Haversine formula
    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

def calculate_distance(address1, address2):
    """
    Calculate the distance between two addresses
    :param address1: First address
    :param address2: Second address
    :return: Distance in kilometers or an error message
    """
    success1, result1 = check_address_osm(address1)
    success2, result2 = check_address_osm(address2)

    if success1 and success2:
        coord1 = result1
        coord2 = result2
        distance = haversine_distance(coord1, coord2)
        # Distance in KM
        return distance
    elif not success1:
        return f"Error: The first address was not found ({result1})"
    elif not success2:
        return f"Error: The second address was not found ({result2})"

# Example usage:
if __name__ == "__main__":
    address1 = "הרב נריה 9, נתניה"
    address2 = "הנופר 4, נתניה"

    print(calculate_distance(address1, address2))
