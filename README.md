# Customer Segmentation and Retention Analysis

End-to-end customer segmentation, churn prediction, and LTV estimation with a FastAPI backend, a Streamlit analyst dashboard, and a Next.js business UI. The pipeline cleans transactional data, builds RFM and engagement features, trains segmentation and predictive models, and serves results through an API.

## Architecture

```mermaid
flowchart LR
    A[Raw Transactions] --> B[Cleaning and Validation]
    B --> C[Feature Engineering (RFM + Engagement)]
    C --> D[Segmentation (K-Means)]
    C --> E[Churn Model (LogReg vs XGBoost)]
    C --> F[LTV Model (XGBoost Regressor)]
    D --> G[Segment Summary and Actions]
    E --> G
    F --> G
    G --> H[API + Dashboards]
```

## Key Features

- Automated data cleaning and standardization for transactional datasets.
- RFM and time-split feature engineering.
- K-Means segmentation with summary and recommended actions.
- Churn prediction and LTV estimation with model selection.
- MLflow experiment tracking and artifact generation.
- FastAPI backend for training, predictions, and dataset/model access.
- Streamlit dashboard for analysis and reporting.
- Next.js app for business-facing workflows.
- Optional Backblaze B2 storage for artifacts and datasets.
- Optional Firestore metadata storage for models, runs, queues, and predictions.

## Project Structure

- `app/` FastAPI app and Streamlit dashboard.
- `src/` data pipeline, feature engineering, modeling, training pipeline.
- `frontend/` Next.js app and Inngest workflows.
- `dataset/` or `datasets/` default data location.
- `artifacts/` trained models and feature stores (local).
- `reports/` strategic reports and summaries.
- `mlruns/` local MLflow tracking.
- `artifacts_cache/` cached downloads (B2 inputs and outputs).

## Requirements

- Python 3.10+ (tested with 3.11+)
- Node.js 18+ (frontend)
- Git

## Configuration

### Backend (.env or environment variables)

Firestore (optional but required for queueing and model metadata):
```
FIREBASE_SERVICE_ACCOUNT_PATH=C:\path\to\service-account.json
```

Backblaze B2 (optional artifact and dataset storage):
```
B2_BUCKET=CSR-Bucket
B2_ENDPOINT=s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_KEY_ID=your_key_id
B2_APP_KEY=your_app_key
```

CORS (optional):
```
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Frontend (`frontend/.env.local`)

```
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Running Locally

### 1) Backend setup

```
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 2) Start the API

```
uvicorn app.main:app --reload --port 8000
```

### 3) Train the models (direct)

```
python src/train_pipeline.py --tenant-id tenant_123
```

Default dataset path is `dataset/OnlineRetail.csv` (or `datasets/OnlineRetail.csv` if `dataset/` is missing).

### 4) Streamlit dashboard

```
streamlit run app/dashboard.py
```

### 5) Frontend

```
cd frontend
npm install
npm run dev
```

### 6) Inngest (required for queued training/predictions)

```
cd frontend
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

## Queueing and Jobs

- The Next.js app uses Inngest to trigger `/train` and `/predict_job`.
- The API stores queue jobs in Firestore via `/queue`.
- If Firestore is not configured, queues and model metadata will be empty and the UI will not reflect training progress.

## API Overview

All API calls require the `X-Tenant-Id` header.

Example:
```
curl -H "X-Tenant-Id: tenant_123" http://127.0.0.1:8000/health
```

### Core endpoints

- `GET /health`
- `POST /upload` (multipart: `tenant_id`, `file`, optional `mapping` JSON)
- `POST /train`
- `GET /metrics`
- `GET /segments`
- `GET /models`
- `GET /models/{model_id}`
- `GET /models/{model_id}/json`
- `GET /models/{model_id}/dataset`
- `GET /models/{model_id}/customers/{customer_id}/exists`
- `GET /models/default`
- `POST /models/default`
- `GET /predictions`
- `GET /predictions/{prediction_id}`
- `PATCH /predictions/{prediction_id}`
- `DELETE /predictions/{prediction_id}`
- `GET /predictions/{prediction_id}/download`
- `GET /predictions/{prediction_id}/csv`
- `POST /predict`
- `POST /predict_job`
- `POST /queue`
- `GET /queue`
- `PATCH /queue/{queue_id}`
- `DELETE /models/{model_id}`

### Predict request example

```json
{
  "customer_id": 12345,
  "features": {
    "recency_days": 10,
    "frequency": 5,
    "monetary": 500.0,
    "avg_basket_value": 100.0,
    "unique_products": 20,
    "avg_interpurchase_days": 30.0,
    "purchase_span_days": 150.0
  }
}
```

## Notes

- Training triggered via `/train` runs `src/train_pipeline.py` in a subprocess.
- For B2-backed datasets, the training pipeline caches inputs under `artifacts_cache/` and stores the original `b2://...` paths in Firestore.
- The backend expects only the `X-Tenant-Id` header; Firebase tokens are passed by the frontend but are not validated server-side in this repo.
