"""Download fonts and aws4fetch into assets/ and js/vendor/."""

from __future__ import annotations

import shutil
import sys
import tempfile
import urllib.request
import zipfile
from pathlib import Path

from deploy.config import ROOT

VAZM_URL = (
    "https://github.com/rastikerdar/vazirmatn/releases/download/"
    "v33.003/vazirmatn-v33.003.zip"
)
JB_URL = (
    "https://github.com/JetBrains/JetBrainsMono/releases/download/"
    "v2.304/JetBrainsMono-2.304.zip"
)
AWS4FETCH_URL = "https://esm.sh/aws4fetch@1.0.20"

VAZM_MAP = {
    "Vazirmatn-Regular.woff2": "vazirmatn-400.woff2",
    "Vazirmatn-Medium.woff2": "vazirmatn-500.woff2",
    "Vazirmatn-SemiBold.woff2": "vazirmatn-600.woff2",
    "Vazirmatn-Bold.woff2": "vazirmatn-700.woff2",
}
JB_MAP = {
    "JetBrainsMono-Regular.woff2": "jetbrains-mono-400.woff2",
    "JetBrainsMono-Medium.woff2": "jetbrains-mono-500.woff2",
}


def _download(url: str, dest: Path) -> None:
    print(f"Downloading {url}")
    with urllib.request.urlopen(url, timeout=120) as resp:
        dest.write_bytes(resp.read())


def _extract_font_zip(
    zip_path: Path, webfonts_subpath: str, dest_dir: Path, name_map: dict[str, str]
) -> None:
    dest_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path) as zf:
        for src_name, dst_name in name_map.items():
            member = next(
                (n for n in zf.namelist() if n.endswith(f"{webfonts_subpath}/{src_name}")),
                None,
            )
            if not member:
                print(f"Warning: {src_name} not found in archive", file=sys.stderr)
                continue
            out = dest_dir / dst_name
            with zf.open(member) as src, open(out, "wb") as dst:
                shutil.copyfileobj(src, dst)
            print(f"  {out.relative_to(ROOT)}")


def download_assets() -> None:
    vazm_dir = ROOT / "assets" / "fonts" / "vazirmatn"
    jb_dir = ROOT / "assets" / "fonts" / "jetbrains-mono"
    vendor_dir = ROOT / "js" / "vendor"
    vendor_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        vazm_zip = tmp_path / "vazirmatn.zip"
        jb_zip = tmp_path / "jbmono.zip"

        _download(VAZM_URL, vazm_zip)
        print("Extracting Vazirmatn...")
        _extract_font_zip(vazm_zip, "fonts/webfonts", vazm_dir, VAZM_MAP)

        _download(JB_URL, jb_zip)
        print("Extracting JetBrains Mono...")
        _extract_font_zip(jb_zip, "fonts/webfonts", jb_dir, JB_MAP)

    aws_dest = vendor_dir / "aws4fetch.mjs"
    _download(AWS4FETCH_URL, aws_dest)
    print(f"  {aws_dest.relative_to(ROOT)}")
    print("Done.")
