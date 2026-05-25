"""CLI entry: deploy, fix-mime, assets, wizard."""

from __future__ import annotations

import argparse

from deploy.assets import download_assets
from deploy.config import S3Credentials
from deploy.upload import deploy, fix_mime
from deploy.wizard import run_wizard


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        description="Bucket policy generator — S3 static deploy"
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p_wizard = sub.add_parser("wizard", help="Interactive TUI wizard")
    p_wizard.add_argument(
        "mode",
        choices=("deploy", "fix-mime"),
        nargs="?",
        default="deploy",
    )

    for name, help_text in (
        ("deploy", "Upload static files (public, CORS, create bucket)"),
        ("fix-mime", "Fix Content-Type on css/html"),
    ):
        p = sub.add_parser(name, help=help_text)
        p.add_argument("bucket", nargs="?")
        p.add_argument("access_key", nargs="?")
        p.add_argument("secret_key", nargs="?")
        p.add_argument("endpoint", nargs="?")

    sub.add_parser("assets", help="Download fonts and aws4fetch")

    args = parser.parse_args(argv)

    if args.command == "assets":
        download_assets()
        return

    if args.command == "wizard":
        run_wizard(args.mode)
        return

    cli_creds = None
    if args.bucket and args.access_key and args.secret_key:
        cli_creds = S3Credentials.from_cli(
            args.bucket,
            args.access_key,
            args.secret_key,
            args.endpoint or "",
        )

    if args.command == "deploy":
        deploy(cli_creds)
    elif args.command == "fix-mime":
        fix_mime(cli_creds)
