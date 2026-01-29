from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from typing import Any, Dict, Optional

import firebase_admin
from firebase_admin import credentials, firestore


_APP = None

# Load .env from repo root if present (avoids re-setting env vars)
ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env", override=False)


def get_firestore():
    global _APP
    if _APP is None:
        service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
        if not service_account_path:
            return None
        cred = credentials.Certificate(service_account_path)
        _APP = firebase_admin.initialize_app(cred)
    return firestore.client()


def write_training_metadata(
    tenant_id: str,
    run_id: str,
    metrics: Dict[str, float],
    artifact_prefix: str,
    dataset_path: str,
    mapping_path: Optional[str],
) -> None:
    db = get_firestore()
    if db is None:
        return
    data: Dict[str, Any] = {
        "run_id": run_id,
        "metrics": metrics,
        "artifact_prefix": artifact_prefix,
        "dataset_path": dataset_path,
        "mapping_path": mapping_path,
        "created_at": firestore.SERVER_TIMESTAMP,
    }
    db.collection("tenants").document(tenant_id).collection("training_runs").document(run_id).set(data)
    db.collection("tenants").document(tenant_id).set({"latest_run": run_id}, merge=True)


def write_model_registry(
    tenant_id: str,
    model_id: str,
    name: str,
    metrics: Dict[str, float],
    artifact_prefix: str,
) -> None:
    db = get_firestore()
    if db is None:
        return
    data = {
        "model_id": model_id,
        "name": name,
        "metrics": metrics,
        "artifact_prefix": artifact_prefix,
        "created_at": firestore.SERVER_TIMESTAMP,
    }
    db.collection("tenants").document(tenant_id).collection("models").document(model_id).set(data)


def write_segment_summary(tenant_id: str, run_id: str, summary_rows: list[dict]) -> None:
    db = get_firestore()
    if db is None:
        return
    db.collection("tenants").document(tenant_id).collection("segments").document(run_id).set(
        {"segments": summary_rows, "created_at": firestore.SERVER_TIMESTAMP}
    )


def write_prediction(
    tenant_id: str,
    prediction_id: str,
    payload: Dict[str, Any],
    result: Dict[str, Any],
    batch_file_url: Optional[str] = None,
) -> None:
    db = get_firestore()
    if db is None:
        return
    data = {
        "prediction_id": prediction_id,
        "payload": payload,
        "result": result,
        "batch_file_url": batch_file_url,
        "created_at": firestore.SERVER_TIMESTAMP,
    }
    db.collection("tenants").document(tenant_id).collection("predictions").document(prediction_id).set(data)


def list_models(tenant_id: str) -> list[dict]:
    db = get_firestore()
    if db is None:
        return []
    docs = db.collection("tenants").document(tenant_id).collection("models").stream()
    return [doc.to_dict() for doc in docs]


def get_model(tenant_id: str, model_id: str) -> Optional[dict]:
    db = get_firestore()
    if db is None:
        return None
    doc = db.collection("tenants").document(tenant_id).collection("models").document(model_id).get()
    return doc.to_dict() if doc.exists else None


def get_training_run(tenant_id: str, run_id: str) -> Optional[dict]:
    db = get_firestore()
    if db is None:
        return None
    doc = (
        db.collection("tenants")
        .document(tenant_id)
        .collection("training_runs")
        .document(run_id)
        .get()
    )
    return doc.to_dict() if doc.exists else None


def list_predictions(tenant_id: str, limit: int = 100) -> list[dict]:
    db = get_firestore()
    if db is None:
        return []
    docs = (
        db.collection("tenants")
        .document(tenant_id)
        .collection("predictions")
        .order_by("created_at", direction=firestore.Query.DESCENDING)
        .limit(limit)
        .stream()
    )
    return [doc.to_dict() for doc in docs]


def get_prediction(tenant_id: str, prediction_id: str) -> Optional[dict]:
    db = get_firestore()
    if db is None:
        return None
    doc = (
        db.collection("tenants")
        .document(tenant_id)
        .collection("predictions")
        .document(prediction_id)
        .get()
    )
    return doc.to_dict() if doc.exists else None


def set_default_model(tenant_id: str, model_id: str) -> None:
    db = get_firestore()
    if db is None:
        return
    db.collection("tenants").document(tenant_id).set({"default_model": model_id}, merge=True)


def get_default_model(tenant_id: str) -> Optional[str]:
    db = get_firestore()
    if db is None:
        return None
    doc = db.collection("tenants").document(tenant_id).get()
    if not doc.exists:
        return None
    return doc.to_dict().get("default_model")


def get_latest_metrics(tenant_id: str) -> Dict[str, float]:
    db = get_firestore()
    if db is None:
        return {}
    tenant_ref = db.collection("tenants").document(tenant_id).get()
    if not tenant_ref.exists:
        return {}
    latest_run = tenant_ref.to_dict().get("latest_run")
    if not latest_run:
        return {}
    run_ref = (
        db.collection("tenants")
        .document(tenant_id)
        .collection("training_runs")
        .document(latest_run)
        .get()
    )
    if not run_ref.exists:
        return {}
    return run_ref.to_dict().get("metrics", {}) or {}


def get_latest_segments(tenant_id: str) -> list[dict]:
    db = get_firestore()
    if db is None:
        return []
    tenant_ref = db.collection("tenants").document(tenant_id).get()
    if not tenant_ref.exists:
        return []
    latest_run = tenant_ref.to_dict().get("latest_run")
    if not latest_run:
        return []
    seg_ref = (
        db.collection("tenants")
        .document(tenant_id)
        .collection("segments")
        .document(latest_run)
        .get()
    )
    if not seg_ref.exists:
        return []
    return seg_ref.to_dict().get("segments", []) or []
