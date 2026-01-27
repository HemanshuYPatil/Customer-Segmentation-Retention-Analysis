from __future__ import annotations

from pathlib import Path
from typing import Dict, Optional

import pandas as pd


def load_raw_transactions(path: str) -> pd.DataFrame:
    file_path = Path(path)
    if file_path.suffix.lower() in {".xlsx", ".xls"}:
        df = pd.read_excel(file_path)
    else:
        df = pd.read_csv(file_path, encoding="ISO-8859-1")
    return df


def standardize_columns(df: pd.DataFrame, mapping: Optional[Dict[str, str]] = None) -> pd.DataFrame:
    if not mapping:
        return df

    required = {"customer_id", "order_id", "order_datetime", "product_id"}
    missing = required - set(mapping.keys())
    if missing:
        raise ValueError(f"Missing required mappings: {sorted(missing)}")

    df = df.copy()

    def _col(key: str) -> str:
        return mapping[key]

    df["CustomerID"] = df[_col("customer_id")]
    df["InvoiceNo"] = df[_col("order_id")]
    df["InvoiceDate"] = df[_col("order_datetime")]
    df["StockCode"] = df[_col("product_id")]

    if "quantity" in mapping and "unit_price" in mapping:
        df["Quantity"] = df[_col("quantity")]
        df["UnitPrice"] = df[_col("unit_price")]
    elif "order_total" in mapping:
        df["Quantity"] = 1
        df["UnitPrice"] = df[_col("order_total")]
    else:
        raise ValueError("Provide quantity+unit_price or order_total in mapping.")

    return df


def clean_transactions(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df["InvoiceDate"] = pd.to_datetime(df["InvoiceDate"], errors="coerce")
    df["CustomerID"] = pd.to_numeric(df["CustomerID"], errors="coerce").astype("Int64")

    # Drop rows with missing critical fields
    df = df.dropna(subset=["InvoiceNo", "InvoiceDate", "CustomerID", "StockCode"])

    # Remove canceled invoices
    df = df[~df["InvoiceNo"].astype(str).str.startswith("C")]

    # Remove non-positive quantities/prices
    df = df[(df["Quantity"] > 0) & (df["UnitPrice"] > 0)]

    # Remove duplicates
    df = df.drop_duplicates()

    df["TotalPrice"] = df["Quantity"] * df["UnitPrice"]

    return df
