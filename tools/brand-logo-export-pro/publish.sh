#!/usr/bin/env bash
# Rebuild the app and publish it to https://open68657.github.io/brand-logo-export/
#
# The public repo holds the built app only, never this source tree. The URL never
# changes, so anyone holding the link gets the new version on their next reload.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAGES_REPO="https://github.com/Open68657/brand-logo-export.git"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "==> building"
# --base=./ keeps asset paths relative, which GitHub Pages serves from a subpath.
# vite resolves its entry and its config against the cwd, so build from APP_DIR.
cd "$APP_DIR"
node node_modules/vite/bin/vite.js build --base=./ >/dev/null

echo "==> cloning the pages repo"
git clone --depth 1 "$PAGES_REPO" "$WORK/pages" >/dev/null 2>&1

echo "==> replacing the build"
# keep robots.txt / README.md / .nojekyll, swap everything the build owns
rm -rf "$WORK/pages/assets" "$WORK/pages/index.html"
cp -R "$APP_DIR/dist/." "$WORK/pages/"

cd "$WORK/pages"
git config user.name "Open68657"
git config user.email "212230822+Open68657@users.noreply.github.com"

if git diff --quiet && git diff --cached --quiet && [ -z "$(git status --porcelain)" ]; then
  echo "==> nothing changed, not publishing"
  exit 0
fi

git add -A
git commit -q -m "${1:-Update build}"
git push -q origin main

echo "==> published: https://open68657.github.io/brand-logo-export/"
echo "    Pages takes about a minute to serve the new files."
