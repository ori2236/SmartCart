"""import requests
from bs4 import BeautifulSoup
import urllib.parse

# כתובת בסיסית של האתר
BASE_URL = "https://chp.co.il"

def get_product_image_base64(location, product_name):
    # יצירת ה-URL המבוסס על המיקום ושם המוצר
    encoded_product_name = urllib.parse.quote(product_name)
    url = f"{BASE_URL}/{location}/0/0/{encoded_product_name}"

    # שליחת בקשה לאתר
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch URL: {url} (status code: {response.status_code})")

    # ניתוח ה-HTML עם BeautifulSoup
    soup = BeautifulSoup(response.text, 'html.parser')

    # מציאת תגית ה-img עם נתוני ה-Base64
    img_tag = soup.find('img', {'data-uri': True})
    if not img_tag:
        raise Exception(f"Image with Base64 data not found on page: {url}")

    # חילוץ נתוני ה-Base64
    base64_data = img_tag['data-uri']

    return base64_data

# דוגמה לשימוש
if __name__ == "__main__":
    location = "נתניה"
    product_name = "חלב תנובה טרי 3% בקרטון, כשרות מהדרין, 1 ליטר"

    try:
        base64_image = get_product_image_base64(location, product_name)
        print("Base64 Image Data:")
        print(base64_image)
    except Exception as e:
        print(f"Error: {e}")
"""




"""
import requests
from bs4 import BeautifulSoup
import urllib.parse
import base64
from PIL import Image
import io
import os

# כתובת בסיסית של האתר
BASE_URL = "https://chp.co.il"

def get_product_image_base64(location, product_name):
    # יצירת ה-URL המבוסס על המיקום ושם המוצר
    encoded_product_name = urllib.parse.quote(product_name)
    url = f"{BASE_URL}/{location}/0/0/{encoded_product_name}"

    # שליחת בקשה לאתר
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch URL: {url} (status code: {response.status_code})")

    # ניתוח ה-HTML עם BeautifulSoup
    soup = BeautifulSoup(response.text, 'html.parser')

    # מציאת תגית ה-img עם נתוני ה-Base64
    img_tag = soup.find('img', {'data-uri': True})
    if not img_tag:
        raise Exception(f"Image with Base64 data not found on page: {url}")

    # חילוץ נתוני ה-Base64
    base64_data = img_tag['data-uri']

    return base64_data

def compress_and_save_image(base64_image, output_path, quality=85):
    
    try:
        # Decode the Base64 string to bytes
        image_data = base64.b64decode(base64_image)

        # Open the image from the decoded bytes
        img = Image.open(io.BytesIO(image_data))

        # Convert the image to RGB (JPEG doesn't support transparency)
        img = img.convert("RGB")

        # Ensure the output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Save the image to the specified path as a compressed JPEG
        img.save(output_path, format="JPEG", quality=quality)

        print(f"Image successfully saved to {output_path}")
        return output_path
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

# דוגמה לשימוש
if __name__ == "__main__":
    location = "נתניה"
    product_name = "ופל במילוי קרם בטעם שוקולד ללא תוספת סוכר, 200 גרם"

    try:
        # Fetch the Base64 image data
        base64_image = get_product_image_base64(location, product_name)

        # Remove "data:image/png;base64," if it exists in the string
        if base64_image.startswith("data:image"):
            base64_image = base64_image.split(",")[1]

        # Define the output path for the compressed image
        output_file_path = "compressed_images/compressed_image.jpg"

        # Compress and save the image
        saved_path = compress_and_save_image(base64_image, output_file_path, quality=85)

        # Calculate the length of the original and compressed Base64 strings
        if saved_path:
            # Read the compressed file and encode it back to Base64
            with open(saved_path, "rb") as f:
                compressed_base64 = base64.b64encode(f.read()).decode('utf-8')

            # Print the lengths
            print(f"Original Base64 length: {len(base64_image)}")
            print(f"Compressed Base64 length: {len(compressed_base64)}")
    except Exception as e:
        print(f"Error: {e}")
"""


import requests
from bs4 import BeautifulSoup
import urllib.parse
import json
import sys

# כתובת בסיסית של האתר
BASE_URL = "https://chp.co.il"

def get_product_image_base64(location, product_name):
    try:
        # יצירת ה-URL המבוסס על המיקום ושם המוצר
        encoded_product_name = urllib.parse.quote(product_name)
        url = f"{BASE_URL}/{location}/0/0/{encoded_product_name}"

        # שליחת בקשה לאתר
        response = requests.get(url)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch URL: {url} (status code: {response.status_code})")

        # ניתוח ה-HTML עם BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')

        # מציאת תגית ה-img עם נתוני ה-Base64
        img_tag = soup.find('img', {'data-uri': True})
        if not img_tag:
            raise Exception(f"Image with Base64 data not found on page: {url}")

        # חילוץ נתוני ה-Base64
        base64_data = img_tag['data-uri']
        return base64_data

    except Exception as e:
        # החזרת שגיאה בפורמט JSON
        return json.dumps({"error": str(e)}, ensure_ascii=False)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing required arguments: location and product_name"}, ensure_ascii=False))
        sys.exit(1)

    location = sys.argv[1]
    product_name = sys.argv[2]

    # החזרת התוצאה כ-JSON
    result = get_product_image_base64(location, product_name)
    print(json.dumps({"image": result}, ensure_ascii=False))
