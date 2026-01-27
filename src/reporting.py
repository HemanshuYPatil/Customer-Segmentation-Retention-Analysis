from __future__ import annotations

import pandas as pd


def build_segment_summary(features: pd.DataFrame) -> pd.DataFrame:
    summary = (
        features.groupby("segment")
        .agg(
            customers=("CustomerID", "count"),
            avg_recency=("recency_days", "mean"),
            avg_frequency=("frequency", "mean"),
            avg_monetary=("monetary", "mean"),
            churn_rate=("churn_label", "mean"),
            avg_future_spend=("future_spend", "mean"),
        )
        .reset_index()
        .sort_values("avg_monetary", ascending=False)
    )
    return summary


def recommend_actions(summary: pd.DataFrame) -> pd.DataFrame:
    actions = []
    for _, row in summary.iterrows():
        if row["avg_monetary"] >= summary["avg_monetary"].quantile(0.75) and row["churn_rate"] < 0.4:
            action = "Offer early access + loyalty perks"
        elif row["avg_monetary"] >= summary["avg_monetary"].median() and row["churn_rate"] >= 0.4:
            action = "Targeted retention incentives"
        elif row["avg_monetary"] < summary["avg_monetary"].median() and row["churn_rate"] >= 0.6:
            action = "Low-touch win-back or deprioritize"
        else:
            action = "Nurture with product education"
        actions.append(action)
    summary["recommended_action"] = actions
    return summary


def write_strategic_report(summary: pd.DataFrame, path: str) -> None:
    lines = [
        "# Strategic Recommendation Report",
        "",
        "This report translates segmentation and churn outputs into actionable retention strategy.",
        "",
    ]
    for _, row in summary.iterrows():
        lines.append(f"## Segment {int(row['segment'])}")
        lines.append(f"- Customers: {int(row['customers'])}")
        lines.append(f"- Avg Recency (days): {row['avg_recency']:.1f}")
        lines.append(f"- Avg Frequency: {row['avg_frequency']:.1f}")
        lines.append(f"- Avg Monetary: {row['avg_monetary']:.2f}")
        lines.append(f"- Churn Rate: {row['churn_rate']:.2%}")
        lines.append(f"- Avg Future Spend: {row['avg_future_spend']:.2f}")
        lines.append(f"- Recommended Action: {row['recommended_action']}")
        lines.append("")

    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
