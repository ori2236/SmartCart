from src.config import Config
from pymongo import MongoClient

def get_client():
    return MongoClient(Config.MONGODB_URI)

def get_db():
    client = get_client()
    return client["SmartCart"]
