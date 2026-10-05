import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app import app


def test_root_endpoint():
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["documentation"] == "/docs"


def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["model_loaded"] is True
        assert "RandomForestClassifier" in data["model_name"]


def test_predict_high_intent_purchaser():
    with TestClient(app) as client:
        payload = {
            "Administrative": 3,
            "Administrative_Duration": 120.0,
            "Informational": 1,
            "Informational_Duration": 45.0,
            "ProductRelated": 25,
            "ProductRelated_Duration": 950.0,
            "BounceRates": 0.005,
            "ExitRates": 0.015,
            "PageValues": 35.5,
            "SpecialDay": 0.0,
            "Month": "Nov",
            "OperatingSystems": 2,
            "Browser": 2,
            "Region": 1,
            "TrafficType": 2,
            "VisitorType": "Returning_Visitor",
            "Weekend": False,
        }
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["prediction"] == "Purchase"
        assert data["prediction_class"] == 1
        assert data["purchase_probability"] >= 0.50
        assert data["intent_level"] in ["High Intent", "Moderate Intent"]
        assert "session_summary" in data
        assert data["session_summary"]["TotalPages"] == 29
        assert data["session_summary"]["TotalDuration"] == 1115.0


def test_predict_low_intent_browser():
    with TestClient(app) as client:
        payload = {
            "Administrative": 0,
            "Administrative_Duration": 0.0,
            "Informational": 0,
            "Informational_Duration": 0.0,
            "ProductRelated": 1,
            "ProductRelated_Duration": 15.0,
            "BounceRates": 0.20,
            "ExitRates": 0.20,
            "PageValues": 0.0,
            "SpecialDay": 0.0,
            "Month": "Feb",
            "OperatingSystems": 1,
            "Browser": 1,
            "Region": 1,
            "TrafficType": 1,
            "VisitorType": "Returning_Visitor",
            "Weekend": False,
        }
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["prediction"] == "No Purchase"
        assert data["prediction_class"] == 0
        assert data["purchase_probability"] < 0.30
        assert data["intent_level"] == "Low Intent"


def test_predict_validation_invalid_bounds():
    with TestClient(app) as client:
        # BounceRates > 1.0 and negative PageValues
        invalid_payload = {
            "Administrative": 2,
            "Administrative_Duration": 50.0,
            "Informational": 0,
            "Informational_Duration": 0.0,
            "ProductRelated": 10,
            "ProductRelated_Duration": 300.0,
            "BounceRates": 1.5,  # Invalid: must be <= 1.0
            "ExitRates": 0.05,
            "PageValues": -5.0,  # Invalid: must be >= 0.0
            "SpecialDay": 0.0,
            "Month": "Nov",
            "OperatingSystems": 2,
            "Browser": 2,
            "Region": 1,
            "TrafficType": 2,
            "VisitorType": "Returning_Visitor",
            "Weekend": False,
        }
        response = client.post("/predict", json=invalid_payload)
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data


def test_predict_validation_invalid_month():
    with TestClient(app) as client:
        payload = {
            "Administrative": 1,
            "Administrative_Duration": 10.0,
            "Informational": 0,
            "Informational_Duration": 0.0,
            "ProductRelated": 5,
            "ProductRelated_Duration": 100.0,
            "BounceRates": 0.01,
            "ExitRates": 0.02,
            "PageValues": 5.0,
            "SpecialDay": 0.0,
            "Month": "NonExistentMonth",  # Invalid month
            "OperatingSystems": 1,
            "Browser": 1,
            "Region": 1,
            "TrafficType": 1,
            "VisitorType": "Returning_Visitor",
            "Weekend": False,
        }
        response = client.post("/predict", json=payload)
        assert response.status_code == 422


def test_predict_validation_missing_field():
    with TestClient(app) as client:
        payload = {
            "Administrative": 1,
            # Missing Administrative_Duration
            "Informational": 0,
            "Informational_Duration": 0.0,
            "ProductRelated": 5,
            "ProductRelated_Duration": 100.0,
            "BounceRates": 0.01,
            "ExitRates": 0.02,
            "PageValues": 5.0,
            "SpecialDay": 0.0,
            "Month": "May",
            "OperatingSystems": 1,
            "Browser": 1,
            "Region": 1,
            "TrafficType": 1,
            "VisitorType": "Returning_Visitor",
            "Weekend": False,
        }
        response = client.post("/predict", json=payload)
        assert response.status_code == 422


def test_batch_prediction():
    with TestClient(app) as client:
        batch_payload = {
            "sessions": [
                {
                    "Administrative": 3,
                    "Administrative_Duration": 100.0,
                    "Informational": 1,
                    "Informational_Duration": 30.0,
                    "ProductRelated": 20,
                    "ProductRelated_Duration": 800.0,
                    "BounceRates": 0.01,
                    "ExitRates": 0.02,
                    "PageValues": 25.0,
                    "SpecialDay": 0.0,
                    "Month": "Nov",
                    "OperatingSystems": 2,
                    "Browser": 2,
                    "Region": 1,
                    "TrafficType": 2,
                    "VisitorType": "Returning_Visitor",
                    "Weekend": False,
                },
                {
                    "Administrative": 0,
                    "Administrative_Duration": 0.0,
                    "Informational": 0,
                    "Informational_Duration": 0.0,
                    "ProductRelated": 2,
                    "ProductRelated_Duration": 20.0,
                    "BounceRates": 0.15,
                    "ExitRates": 0.15,
                    "PageValues": 0.0,
                    "SpecialDay": 0.0,
                    "Month": "Mar",
                    "OperatingSystems": 1,
                    "Browser": 1,
                    "Region": 2,
                    "TrafficType": 1,
                    "VisitorType": "New_Visitor",
                    "Weekend": True,
                },
            ]
        }
        response = client.post("/predict/batch", json=batch_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["total_sessions"] == 2
        assert len(data["predictions"]) == 2
        assert data["predictions"][0]["prediction"] == "Purchase"
        assert data["predictions"][1]["prediction"] == "No Purchase"


if __name__ == "__main__":
    pytest.main(["-v", __file__])
