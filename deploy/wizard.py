"""Interactive TUI wizard (questionary)."""

from __future__ import annotations

import sys

import questionary
from questionary import Style

from deploy.assets import download_assets
from deploy.config import (
    DEFAULT_ENDPOINT,
    S3Credentials,
    fonts_present,
    load_deploy_env,
    save_deploy_env,
)
from deploy.upload import deploy, fix_mime

WIZARD_STYLE = Style(
    [
        ("qmark", "fg:cyan bold"),
        ("question", "bold"),
        ("answer", "fg:green bold"),
        ("pointer", "fg:cyan bold"),
        ("highlighted", "fg:cyan bold"),
        ("selected", "fg:green"),
    ]
)


def _default(field: str, fallback: str = "") -> str:
    return load_deploy_env().get(field, "") or fallback


def prompt_credentials(mode: str) -> S3Credentials:
    print("")
    if mode == "fix-mime":
        print("=== Fix Content-Type on S3 ===")
    else:
        print("=== Static site deploy (Arvan S3) ===")
    print("")

    bucket = questionary.text(
        "Bucket name:",
        default=_default("S3_BUCKET"),
        style=WIZARD_STYLE,
    ).ask()
    if bucket is None or not bucket.strip():
        print("Cancelled.", file=sys.stderr)
        sys.exit(130)

    endpoint = questionary.text(
        "S3 endpoint URL:",
        default=_default("S3_ENDPOINT", DEFAULT_ENDPOINT),
        style=WIZARD_STYLE,
    ).ask()
    if endpoint is None:
        print("Cancelled.", file=sys.stderr)
        sys.exit(130)

    access = questionary.text(
        "Access Key ID:",
        default=_default("S3_ACCESS_KEY_ID"),
        style=WIZARD_STYLE,
    ).ask()
    if access is None or not access.strip():
        print("Error: Access Key ID is required.", file=sys.stderr)
        sys.exit(1)

    secret = questionary.password(
        "Secret Access Key:",
        style=WIZARD_STYLE,
    ).ask()
    if secret is None:
        print("Cancelled.", file=sys.stderr)
        sys.exit(130)
    if not secret.strip():
        print("Error: Secret Access Key is required.", file=sys.stderr)
        sys.exit(1)

    creds = S3Credentials(
        bucket=bucket.strip(),
        access_key_id=access.strip(),
        secret_access_key=secret.strip(),
        endpoint=endpoint.strip(),
    )

    if mode == "deploy" and not fonts_present():
        if questionary.confirm(
            "Fonts missing under assets/fonts. Download now?",
            default=True,
            style=WIZARD_STYLE,
        ).ask():
            download_assets()

    if questionary.confirm(
        "Save bucket, endpoint, and access key to .deploy.env (no secret)?",
        default=False,
        style=WIZARD_STYLE,
    ).ask():
        save_deploy_env(creds)

    return creds


def run_wizard(mode: str = "deploy") -> None:
    creds = prompt_credentials(mode)
    print("")
    if mode == "fix-mime":
        fix_mime(creds)
    else:
        deploy(creds)
