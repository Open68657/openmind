import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv, Plugin} from 'vite';

// Tesseract.js, the OCR behind the palette-board reader, fetches its worker, its
// WebAssembly engine and the language data from a CDN unless told otherwise. This serves
// them from the app itself, under /tesseract/, so the tool keeps working offline and no
// image ever leaves the browser. Only the LSTM engines are shipped: that is the one in
// use, and the two legacy builds are 9 MB nobody loads.
const TESSERACT_ASSETS: Record<string, string> = {
  'worker.min.js': 'tesseract.js/dist/worker.min.js',
  'tesseract-core-simd-lstm.wasm.js': 'tesseract.js-core/tesseract-core-simd-lstm.wasm.js',
  'tesseract-core-lstm.wasm.js': 'tesseract.js-core/tesseract-core-lstm.wasm.js',
  'eng.traineddata.gz': '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz',
};

const tesseractAssets = (): Plugin => {
  const file = (rel: string) => path.resolve(__dirname, 'node_modules', rel);
  return {
    name: 'tesseract-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = (req.url || '').match(/^\/tesseract\/([^/?#]+)/);
        const rel = m && TESSERACT_ASSETS[m[1]];
        if (!rel) return next();
        res.setHeader('Content-Type', m![1].endsWith('.js') ? 'text/javascript' : 'application/gzip');
        fs.createReadStream(file(rel)).pipe(res);
      });
    },
    generateBundle() {
      for (const [name, rel] of Object.entries(TESSERACT_ASSETS)) {
        this.emitFile({type: 'asset', fileName: `tesseract/${name}`, source: fs.readFileSync(file(rel))});
      }
    },
  };
};

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), tesseractAssets()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
