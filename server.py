#!/usr/bin/env python3
"""
سرور توسعه: فایل‌های استاتیک + پروکسی S3 برای دور زدن CORS در localhost.

اجرا:
  python3 server.py
  # http://localhost:8080
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

PORT = int(os.environ.get('PORT', '8080'))
ROOT = os.path.dirname(os.path.abspath(__file__))
PROXY_PATH = '/s3-proxy'

# فقط هدرهای مخصوص HTTP connection — Host و Content-Length امضا باید حفظ شوند.
HOP_BY_HOP = {
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers',
    'transfer-encoding',
    'upgrade',
}


class DevHandler(SimpleHTTPRequestHandler):
    """Serve static files with MIME types suitable for ES modules."""

    extensions_map = {
        **getattr(
            SimpleHTTPRequestHandler,
            'extensions_map',
            {'': 'application/octet-stream', '.html': 'text/html'},
        ),
        '.css': 'text/css',
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.svg': 'image/svg+xml',
        '.woff2': 'font/woff2',
        '.json': 'application/json',
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        if self.path == PROXY_PATH:
            sys.stderr.write('[s3-proxy] %s\n' % (args[0] if args else ''))
        else:
            super().log_message(fmt, *args)

    def send_cors(self):
        origin = self.headers.get('Origin')
        if origin:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')
        else:
            self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        if self.path == PROXY_PATH:
            self.send_response(204)
            self.send_cors()
            self.end_headers()
            return
        super().do_OPTIONS()

    def do_POST(self):
        if self.path == PROXY_PATH:
            self.handle_s3_proxy()
            return
        self.send_error(404)

    def _proxy_json_error(self, code, message):
        msg = json.dumps({'error': message}, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(msg)))
        self.send_cors()
        self.end_headers()
        self.wfile.write(msg)

    def handle_s3_proxy(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            raw = self.rfile.read(length) if length else b'{}'
            payload = json.loads(raw.decode('utf-8'))
            url = payload.get('url')
            method = (payload.get('method') or 'GET').upper()
            headers = payload.get('headers') or {}
            if not url or not isinstance(url, str):
                self._proxy_json_error(400, 'Invalid target url: missing')
                return
            if not (url.startswith('https://') or url.startswith('http://')):
                self._proxy_json_error(400, f'Invalid target url scheme: {url[:48]}')
                return

            fwd_headers = {
                k: v
                for k, v in headers.items()
                if k.lower() not in HOP_BY_HOP
            }
            raw_body = payload.get('body')
            body_bytes = None
            if raw_body is not None:
                body_bytes = (
                    raw_body.encode('utf-8')
                    if isinstance(raw_body, str)
                    else raw_body
                )
            req = urllib.request.Request(
                url, data=body_bytes, method=method, headers=fwd_headers
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                body = resp.read()
                self.send_response(resp.status)
                ctype = resp.headers.get('Content-Type', 'application/xml')
                self.send_header('Content-Type', ctype)
                self.send_header('Content-Length', str(len(body)))
                self.send_cors()
                self.end_headers()
                self.wfile.write(body)
        except urllib.error.HTTPError as err:
            body = err.read()
            self.send_response(err.code)
            self.send_header('Content-Type', err.headers.get('Content-Type', 'application/xml'))
            self.send_header('Content-Length', str(len(body)))
            self.send_cors()
            self.end_headers()
            self.wfile.write(body)
        except Exception as err:
            msg = json.dumps({'error': str(err)}).encode('utf-8')
            self.send_response(502)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(msg)))
            self.send_cors()
            self.end_headers()
            self.wfile.write(msg)


def main():
    os.chdir(ROOT)
    httpd = ThreadingHTTPServer(('', PORT), DevHandler)
    print(f'Serving {ROOT}')
    print(f'  http://localhost:{PORT}')
    print(f'  S3 proxy: POST {PROXY_PATH}')
    print('Press Ctrl+C to stop.')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nStopped.')
        httpd.server_close()


if __name__ == '__main__':
    main()
