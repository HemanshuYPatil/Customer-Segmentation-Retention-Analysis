from __future__ import annotations

import pandas as pd


def build_rfm_features(df: pd.DataFrame, snapshot_date: pd.Timestamp) -> pd.DataFrame:
    rfm = (
        df.groupby("CustomerID")
        .agg(
            recency_days=("InvoiceDate", lambda x: (snapshot_date - x.max()).days),
            frequency=("InvoiceNo", "nunique"),
            monetary=("TotalPrice", "sum"),
            first_purchase=("InvoiceDate", "min"),
            last_purchase=("InvoiceDate", "max"),
            unique_products=("StockCode", "nunique"),
            avg_basket_value=("TotalPrice", "mean"),
            avg_quantity=("Quantity", "mean"),
        )
        .reset_index()
    )

    rfm["purchase_span_days"] = (rfm["last_purchase"] - rfm["first_purchase"]).dt.days
    rfm["avg_interpurchase_days"] = rfm.apply(
        lambda row: row["purchase_span_days"] / (row["frequency"] - 1)
        if row["frequency"] > 1
        else row["purchase_span_days"],
        axis=1,
    )

    rfm = rfm.drop(columns=["first_purchase", "last_purchase"])
    return rfm


def build_time_split_features(
    df: pd.DataFrame,
    cutoff_date: pd.Timestamp,
    churn_window_days: int,
    ltv_horizon_days: int,
) -> pd.DataFrame:
    history = df[df["InvoiceDate"] <= cutoff_date].copy()
    future = df[df["InvoiceDate"] > cutoff_date].copy()

    snapshot_date = cutoff_date + pd.Timedelta(days=1)
    features = build_rfm_features(history, snapshot_date)

    future_window_end = cutoff_date + pd.Timedelta(days=churn_window_days)
    ltv_window_end = cutoff_date + pd.Timedelta(days=ltv_horizon_days)

    future_churn = (
        future[future["InvoiceDate"] <= future_window_end]
        .groupby("CustomerID")["InvoiceNo"]
        .nunique()
        .rename("future_orders")
    )
    future_ltv = (
        future[future["InvoiceDate"] <= ltv_window_end]
        .groupby("CustomerID")["TotalPrice"]
        .sum()
        .rename("future_spend")
    )

    features = features.merge(future_churn, on="CustomerID", how="left")
    features = features.merge(future_ltv, on="CustomerID", how="left")
    features["future_orders"] = features["future_orders"].fillna(0)
    features["future_spend"] = features["future_spend"].fillna(0.0)
    features["churn_label"] = (features["future_orders"] == 0).astype(int)

    return features
