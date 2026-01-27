# Customer Segmentation & Retention Analysis - Final Wrap-Up

Date: 2026-01-27

## Overview
This project delivers an end-to-end customer segmentation and retention system built on messy, real-world transactional data. It includes a data cleaning pipeline, RFM feature engineering, segmentation, churn prediction, LTV estimation, MLflow experiment tracking, and deployment via FastAPI plus a web dashboard for upload/retrain.

## Core Outputs (What Exists Now)
- **Data Pipeline**: `src/data_pipeline.py`
- **Feature Engineering**: `src/features.py`
- **Model Training**: `src/modeling.py`, `src/train_pipeline.py`
- **Strategic Report**: `reports/strategic_report.md`
- **Artifacts**: `artifacts/` (models, feature store, segments)
- **API**: `app/main.py`
- **Dashboard**: `app/dashboard.py`
- **Dependencies**: `requirements.txt`
- **Flowchart**: `research/flowchart.mmd` (Mermaid)
- **Documentation**: `README.md`

## Files Created/Updated
- `src/config.py`
- `src/data_pipeline.py`
- `src/features.py`
- `src/modeling.py`
- `src/train_pipeline.py`
- `src/reporting.py`
- `app/main.py`
- `app/dashboard.py`
- `requirements.txt`
- `README.md`
- `research/flowchart.mmd`
- `reports/strategic_report.md`
- `reports/final_summary.md`

## Data Handling Decisions (Trade-offs)
- Missing customer IDs are dropped to avoid anonymous leakage.
- Canceled invoices removed to match realized revenue.
- Negative/zero quantities and prices removed.
- Session data not available; proxy engagement features used.
- Time-based holdout to reduce leakage.

## Model Components
1. **Segmentation**: K-Means on RFM + engagement proxies.
2. **Churn Prediction**: Logistic Regression + XGBoost; best accuracy model is saved as `artifacts/churn_best.joblib`.
3. **LTV Regression**: XGBoost regressor on the same feature set.

## Latest Logged Metrics
From the most recent MLflow run:
```
Churn metrics: {
  'baseline_acc': 0.6990,
  'baseline_f1': 0.0,
  'logreg_f1': 0.1958,
  'logreg_auc': 0.7382,
  'logreg_acc': 0.7139,
  'logreg_best_threshold': 0.57,
  'logreg_val_acc': 0.7090,
  'xgb_f1': 0.1014,
  'xgb_auc': 0.7291,
  'xgb_acc': 0.6915,
  'xgb_best_threshold': 0.73,
  'xgb_val_acc': 0.7239
}
LTV metrics: {
  'ltv_mae': 935.4539,
  'ltv_rmse': 4436.4090
}
Selected churn model for API: churn_logreg.joblib
```

Interpretation:
- Baseline accuracy is ~0.70 (predict churn for everyone).
- Best model accuracy is ~0.71 (logistic regression).
- This is moderate performance on the dataset; 90% accuracy is not realistic without richer data or a different label definition.

## How Companies Integrate Their Own Data
Each company can upload Excel/CSV and provide a column mapping (JSON). The pipeline then standardizes columns and retrains.

Example mapping:
```
{
  "customer_id": "ClientNumber",
  "order_id": "TxnID",
  "order_datetime": "PurchaseDate",
  "product_id": "SKU",
  "quantity": "Units",
  "unit_price": "Price"
}
```

If only order totals exist:
```
{
  "customer_id": "ClientNumber",
  "order_id": "TxnID",
  "order_datetime": "PurchaseDate",
  "product_id": "SKU",
  "order_total": "OrderTotal"
}
```

## Web Interface (Upload + Retrain)
Run:
```
streamlit run app/dashboard.py
```
The dashboard lets companies:
- View metrics and segment summaries
- Read strategic report
- Upload data + mapping
- Retrain the model

## API Usage
Run:
```
uvicorn app.main:app --reload
```

Example:
```
curl -X POST "http://127.0.0.1:8000/predict" ^
  -H "Content-Type: application/json" ^
  -d "{\"customer_id\": 17850}"
```

## Drift + Retraining Plan
- Weekly data checks, monthly evaluation.
- Trigger retraining if PSI > 0.2 or AUC drops >10%.
- Retrain on the latest 12–18 months.

## Notes and Limitations
- Accuracy depends heavily on dataset signal.
- This pipeline is reusable, but models must be retrained per company.
- Improvements possible with behavioral/session data.
