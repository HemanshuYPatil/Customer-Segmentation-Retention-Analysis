from __future__ import annotations

from pathlib import Path
from typing import List, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"

FEATURE_COLS = [
    "recency_days",
    "frequency",
    "monetary",
    "avg_basket_value",
    "unique_products",
    "avg_interpurchase_days",
    "purchase_span_days",
]

SEGMENT_COLS = [
    "recency_days",
    "frequency",
    "monetary",
    "avg_basket_value",
    "unique_products",
    "avg_interpurchase_days",
]

class FeaturePayload(BaseModel):
    recency_days: float = Field(..., ge=0)
    frequency: float = Field(..., ge=0)
    monetary: float = Field(..., ge=0)
    avg_basket_value: float = Field(..., ge=0)
    unique_products: float = Field(..., ge=0)
    avg_interpurchase_days: float = Field(..., ge=0)
    purchase_span_days: float = Field(..., ge=0)


class PredictRequest(BaseModel):
    customer_id: Optional[int] = None
    features: Optional[FeaturePayload] = None


class PredictResponse(BaseModel):
    customer_id: Optional[int]
    segment: int
    churn_probability: float
    ltv_estimate: float
    recommended_action: str


app = FastAPI(title="Customer Segmentation & Retention API")


@app.on_event("startup")
def load_artifacts() -> None:
    app.state.scaler = joblib.load(ARTIFACTS / "scaler.joblib")
    app.state.kmeans = joblib.load(ARTIFACTS / "kmeans.joblib")
    churn_best = ARTIFACTS / "churn_best.joblib"
    if churn_best.exists():
        app.state.churn_model = joblib.load(churn_best)
    else:
        app.state.churn_model = joblib.load(ARTIFACTS / "churn_xgb.joblib")
    app.state.ltv_model = joblib.load(ARTIFACTS / "ltv_xgb.joblib")
    app.state.feature_store = pd.read_csv(ARTIFACTS / "feature_store.csv")
    app.state.segment_summary = pd.read_csv(ARTIFACTS / "segment_summary.csv")


def get_action_for_segment(segment: int) -> str:
    summary = app.state.segment_summary
    row = summary[summary["segment"] == segment]
    if row.empty:
        return "General nurture"
    return row.iloc[0]["recommended_action"]


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest) -> PredictResponse:
    if request.customer_id is None and request.features is None:
        raise HTTPException(status_code=400, detail="Provide customer_id or features")

    if request.features is not None:
        features = pd.DataFrame([request.features.dict()])
        customer_id = request.customer_id
    else:
        store = app.state.feature_store
        row = store[store["CustomerID"] == request.customer_id]
        if row.empty:
            raise HTTPException(status_code=404, detail="Customer not found")
        features = row[FEATURE_COLS]
        customer_id = int(request.customer_id)

    scaler = app.state.scaler
    kmeans = app.state.kmeans
    churn_model = app.state.churn_model
    ltv_model = app.state.ltv_model

    segment = int(kmeans.predict(scaler.transform(features[SEGMENT_COLS]))[0])
    churn_prob = float(churn_model.predict_proba(features[FEATURE_COLS])[:, 1][0])
    ltv_pred = float(ltv_model.predict(features[FEATURE_COLS])[0])

    action = get_action_for_segment(segment)

    return PredictResponse(
        customer_id=customer_id,
        segment=segment,
        churn_probability=churn_prob,
        ltv_estimate=ltv_pred,
        recommended_action=action,
    )
