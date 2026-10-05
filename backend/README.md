# Stage 9: Backend API Service (FastAPI)

Production-ready REST API service for real-time online shopper purchasing intention prediction using the champion **Random Forest Classifier** ensemble.

---

## 1. Quickstart

### Installation
From the project root, activate your virtual environment and install the dependencies:
```bash
pip install -r backend/requirements.txt
```

### Run the Server
Launch the FastAPI development server with hot reload:
```bash
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

Once running:
- **Interactive API Documentation (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative Documentation (ReDoc):** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check Endpoint:** [http://localhost:8000/health](http://localhost:8000/health)

---

## 2. API Endpoints

### `GET /health`
Returns the status of the service and confirms the ML model is loaded in memory.

**Response (HTTP 200 OK):**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_name": "RandomForestClassifier (Champion Ensemble)",
  "model_version": "1.0.0",
  "expected_features_count": 18
}
```

---

### `POST /predict`
Predicts purchasing intention for an individual session.

**Request Payload:**
```json
{
  "Administrative": 2,
  "Administrative_Duration": 85.5,
  "Informational": 1,
  "Informational_Duration": 32.0,
  "ProductRelated": 18,
  "ProductRelated_Duration": 640.2,
  "BounceRates": 0.01,
  "ExitRates": 0.03,
  "PageValues": 16.4,
  "SpecialDay": 0.0,
  "Month": "Nov",
  "OperatingSystems": 2,
  "Browser": 2,
  "Region": 1,
  "TrafficType": 2,
  "VisitorType": "Returning_Visitor",
  "Weekend": false
}
```

**Response (HTTP 200 OK):**
```json
{
  "prediction": "Purchase",
  "prediction_class": 1,
  "purchase_probability": 0.8125,
  "confidence_percentage": "81.2%",
  "intent_level": "High Intent",
  "recommendation": "High purchasing intent detected. Display a limited-time checkout offer or free shipping voucher to close the sale.",
  "session_summary": {
    "TotalPages": 21,
    "TotalDuration": 757.7,
    "AvgTimePerPage": 36.08,
    "VisitorType_Weekend": "Returning_Visitor_False"
  }
}
```

---

### `POST /predict/batch`
Predicts purchasing intention across multiple sessions simultaneously.

**Request Payload:**
```json
{
  "sessions": [
    { /* Session 1 attributes */ },
    { /* Session 2 attributes */ }
  ]
}
```

**Response (HTTP 200 OK):**
```json
{
  "total_sessions": 2,
  "predicted_purchases": 1,
  "predictions": [
    { /* Prediction 1 */ },
    { /* Prediction 2 */ }
  ]
}
```

---

## 3. Data Validation & Preprocessing

1. **Strict Input Validation (Pydantic):**
   - Value ranges are validated (e.g. `BounceRates` and `ExitRates` bounded to $[0.0, 1.0]$, counts $\ge 0$).
   - Categorical inputs are checked against allowed vocabularies (`Month`, `VisitorType`).
   - Invalid payloads return structured HTTP 422 error details.
2. **Automated Feature Engineering:**
   - Raw session records are converted into engineered features (`TotalPages`, `TotalDuration`, `AvgTimePerPage`, `VisitorType_Weekend`) matching the exact training preprocessing pipeline.
3. **Pipeline Inference:**
   - The selected 18 features are fed directly into the serialized scikit-learn `Pipeline` (`models/randomforest_candidate.joblib`), which internally one-hot encodes categorical values and scales numerical predictors.

---

## 4. Running Automated Tests

Run the test suite using `pytest`:
```bash
pytest backend/test_app.py -v
```
