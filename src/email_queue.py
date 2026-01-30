from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import json
import os
import sqlite3
import threading
import time
import uuid
from typing import Optional
from urllib import request as urlrequest
from urllib.error import HTTPError, URLError


UTC = timezone.utc


@dataclass(frozen=True)
class EmailJob:
    job_id: str
    to_email: str
    subject: str
    html: str
    text: str
    metadata: Optional[dict]


def _now() -> datetime:
    return datetime.now(tz=UTC)


def _iso(dt: datetime) -> str:
    return dt.isoformat()


def get_queue_db_path() -> str:
    override = os.getenv("EMAIL_QUEUE_DB_PATH")
    if override:
        return override
    root = os.path.dirname(os.path.dirname(__file__))
    return os.path.join(root, "artifacts", "email_queue.db")


def init_email_queue(db_path: Optional[str] = None) -> None:
    path = db_path or get_queue_db_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    conn = sqlite3.connect(path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS email_queue (
                id TEXT PRIMARY KEY,
                to_email TEXT NOT NULL,
                subject TEXT NOT NULL,
                html TEXT NOT NULL,
                text TEXT NOT NULL,
                metadata TEXT,
                status TEXT NOT NULL,
                attempts INTEGER NOT NULL DEFAULT 0,
                next_attempt_at TEXT,
                last_error TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, next_attempt_at)"
        )
        conn.commit()
    finally:
        conn.close()


def enqueue_email(
    to_email: str,
    subject: str,
    html: str,
    text: str,
    metadata: Optional[dict] = None,
    db_path: Optional[str] = None,
) -> str:
    init_email_queue(db_path)
    job_id = str(uuid.uuid4())
    now = _now()
    payload = json.dumps(metadata) if metadata else None
    path = db_path or get_queue_db_path()
    conn = sqlite3.connect(path)
    try:
        conn.execute(
            """
            INSERT INTO email_queue (
                id, to_email, subject, html, text, metadata,
                status, attempts, next_attempt_at, last_error, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                job_id,
                to_email,
                subject,
                html,
                text,
                payload,
                "pending",
                0,
                _iso(now),
                None,
                _iso(now),
                _iso(now),
            ),
        )
        conn.commit()
    finally:
        conn.close()
    return job_id


def _claim_next_job(conn: sqlite3.Connection) -> Optional[EmailJob]:
    now = _iso(_now())
    conn.execute("BEGIN IMMEDIATE")
    row = conn.execute(
        """
        SELECT id, to_email, subject, html, text, metadata
        FROM email_queue
        WHERE status = 'pending'
          AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
        ORDER BY created_at ASC
        LIMIT 1
        """,
        (now,),
    ).fetchone()
    if not row:
        conn.execute("COMMIT")
        return None
    job_id = row[0]
    conn.execute(
        "UPDATE email_queue SET status = 'processing', updated_at = ? WHERE id = ?",
        (now, job_id),
    )
    conn.execute("COMMIT")
    metadata = json.loads(row[5]) if row[5] else None
    return EmailJob(
        job_id=job_id,
        to_email=row[1],
        subject=row[2],
        html=row[3],
        text=row[4],
        metadata=metadata,
    )


def _record_success(conn: sqlite3.Connection, job_id: str) -> None:
    now = _iso(_now())
    conn.execute(
        "UPDATE email_queue SET status = 'sent', updated_at = ?, last_error = NULL WHERE id = ?",
        (now, job_id),
    )


def _record_failure(conn: sqlite3.Connection, job_id: str, error: str, max_attempts: int) -> None:
    now = _now()
    row = conn.execute(
        "SELECT attempts FROM email_queue WHERE id = ?",
        (job_id,),
    ).fetchone()
    attempts = int(row[0]) if row else 0
    attempts += 1
    status = "failed" if attempts >= max_attempts else "pending"
    delay_seconds = min(3600, 15 * (2 ** (attempts - 1)))
    next_attempt = _iso(now + timedelta(seconds=delay_seconds))
    conn.execute(
        """
        UPDATE email_queue
        SET status = ?, attempts = ?, next_attempt_at = ?, last_error = ?, updated_at = ?
        WHERE id = ?
        """,
        (status, attempts, next_attempt, error[:500], _iso(now), job_id),
    )


def _send_brevo_email(job: EmailJob) -> None:
    api_url = os.getenv("BREVO_API_URL") or os.getenv("BVEO_API_URL")
    api_key = os.getenv("BREVO_API_KEY") or os.getenv("BVEO_API_KEY")
    sender_email = os.getenv("BREVO_SENDER_EMAIL") or os.getenv("BVEO_SENDER_EMAIL")
    sender_name = os.getenv("BREVO_SENDER_NAME") or os.getenv("BVEO_SENDER_NAME", "Customer Segmentation")
    if not api_url or not api_key or not sender_email:
        raise RuntimeError("Missing BREVO_API_URL/BREVO_API_KEY/BREVO_SENDER_EMAIL (or BVEO_* fallback)")

    payload = {
        "sender": {"email": sender_email, "name": sender_name},
        "to": [{"email": job.to_email}],
        "subject": job.subject,
        "htmlContent": job.html,
    }
    if job.text:
        payload["textContent"] = job.text
    if job.metadata:
        payload["params"] = job.metadata

    data = json.dumps(payload).encode("utf-8")
    req = urlrequest.Request(api_url, data=data, method="POST")
    req.add_header("accept", "application/json")
    req.add_header("content-type", "application/json")
    req.add_header("api-key", api_key)
    with urlrequest.urlopen(req, timeout=15) as resp:
        if resp.status >= 400:
            raise RuntimeError(f"BVEO API returned {resp.status}")


def process_due_emails(
    db_path: Optional[str] = None,
    max_attempts: int = 5,
) -> bool:
    path = db_path or get_queue_db_path()
    init_email_queue(path)
    conn = sqlite3.connect(path)
    try:
        job = _claim_next_job(conn)
        if not job:
            return False
        try:
            _send_brevo_email(job)
            _record_success(conn, job.job_id)
            conn.commit()
            print(f"[email_queue] sent job {job.job_id} to {job.to_email}")
        except (HTTPError, URLError, RuntimeError) as exc:
            _record_failure(conn, job.job_id, str(exc), max_attempts=max_attempts)
            conn.commit()
            print(f"[email_queue] failed job {job.job_id}: {exc}")
        return True
    finally:
        conn.close()


def run_worker_loop(
    db_path: Optional[str] = None,
    poll_interval: float = 3.0,
    max_attempts: int = 5,
) -> None:
    print("[email_queue] worker started")
    while True:
        processed = process_due_emails(db_path=db_path, max_attempts=max_attempts)
        if not processed:
            time.sleep(poll_interval)


def start_worker_thread(
    db_path: Optional[str] = None,
    poll_interval: float = 3.0,
    max_attempts: int = 5,
) -> Optional[threading.Thread]:
    enabled = os.getenv("EMAIL_QUEUE_WORKER_ENABLED", "true").lower() in {"1", "true", "yes"}
    if not enabled:
        print("[email_queue] worker disabled by EMAIL_QUEUE_WORKER_ENABLED")
        return None
    thread = threading.Thread(
        target=run_worker_loop,
        args=(db_path, poll_interval, max_attempts),
        daemon=True,
    )
    thread.start()
    return thread
