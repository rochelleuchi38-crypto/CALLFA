"""Simple test harness for the Registration ML API.

Run this locally after starting the API (python app.py). It will call /health and /predict and print responses.
"""
import requests
import json

BASE = "http://127.0.0.1:5001"

def call_health():
    url = f"{BASE}/health"
    r = requests.get(url, timeout=5)
    print("HEALTH status code:", r.status_code)
    print(json.dumps(r.json(), indent=2))

def call_predict(crop='Rice', month='2025-11'):
    url = f"{BASE}/predict"
    payload = {"crop": crop, "Month": month}
    r = requests.post(url, json=payload, timeout=10)
    print("PREDICT status code:", r.status_code)
    try:
        print(json.dumps(r.json(), indent=2))
    except Exception:
        print(r.text)

if __name__ == '__main__':
    print('Calling health')
    try:
        call_health()
    except Exception as e:
        print('Health check failed:', e)

    print('\nCalling predict (sample)')
    try:
        call_predict()
    except Exception as e:
        print('Predict request failed:', e)
