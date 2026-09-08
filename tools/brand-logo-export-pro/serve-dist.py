"""Serve the staged production build so it can be checked before publishing.

Do not run this by hand — run ./preview.sh, which builds, stages and explains
the rest. This file is what the `logo-dist` entry in .claude/launch.json runs.

Everything lives under /tmp because the preview sandbox cannot touch Documents:
it refuses to launch a script from there, it denies os.getcwd() inside it (which
SimpleHTTPRequestHandler calls on every request), and it cannot even read the
files. So preview.sh copies both this script and dist/ into STAGE.
"""

import functools
import http.server
import os
import socketserver

STAGE = "/tmp/logo_dist_preview/dist"
PORT = 3011

if not os.path.isdir(STAGE):
    raise SystemExit(f"{STAGE} not found. Run ./preview.sh first.")


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), functools.partial(Handler, directory=STAGE)) as httpd:
    print(f"serving {STAGE} on http://localhost:{PORT}")
    httpd.serve_forever()
