import sys
from pathlib import Path
from typing import List
from contextlib import asynccontextmanager

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, status, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.preprocessing.feature_engineering import add_engineered_features
from backend.schemas import (
    SessionInput,
    PredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
    HealthResponse,
    SessionFeaturesSummary,
)

MODEL_PATH = PROJECT_ROOT / "models" / "randomforest_candidate.joblib"
FRONTEND_DIR = PROJECT_ROOT / "frontend"
SELECTED_COLUMNS = [
    "Administrative",
    "Administrative_Duration",
    "Informational",
    "Informational_Duration",
    "BounceRates",
    "ExitRates",
    "PageValues",
    "SpecialDay",
    "Month",
    "OperatingSystems",
    "Browser",
    "TrafficType",
    "VisitorType",
    "Weekend",
    "TotalPages",
    "TotalDuration",
    "AvgTimePerPage",
    "VisitorType_Weekend",
]

# Global model container
ml_models = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model on startup
    if not MODEL_PATH.exists():
        raise RuntimeError(f"Candidate model artifact not found at {MODEL_PATH}")
    
    print(f"Loading champion model from {MODEL_PATH}...")
    ml_models["model"] = joblib.load(MODEL_PATH)
    print("Champion model loaded successfully.")
    yield
    # Clean up on shutdown
    ml_models.clear()


app = FastAPI(
    title="Online Shopper Purchasing Intention API",
    description="Production REST API service providing real-time purchasing intention predictions using a tuned Random Forest ensemble.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend integration (React, Vue, mobile apps, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def preprocess_session_data(raw_records: List[dict]) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Apply identical feature engineering used during development:
    1. Convert raw input dicts to pandas DataFrame
    2. Derive TotalPages, TotalDuration, AvgTimePerPage, and VisitorType_Weekend
    3. Select exact 18 columns expected by the trained pipeline
    """
    raw_df = pd.DataFrame(raw_records)
    engineered_df = add_engineered_features(raw_df)
    
    missing_cols = [c for c in SELECTED_COLUMNS if c not in engineered_df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns after feature engineering: {missing_cols}")
        
    return engineered_df[SELECTED_COLUMNS], engineered_df


def format_prediction_result(
    pred_class: int,
    prob_purchase: float,
    summary_row: pd.Series,
) -> PredictionResponse:
    """Construct structured, business-actionable prediction response."""
    label = "Purchase" if pred_class == 1 else "No Purchase"
    confidence_pct = f"{max(prob_purchase, 1.0 - prob_purchase) * 100:.1f}%"
    
    if prob_purchase >= 0.65:
        intent = "High Intent"
        recommendation = "High purchasing intent detected. Display a limited-time checkout offer or free shipping voucher to close the sale."
    elif prob_purchase >= 0.40:
        intent = "Moderate Intent"
        recommendation = "Visitor exhibits purchasing interest. Trigger an unobtrusive exit-intent modal, product reviews, or live chat assistance."
    else:
        intent = "Low Intent"
        recommendation = "General browsing behavior. Maintain standard catalog navigation without disruptive interventions."

    summary = SessionFeaturesSummary(
        TotalPages=int(summary_row["TotalPages"]),
        TotalDuration=round(float(summary_row["TotalDuration"]), 2),
        AvgTimePerPage=round(float(summary_row["AvgTimePerPage"]), 2),
        VisitorType_Weekend=str(summary_row["VisitorType_Weekend"]),
    )

    return PredictionResponse(
        prediction=label,
        prediction_class=pred_class,
        purchase_probability=round(prob_purchase, 4),
        confidence_percentage=confidence_pct,
        intent_level=intent,
        recommendation=recommendation,
        session_summary=summary,
    )


@app.get("/", tags=["System"])
def root(request: Request):
    accept = request.headers.get("accept", "")
    if "text/html" in accept and FRONTEND_DIR.exists() and (FRONTEND_DIR / "index.html").exists():
        return FileResponse(FRONTEND_DIR / "index.html")
    return {
        "message": "Online Shopper Purchasing Intention API is active.",
        "documentation": "/docs",
        "health_check": "/health",
    }


@app.get("/health", response_model=HealthResponse, tags=["System"])
def health_check():
    is_loaded = "model" in ml_models
    return HealthResponse(
        status="healthy" if is_loaded else "unhealthy",
        model_loaded=is_loaded,
        model_name="RandomForestClassifier (Champion Ensemble)",
        model_version="1.0.0",
        expected_features_count=len(SELECTED_COLUMNS),
    )


@app.post("/predict", response_model=PredictionResponse, tags=["Inference"])
def predict_single_session(session: SessionInput):
    """
    Predict purchasing intention for a single user browsing session.
    Accepts raw session metrics, performs automated feature engineering,
    and returns prediction label, probability, intent level, and marketing recommendation.
    """
    if "model" not in ml_models:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Machine learning model is not loaded.",
        )

    try:
        raw_record = session.model_dump()
        X_selected, engineered_df = preprocess_session_data([raw_record])

        model = ml_models["model"]
        pred_class = int(model.predict(X_selected)[0])
        prob_purchase = float(model.predict_proba(X_selected)[0, 1])

        return format_prediction_result(pred_class, prob_purchase, engineered_df.iloc[0])

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing inference: {str(e)}",
        )


@app.post("/predict/batch", response_model=BatchPredictionResponse, tags=["Inference"])
def predict_batch_sessions(batch: BatchPredictionRequest):
    """
    Predict purchasing intention for multiple browsing sessions in a single request.
    Optimized for batch processing or stream event handlers.
    """
    if "model" not in ml_models:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Machine learning model is not loaded.",
        )

    if not batch.sessions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch list cannot be empty.",
        )

    try:
        raw_records = [s.model_dump() for s in batch.sessions]
        X_selected, engineered_df = preprocess_session_data(raw_records)

        model = ml_models["model"]
        preds = model.predict(X_selected)
        probs = model.predict_proba(X_selected)[:, 1]

        results = []
        for i in range(len(preds)):
            res = format_prediction_result(int(preds[i]), float(probs[i]), engineered_df.iloc[i])
            results.append(res)

        total_purchases = sum(1 for p in preds if p == 1)

        return BatchPredictionResponse(
            total_sessions=len(results),
            predicted_purchases=total_purchases,
            predictions=results,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing batch inference: {str(e)}",
        )


# Mount frontend static files to serve the complete UI at http://localhost:8000/
from fastapi.staticfiles import StaticFiles

if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
