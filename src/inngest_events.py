from __future__ import annotations

import os
from typing import Optional

import inngest

from inngest_client import inngest_client


EMAIL_EVENT_NAME = "csr/email.send"


def send_email_event(
    to_email: str,
    subject: str,
    html: str,
    text: str,
    metadata: Optional[dict] = None,
    event_id: Optional[str] = None,
) -> None:
    disabled = os.getenv("INNGEST_DISABLED", "").lower() in {"1", "true", "yes"}
    if disabled:
        print("[inngest] email event skipped (INNGEST_DISABLED)")
        return
    payload = {
        "to_email": to_email,
        "subject": subject,
        "html": html,
        "text": text,
        "metadata": metadata or {},
    }
    event = inngest.Event(name=EMAIL_EVENT_NAME, data=payload, id=event_id)
    try:
        inngest_client.send_sync(event)
    except Exception as exc:
        print(f"[inngest] failed to send email event: {exc}")
