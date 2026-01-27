from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_recall_curve,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

try:
    from xgboost import XGBClassifier, XGBRegressor
except ImportError:  # pragma: no cover
    XGBClassifier = None
    XGBRegressor = None


@dataclass
class ModelArtifacts:
    scaler: StandardScaler
    kmeans: KMeans
    churn_logreg: LogisticRegression
    churn_xgb: object
    ltv_xgb: object


def select_kmeans_k(X: np.ndarray, k_range: Tuple[int, int], random_state: int) -> Tuple[int, Dict[int, float]]:
    from sklearn.metrics import silhouette_score

    scores: Dict[int, float] = {}
    best_k = k_range[0]
    best_score = -1.0
    for k in range(k_range[0], k_range[1] + 1):
        model = KMeans(n_clusters=k, random_state=random_state, n_init=10)
        labels = model.fit_predict(X)
        score = silhouette_score(X, labels)
        scores[k] = score
        if score > best_score:
            best_k = k
            best_score = score
    return best_k, scores


def train_segmentation(features: pd.DataFrame, random_state: int, k_range: Tuple[int, int]) -> Tuple[StandardScaler, KMeans, pd.DataFrame, Dict[int, float]]:
    seg_features = features[
        [
            "recency_days",
            "frequency",
            "monetary",
            "avg_basket_value",
            "unique_products",
            "avg_interpurchase_days",
        ]
    ].copy()
    scaler = StandardScaler()
    X = scaler.fit_transform(seg_features)
    best_k, scores = select_kmeans_k(X, k_range, random_state)
    kmeans = KMeans(n_clusters=best_k, random_state=random_state, n_init=10)
    features["segment"] = kmeans.fit_predict(X)
    return scaler, kmeans, features, scores


def _find_best_threshold(y_true: np.ndarray, y_prob: np.ndarray) -> Tuple[float, float]:
    best_thresh = 0.5
    best_acc = -1.0
    for thresh in np.linspace(0.05, 0.95, 91):
        preds = (y_prob >= thresh).astype(int)
        acc = accuracy_score(y_true, preds)
        if acc > best_acc:
            best_acc = acc
            best_thresh = float(thresh)
    return best_thresh, float(best_acc)


def train_churn_models(
    features: pd.DataFrame, random_state: int
) -> Tuple[LogisticRegression, object, Dict[str, float]]:
    X = features[
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
    y = features["churn_label"]

    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=0.2, random_state=random_state, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=0.25, random_state=random_state, stratify=y_temp
    )

    logreg = LogisticRegression(max_iter=1000)
    logreg.fit(X_train, y_train)
    logreg_val_prob = logreg.predict_proba(X_val)[:, 1]
    logreg_thresh, logreg_val_acc = _find_best_threshold(y_val.values, logreg_val_prob)
    logreg_test_prob = logreg.predict_proba(X_test)[:, 1]
    logreg_test_pred = (logreg_test_prob >= logreg_thresh).astype(int)
    logreg_f1 = f1_score(y_test, logreg_test_pred)
    logreg_auc = roc_auc_score(y_test, logreg_test_prob)
    logreg_acc = accuracy_score(y_test, logreg_test_pred)

    if XGBClassifier is None:
        raise ImportError("xgboost is required for XGBClassifier")

    candidate_params = [
        {"n_estimators": 300, "max_depth": 4, "learning_rate": 0.05},
        {"n_estimators": 500, "max_depth": 4, "learning_rate": 0.03},
        {"n_estimators": 400, "max_depth": 5, "learning_rate": 0.05},
        {"n_estimators": 600, "max_depth": 6, "learning_rate": 0.03},
    ]

    best_xgb = None
    best_xgb_thresh = 0.5
    best_xgb_val_acc = -1.0
    for params in candidate_params:
        model = XGBClassifier(
            n_estimators=params["n_estimators"],
            max_depth=params["max_depth"],
            learning_rate=params["learning_rate"],
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=random_state,
            eval_metric="logloss",
        )
        model.fit(X_train, y_train)
        val_prob = model.predict_proba(X_val)[:, 1]
        thresh, val_acc = _find_best_threshold(y_val.values, val_prob)
        if val_acc > best_xgb_val_acc:
            best_xgb = model
            best_xgb_thresh = thresh
            best_xgb_val_acc = val_acc

    xgb = best_xgb
    xgb_test_prob = xgb.predict_proba(X_test)[:, 1]
    xgb_test_pred = (xgb_test_prob >= best_xgb_thresh).astype(int)
    xgb_f1 = f1_score(y_test, xgb_test_pred)
    xgb_auc = roc_auc_score(y_test, xgb_test_prob)
    xgb_acc = accuracy_score(y_test, xgb_test_pred)

    baseline_pred = np.zeros_like(y_test)
    baseline_acc = accuracy_score(y_test, baseline_pred)
    baseline_f1 = f1_score(y_test, baseline_pred)

    metrics = {
        "baseline_acc": baseline_acc,
        "baseline_f1": baseline_f1,
        "logreg_f1": logreg_f1,
        "logreg_auc": logreg_auc,
        "logreg_acc": logreg_acc,
        "logreg_best_threshold": float(logreg_thresh),
        "logreg_val_acc": float(logreg_val_acc),
        "xgb_f1": xgb_f1,
        "xgb_auc": xgb_auc,
        "xgb_acc": xgb_acc,
        "xgb_best_threshold": float(best_xgb_thresh),
        "xgb_val_acc": float(best_xgb_val_acc),
    }

    return logreg, xgb, metrics


def train_ltv_model(features: pd.DataFrame, random_state: int) -> Tuple[object, Dict[str, float]]:
    X = features[
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
    y = features["future_spend"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=random_state
    )

    if XGBRegressor is None:
        raise ImportError("xgboost is required for XGBRegressor")

    xgb = XGBRegressor(
        n_estimators=400,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=random_state,
    )
    xgb.fit(X_train, y_train)
    preds = xgb.predict(X_test)
    mae = np.mean(np.abs(preds - y_test))
    rmse = np.sqrt(np.mean((preds - y_test) ** 2))

    metrics = {
        "ltv_mae": float(mae),
        "ltv_rmse": float(rmse),
    }

    return xgb, metrics


def compute_business_cost(y_true: np.ndarray, y_prob: np.ndarray, cost_fp: float, cost_fn: float) -> float:
    preds = (y_prob >= 0.5).astype(int)
    fp = ((preds == 1) & (y_true == 0)).sum()
    fn = ((preds == 0) & (y_true == 1)).sum()
    return float(fp * cost_fp + fn * cost_fn)


def save_artifacts(artifacts_path: str, artifacts: ModelArtifacts) -> None:
    joblib.dump(artifacts.scaler, f"{artifacts_path}/scaler.joblib")
    joblib.dump(artifacts.kmeans, f"{artifacts_path}/kmeans.joblib")
    joblib.dump(artifacts.churn_logreg, f"{artifacts_path}/churn_logreg.joblib")
    joblib.dump(artifacts.churn_xgb, f"{artifacts_path}/churn_xgb.joblib")
    joblib.dump(artifacts.ltv_xgb, f"{artifacts_path}/ltv_xgb.joblib")
