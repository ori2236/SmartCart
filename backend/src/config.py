from dotenv import load_dotenv
import os

load_dotenv()

class Config:
    MONGODB_URI = os.getenv("MONGODB_URI")
    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
    EMAIL_USER = os.getenv("EMAIL_USER")
    EMAIL_PASS = os.getenv("EMAIL_PASS")

if not Config.MONGODB_URI:
    raise RuntimeError("Missing MONGODB_URI in .env")
