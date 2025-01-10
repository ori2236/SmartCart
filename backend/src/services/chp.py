import requests
import json
import sys

# הגדרת קידוד UTF-8
sys.stdout.reconfigure(encoding='utf-8')

# URL הבסיס
url = "https://chp.co.il/autocompletion/product_extended"

# פרמטרים לחיפוש
params = {
    "term": "חלב",  # מילת החיפוש
    "from": 0,
    "u": "0.3687824447572643",  # מזהה ייחודי (יכול להשתנות)
    "shopping_address": "נתניה",
    "shopping_address_city_id": 7400,
    "shopping_address_street_id": 9000,
}

# Headers כפי שנראה ב-Network
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Referer": "https://chp.co.il/",
    "X-Requested-With": "XMLHttpRequest",
}

# שליחת הבקשה
response = requests.get(url, params=params, headers=headers)

# בדיקת סטטוס
if response.status_code == 200:
    # עיבוד התוצאה
    results = response.json()  # המרת התגובה ל-JSON
    products = []
    for product in results:
        if "label" in product and product["label"] != "↓ הצג ערכים נוספים ↓":
            products.append({"label": product["label"]})  # בניית רשימת המוצרים

    # הדפסת התוצאה כ-JSON
    print(json.dumps(products, ensure_ascii=False, indent=4))
else:
    # החזרת שגיאה במקרה של סטטוס שאינו תקין
    print(json.dumps({"error": f"Request failed with status code: {response.status_code}"}, ensure_ascii=False))
