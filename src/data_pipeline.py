from __future__ import annotations

import pandas as pd


def load_raw_transactions(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, encoding="ISO-8859-1")
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
