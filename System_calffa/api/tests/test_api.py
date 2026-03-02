import json
import pytest

from app import app as flask_app, model


@pytest.fixture
def client():
    flask_app.config['TESTING'] = True
    with flask_app.test_client() as client:
        yield client


def test_health(client):
    r = client.get('/health')
    assert r.status_code == 200
    j = r.get_json()
    assert 'status' in j
    assert 'model_loaded' in j


def test_predict_success(client):
    # Use a crop name likely to exist in mapping or fallback
    payload = {"crop": "Palay", "Month": "2025-11"}
    r = client.post('/predict', data=json.dumps(payload), content_type='application/json')
    assert r.status_code in (200, 201)
    j = r.get_json()
    assert 'prediction' in j or 'result' in j


def test_predict_invalid_payload(client):
    # Missing fields
    payload = {"crop": "Palay"}
    r = client.post('/predict', data=json.dumps(payload), content_type='application/json')
    assert r.status_code == 400
