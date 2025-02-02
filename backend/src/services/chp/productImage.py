import requests
from bs4 import BeautifulSoup
import urllib.parse
import json
import sys

BASE_URL = "https://chp.co.il"

def get_product_image_base64(location, product_name):
    try:
        encoded_product_name = urllib.parse.quote(product_name)
        url = f"{BASE_URL}/{location}/0/0/{encoded_product_name}"

        response = requests.get(url)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch URL: {url} (status code: {response.status_code})")

        soup = BeautifulSoup(response.text, 'html.parser')

        img_tag = soup.find('img', {'data-uri': True})
        if not img_tag:
            raise Exception(f"Image with Base64 data not found on page: {url}")

        base64_data = img_tag['data-uri']
        return base64_data

    except Exception as e:
        return json.dumps({"error": str(e)}, ensure_ascii=False)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing required arguments: location and product_name"}, ensure_ascii=False))
        sys.exit(1)

    location = sys.argv[1]
    product_name = sys.argv[2]

    result = get_product_image_base64(location, product_name)
    print(json.dumps({"image": result}, ensure_ascii=False))
