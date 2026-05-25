#!/usr/bin/env python3
"""Build static documentation site into docs/_site (RTL, Vazirmatn)."""

from __future__ import annotations

import re
import shutil
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
DOCS = Path(__file__).resolve().parent
OUT = DOCS / "_site"

PAGES: list[tuple[str, Path, str]] = [
    ("index", ROOT / "README.md", "راهنمای اصلی"),
    ("deploy", ROOT / "DEPLOY.md", "استقرار استاتیک"),
    ("contributing", ROOT / "CONTRIBUTING.md", "مشارکت"),
    ("security", ROOT / "SECURITY.md", "امنیت"),
    ("third-party", ROOT / "THIRD_PARTY.md", "دارایی‌های شخص ثالث"),
]

NAV: list[tuple[str, str]] = [
    ("index.html", "راهنمای اصلی"),
    ("deploy.html", "استقرار"),
    ("contributing.html", "مشارکت"),
    ("security.html", "امنیت"),
    ("third-party.html", "شخص ثالث"),
]

MD = markdown.Markdown(
    extensions=["tables", "fenced_code", "sane_lists", "nl2br"],
    extension_configs={"fenced_code": {"lang_prefix": "language-"}},
)


def strip_html_wrapper(text: str) -> str:
    """Remove GitHub RTL/LTR wrapper divs; keep inner markdown."""
    text = text.strip()
    text = re.sub(r"<div[^>]*>", "", text, flags=re.I)
    text = re.sub(r"</div>", "", text, flags=re.I)
    return text.strip()


def fix_repo_links(html: str) -> str:
    """Turn relative .md links into .html on the docs site."""
    html = re.sub(
        r'href="([^"]+)\.md"',
        lambda m: f'href="{Path(m.group(1)).stem}.html"'
        if not m.group(1).startswith("http")
        else m.group(0),
        html,
    )
    html = html.replace('href="README.html"', 'href="index.html"')
    html = html.replace('href="../', 'href="https://github.com/RaminNietzsche/s3_policy_gen/blob/main/')
    return html


def render_page(title: str, body_html: str, active: str) -> str:
    nav_items = "\n".join(
        f'        <li><a href="{href}"{" class=\"active\"" if href == active else ""}>{label}</a></li>'
        for href, label in NAV
    )
    return f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title} · s3_policy_gen</title>
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="docs.css" />
</head>
<body>
  <div class="docs-wrap">
    <nav class="docs-nav" aria-label="فهرست مستندات">
      <strong>مستندات s3_policy_gen</strong>
      <ul>
{nav_items}
      </ul>
      <p class="docs-meta">
        <a href="https://github.com/RaminNietzsche/s3_policy_gen" dir="ltr">مخزن GitHub</a>
      </p>
    </nav>
    <div class="badge-row" dir="ltr">
      <a href="https://github.com/RaminNietzsche/s3_policy_gen"><img src="https://img.shields.io/badge/License-MIT-teal.svg" alt="MIT" /></a>
      <img src="https://img.shields.io/badge/python-3.10+-blue.svg" alt="Python" />
      <img src="https://img.shields.io/badge/S3-Arvan%20Cloud-00baba.svg" alt="Arvan" />
    </div>
    <article class="docs-content">
{body_html}
    </article>
  </div>
</body>
</html>
"""


def copy_assets() -> None:
    fonts_src = ROOT / "assets" / "fonts"
    fonts_dst = OUT / "assets" / "fonts"
    if fonts_src.is_dir():
        if fonts_dst.exists():
            shutil.rmtree(fonts_dst)
        shutil.copytree(fonts_src, fonts_dst)

    favicon = ROOT / "assets" / "favicon.svg"
    if favicon.is_file():
        shutil.copy2(favicon, OUT / "assets" / "favicon.svg")

    css_src = DOCS / "docs.css"
    if css_src.is_file():
        text = css_src.read_text(encoding="utf-8")
        text = text.replace("../assets/fonts/", "assets/fonts/")
        (OUT / "docs.css").write_text(text, encoding="utf-8")


def build_page(slug: str, src: Path, title: str) -> None:
    if not src.is_file():
        raise FileNotFoundError(src)
    raw = strip_html_wrapper(src.read_text(encoding="utf-8"))
    body = fix_repo_links(MD.convert(raw))
    MD.reset()
    html_name = "index.html" if slug == "index" else f"{slug}.html"
    out_path = OUT / html_name
    out_path.write_text(
        render_page(title, body, html_name),
        encoding="utf-8",
    )
    print(f"  {out_path.relative_to(ROOT)}")


def main() -> None:
    print(f"Building docs → {OUT}")
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    (OUT / "assets").mkdir(parents=True, exist_ok=True)

    copy_assets()
    for slug, src, title in PAGES:
        build_page(slug, src, title)

    print("Done.")


if __name__ == "__main__":
    main()
