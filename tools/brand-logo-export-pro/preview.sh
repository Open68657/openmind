#!/usr/bin/env bash
# Build the app and stage it for the `logo-dist` preview on http://localhost:3011
#
# This checks the *production* build, the exact thing publish.sh puts online.
# Port 3010 (`logo-pack`) is the dev server and is a different thing.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STAGE=/tmp/logo_dist_preview

echo "==> building"
# --base=./ keeps asset paths relative, matching how it is served in production.
# vite resolves its entry and its config against the cwd, so build from APP_DIR.
cd "$APP_DIR"
node node_modules/vite/bin/vite.js build --base=./ >/dev/null

echo "==> staging to $STAGE"
# The preview sandbox cannot read anything under Documents, so the build has to
# be copied out. Copy into the folder rather than replacing it, so a running
# server does not lose the directory under its feet.
mkdir -p "$STAGE/dist"
cp "$APP_DIR/serve-dist.py" "$STAGE/serve.py"
rm -rf "$STAGE/dist/assets" "$STAGE/dist/tesseract"
cp -R "$APP_DIR/dist/." "$STAGE/dist/"

echo "==> ready: http://localhost:3011  (start the 'logo-dist' preview)"
