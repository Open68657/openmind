/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Reads a palette board image. The swatches come from the pixels: every large flat area is
// one. The values come from the text printed on the board: each area's ink is cropped,
// normalised to dark-on-light and read with OCR, and every label block is paired with its
// swatch, by the colour it names when it names one, by position otherwise. Everything runs
// in the browser: Tesseract.js on WebAssembly, with the worker, the engine and the language
// data served by this app (see vite.config.ts). No image ever leaves the machine.

import type { Worker as OcrWorker } from 'tesseract.js';
import { Rgb, readCmyk, readHex, readName, readPantone, readRgb, repairOcrDigits } from './colorNotation';

export interface Swatch {
  rgb: Rgb;
  hex: string; // sampled from the pixels, "#RRGGBB"
  x: number;
  y: number;
  w: number;
  h: number; // box in the analysed image
}

export interface SwatchReading {
  swatch: Swatch;
  hex: string; // the printed hex when it agrees with the pixels, otherwise the sampled one
  name?: string;
  cmyk?: string; // "C:x M:x Y:x K:x"
  pantone?: string; // "PANTONE 2756 C"
  text: string; // everything OCR read for this swatch
}

export interface OcrProgress {
  stage: 'swatches' | 'engine' | 'read';
  done: number;
  total: number;
}

// How far a printed HEX may sit from the swatch's own pixels and still be believed. JPEG
// and colour management move a flat colour by a few units; a designer who fills the swatch
// with the RGB triplet and prints a slightly different HEX moves it by a few dozen.
const PRINTED_HEX_TOLERANCE = 48;
// Working size of the analysed image. Boards are flat, so OCR loses nothing here.
const MAX_SIDE = 3000;
// Longest side of an OCR crop. Text is upscaled 2x up to this.
const MAX_CROP_SIDE = 2600;

interface Region extends Swatch {
  cells: number;
  ground: boolean; // the page behind the swatches, not a swatch itself
}

interface OcrLine {
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface Block {
  lines: OcrLine[];
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  text: string;
}

interface Crop {
  canvas: HTMLCanvasElement;
  x: number; // image coordinates of the crop's top-left corner
  y: number;
  scale: number;
}

const dist = (a: Rgb, b: Rgb): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const toHex = (rgb: Rgb): string => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
const fromHex = (hex: string): Rgb => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = url;
  });

// --- 1. Swatches: connected areas of one flat colour on a coarse grid ---
const findRegions = (data: Uint8ClampedArray, W: number, H: number): { regions: Region[]; step: number } => {
  const step = Math.max(4, Math.round(Math.max(W, H) / 140));
  const cols = Math.floor(W / step);
  const rows = Math.floor(H / step);
  const at = (gx: number, gy: number) => ((gy * step + (step >> 1)) * W + gx * step + (step >> 1)) * 4;

  // Colour of every cell, clustered: two cells within 24 units are the same colour.
  const palette: Rgb[] = [];
  const label = new Int32Array(cols * rows);
  for (let gy = 0; gy < rows; gy++)
    for (let gx = 0; gx < cols; gx++) {
      const i = at(gx, gy);
      const rgb: Rgb = [data[i], data[i + 1], data[i + 2]];
      let k = palette.findIndex((p) => dist(p, rgb) < 24);
      if (k < 0) {
        k = palette.length;
        palette.push(rgb);
      }
      label[gy * cols + gx] = k;
    }

  // Connected components. A swatch is one large solid blob; text that happens to share its
  // colour is scattered single cells and never forms one.
  const seen = new Uint8Array(cols * rows);
  const regions: Region[] = [];
  const stack: number[] = [];
  for (let start = 0; start < cols * rows; start++) {
    if (seen[start]) continue;
    const k = label[start];
    seen[start] = 1;
    stack.push(start);
    let n = 0, x0 = cols, y0 = rows, x1 = -1, y1 = -1;
    const sum = [0, 0, 0];
    while (stack.length) {
      const i = stack.pop()!;
      n++;
      const gx = i % cols;
      const gy = (i - gx) / cols;
      if (gx < x0) x0 = gx;
      if (gy < y0) y0 = gy;
      if (gx > x1) x1 = gx;
      if (gy > y1) y1 = gy;
      const p = at(gx, gy);
      sum[0] += data[p];
      sum[1] += data[p + 1];
      sum[2] += data[p + 2];
      const next = [gx > 0 ? i - 1 : -1, gx < cols - 1 ? i + 1 : -1, gy > 0 ? i - cols : -1, gy < rows - 1 ? i + cols : -1];
      for (const j of next) {
        if (j >= 0 && !seen[j] && label[j] === k) {
          seen[j] = 1;
          stack.push(j);
        }
      }
    }
    // Solid, and with body in both directions: JPEG smears a strip of blended colour along
    // every edge between two swatches, one cell wide and as tall as the swatch.
    const area = (x1 - x0 + 1) * (y1 - y0 + 1);
    if (n < 40 || n / area < 0.6 || x1 - x0 < 2 || y1 - y0 < 2) continue;
    const rgb = sum.map((v) => Math.round(v / n)) as Rgb;
    // The page behind the swatches: white or black, and either most of the image or
    // wrapped around everything else.
    const flat = Math.min(...rgb) >= 235 || Math.max(...rgb) <= 25;
    const wraps = (x1 - x0 + 1) / cols >= 0.9 && (y1 - y0 + 1) / rows >= 0.9;
    const ground = flat && (n >= 0.25 * cols * rows || wraps);
    regions.push({ rgb, hex: toHex(rgb), x: x0 * step, y: y0 * step, w: (x1 - x0 + 1) * step, h: (y1 - y0 + 1) * step, cells: n, ground });
  }
  regions.sort((a, b) => a.y - b.y || a.x - b.x);
  return { regions, step };
};

// --- 2. The region's ink, the way OCR likes it ---
// Dark text on a white ground whatever the swatch colour, the other regions masked out (a
// neighbouring swatch would be a giant black block otherwise), tightened to the text and
// scaled to a comfortable size. Null when nothing is printed on the region.
const cropInk = (src: CanvasRenderingContext2D, W: number, H: number, region: Region, others: Region[], step: number): Crop | null => {
  // A swatch box is grid-aligned and may overshoot into its neighbour by one cell.
  const inset = region.ground ? 0 : step;
  const x = Math.max(0, region.x + inset);
  const y = Math.max(0, region.y + inset);
  const w = Math.min(W, region.x + region.w - inset) - x;
  const h = Math.min(H, region.y + region.h - inset) - y;
  if (w < 8 || h < 8) return null;

  const img = src.getImageData(x, y, w, h);
  const d = img.data;
  const [r0, g0, b0] = region.rgb;
  const masks = others.map((o) => [o.x - step - x, o.y - step - y, o.x + o.w + step - x, o.y + o.h + step - y]);
  let ix0 = w, iy0 = h, ix1 = -1, iy1 = -1;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const i = (py * w + px) * 4;
      let v = 255;
      if (!masks.some((m) => px >= m[0] && px < m[2] && py >= m[1] && py < m[3])) {
        v = 255 - Math.min(255, Math.hypot(d[i] - r0, d[i + 1] - g0, d[i + 2] - b0) * 3);
        if (v < 128) {
          if (px < ix0) ix0 = px;
          if (px > ix1) ix1 = px;
          if (py < iy0) iy0 = py;
          if (py > iy1) iy1 = py;
        }
      }
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
  }
  if (ix1 < 0) return null;

  const pad = Math.max(8, step);
  const cx0 = Math.max(0, ix0 - pad);
  const cy0 = Math.max(0, iy0 - pad);
  const cw = Math.min(w, ix1 + pad + 1) - cx0;
  const ch = Math.min(h, iy1 + pad + 1) - cy0;
  const scale = Math.max(0.5, Math.min(2, MAX_CROP_SIDE / Math.max(cw, ch)));

  const flat = document.createElement('canvas');
  flat.width = w;
  flat.height = h;
  flat.getContext('2d')!.putImageData(img, 0, 0);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(cw * scale);
  canvas.height = Math.round(ch * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(flat, cx0, cy0, cw, ch, 0, 0, canvas.width, canvas.height);
  return { canvas, x: x + cx0, y: y + cy0, scale };
};

// --- 3. OCR ---
// Everything Tesseract needs is served by this app under /tesseract/ (see vite.config.ts),
// resolved against the page so it works from a sub-path like GitHub Pages.
const assetUrl = (name: string): string => new URL(`tesseract/${name}`, new URL(import.meta.env.BASE_URL, document.baseURI)).href;

const createOcrWorker = async (): Promise<OcrWorker> => {
  const mod: any = await import('tesseract.js');
  const createWorker = (mod.createWorker ? mod : mod.default).createWorker as typeof import('tesseract.js').createWorker;
  const dir = assetUrl('').replace(/\/$/, '');
  const worker = await createWorker('eng', 1 /* LSTM only */, {
    workerPath: assetUrl('worker.min.js'),
    corePath: dir,
    langPath: dir,
    gzip: true,
  });
  // Automatic page segmentation: a board printed as columns comes back as separate lines
  // per column, and a single label block comes back as its own lines either way.
  await worker.setParameters({ tessedit_pageseg_mode: '3' as any, preserve_interword_spaces: '1' });
  return worker;
};

const recognizeLines = async (worker: OcrWorker, crop: Crop): Promise<OcrLine[]> => {
  const { data } = await worker.recognize(crop.canvas, {}, { blocks: true, text: true });
  const lines: OcrLine[] = [];
  for (const block of data.blocks || [])
    for (const paragraph of block.paragraphs)
      for (const line of paragraph.lines) {
        const text = line.text.replace(/\s+/g, ' ').trim();
        if (!text) continue;
        lines.push({
          text,
          x0: crop.x + line.bbox.x0 / crop.scale,
          y0: crop.y + line.bbox.y0 / crop.scale,
          x1: crop.x + line.bbox.x1 / crop.scale,
          y1: crop.y + line.bbox.y1 / crop.scale,
        });
      }
  return lines;
};

// Lines that sit under one another, close and horizontally overlapping, are one label.
const groupLines = (lines: OcrLine[]): Block[] => {
  const blocks: Block[] = [];
  for (const ln of [...lines].sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)) {
    const h = ln.y1 - ln.y0;
    const home = blocks.find((b) => {
      const lineH = Math.max(h, ...b.lines.map((l) => l.y1 - l.y0));
      const gap = ln.y0 - b.y1;
      const overlap = Math.min(ln.x1, b.x1) - Math.max(ln.x0, b.x0);
      return gap < 1.8 * lineH && gap > -0.5 * h && overlap > -h;
    });
    if (home) {
      home.lines.push(ln);
      home.x0 = Math.min(home.x0, ln.x0);
      home.y0 = Math.min(home.y0, ln.y0);
      home.x1 = Math.max(home.x1, ln.x1);
      home.y1 = Math.max(home.y1, ln.y1);
    } else {
      blocks.push({ lines: [ln], x0: ln.x0, y0: ln.y0, x1: ln.x1, y1: ln.y1, text: '' });
    }
  }
  blocks.forEach((b) => (b.text = b.lines.map((l) => l.text).join('\n')));
  return blocks;
};

// --- 4. Printed HEX vs. the pixels ---
// Every way OCR confuses a character with another that is still a hex digit, or a digit
// with a letter that is not. The candidate nearest the swatch's own colour wins.
const PAIRS = ['0O', '0D', '0Q', '1I', '1L', '2Z', '5S', '6G', '8B', '4A', '7T', 'EF', 'CG'];
const ALT: Record<string, string[]> = {};
for (const [a, b] of PAIRS) {
  (ALT[a] ||= []).push(b);
  (ALT[b] ||= []).push(a);
}
const hexCandidates = (raw: string): string[] => {
  let out = [''];
  for (const ch of raw.replace('#', '').toUpperCase()) {
    const options = [ch, ...(ALT[ch] || [])];
    out = out.flatMap((prefix) => options.map((o) => prefix + o));
  }
  return out.filter((c) => /^[0-9A-F]{6}$/.test(c));
};
// Nearest candidate to the colour, or null when none comes close enough. The raw reading
// is generated first, so it wins a tie.
const nearestHex = (raw: string, rgb: Rgb): { hex: string; d: number } | null => {
  let best: { hex: string; d: number } | null = null;
  for (const c of hexCandidates(raw)) {
    const d = dist(fromHex('#' + c), rgb);
    if (d <= PRINTED_HEX_TOLERANCE && (!best || d < best.d)) best = { hex: '#' + c, d };
  }
  return best;
};

// The printed colour when it agrees with the pixels, otherwise the pixels.
const resolveHex = (text: string, sampled: Rgb): string => {
  const printed = readHex(text, true);
  const hit = printed ? nearestHex(printed, sampled) : null;
  if (hit) return hit.hex;
  const rgb = readRgb(text);
  if (rgb && dist(rgb, sampled) <= PRINTED_HEX_TOLERANCE) return toHex(rgb);
  return toHex(sampled);
};

// --- 5. Which swatch does a label belong to? ---
const assign = (block: Block, regions: Region[], reach: number): Region | null => {
  const text = repairOcrDigits(block.text);
  // By the colour it names: a printed HEX or RGB that matches a swatch is that swatch's.
  const printed = readHex(text, true);
  const rgb = readRgb(text);
  let best: Region | null = null;
  let bestD = PRINTED_HEX_TOLERANCE;
  for (const r of regions) {
    const d = printed ? nearestHex(printed, r.rgb)?.d ?? Infinity : rgb ? dist(rgb, r.rgb) : Infinity;
    if (d <= bestD) {
      bestD = d;
      best = r;
    }
  }
  if (best) return best;
  // Printed on the swatch itself.
  const cx = (block.x0 + block.x1) / 2;
  const cy = (block.y0 + block.y1) / 2;
  const inside = regions.find((r) => !r.ground && cx >= r.x && cx < r.x + r.w && cy >= r.y && cy < r.y + r.h);
  if (inside) return inside;
  // Printed next to it, usually underneath: the nearest swatch, within reason.
  let near: Region | null = null;
  let nearD = reach;
  for (const r of regions) {
    if (r.ground) continue;
    const dx = Math.max(0, r.x - block.x1, block.x0 - (r.x + r.w));
    const dy = Math.max(0, r.y - block.y1, block.y0 - (r.y + r.h));
    // A label sits under its swatch far more often than beside it, and a block above a
    // swatch is usually a heading for the whole board.
    const above = block.y1 <= r.y ? 4 : 1;
    const d = (Math.hypot(dx, dy) + dx) * above;
    if (d < nearD) {
      nearD = d;
      near = r;
    }
  }
  return near;
};

// --- The whole thing ---
export const readPaletteBoard = async (imageUrl: string, onProgress?: (p: OcrProgress) => void): Promise<SwatchReading[]> => {
  onProgress?.({ stage: 'swatches', done: 0, total: 0 });
  const img = await loadImage(imageUrl);
  const k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const W = Math.max(1, Math.round(img.naturalWidth * k));
  const H = Math.max(1, Math.round(img.naturalHeight * k));
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, W, H);
  const { regions, step } = findRegions(ctx.getImageData(0, 0, W, H).data, W, H);
  if (!regions.some((r) => !r.ground)) return [];

  // Crops first: the engine is only loaded when there is something to read.
  const crops: Crop[] = [];
  for (const r of regions) {
    const crop = cropInk(ctx, W, H, r, regions.filter((o) => o !== r && !o.ground), step);
    if (crop) crops.push(crop);
  }
  const blocks: Block[] = [];
  if (crops.length) {
    onProgress?.({ stage: 'engine', done: 0, total: crops.length });
    const worker = await createOcrWorker();
    try {
      for (let i = 0; i < crops.length; i++) {
        onProgress?.({ stage: 'read', done: i, total: crops.length });
        blocks.push(...groupLines(await recognizeLines(worker, crops[i])));
      }
    } finally {
      await worker.terminate();
    }
  }

  // Blocks that carry values go first: the name is read from the first plain line, and a
  // heading that landed on the same swatch must not be it.
  const hasValues = (b: Block) => /\b(HEX|RGB|CMYK|PANTONE|PMS)\b|#[0-9A-Za-z]{6}/i.test(b.text);
  const textFor = new Map<Region, string[]>();
  for (const block of [...blocks].sort((a, b) => Number(hasValues(b)) - Number(hasValues(a)))) {
    const owner = assign(block, regions, 0.2 * Math.max(W, H));
    if (owner) (textFor.get(owner) ?? textFor.set(owner, []).get(owner)!).push(block.text);
  }

  const readings: SwatchReading[] = [];
  for (const r of regions) {
    const texts = textFor.get(r);
    if (r.ground && !texts) continue; // the page is not a colour, unless a label says it is
    const text = repairOcrDigits((texts || []).join('\n'));
    readings.push({
      swatch: r,
      hex: resolveHex(text, r.rgb),
      name: readName(text) ?? undefined,
      cmyk: readCmyk(text) ?? undefined,
      pantone: readPantone(text) ?? undefined,
      text,
    });
  }
  return readings;
};
