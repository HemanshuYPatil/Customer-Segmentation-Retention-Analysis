from __future__ import annotations

import json
import os
import uuid
from pathlib import Path
import argparse
import yaml

import mlflow
import numpy as np
import pandas as pd
from dotenv import load_dotenv

from config import get_config, get_paths
from data_pipeline import clean_transactions, load_raw_transactions, standardize_columns
from storage import get_b2_client, upload_files, download_file, parse_b2_url
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
from firestore_client import write_training_metadata, write_segment_summary, write_model_registry
from notifications import build_training_complete_email
from email_queue_client import enqueue_email_via_frontend


def _load_mapping(mapping_path: Path) -> dict:
    if mapping_path.suffix.lower() in {".yaml", ".yml"}:
        with open(mapping_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    with open(mapping_path, "r", encoding="utf-8") as f:
        return json.load(f)


def _resolve_b2_input(url: str, tenant_id: str, label: str) -> Path:
    parsed = parse_b2_url(url)
    if not parsed:
        return Path(url)
    bucket, key = parsed
    client = get_b2_client()
    if client is None:
        raise RuntimeError(f"B2 client not configured for {label}")
    cache_dir = Path(__file__).resolve().parents[1] / "artifacts_cache" / tenant_id / "inputs"
    cache_dir.mkdir(parents=True, exist_ok=True)
    local_path = cache_dir / Path(key).name
    download_file(client, bucket, key, local_path)
    return local_path


def main() -> None:
    load_dotenv()
    parser = argparse.ArgumentParser(description="Train segmentation and churn models.")
    parser.add_argument("--data-path", type=str, default=None)
    parser.add_argument("--mapping-path", type=str, default=None)
    parser.add_argument("--tenant-id", type=str, default="local")
    parser.add_argument("--notify-email", type=str, default=None)
    args = parser.parse_args()

    paths = get_paths()
    if not os.getenv("MLFLOW_TRACKING_URI"):
        mlflow.set_tracking_uri(f"file:{paths.root / 'mlruns'}")
    config = get_config()

    paths.artifacts.mkdir(parents=True, exist_ok=True)
    paths.reports.mkdir(parents=True, exist_ok=True)

    data_file = Path(args.data_path) if args.data_path else config.data_file
    if args.data_path:
        data_file = _resolve_b2_input(args.data_path, args.tenant_id, "dataset")
    df_raw = load_raw_transactions(str(data_file))
    if args.mapping_path:
        mapping_path = _resolve_b2_input(args.mapping_path, args.tenant_id, "mapping")
        mapping = _load_mapping(mapping_path)
        df_raw = standardize_columns(df_raw, mapping)
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

    run_id = str(uuid.uuid4())
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

        b2_bucket = os.getenv("B2_BUCKET")
        client = get_b2_client()
        if client and b2_bucket:
            prefix = f"tenants/{args.tenant_id}/models"
            local_paths = [
                paths.artifacts / "scaler.joblib",
                paths.artifacts / "kmeans.joblib",
                paths.artifacts / "churn_logreg.joblib",
                paths.artifacts / "churn_xgb.joblib",
                paths.artifacts / "churn_best.joblib",
                paths.artifacts / "ltv_xgb.joblib",
                paths.artifacts / "segment_summary.csv",
                paths.artifacts / "feature_store.csv",
                paths.artifacts / "kmeans_scores.json",
            ]
            upload_files(client, b2_bucket, local_paths, prefix)
            artifact_prefix = f"b2://{b2_bucket}/{prefix}"
        else:
            artifact_prefix = str(paths.artifacts)

        full_metrics = {**churn_metrics, **ltv_metrics, "business_cost": business_cost}
        write_training_metadata(
            tenant_id=args.tenant_id,
            run_id=run_id,
            metrics=full_metrics,
            artifact_prefix=artifact_prefix,
            dataset_path=str(data_file),
            mapping_path=str(args.mapping_path) if args.mapping_path else None,
        )
        model_name = f"{Path(data_file).name} ({run_id[:8]})"
        write_model_registry(
            tenant_id=args.tenant_id,
            model_id=run_id,
            name=model_name,
            metrics=full_metrics,
            artifact_prefix=artifact_prefix,
        )
        write_segment_summary(
            tenant_id=args.tenant_id,
            run_id=run_id,
            summary_rows=segment_summary.to_dict(orient="records"),
        )
        if args.notify_email:
            subject, text, html = build_training_complete_email(
                tenant_id=args.tenant_id,
                run_id=run_id,
                metrics=full_metrics,
                artifact_prefix=artifact_prefix,
                model_name=model_name,
            )
            try:
                enqueue_email_via_frontend(
                    to_email=args.notify_email,
                    subject=subject,
                    html=html,
                    text=text,
                    metadata={"type": "training_complete", "tenant_id": args.tenant_id, "run_id": run_id},
                    event_id=f"training-email-{run_id}",
                )
            except Exception as exc:
                print(f"[email] queue failed: {exc}")


if __name__ == "__main__":
    main()
