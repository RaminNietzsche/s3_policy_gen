"""Upload static site and fix object Content-Type on S3."""

from __future__ import annotations

import sys
from pathlib import Path

from deploy.config import (
    ROOT,
    S3Credentials,
    apply_bucket_cors,
    apply_public_read_policy,
    apply_static_website,
    ensure_bucket,
    fix_object_mime,
    fonts_present,
    iter_deploy_files,
    make_s3_client,
    merge_credentials,
    upload_file,
    website_hint,
)

FIX_MIME_FILES: list[tuple[Path, str]] = [
    (ROOT / "css" / "styles.css", "css/styles.css"),
    (ROOT / "index.html", "index.html"),
    (ROOT / "assets" / "favicon.svg", "assets/favicon.svg"),
]


def deploy(creds: S3Credentials | None = None) -> None:
    creds = merge_credentials(creds)

    if not fonts_present():
        print(
            "Warning: no fonts under assets/fonts/. Run: make assets",
            file=sys.stderr,
        )

    print(f"Deploy from: {ROOT}")
    print(f"Target: s3://{creds.bucket}/ @ {creds.endpoint}")

    client = make_s3_client(creds)
    ensure_bucket(client, creds.bucket)
    apply_public_read_policy(client, creds.bucket)
    apply_bucket_cors(client, creds.bucket)
    apply_static_website(client, creds.bucket)

    files = iter_deploy_files(ROOT)
    if not files:
        print("Error: no files to upload.", file=sys.stderr)
        sys.exit(1)

    print(f"Uploading {len(files)} file(s)...")
    for local_path, key in files:
        upload_file(client, creds.bucket, local_path, key)

    website_hint(creds)


def fix_mime(creds: S3Credentials | None = None) -> None:
    creds = merge_credentials(creds)
    print(f"Fix MIME on s3://{creds.bucket}/ @ {creds.endpoint}")

    client = make_s3_client(creds)
    fixed = 0
    for local_path, key in FIX_MIME_FILES:
        if not local_path.is_file():
            continue
        fix_object_mime(client, creds.bucket, local_path, key)
        fixed += 1

    if fixed == 0:
        print("Error: no local files found to fix.", file=sys.stderr)
        sys.exit(1)

    print(f"Fixed {fixed} object(s). Hard-refresh the site (Ctrl+Shift+R).")
    website_hint(creds)
