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
import subprocess
import sys

# abspath only consults the working directory for a relative path, and this is
# launched by absolute path, so the lookup that breaks everything else is avoided
ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 4311

os.chdir(ROOT)


INDEX = os.path.join(ROOT, 'index.html')
COMPOSE = os.path.join(ROOT, 'compose.html')
TAIL = os.path.join(ROOT, 'compose_tail.js')
BUILD = os.path.join(ROOT, 'build_compose.py')


def rebuild_if_stale():
    """compose.html is DERIVED, and a derived file that is only rebuilt when
    somebody remembers is a file that is quietly out of date.

    The rule is that the intermediate tool always holds the current drawing
    tool. It was true only because a build was run by hand after every change,
    which is exactly the kind of promise that breaks on the day it matters. So
    it is checked here instead: if index.html — or the two files that shape the
    derivation — is newer than compose.html, the build runs before the page is
    served. A request costs nothing when nothing has changed, and about a second
    when something has.

    A build that fails must NOT leave a stale page pretending to be current, so
    the error is served in place of the tool: build_compose.py asserts every
    replacement, and an upstream change that breaks one is a thing to see rather
    than to discover later in a shape nobody can trace.
    """
    try:
        if not os.path.exists(COMPOSE):
            newest = 1
        else:
            out = os.path.getmtime(COMPOSE)
            newest = max((os.path.getmtime(f) for f in (INDEX, TAIL, BUILD)
                          if os.path.exists(f)), default=0) - out
        if newest <= 0:
            return None
        r = subprocess.run([sys.executable, BUILD], cwd=ROOT,
                           capture_output=True, text=True)
        if r.returncode:
            return (r.stdout or '') + (r.stderr or '')
        print('rebuilt compose.html from index.html')
        return None
    except Exception as e:                     # never take the server down for this
        return 'the rebuild check itself failed: %r' % (e,)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        if self.path.split('?')[0].rstrip('/').endswith('compose.html'):
            err = rebuild_if_stale()
            if err:
                body = ('compose.html is out of date and the build failed.\n\n'
                        + err).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'text/plain; charset=utf-8')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
        super().do_GET()

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
