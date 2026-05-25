#!/usr/bin/env python3
"""Build Persian documentation site into docs/_site."""

from __future__ import annotations

import re
import shutil
from pathlib import Path

import markdown

from icons import ICONS, NAV_SLUGS

ROOT = Path(__file__).resolve().parent.parent
DOCS = Path(__file__).resolve().parent
CONTENT = DOCS / "content"
OUT = DOCS / "_site"
IMG = DOCS / "assets" / "img"

DOCS_BASE_URL = "https://policygen.ceph-s3.ir"
APP_URL = "https://policygen.s3-website.ir-thr-at1.arvanstorage.ir"
REPO_URL = "https://github.com/RaminNietzsche/s3_policy_gen"

PAGES: list[tuple[str, str, str]] = [
    ("index", "index.md", "معرفی"),
    ("guide", "guide.md", "راهنمای استفاده"),
    ("deploy", "deploy.md", "استقرار"),
    ("security", "security.md", "امنیت"),
    ("contributing", "contributing.md", "مشارکت"),
    ("third-party", "third-party.md", "شخص ثالث"),
]

MD = markdown.Markdown(
    extensions=["tables", "fenced_code", "sane_lists", "nl2br"],
    extension_configs={"fenced_code": {"lang_prefix": "language-"}},
)

FEATURE_CARDS = """
        <div class="feature-grid" role="list">
          <div class="feature-card" role="listitem">
            <div class="icon">{deploy}</div>
            <h3>Bucket Policy</h3>
            <p>ساخت Statement با Effect، Principal، Action و Condition</p>
          </div>
          <div class="feature-card" role="listitem">
            <div class="icon">{security}</div>
            <h3>CORS</h3>
            <p>تنظیم Origin، Method و Header برای دسترسی مرورگر</p>
          </div>
          <div class="feature-card" role="listitem">
            <div class="icon">{guide}</div>
            <h3>Lifecycle</h3>
            <p>قوانین انتقال، انقضا و نسخه‌بندی اشیاء</p>
          </div>
        </div>
""".format(**ICONS)


def strip_leading_h1(html: str) -> str:
    return re.sub(
        r"^\s*<h1[^>]*>.*?</h1>\s*",
        "",
        html,
        count=1,
        flags=re.DOTALL | re.IGNORECASE,
    )


def fix_links(html: str) -> str:
    html = re.sub(
        r'href="([^"]*?)\.md"',
        lambda m: f'href="{Path(m.group(1)).name}.html"'
        if not m.group(1).startswith("http")
        else m.group(0),
        html,
    )
    html = html.replace('href="README.html"', 'href="index.html"')
    return html


def page_hero(slug: str, title: str) -> str:
    if slug == "index":
        return f"""
        <section class="page-hero" aria-labelledby="hero-title">
          <div>
            <h1 id="hero-title">سازندهٔ سیاست دسترسی S3</h1>
            <p class="lead">
              ابزار وب فارسی برای تولید Bucket Policy، CORS و Lifecycle
              روی فضای ذخیره‌سازی ابری آروان — بدون نصب، مستقیم در مرورگر.
            </p>
            {FEATURE_CARDS}
          </div>
          <div class="page-hero-visual">
            <img src="assets/img/hero.svg" width="400" height="280" alt="" loading="eager" />
          </div>
        </section>
"""
    if slug == "guide":
        return f"""
        <section class="page-hero page-hero-compact" aria-labelledby="hero-title">
          <div>
            <h1 id="hero-title">{title}</h1>
            <p class="lead">گام‌به‌گام از اتصال تا خروجی JSON و استقرار روی باکت.</p>
          </div>
        </section>
"""
    return ""


def render_nav(active: str) -> str:
    items = []
    for href, icon_key, label in NAV_SLUGS:
        cls = ' class="active"' if href == active else ""
        icon = ICONS.get(icon_key, "")
        items.append(
            f'          <li><a href="{href}"{cls}>'
            f'<span class="nav-icon">{icon}</span>{label}</a></li>'
        )
    return "\n".join(items)


def render_shell(title: str, body_html: str, active: str, slug: str) -> str:
    nav = render_nav(active)
    hero = page_hero(slug, title)
    breadcrumb = ""
    if slug != "index":
        breadcrumb = f"""
        <nav class="breadcrumb" aria-label="مسیر">
          <a href="index.html">معرفی</a>
          <span aria-hidden="true">/</span>
          <span>{title}</span>
        </nav>
"""
    return f"""<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="مستندات s3_policy_gen — سازنده Bucket Policy، CORS و Lifecycle برای فضای ذخیره‌سازی ابری آروان" />
  <meta name="theme-color" content="#0b3a42" />
  <meta property="og:title" content="{title} · مستندات s3_policy_gen" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="fa_IR" />
  <title>{title} · مستندات s3_policy_gen</title>
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="docs.css" />
  <script>
    (function() {{
      var t = localStorage.getItem('docs-theme');
      if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches))
        document.documentElement.setAttribute('data-theme', 'dark');
    }})();
  </script>
</head>
<body>
  <header class="site-header">
    <div class="site-header-inner">
      <a href="index.html" class="site-brand" style="color:inherit;text-decoration:none">
        <img class="site-brand-logo" src="assets/favicon.svg" width="40" height="40" alt="" />
        <div class="site-brand-text">
          s3_policy_gen
          <span>مستندات فارسی · ابر آروان</span>
        </div>
      </a>
      <div class="header-actions">
        <button type="button" class="btn btn-icon nav-toggle" id="nav-toggle" aria-label="باز کردن منو" aria-expanded="false">
          {ICONS["menu"]}
        </button>
        <button type="button" class="btn btn-icon" id="theme-toggle" aria-label="تغییر پوسته">
          {ICONS["sun"]}
        </button>
        <a class="btn btn-primary" href="{APP_URL}">
          {ICONS["external"]}
          <span class="btn-label">باز کردن ابزار</span>
        </a>
        <a class="btn btn-ghost" href="{REPO_URL}" dir="ltr">
          {ICONS["github"]}
          <span class="btn-label">GitHub</span>
        </a>
      </div>
    </div>
  </header>

  <div class="sidebar-backdrop" id="sidebar-backdrop" aria-hidden="true"></div>

  <div class="layout">
    <aside class="sidebar" id="sidebar" aria-label="ناوبری">
      <p class="sidebar-title">فهرست</p>
      <nav>
        <ul>
{nav}
        </ul>
      </nav>
      <div class="sidebar-divider"></div>
      <p class="sidebar-links">
        <a href="{APP_URL}">نسخهٔ آنلاین</a><br />
        <a href="{REPO_URL}" dir="ltr">مخزن GitHub</a>
      </p>
    </aside>

    <main class="main">
      <article class="doc-article">
{breadcrumb}{hero}
{body_html}
      </article>
    </main>
  </div>

  <footer class="site-footer">
    <p>s3_policy_gen — سازندهٔ سیاست S3 برای ابر آروان</p>
    <div class="site-footer-links">
      <a href="{DOCS_BASE_URL}">مستندات</a>
      <a href="{APP_URL}">ابزار آنلاین</a>
      <a href="{REPO_URL}" dir="ltr">GitHub</a>
    </div>
  </footer>

  <script>
    (function() {{
      var sidebar = document.getElementById('sidebar');
      var backdrop = document.getElementById('sidebar-backdrop');
      var toggle = document.getElementById('nav-toggle');
      function setOpen(open) {{
        sidebar.classList.toggle('is-open', open);
        backdrop.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
      }}
      toggle.addEventListener('click', function() {{ setOpen(!sidebar.classList.contains('is-open')); }});
      backdrop.addEventListener('click', function() {{ setOpen(false); }});
      sidebar.querySelectorAll('a').forEach(function(a) {{
        a.addEventListener('click', function() {{ if (matchMedia('(max-width: 960px)').matches) setOpen(false); }});
      }});

      var themeBtn = document.getElementById('theme-toggle');
      var sun = {repr(ICONS["sun"])};
      var moon = {repr(ICONS["moon"])};
      function applyTheme(dark) {{
        if (dark) document.documentElement.setAttribute('data-theme', 'dark');
        else document.documentElement.removeAttribute('data-theme');
        themeBtn.innerHTML = dark ? moon : sun;
        localStorage.setItem('docs-theme', dark ? 'dark' : 'light');
      }}
      themeBtn.addEventListener('click', function() {{
        applyTheme(!document.documentElement.hasAttribute('data-theme'));
      }});
      if (document.documentElement.hasAttribute('data-theme')) themeBtn.innerHTML = moon;
    }})();
  </script>
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

    for name in ("favicon.svg",):
        src = ROOT / "assets" / name
        if src.is_file():
            shutil.copy2(src, OUT / "assets" / name)

    img_dst = OUT / "assets" / "img"
    img_dst.mkdir(parents=True, exist_ok=True)
    if IMG.is_dir():
        for f in IMG.iterdir():
            if f.is_file():
                shutil.copy2(f, img_dst / f.name)

    css = (DOCS / "docs.css").read_text(encoding="utf-8")
    css = css.replace("../assets/fonts/", "assets/fonts/")
    (OUT / "docs.css").write_text(css, encoding="utf-8")


def build_page(slug: str, filename: str, title: str) -> None:
    src = CONTENT / filename
    if not src.is_file():
        raise FileNotFoundError(src)
    body = fix_links(MD.convert(src.read_text(encoding="utf-8")))
    MD.reset()
    if slug in ("index", "guide"):
        body = strip_leading_h1(body)
    html_name = "index.html" if slug == "index" else f"{slug}.html"
    out = OUT / html_name
    out.write_text(render_shell(title, body, html_name, slug), encoding="utf-8")
    print(f"  {out.relative_to(ROOT)}")


def main() -> None:
    print(f"Building docs → {OUT}")
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    (OUT / "assets").mkdir()

    copy_assets()
    for slug, filename, title in PAGES:
        build_page(slug, filename, title)

    print("Done.")


if __name__ == "__main__":
    main()
