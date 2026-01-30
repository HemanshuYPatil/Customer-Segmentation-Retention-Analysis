from __future__ import annotations

from dotenv import load_dotenv
from email_queue import run_worker_loop


if __name__ == "__main__":
    load_dotenv()
    run_worker_loop()
