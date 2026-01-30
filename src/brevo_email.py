from __future__ import annotations

import json
import os
from urllib import request as urlrequest
from urllib.error import HTTPError, URLError


def send_brevo_email(
    to_email: str,
    subject: str,
    html: str,
    text: str,
    metadata: dict | None = None,
) -> None:
    api_url = os.getenv("BREVO_API_URL") or os.getenv("BVEO_API_URL")
    api_key = os.getenv("BREVO_API_KEY") or os.getenv("BVEO_API_KEY")
    sender_email = os.getenv("BREVO_SENDER_EMAIL") or os.getenv("BVEO_SENDER_EMAIL")
    sender_name = os.getenv("BREVO_SENDER_NAME") or os.getenv("BVEO_SENDER_NAME", "Customer Segmentation")
    if not api_url or not api_key or not sender_email:
        raise RuntimeError("Missing BREVO_API_URL/BREVO_API_KEY/BREVO_SENDER_EMAIL (or BVEO_* fallback)")

    payload = {
        "sender": {"email": sender_email, "name": sender_name},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html,
    }
    if text:
        payload["textContent"] = text
    if metadata:
        payload["params"] = metadata

    data = json.dumps(payload).encode("utf-8")
    req = urlrequest.Request(api_url, data=data, method="POST")
    req.add_header("accept", "application/json")
    req.add_header("content-type", "application/json")
    req.add_header("api-key", api_key)
    try:
        with urlrequest.urlopen(req, timeout=15) as resp:
            if resp.status >= 400:
                raise RuntimeError(f"Brevo API returned {resp.status}")
    except (HTTPError, URLError) as exc:
        raise RuntimeError(f"Brevo request failed: {exc}") from exc
