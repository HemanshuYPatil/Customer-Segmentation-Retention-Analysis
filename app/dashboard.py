from __future__ import annotations

import json
import sqlite3
import subprocess
import sys
from pathlib import Path
from typing import Dict, Optional

import joblib
import pandas as pd
import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"
DATASET_DIR = ROOT / "dataset"

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


def load_latest_metrics(db_path: Path) -> Dict[str, float]:
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
    metrics = {k: float(v) for k, v in cur.fetchall()}
    conn.close()
    return metrics


def load_artifacts():
    scaler = joblib.load(ARTIFACTS / "scaler.joblib")
    kmeans = joblib.load(ARTIFACTS / "kmeans.joblib")
    churn_path = ARTIFACTS / "churn_best.joblib"
    churn_model = joblib.load(churn_path if churn_path.exists() else ARTIFACTS / "churn_xgb.joblib")
    ltv_model = joblib.load(ARTIFACTS / "ltv_xgb.joblib")
    return scaler, kmeans, churn_model, ltv_model


def predict(features: pd.DataFrame) -> Dict[str, float]:
    scaler, kmeans, churn_model, ltv_model = load_artifacts()
    segment = int(kmeans.predict(scaler.transform(features[SEGMENT_COLS]))[0])
    churn_prob = float(churn_model.predict_proba(features[FEATURE_COLS])[:, 1][0])
    ltv = float(ltv_model.predict(features[FEATURE_COLS])[0])
    return {"segment": segment, "churn_probability": churn_prob, "ltv_estimate": ltv}


st.set_page_config(page_title="Customer Segmentation & Retention", layout="wide")
st.title("Customer Segmentation & Retention Dashboard")

col1, col2 = st.columns(2)
with col1:
    st.subheader("Latest Metrics")
    metrics = load_latest_metrics(ROOT / "mlflow.db")
    if metrics:
        st.json(metrics)
    else:
        st.info("No metrics found. Run training first.")

with col2:
    st.subheader("Segment Summary")
    summary_path = ARTIFACTS / "segment_summary.csv"
    if summary_path.exists():
        st.dataframe(pd.read_csv(summary_path))
    else:
        st.info("No segment summary found yet.")

st.subheader("Strategic Report")
report_path = ROOT / "reports" / "strategic_report.md"
if report_path.exists():
    st.markdown(report_path.read_text(encoding="utf-8"))
else:
    st.info("No report yet. Run training.")

st.subheader("Predict (Manual Features)")
with st.form("predict_form"):
    cols = st.columns(4)
    inputs = {}
    for i, name in enumerate(FEATURE_COLS):
        with cols[i % 4]:
            inputs[name] = st.number_input(name, min_value=0.0, value=0.0)
    submitted = st.form_submit_button("Predict")
    if submitted:
        features = pd.DataFrame([inputs])
        try:
            out = predict(features)
            st.success(out)
        except Exception as exc:
            st.error(str(exc))

st.subheader("Upload Data & Retrain")
uploaded_file = st.file_uploader("Upload CSV or Excel", type=["csv", "xlsx", "xls"])
mapping_text = st.text_area(
    "Column mapping (JSON). Example:\n"
    '{ "customer_id":"CustomerID", "order_id":"InvoiceNo", "order_datetime":"InvoiceDate", '
    '"product_id":"StockCode", "quantity":"Quantity", "unit_price":"UnitPrice" }'
)

if st.button("Save & Retrain"):
    if not uploaded_file:
        st.error("Upload a dataset first.")
    else:
        DATASET_DIR.mkdir(parents=True, exist_ok=True)
        suffix = Path(uploaded_file.name).suffix.lower()
        data_path = DATASET_DIR / f"uploaded{suffix}"
        data_path.write_bytes(uploaded_file.getbuffer())
        mapping_path = DATASET_DIR / "mapping.json"
        try:
            mapping = json.loads(mapping_text) if mapping_text.strip() else None
        except json.JSONDecodeError as exc:
            st.error(f"Invalid JSON mapping: {exc}")
            mapping = None

        if not mapping:
            st.error("Provide a valid JSON mapping.")
        else:
            mapping_path.write_text(json.dumps(mapping, indent=2), encoding="utf-8")
            cmd = [
                sys.executable,
                str(ROOT / "src" / "train_pipeline.py"),
                "--data-path",
                str(data_path),
                "--mapping-path",
                str(mapping_path),
            ]
            st.write("Running training...")
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                st.success("Training complete.")
                st.text(result.stdout)
            else:
                st.error("Training failed.")
                st.text(result.stderr)
