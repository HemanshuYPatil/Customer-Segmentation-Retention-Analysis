from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable

import boto3
from botocore.config import Config


def _get_env(name: str) -> str | None:
    value = os.getenv(name)
    return value if value else None


def get_b2_client():
    key_id = _get_env("B2_KEY_ID")
    app_key = _get_env("B2_APP_KEY")
    endpoint = _get_env("B2_ENDPOINT")
    region = _get_env("B2_REGION") or "us-east-005"
    if not (key_id and app_key and endpoint):
        return None
    return boto3.client(
        "s3",
        aws_access_key_id=key_id,
        aws_secret_access_key=app_key,
        region_name=region,
        endpoint_url=f"https://{endpoint}",
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )


def upload_files(client, bucket: str, local_paths: Iterable[Path], prefix: str) -> None:
    for path in local_paths:
        key = f"{prefix}/{path.name}"
        try:
            client.upload_file(str(path), bucket, key)
        except Exception as exc:  # pragma: no cover
            print(f"B2 upload failed for {path.name}: {exc}")


def download_file(client, bucket: str, key: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    client.download_file(bucket, key, str(dest))


def presign_download_url(client, bucket: str, key: str, expires_in: int = 3600) -> str:
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=expires_in,
    )
