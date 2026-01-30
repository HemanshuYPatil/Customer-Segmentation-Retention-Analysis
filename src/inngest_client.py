from __future__ import annotations

import logging
import os

import inngest


def get_inngest_client() -> inngest.Inngest:
    app_id = os.getenv("INNGEST_APP_ID", "customer-segmentation-retention")
    return inngest.Inngest(
        app_id=app_id,
        logger=logging.getLogger("uvicorn"),
    )


inngest_client = get_inngest_client()
