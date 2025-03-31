import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

if len(sys.argv) < 3:
    print(json.dumps({"error": "Missing required arguments: term and shopping_address"}, ensure_ascii=False))
    sys.exit(1)

term = sys.argv[1]
shopping_address = sys.argv[2]

url = "https://chp.co.il/autocompletion/product_extended"

params = {
    "term": term,
    "shopping_address": shopping_address,
}

response = requests.get(url, params=params)

if response.status_code == 200:
    results = response.json()
    
    products = []
    for product in results:
        if "label" in product and product["label"] != "↓ הצג ערכים נוספים ↓":
            products.append({"label": product["label"]})

    print(json.dumps(products, ensure_ascii=False, indent=4))

else:
    print(json.dumps({"error": f"Request failed with status code: {response.status_code}"}, ensure_ascii=False))
