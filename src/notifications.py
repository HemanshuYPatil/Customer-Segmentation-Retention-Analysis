from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional


UTC = timezone.utc


def _timestamp() -> str:
    return datetime.now(tz=UTC).strftime("%Y-%m-%d %H:%M:%S UTC")


def build_training_complete_email(
    tenant_id: str,
    run_id: str,
    metrics: dict,
    artifact_prefix: str,
    model_name: str,
) -> tuple[str, str, str]:
    subject = "Model training complete"
    lines = [
        "Your training job has completed.",
        f"Model: {model_name}",
        f"Completed at: {_timestamp()}",
    ]
    if metrics:
        lines.append("Key metrics:")
        for key, value in metrics.items():
            lines.append(f"- {key}: {value}")
    text = "\n".join(lines)
    html = _wrap_email(
        title="Training complete",
        summary="Your model training finished successfully.",
        items=[f"Model: {model_name}", f"Completed at: {_timestamp()}"],
        metrics=metrics,
        footer_note="You can review details in the dashboard.",
    )
    return subject, text, html


def build_prediction_complete_email(
    tenant_id: str,
    prediction_id: str,
    mode: str,
    batch_file_url: Optional[str] = None,
    count: Optional[int] = None,
) -> tuple[str, str, str]:
    subject = "Prediction complete"
    lines = [
        "Your prediction job has completed.",
        f"Mode: {mode}",
        f"Completed at: {_timestamp()}",
    ]
    if count is not None:
        lines.append(f"Rows: {count}")
    if batch_file_url:
        lines.append(f"Batch file: {batch_file_url}")
    text = "\n".join(lines)
    items = [f"Mode: {mode}", f"Completed at: {_timestamp()}"]
    if count is not None:
        items.append(f"Rows: {count}")
    html = _wrap_email(
        title="Prediction complete",
        summary="Your prediction job finished successfully.",
        items=items,
        cta_label="Download batch file" if batch_file_url else None,
        cta_url=batch_file_url,
        footer_note="Open the dashboard to review results.",
    )
    return subject, text, html


def _wrap_email(
    title: str,
    summary: str,
    items: list[str],
    metrics: Optional[dict] = None,
    cta_label: Optional[str] = None,
    cta_url: Optional[str] = None,
    footer_note: Optional[str] = None,
) -> str:
    accent = "#3BA3FF"
    accent_soft = "#183A5B"
    background = "#0B0F14"
    panel = "#121823"
    panel_border = "#1C2533"
    text = "#E6EDF6"
    muted = "#9FB0C7"
    font = "'Bitcount Single','Trebuchet MS','Segoe UI',Arial,sans-serif"

    items_html = "".join(
        f"<tr><td style=\"padding:6px 0;color:{muted};font-size:13px;\">{item}</td></tr>"
        for item in items
    )

    metrics_html = ""
    if metrics:
        rows = "".join(
            f"<tr><td style=\"padding:4px 8px;color:{muted};font-size:12px;\">{key}</td>"
            f"<td style=\"padding:4px 8px;color:{text};font-size:12px;text-align:right;\">{value}</td></tr>"
            for key, value in metrics.items()
        )
        metrics_html = (
            f"<div style=\"margin-top:12px;border:1px solid {panel_border};border-radius:12px;\">"
            f"<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"padding:10px 12px;\">"
            f"{rows}"
            f"</table></div>"
        )

    cta_html = ""
    if cta_label and cta_url:
        cta_html = (
            f"<a href=\"{cta_url}\" style=\"display:inline-block;margin-top:16px;"
            f"padding:10px 18px;background:{accent_soft};color:{text};"
            f"text-decoration:none;border:1px solid {accent};border-radius:999px;"
            f"font-size:13px;font-weight:600;\">{cta_label}</a>"
        )

    footer_html = ""
    if footer_note:
        footer_html = (
            f"<p style=\"margin:18px 0 0;color:{muted};font-size:12px;\">{footer_note}</p>"
        )

    return f"""
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:{background};font-family:{font};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{background};padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:{panel};border:1px solid {panel_border};border-radius:20px;padding:28px;">
            <tr>
              <td style="color:{text};font-size:20px;font-weight:600;letter-spacing:0.02em;">
                {title}
              </td>
            </tr>
            <tr>
              <td style="padding-top:8px;color:{muted};font-size:14px;line-height:1.5;">
                {summary}
              </td>
            </tr>
            <tr>
              <td style="padding-top:16px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  {items_html}
                </table>
              </td>
            </tr>
            <tr>
              <td>
                {metrics_html}
                {cta_html}
                {footer_html}
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 0;color:{muted};font-size:11px;">CSR Analytics</p>
        </td>
      </tr>
    </table>
  </body>
</html>
"""
