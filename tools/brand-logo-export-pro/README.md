# Brand Logo Export Pro

Takes an SVG logo and produces the full delivery kit: every colour combination,
in RGB, real DeviceCMYK, and Pantone separation plates, zipped.

Runs entirely in the browser. Nothing is uploaded anywhere.

**Live:** https://open68657.github.io/brand-logo-export/

## Running it

```
node node_modules/vite/bin/vite.js --port=3010
```

Call vite's binary directly. `npm run dev` fails on this machine with an EPERM
`uv_cwd` error. The `logo-pack` entry in `.claude/launch.json` is already set up
this way.

## Checking the production build

```
./preview.sh
```

Builds and stages to `/tmp`, then start the `logo-dist` preview on port 3011.
This serves the exact files that go online, which is worth checking separately
from the dev server. The staging step exists because the preview sandbox cannot
read anything under `Documents`.

## Publishing

```
./publish.sh "what changed"
```

Rebuilds and pushes the built app to `Open68657/brand-logo-export`, which GitHub
Pages serves at the link above. The URL never changes, so anyone holding it gets
the new version on their next reload. Only the build is published; this source
tree stays private.

## Notes

- The app is client-side only. There is no API key and no backend, despite what
  the original AI Studio scaffold in `.env.example` implies.
- A palette board image is read with OCR (Tesseract.js on WebAssembly) inside the
  browser: the swatches come from the pixels, the name, HEX, CMYK and Pantone
  printed on them from the text. The worker, the engine and the English language
  data are served by the app itself under `tesseract/`, copied out of
  `node_modules` by the plugin in `vite.config.ts`, so nothing is fetched from a
  CDN and no image leaves the machine.
- `src/cmykLut.ts` holds lookup tables baked from the real Adobe ICC profiles by
  `scripts/build_cmyk_lut.py`, which is why the CMYK matches Illustrator.
- Uploaded SVGs must have their text converted to outlines. The app detects live
  `<text>` and blocks the flow rather than silently substituting Helvetica.
