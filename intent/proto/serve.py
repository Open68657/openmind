#!/usr/bin/env python3
"""Serve the prototype on http://localhost:4311.

`npx serve` and `python3 -m http.server` both refuse to start under the Claude
Code preview launcher, which spawns processes without a usable working
directory. npm's CLI calls process.cwd() while loading its config; http.server's
command line calls os.getcwd() while building its argument parser, which happens
before any --directory value is read, so passing one does not help. Both die
with a permission error before serving a byte.

Importing the handler directly skips that argument parser entirely, and the root
is pinned to this file's own folder instead of being inherited from wherever the
process happened to start.

Run it by hand the same way:

    python3 intent/intent/proto/serve.py
"""
import http.server
import os
import socketserver

# abspath only consults the working directory for a relative path, and this is
# launched by absolute path, so the lookup that breaks everything else is avoided
ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 4311

os.chdir(ROOT)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # the page is edited and reloaded constantly, and a cached index or a
        # cached bundle is the difference between testing this change and
        # testing the previous one
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass          # a request line per texture per reload drowns the log


socketserver.TCPServer.allow_reuse_address = True

if __name__ == '__main__':
    with socketserver.TCPServer(('', PORT), Handler) as httpd:
        print('INTENT proto on http://localhost:%d  (root: %s)' % (PORT, ROOT))
        httpd.serve_forever()
