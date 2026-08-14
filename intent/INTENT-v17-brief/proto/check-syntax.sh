#!/bin/sh
# Parse index.html's module script before measuring anything.
#
# Written after a backtick inside the shader's template literal took the whole
# file down on 11 Aug. The only symptom was a page that never defined devCheck:
# no shader compile error, no material silently dropped, just a module that did
# not load. Two seconds here against a long time in the browser wondering why
# nothing responds.
#
#   sh proto/check-syntax.sh
DIR=$(dirname "$0")
node -e "
const fs=require('fs');
const html=fs.readFileSync('$DIR/index.html','utf8');
const m=html.match(/<script type=\"module\">([\s\S]*?)<\/script>/);
if(!m){console.error('no module script found');process.exit(1);}
fs.writeFileSync('$DIR/.syntax-check.mjs', m[1]);
" && node --check "$DIR/.syntax-check.mjs" && rm -f "$DIR/.syntax-check.mjs" && echo "SYNTAX OK"
