from pymongo import MongoClient

def get_client():
    client = MongoClient("mongodb+srv://ori:ori@cluster0.tmv7g.mongodb.net/SmartCart?retryWrites=true&w=majority&appName=Cluster0")
    return client

def get_db():
    client = get_client()
    return client["SmartCart"]
