from __future__ import annotations

import json
from pathlib import Path

import mlflow
import numpy as np
import pandas as pd

from config import get_config, get_paths
from data_pipeline import clean_transactions, load_raw_transactions
from features import build_rfm_features, build_time_split_features
from modeling import (
    ModelArtifacts,
    compute_business_cost,
    save_artifacts,
    train_churn_models,
    train_ltv_model,
    train_segmentation,
)
from reporting import build_segment_summary, recommend_actions, write_strategic_report


def main() -> None:
    paths = get_paths()
    config = get_config()

    paths.artifacts.mkdir(parents=True, exist_ok=True)
    paths.reports.mkdir(parents=True, exist_ok=True)

    df_raw = load_raw_transactions(str(config.data_file))
    df = clean_transactions(df_raw)

    snapshot_date = df["InvoiceDate"].max() + pd.Timedelta(days=1)
    rfm = build_rfm_features(df, snapshot_date)

    cutoff_date = df["InvoiceDate"].max() - pd.Timedelta(days=config.holdout_days)
    modeling_df = build_time_split_features(
        df,
        cutoff_date=cutoff_date,
        churn_window_days=config.churn_window_days,
        ltv_horizon_days=config.ltv_horizon_days,
    )

    modeling_df = modeling_df[modeling_df["frequency"] >= config.min_transactions].copy()

    mlflow.set_experiment(config.mlflow_experiment)
    with mlflow.start_run(run_name="customer_segmentation_retention"):
        mlflow.log_params(
            {
                "churn_window_days": config.churn_window_days,
                "ltv_horizon_days": config.ltv_horizon_days,
                "holdout_days": config.holdout_days,
                "min_transactions": config.min_transactions,
            }
        )

        scaler, kmeans, segmented_df, k_scores = train_segmentation(
            rfm, config.random_state, config.k_range
        )
        segmented_df.to_csv(paths.artifacts / "segmented_customers.csv", index=False)

        churn_logreg, churn_xgb, churn_metrics = train_churn_models(
            modeling_df, config.random_state
        )
        mlflow.log_metrics(churn_metrics)

        ltv_xgb, ltv_metrics = train_ltv_model(modeling_df, config.random_state)
        mlflow.log_metrics(ltv_metrics)

        y_true = modeling_df["churn_label"].values
        churn_probs = churn_xgb.predict_proba(
            modeling_df[
                [
                    "recency_days",
                    "frequency",
                    "monetary",
                    "avg_basket_value",
                    "unique_products",
                    "avg_interpurchase_days",
                    "purchase_span_days",
                ]
            ]
        )[:, 1]
        business_cost = compute_business_cost(y_true, churn_probs, cost_fp=5.0, cost_fn=20.0)
        mlflow.log_metric("business_cost", business_cost)

        artifacts = ModelArtifacts(
            scaler=scaler,
            kmeans=kmeans,
            churn_logreg=churn_logreg,
            churn_xgb=churn_xgb,
            ltv_xgb=ltv_xgb,
        )
        save_artifacts(str(paths.artifacts), artifacts)
        # Save the best churn model by accuracy for API use
        best_model_name = (
            "churn_logreg.joblib"
            if churn_metrics["logreg_acc"] >= churn_metrics["xgb_acc"]
            else "churn_xgb.joblib"
        )
        best_model_path = paths.artifacts / best_model_name
        (paths.artifacts / "churn_best.joblib").write_bytes(best_model_path.read_bytes())

        modeling_df.to_csv(paths.artifacts / "feature_store.csv", index=False)

        segment_summary = build_segment_summary(
            segmented_df.merge(
                modeling_df[["CustomerID", "churn_label", "future_spend"]],
                on="CustomerID",
                how="left",
            ).fillna({"churn_label": 0, "future_spend": 0.0})
        )
        segment_summary = recommend_actions(segment_summary)
        segment_summary.to_csv(paths.artifacts / "segment_summary.csv", index=False)
        write_strategic_report(segment_summary, str(paths.reports / "strategic_report.md"))

        with open(paths.artifacts / "kmeans_scores.json", "w", encoding="utf-8") as f:
            json.dump(k_scores, f, indent=2)

        mlflow.log_artifact(str(paths.reports / "strategic_report.md"))
        mlflow.log_artifact(str(paths.artifacts / "segment_summary.csv"))

        print("Churn metrics:", churn_metrics)
        print("LTV metrics:", ltv_metrics)
        print(f"Selected churn model for API: {best_model_name}")


if __name__ == "__main__":
    main()
