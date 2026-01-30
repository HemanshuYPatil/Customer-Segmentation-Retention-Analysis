from __future__ import annotations

import json
import os
from typing import Optional
from urllib import request as urlrequest
from urllib.error import HTTPError, URLError


def enqueue_email_via_frontend(
    to_email: str,
    subject: str,
    html: str,
    text: str,
    metadata: Optional[dict] = None,
    event_id: Optional[str] = None,
) -> None:
    base = os.getenv("FRONTEND_BASE_URL", "http://127.0.0.1:3000").rstrip("/")
    queue_url = os.getenv("FRONTEND_EMAIL_QUEUE_URL", f"{base}/api/queue/email")
    payload = {
        "to_email": to_email,
        "subject": subject,
        "html": html,
        "text": text,
        "metadata": metadata or {},
        "event_id": event_id,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urlrequest.Request(queue_url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        with urlrequest.urlopen(req, timeout=10) as resp:
            if resp.status >= 400:
                raise RuntimeError(f"Email queue returned {resp.status}")
    except (HTTPError, URLError) as exc:
        raise RuntimeError(f"Email queue request failed: {exc}") from exc
