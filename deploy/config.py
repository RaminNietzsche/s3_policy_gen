"""S3 credentials, bucket setup, and upload helpers."""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_ENDPOINT = "https://s3.ir-thr-at1.arvanstorage.ir"
DEFAULT_REGION = "us-east-1"
DEPLOY_ENV_FILE = ROOT / ".deploy.env"

MIME_BY_SUFFIX: dict[str, str] = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".woff2": "font/woff2",
    ".svg": "image/svg+xml",
    ".json": "application/json; charset=utf-8",
}

BUCKET_CORS: dict[str, Any] = {
    "CORSRules": [
        {
            "AllowedOrigins": ["*"],
            "AllowedMethods": ["GET", "HEAD"],
            "AllowedHeaders": ["*"],
            "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
            "MaxAgeSeconds": 3600,
        }
    ]
}

PUBLIC_READ_POLICY_TEMPLATE = """{{
  "Version": "2012-10-17",
  "Statement": [
    {{
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::{bucket}/*"]
    }}
  ]
}}"""


@dataclass
class S3Credentials:
    bucket: str
    access_key_id: str
    secret_access_key: str
    endpoint: str = DEFAULT_ENDPOINT
    region: str = DEFAULT_REGION

    @classmethod
    def from_env(cls) -> S3Credentials | None:
        bucket = os.environ.get("S3_BUCKET", "").strip()
        access = os.environ.get("S3_ACCESS_KEY_ID", "").strip()
        secret = os.environ.get("S3_SECRET_ACCESS_KEY", "").strip()
        if not (bucket and access and secret):
            return None
        return cls(
            bucket=bucket,
            access_key_id=access,
            secret_access_key=secret,
            endpoint=normalize_endpoint(os.environ.get("S3_ENDPOINT", DEFAULT_ENDPOINT)),
            region=os.environ.get("S3_REGION", DEFAULT_REGION).strip() or DEFAULT_REGION,
        )

    @classmethod
    def from_cli(
        cls,
        bucket: str,
        access_key: str,
        secret_key: str,
        endpoint: str = "",
    ) -> S3Credentials:
        return cls(
            bucket=bucket.strip(),
            access_key_id=access_key.strip(),
            secret_access_key=secret_key.strip(),
            endpoint=normalize_endpoint(endpoint or DEFAULT_ENDPOINT),
        )


def normalize_endpoint(url: str) -> str:
    url = (url or DEFAULT_ENDPOINT).strip().rstrip("/")
    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"
    return url


def load_deploy_env(path: Path | None = None) -> dict[str, str]:
    path = path or DEPLOY_ENV_FILE
    out: dict[str, str] = {}
    if not path.is_file():
        return out
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        key, _, value = line.partition("=")
        out[key.strip()] = value.strip()
    return out


def merge_credentials(cli: S3Credentials | None = None) -> S3Credentials:
    file_env = load_deploy_env()
    env = S3Credentials.from_env()

    bucket = (cli.bucket if cli else "") or file_env.get("S3_BUCKET", "") or (
        env.bucket if env else ""
    )
    access = (cli.access_key_id if cli else "") or file_env.get(
        "S3_ACCESS_KEY_ID", ""
    ) or (env.access_key_id if env else "")
    secret = (cli.secret_access_key if cli else "") or file_env.get(
        "S3_SECRET_ACCESS_KEY", ""
    ) or os.environ.get("S3_SECRET_ACCESS_KEY", "") or (
        env.secret_access_key if env else ""
    )
    endpoint = normalize_endpoint(
        (cli.endpoint if cli else "")
        or file_env.get("S3_ENDPOINT", "")
        or (env.endpoint if env else DEFAULT_ENDPOINT)
    )
    region = (
        (cli.region if cli else "")
        or file_env.get("S3_REGION", "")
        or (env.region if env else DEFAULT_REGION)
    )

    missing = [
        name
        for name, val in (
            ("S3_BUCKET", bucket),
            ("S3_ACCESS_KEY_ID", access),
            ("S3_SECRET_ACCESS_KEY", secret),
        )
        if not val
    ]
    if missing:
        print(f"Error: missing: {', '.join(missing)}", file=sys.stderr)
        if DEPLOY_ENV_FILE.is_file():
            print(f"  Loaded: {DEPLOY_ENV_FILE}", file=sys.stderr)
        else:
            print(f"  No file: {DEPLOY_ENV_FILE}", file=sys.stderr)
        if "S3_SECRET_ACCESS_KEY" in missing:
            print(
                "  Add S3_SECRET_ACCESS_KEY to .deploy.env (one line) or run: make deploy",
                file=sys.stderr,
            )
        print(
            "  Or: python3 -m deploy deploy BUCKET ACCESS SECRET [ENDPOINT]",
            file=sys.stderr,
        )
        sys.exit(1)

    return S3Credentials(
        bucket=bucket,
        access_key_id=access,
        secret_access_key=secret,
        endpoint=endpoint,
        region=region or DEFAULT_REGION,
    )


def make_s3_client(creds: S3Credentials):
    session = boto3.Session(
        aws_access_key_id=creds.access_key_id,
        aws_secret_access_key=creds.secret_access_key,
        region_name=creds.region,
    )
    return session.client(
        "s3",
        endpoint_url=creds.endpoint,
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
        ),
    )


def bucket_exists(client, bucket: str) -> bool:
    try:
        client.head_bucket(Bucket=bucket)
        return True
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "")
        if code in ("404", "NoSuchBucket", "NotFound"):
            return False
        if code in ("403", "Forbidden"):
            print(
                f"Warning: cannot confirm bucket '{bucket}' (403). Continuing.",
                file=sys.stderr,
            )
            return True
        raise


def ensure_bucket(client, bucket: str) -> None:
    if bucket_exists(client, bucket):
        print(f"Bucket exists: {bucket}")
        return
    print(f"Creating bucket: {bucket}")
    try:
        client.create_bucket(Bucket=bucket)
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "")
        if code in ("BucketAlreadyOwnedByYou", "BucketAlreadyExists"):
            print(f"Bucket already present: {bucket}")
            return
        raise
    print(f"Created bucket: {bucket}")


def apply_bucket_cors(client, bucket: str) -> None:
    print(f"Applying bucket CORS: {bucket}")
    client.put_bucket_cors(Bucket=bucket, CORSConfiguration=BUCKET_CORS)


def apply_public_read_policy(client, bucket: str) -> None:
    policy = PUBLIC_READ_POLICY_TEMPLATE.format(bucket=bucket)
    print(f"Applying public read bucket policy: {bucket}")
    try:
        client.put_bucket_policy(Bucket=bucket, Policy=policy)
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "")
        print(
            f"Warning: could not set bucket policy ({code}). "
            "Objects will still use public-read ACL.",
            file=sys.stderr,
        )


def apply_static_website(client, bucket: str) -> None:
    print(f"Configuring static website (index: index.html): {bucket}")
    try:
        client.put_bucket_website(
            Bucket=bucket,
            WebsiteConfiguration={"IndexDocument": {"Suffix": "index.html"}},
        )
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "")
        print(
            f"Warning: could not set website config ({code}). "
            "Enable static hosting in the Arvan panel if needed.",
            file=sys.stderr,
        )


def guess_content_type(path: Path) -> str:
    return MIME_BY_SUFFIX.get(path.suffix.lower(), "application/octet-stream")


def upload_file(
    client,
    bucket: str,
    local_path: Path,
    key: str,
    *,
    content_type: str | None = None,
    public: bool = True,
) -> None:
    extra: dict[str, Any] = {}
    if public:
        extra["ACL"] = "public-read"
    ct = content_type or guess_content_type(local_path)
    print(f"  upload s3://{bucket}/{key} ({ct})")
    try:
        client.upload_file(
            str(local_path),
            bucket,
            key,
            ExtraArgs={"ContentType": ct, **extra},
        )
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "")
        if code == "AccessDenied" and public:
            print("  retry without ACL (bucket policy may grant public access)")
            client.upload_file(
                str(local_path),
                bucket,
                key,
                ExtraArgs={"ContentType": ct},
            )
        else:
            raise


def fix_object_mime(client, bucket: str, local_path: Path, key: str) -> None:
    ct = guess_content_type(local_path)
    print(f"  fix MIME s3://{bucket}/{key} -> {ct}")
    with open(local_path, "rb") as body:
        extra: dict[str, Any] = {"ContentType": ct, "ACL": "public-read"}
        try:
            client.put_object(Bucket=bucket, Key=key, Body=body, **extra)
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code", "")
            if code == "AccessDenied":
                body.seek(0)
                client.put_object(Bucket=bucket, Key=key, Body=body, ContentType=ct)
            else:
                raise


def website_hint(creds: S3Credentials) -> None:
    host = urlparse(creds.endpoint).netloc or creds.endpoint
    print("")
    print("Done.")
    print(f"  Bucket: s3://{creds.bucket}/")
    print("  Objects: public-read (+ bucket policy when supported)")
    print(f"  Website (if enabled): http://{creds.bucket}.s3-website.{host}/")
    print("  Or enable static website in the Arvan panel (index: index.html).")


def iter_deploy_files(root: Path) -> list[tuple[Path, str]]:
    pairs: list[tuple[Path, str]] = []

    index = root / "index.html"
    if index.is_file():
        pairs.append((index, "index.html"))

    styles = root / "css" / "styles.css"
    if styles.is_file():
        pairs.append((styles, "css/styles.css"))

    favicon = root / "assets" / "favicon.svg"
    if favicon.is_file():
        pairs.append((favicon, "assets/favicon.svg"))

    fonts = root / "assets" / "fonts"
    if fonts.is_dir():
        for woff in sorted(fonts.rglob("*.woff2")):
            pairs.append((woff, woff.relative_to(root).as_posix()))

    js_dir = root / "js"
    if js_dir.is_dir():
        for js in sorted(js_dir.glob("*.js")):
            pairs.append((js, f"js/{js.name}"))
        vendor = js_dir / "vendor"
        if vendor.is_dir():
            for mjs in sorted(vendor.glob("*.mjs")):
                pairs.append((mjs, f"js/vendor/{mjs.name}"))

    return pairs


def fonts_present(root: Path = ROOT) -> bool:
    fonts = root / "assets" / "fonts"
    return fonts.is_dir() and any(fonts.rglob("*.woff2"))


def save_deploy_env(creds: S3Credentials) -> None:
    lines = [
        "# Generated by deploy wizard — secret is never stored",
        f"S3_BUCKET={creds.bucket}",
        f"S3_ENDPOINT={creds.endpoint}",
        f"S3_ACCESS_KEY_ID={creds.access_key_id}",
    ]
    DEPLOY_ENV_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    try:
        os.chmod(DEPLOY_ENV_FILE, 0o600)
    except OSError:
        pass
    print(f"Saved: {DEPLOY_ENV_FILE}")
