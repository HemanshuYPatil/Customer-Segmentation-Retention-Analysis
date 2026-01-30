from __future__ import annotations

from pathlib import Path
import sys
from typing import Optional
import uuid
import subprocess
import os

import joblib
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Header
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import json
ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT / "src"))
from firestore_client import (
    get_latest_metrics,
    get_latest_segments,
    list_models,
    list_predictions,
    get_model,
    get_training_run,
    write_prediction,
    get_prediction,
    set_default_model,
    get_default_model,
)
from storage import get_b2_client, download_file, presign_download_url
from notifications import build_prediction_complete_email
from email_queue_client import enqueue_email_via_frontend
from pydantic import BaseModel, Field

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


class TrainRequest(BaseModel):
    tenant_id: str
    dataset_path: str
    mapping_path: Optional[str] = None
    notify_email: Optional[str] = None


app = FastAPI(title="Customer Segmentation & Retention API")
load_dotenv()

# CORS for local Next.js + Inngest
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


@app.post("/upload")
async def upload_dataset(
    tenant_id: str = Form(...),
    file: UploadFile = File(...),
    mapping: Optional[str] = Form(None),
) -> dict:
    tenant_dir = ROOT / "dataset" / "tenants" / tenant_id
    tenant_dir.mkdir(parents=True, exist_ok=True)
    filename = Path(file.filename).name
    dataset_path = tenant_dir / filename
    content = await file.read()
    dataset_path.write_bytes(content)
    mapping_path = None
    if mapping:
        mapping_path = tenant_dir / "mapping.json"
        mapping_path.write_text(mapping, encoding="utf-8")
    return {
        "dataset_path": str(dataset_path),
        "mapping_path": str(mapping_path) if mapping_path else None,
    }


@app.post("/train")
def train(request: TrainRequest) -> dict:
    job_id = str(uuid.uuid4())
    args = [
        sys.executable,
        str(ROOT / "src" / "train_pipeline.py"),
        "--tenant-id",
        request.tenant_id,
        "--data-path",
        request.dataset_path,
    ]
    if request.mapping_path:
        args += ["--mapping-path", request.mapping_path]
    if request.notify_email:
        args += ["--notify-email", request.notify_email]
    subprocess.Popen(args, cwd=str(ROOT))
    return {"status": "started", "job_id": job_id}


@app.get("/metrics")
def metrics(x_tenant_id: Optional[str] = Header(None)) -> dict:
    if x_tenant_id:
        return get_latest_metrics(x_tenant_id)
    db_path = ROOT / "mlflow.db"
    if not db_path.exists():
        return {}
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT run_uuid FROM runs ORDER BY start_time DESC LIMIT 1")
    row = cur.fetchone()
    if not row:
        conn.close()
        return {}
    run_id = row[0]
    cur.execute("SELECT key, value FROM metrics WHERE run_uuid=?", (run_id,))
    data = {k: float(v) for k, v in cur.fetchall()}
    conn.close()
    return data


@app.get("/segments")
def segments(x_tenant_id: Optional[str] = Header(None)) -> list[dict]:
    if x_tenant_id:
        return get_latest_segments(x_tenant_id)
    if not hasattr(app.state, "segment_summary"):
        return []
    return app.state.segment_summary.to_dict(orient="records")


@app.get("/models")
def models(x_tenant_id: Optional[str] = Header(None)) -> list[dict]:
    if not x_tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant id")
    return list_models(x_tenant_id)

@app.get("/models/{model_id}")
def model_detail(model_id: str, x_tenant_id: Optional[str] = Header(None)) -> dict:
    if not x_tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant id")
    model = get_model(x_tenant_id, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model


@app.get("/models/{model_id}/json")
def model_json(model_id: str, x_tenant_id: Optional[str] = Header(None)) -> dict:
    if not x_tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant id")
    model = get_model(x_tenant_id, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    artifact_prefix = model.get("artifact_prefix")
    if not artifact_prefix:
        raise HTTPException(status_code=404, detail="Model artifact path missing")

    filename = "kmeans_scores.json"

    if artifact_prefix.startswith("b2://"):
        _, bucket_and_prefix = artifact_prefix.split("b2://", 1)
        bucket, prefix = bucket_and_prefix.split("/", 1)
        client = get_b2_client()
        if client is None:
            raise HTTPException(status_code=500, detail="B2 client not configured. Set B2_* env vars in .env.")
        key = f"{prefix}/{filename}"
        try:
            obj = client.get_object(Bucket=bucket, Key=key)
            payload = obj["Body"].read().decode("utf-8")
            return {"filename": filename, "data": json.loads(payload)}
        except Exception:
            raise HTTPException(status_code=404, detail="JSON artifact not found")

    local_path = Path(artifact_prefix) / filename
    if local_path.exists():
        return {"filename": filename, "data": json.loads(local_path.read_text(encoding="utf-8"))}
    raise HTTPException(status_code=404, detail="JSON artifact not found")


@app.get("/models/{model_id}/dataset")
def model_dataset(model_id: str, x_tenant_id: Optional[str] = Header(None)) -> dict:
    if not x_tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant id")
    run = get_training_run(x_tenant_id, model_id)
    if not run:
        raise HTTPException(status_code=404, detail="Training run not found")
    dataset_path = run.get("dataset_path")
    if not dataset_path:
        raise HTTPException(status_code=404, detail="Dataset path not found")
    path = Path(dataset_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Dataset file not found")
    df = pd.read_csv(path)
    return {"path": str(path), "columns": list(df.columns), "rows": df.to_dict(orient="records")}


@app.get("/models/{model_id}/customers/{customer_id}/exists")
def customer_exists(model_id: str, customer_id: int, x_tenant_id: Optional[str] = Header(None)) -> dict:
    if not x_tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant id")
    bundle = _load_artifacts_for_model(x_tenant_id, model_id)
    store = bundle["feature_store"]
    exists = not store[store["CustomerID"] == customer_id].empty
    return {"exists": bool(exists)}


@app.get("/models/default")
def get_default(x_tenant_id: Optional[str] = Header(None)) -> dict:
    if not x_tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant id")
    return {"model_id": get_default_model(x_tenant_id)}


@app.post("/models/default")
def set_default(x_tenant_id: Optional[str] = Header(None), body: dict | None = None) -> dict:
    if not x_tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant id")
    model_id = body.get("model_id") if body else None
    if not model_id:
        raise HTTPException(status_code=400, detail="Missing model_id")
    set_default_model(x_tenant_id, model_id)
    return {"status": "ok"}


@app.get("/predictions")
def predictions(x_tenant_id: Optional[str] = Header(None)) -> list[dict]:
    if not x_tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant id")
    return list_predictions(x_tenant_id)


@app.get("/predictions/{prediction_id}")
def prediction_detail(prediction_id: str, x_tenant_id: Optional[str] = Header(None)) -> dict:
    if not x_tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant id")
    item = get_prediction(x_tenant_id, prediction_id)
    if not item:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return item


@app.get("/predictions/{prediction_id}/download")
def prediction_download(prediction_id: str, x_tenant_id: Optional[str] = Header(None)) -> dict:
    if not x_tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant id")
    item = get_prediction(x_tenant_id, prediction_id)
    if not item:
        raise HTTPException(status_code=404, detail="Prediction not found")
    url = item.get("batch_file_url")
    if not url:
        raise HTTPException(status_code=404, detail="No file available")
    if not url.startswith("b2://"):
        return {"url": url}
    _, bucket_and_prefix = url.split("b2://", 1)
    bucket, key = bucket_and_prefix.split("/", 1)
    client = get_b2_client()
    if client is None:
        raise HTTPException(status_code=500, detail="B2 client not configured. Set B2_* env vars in .env.")
    try:
        presigned = presign_download_url(client, bucket, key, expires_in=3600)
        return {"url": presigned}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"B2 download failed: {exc}")


@app.get("/predictions/{prediction_id}/csv")
def prediction_csv(prediction_id: str, x_tenant_id: Optional[str] = Header(None)) -> FileResponse:
    if not x_tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant id")
    item = get_prediction(x_tenant_id, prediction_id)
    if not item:
        raise HTTPException(status_code=404, detail="Prediction not found")
    url = item.get("batch_file_url")
    if not url:
        raise HTTPException(status_code=404, detail="No file available")
    if url.startswith("b2://"):
        _, bucket_and_prefix = url.split("b2://", 1)
        bucket, key = bucket_and_prefix.split("/", 1)
        client = get_b2_client()
        if client is None:
            raise HTTPException(status_code=500, detail="B2 client not configured. Set B2_* env vars in .env.")
        temp_path = ROOT / "artifacts_cache" / x_tenant_id / "downloads" / f"{prediction_id}.csv"
        download_file(client, bucket, key, temp_path)
        return FileResponse(temp_path, media_type="text/csv", filename=f"{prediction_id}.csv")
    local_path = Path(url)
    if local_path.exists():
        return FileResponse(local_path, media_type="text/csv", filename=local_path.name)
    raise HTTPException(status_code=404, detail="File not found")


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


class PredictJobRequest(BaseModel):
    tenant_id: str
    model_id: str
    mode: str  # "single" or "batch"
    customer_id: Optional[int] = None
    features: Optional[FeaturePayload] = None
    notify_email: Optional[str] = None


def _load_artifacts_for_model(tenant_id: str, model_id: str) -> dict:
    model = get_model(tenant_id, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    artifact_prefix = model.get("artifact_prefix")
    if not artifact_prefix:
        raise HTTPException(status_code=500, detail="Model artifact path missing")

    if artifact_prefix.startswith("b2://"):
        _, bucket_and_prefix = artifact_prefix.split("b2://", 1)
        bucket, prefix = bucket_and_prefix.split("/", 1)
        cache_dir = ROOT / "artifacts_cache" / tenant_id / model_id
        client = get_b2_client()
        if client is None:
            raise HTTPException(status_code=500, detail="B2 client not configured")
        files = [
            "scaler.joblib",
            "kmeans.joblib",
            "churn_best.joblib",
            "ltv_xgb.joblib",
            "segment_summary.csv",
            "feature_store.csv",
        ]
        for name in files:
            download_file(client, bucket, f"{prefix}/{name}", cache_dir / name)
        base = cache_dir
    else:
        base = Path(artifact_prefix)

    return {
        "scaler": joblib.load(base / "scaler.joblib"),
        "kmeans": joblib.load(base / "kmeans.joblib"),
        "churn_model": joblib.load(base / "churn_best.joblib"),
        "ltv_model": joblib.load(base / "ltv_xgb.joblib"),
        "segment_summary": pd.read_csv(base / "segment_summary.csv"),
        "feature_store": pd.read_csv(base / "feature_store.csv"),
    }


def _action_for_segment(summary: pd.DataFrame, segment: int) -> str:
    row = summary[summary["segment"] == segment]
    if row.empty:
        return "General nurture"
    return row.iloc[0]["recommended_action"]


@app.post("/predict_job")
def predict_job(request: PredictJobRequest) -> dict:
    bundle = _load_artifacts_for_model(request.tenant_id, request.model_id)
    scaler = bundle["scaler"]
    kmeans = bundle["kmeans"]
    churn_model = bundle["churn_model"]
    ltv_model = bundle["ltv_model"]
    summary = bundle["segment_summary"]
    store = bundle["feature_store"]

    prediction_id = str(uuid.uuid4())

    if request.mode == "single":
        if request.features is None and request.customer_id is None:
            raise HTTPException(status_code=400, detail="Provide customer_id or features")
        if request.features is not None:
            features = pd.DataFrame([request.features.dict()])
            customer_id = request.customer_id
        else:
            row = store[store["CustomerID"] == request.customer_id]
            if row.empty:
                raise HTTPException(status_code=404, detail="Customer not found")
            features = row[FEATURE_COLS]
            customer_id = int(request.customer_id)

        segment = int(kmeans.predict(scaler.transform(features[SEGMENT_COLS]))[0])
        churn_prob = float(churn_model.predict_proba(features[FEATURE_COLS])[:, 1][0])
        ltv_pred = float(ltv_model.predict(features[FEATURE_COLS])[0])
        action = _action_for_segment(summary, segment)

        result = {
            "customer_id": customer_id,
            "segment": segment,
            "churn_probability": churn_prob,
            "ltv_estimate": ltv_pred,
            "recommended_action": action,
        }
        write_prediction(
            tenant_id=request.tenant_id,
            prediction_id=prediction_id,
            payload=request.dict(),
            result=result,
        )
        if request.notify_email:
            subject, text, html = build_prediction_complete_email(
                tenant_id=request.tenant_id,
                prediction_id=prediction_id,
                mode="single",
            )
            try:
                enqueue_email_via_frontend(
                    to_email=request.notify_email,
                    subject=subject,
                    html=html,
                    text=text,
                    metadata={"type": "prediction_complete", "tenant_id": request.tenant_id},
                    event_id=f"prediction-email-{prediction_id}",
                )
            except Exception as exc:
                print(f"[email] queue failed: {exc}")
        return {"status": "completed", "prediction_id": prediction_id}

    if request.mode == "batch":
        features = store[FEATURE_COLS]
        segments = kmeans.predict(scaler.transform(store[SEGMENT_COLS]))
        churn_probs = churn_model.predict_proba(features)[:, 1]
        ltv_preds = ltv_model.predict(features)
        results = store[["CustomerID"]].copy()
        results["segment"] = segments
        results["churn_probability"] = churn_probs
        results["ltv_estimate"] = ltv_preds
        results["recommended_action"] = results["segment"].apply(lambda s: _action_for_segment(summary, int(s)))

        # Hybrid storage: store sample rows in Firestore + full CSV in B2
        batch_file_url = None
        sample_size = 200
        result_payload = {
            "count": int(len(results)),
            "rows": results.head(sample_size).to_dict(orient="records"),
            "sample_size": sample_size,
        }
        b2_bucket = os.getenv("B2_BUCKET")
        client = get_b2_client()
        if client and b2_bucket:
            output_key = f"tenants/{request.tenant_id}/outputs/{prediction_id}.csv"
            temp_path = ROOT / "artifacts_cache" / request.tenant_id / f"{prediction_id}.csv"
            temp_path.parent.mkdir(parents=True, exist_ok=True)
            results.to_csv(temp_path, index=False)
            client.upload_file(str(temp_path), b2_bucket, output_key)
            batch_file_url = f"b2://{b2_bucket}/{output_key}"

        write_prediction(
            tenant_id=request.tenant_id,
            prediction_id=prediction_id,
            payload=request.dict(),
            result=result_payload,
            batch_file_url=batch_file_url,
        )
        if request.notify_email:
            subject, text, html = build_prediction_complete_email(
                tenant_id=request.tenant_id,
                prediction_id=prediction_id,
                mode="batch",
                batch_file_url=batch_file_url,
                count=int(len(results)),
            )
            try:
                enqueue_email_via_frontend(
                    to_email=request.notify_email,
                    subject=subject,
                    html=html,
                    text=text,
                    metadata={"type": "prediction_complete", "tenant_id": request.tenant_id},
                    event_id=f"prediction-email-{prediction_id}",
                )
            except Exception as exc:
                print(f"[email] queue failed: {exc}")
        return {"status": "completed", "prediction_id": prediction_id}

    raise HTTPException(status_code=400, detail="Invalid mode")
