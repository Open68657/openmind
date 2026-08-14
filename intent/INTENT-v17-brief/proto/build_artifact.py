#!/usr/bin/env python3
"""Turn a prototype page into a single self-contained file for publishing.

A published page cannot make a single network request, so the importmap that
resolves three from unpkg never fires and only the HUD arrives. This bakes
three, and the scans, straight into the file.

    python3 build_artifact.py index.html artifact-v03.html

Versions 1 and 2 were built against three r128, the last release to ship a UMD
bundle, and every quirk that had to be undone by hand here (sRGB spelled
`encoding`, light intensity divided by pi) was rent paid on that choice. Version
3 finally could not pay it: r128 predates colour management, physical light
units, sheen as a number, iridescence and attenuationColor, and the page built
against it rendered blank.

So nothing is downgraded any more. The current module build ships as it is, and
becomes reachable from a classic script by rewriting its one trailing export
into an assignment on window. That is safe precisely because three.module.min.js
is a single pre-bundled file: exactly one `export{...}` at the very end, and no
imports of its own to resolve.

The GLB export button is the one thing that cannot survive the trip, since it
resolves an addon through the importmap that is being removed. It fails closed:
the page catches it and relabels the button.
"""
import base64
import io
import os
import re
import sys

THREE = 'three-r160.module.min.js'
BAKED = 'textures/baked'


def globalise(three):
    """Rewrite `export{a as A,b}` into `window.THREE={A:a,b}`, scoped.

    The minified build renames everything internally and re-exports under the
    real names, so each entry is either `local as Exported` or a bare name that
    object shorthand already handles.

    The IIFE around it is not tidiness, it is required. A module keeps its top
    level to itself; a classic script does not, and three minifies its internals
    down to names like `dc` and `wi` that collide with the page's own the moment
    the two are concatenated. (`dc` is the drawing canvas here, and that one
    collision alone took the whole page down with a redeclaration error.) The
    wrapper keeps every internal name private and lets exactly one thing out.
    Modules are strict by default, so strictness is restated on the way in.
    """
    m = re.search(r'export\{(.*?)\};?\s*$', three, flags=re.S)
    assert m, 'no trailing export block found in ' + THREE
    fields = []
    for entry in m.group(1).split(','):
        entry = entry.strip()
        if not entry:
            continue
        parts = entry.split(' as ')
        fields.append('%s:%s' % (parts[1], parts[0]) if len(parts) == 2 else entry)
    body = three[:m.start()] + 'window.THREE={%s};' % ','.join(fields)
    return '(function(){"use strict";\n%s\n})();' % body


def build(src_path, out_path):
    src = io.open(src_path, encoding='utf-8').read()
    three = globalise(io.open(THREE, encoding='utf-8').read())

    # the artifact host supplies doctype/head/body — keep only page content.
    # The charset comes along anyway: the host's head is out of this file's
    # hands, and a page whose interface is in Hebrew arrives as mojibake the
    # moment nobody declares one. The sniffing pass reads the first 1024 bytes
    # of the document wherever the tag sits, so this early is early enough.
    src = '<meta charset="utf-8">\n' + src[src.index('<title>'):]
    for junk in ('</head>\n', '<body>\n', '</body>\n', '</html>\n'):
        src = src.replace(junk, '')

    # the importmap points at unpkg, which is blocked; drop it and go classic
    src = re.sub(r'<script type="importmap">.*?</script>\n\n?', '', src, flags=re.S)
    module = "<script type=\"module\">\nimport * as THREE from 'three';\n"
    assert module in src, 'unexpected script header'
    src = src.replace(module, '<script>\n' + three + '\n')

    # nothing else may still be reaching for the module system: a leftover
    # static import is a syntax error in a classic script and takes the whole
    # page down silently
    body = src[src.index('<script>'):]
    assert not re.search(r'^\s*import\s+[\w{*]', body, flags=re.M), 'stray static import'

    # the scans: a published page cannot fetch a file of its own, so they ride
    # along as data URIs. BAKED holds square crops — a quarter of the weight of
    # the originals, and the page crops them square on load anyway
    baked = []
    if os.path.isdir(BAKED):
        for f in sorted(os.listdir(BAKED)):
            if not f.endswith('.jpg'):
                continue
            raw = io.open(os.path.join(BAKED, f), 'rb').read()
            b64 = base64.b64encode(raw).decode('ascii')
            baked.append('"%s":"data:image/jpeg;base64,%s"' % (f[:-4], b64))
    if baked:
        src = src.replace('<script>\n' + three,
                          '<script>window.TEX_DATA={%s};</script>\n<script>\n' % ','.join(baked) + three,
                          1)

    io.open(out_path, 'w', encoding='utf-8').write(src)
    print('built %s (%d KB, three bundled whole, %d scans baked in)'
          % (out_path, len(src) / 1024, len(baked)))
    check(src)


def check(src):
    """Parse the built script, because this file fails silently by nature.

    Everything here is string surgery on someone else's minified output, and a
    broken result does not raise: it publishes a page that draws the HUD and
    nothing else, which is only discovered by opening the link. A syntax error
    is the failure mode that surgery actually produces, so it is worth the two
    seconds to have node parse the thing before it goes anywhere.
    """
    import shutil
    import subprocess
    import tempfile
    node = shutil.which('node')
    if not node:
        print('  (node not found, skipped the syntax check)')
        return
    body = re.findall(r'<script>(.*?)</script>', src, flags=re.S)[-1]
    with tempfile.NamedTemporaryFile('w', suffix='.js', encoding='utf-8', delete=False) as f:
        f.write(body)
        path = f.name
    try:
        r = subprocess.run([node, '--check', path], capture_output=True, text=True)
    finally:
        os.unlink(path)
    if r.returncode:
        raise SystemExit('built file does not parse:\n' + (r.stderr or r.stdout))
    print('  parses clean')


if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2])
