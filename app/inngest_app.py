from __future__ import annotations

import sys
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
import inngest.fast_api

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT / "src"))

from inngest_client import inngest_client
from inngest_functions import send_email_notification

load_dotenv()

app = FastAPI(title="Customer Segmentation Inngest Worker")

inngest.fast_api.serve(app, inngest_client, [send_email_notification])
