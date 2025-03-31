"""
#Registration with various methods

import requests

def test_register_with_email():
    payload = {
        "name": "Name",
        "mail": "testuser@example.com",
        "password": "password123",
    }
    response = requests.post("http://${config.apiServer}/api/register", json=payload)
    assert response.status_code == 201
    assert response.json()["message"] == "Registration successful"

def test_register_with_google():
    payload = {
        "method": "google",
        "token": "sample_google_oauth_token"
    }
    response = requests.post("http://${config.apiServer}/api/register", json=payload)
    assert response.status_code == 201
    assert response.json()["message"] == "Registration successful"

test_register_with_email()
test_register_with_google()


#Real-time cart updates

from websocket import create_connection

def test_real_time_cart_updates():
    ws = create_connection("ws://${config.apiServer}/carts/1234")
    ws.send('{"action": "add_item", "item_id": "5678", "quantity": 1}')
    
    response = ws.recv()
    assert "action" in response
    assert "item_id" in response
    assert "quantity" in response
    
    response_data = json.loads(response)
    assert response_data["action"] == "item_added"
    assert response_data["item_id"] == "5678"
    assert response_data["quantity"] == 1

    ws.close()

test_real_time_cart_updates()


#Removing items from the cart

import requests

def test_remove_item_from_cart():
    cart_id = "1234"
    item_id = "5678"
    response = requests.delete(f"http://${config.apiServer}/api/productInCarts/{cart_id}/{item_id}")
    
    assert response.status_code == 200
    assert response.json()["message"] == "Item removed successfully"

test_remove_item_from_cart()


#Comparing supermarkets by preferences

import requests

def test_compare_supermarkets_by_price():
    payload = {
        "preference": "price",
        "cart_id": "1234",
        "location": "כתובת כלשהי בעברית"
    }
    response = requests.post("http://${config.apiServer}/api/supermarkets/compare", json=payload)
    
    assert response.status_code == 200
    assert "supermarkets" in response.json()
    assert all("price" in s for s in response.json()["supermarkets"])
    assert sorted(response.json()["supermarkets"], key=lambda x: x["price"]) == response.json()["supermarkets"]

test_compare_supermarkets_by_price()
"""