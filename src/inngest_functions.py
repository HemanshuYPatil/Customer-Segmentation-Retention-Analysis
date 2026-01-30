from __future__ import annotations

import inngest

from brevo_email import send_brevo_email
from inngest_client import inngest_client


@inngest_client.create_function(
    fn_id="send-email-notification",
    trigger=inngest.TriggerEvent(event="csr/email.send"),
)
async def send_email_notification(ctx: inngest.Context) -> dict:
    data = ctx.event.data or {}
    to_email = (data.get("to_email") or "").strip()
    subject = data.get("subject") or ""
    html = data.get("html") or ""
    text = data.get("text") or ""
    if not to_email:
        raise ValueError("Missing to_email")
    send_brevo_email(
        to_email=to_email,
        subject=subject,
        html=html,
        text=text,
        metadata=data.get("metadata") or {},
    )
    return {"status": "sent"}
