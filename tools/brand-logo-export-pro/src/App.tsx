/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  Trash2,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon,
  Plus,
  ChevronDown,
  Lock,
  FileText,
  Check,
} from 'lucide-react';
import { motion } from 'motion/react';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import { Asset, BrandColor, Background, OutputTargets } from './constants';
import { CMYK_PROFILES, CmykProfileKey, GRID, getCmykLut } from './cmykLut';
import { readAllCmyk, readAllHex, readAllRgb, readCmyk, readHex, readName, readPantone, readRgb } from './colorNotation';
import { OcrProgress, readPaletteBoard, SwatchReading } from './paletteOcr';

// Breathing room around the logo whenever it sits on a background (CMYK PDF and the rgb JPEG).
const MARGIN_RATIO = 0.12;

const OUTPUT_OPTIONS: { key: keyof OutputTargets; label: string; hint: string }[] = [
  { key: 'rgb', label: 'RGB / מסך', hint: 'svg · pdf · png שקוף · jpg על הרקע' },
  { key: 'cmyk', label: 'CMYK / דפוס', hint: 'pdf ווקטורי בלבד, DeviceCMYK אמיתי' },
  { key: 'pantone', label: 'Pantone / ספוט', hint: 'pdf עם פלטות Separation לפי שמות הפנטון' },
];

// --- Color utilities ---

const hexToRgb =(hex: string): [number, number, number] => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const rgbToHex = (r: number, g: number, b: number): string =>
  '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');

const normalizeHex = (hex: string): string => {
  let h = hex.trim();
  if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  return h.toUpperCase();
};

const getRgbDistance = (a: [number, number, number], b: [number, number, number]): number =>
  Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);

// Ink or paper, whichever stays legible on the given background. Used for the small
// asset captions in a combination card, which sit directly on the combination color.
const onColor = (hex: string): string => {
  const [r, g, b] = hexToRgb(normalizeHex(hex));
  return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? '#000000' : '#FFFFFF';
};

// RGB -> CMYK string "C:x M:x Y:x K:x" (0-100).
// Trilinear lookup into a table baked from the real ICC profile, so the numbers
// match what Illustrator gives you when an RGB color lands in a CMYK document.
const calculateCMYK = (r: number, g: number, b: number, profile: CmykProfileKey = 'swop'): string => {
  const lut = getCmykLut(profile);
  const axis = (v: number) => {
    const f = (Math.max(0, Math.min(255, v)) / 255) * (GRID - 1);
    const i = Math.min(Math.floor(f), GRID - 2);
    return [i, f - i] as const;
  };
  const [ri, rf] = axis(r), [gi, gf] = axis(g), [bi, bf] = axis(b);
  const out = [0, 0, 0, 0];
  for (let dr = 0; dr < 2; dr++)
    for (let dg = 0; dg < 2; dg++)
      for (let db = 0; db < 2; db++) {
        const w = (dr ? rf : 1 - rf) * (dg ? gf : 1 - gf) * (db ? bf : 1 - bf);
        if (!w) continue;
        const base = (((ri + dr) * GRID + (gi + dg)) * GRID + (bi + db)) * 4;
        for (let i = 0; i < 4; i++) out[i] += lut[base + i] * w;
      }
  const [c, m, y, k] = out.map((v) => Math.round((v / 255) * 100));
  return `C:${c} M:${m} Y:${y} K:${k}`;
};

// CMYK string -> [c,m,y,k] in 0-1
const parseCmyk = (cmykStr: string): [number, number, number, number] => {
  const m = cmykStr.match(/\d+(\.\d+)?/g);
  if (m && m.length === 4) return m.map((v) => parseFloat(v) / 100) as [number, number, number, number];
  return [0, 0, 0, 1];
};

// CMYK string -> approximate RGB hex (screen preview + raster of CMYK values)
const cmykToRgbHex = (cmykStr: string): string => {
  const [c, m, y, k] = parseCmyk(cmykStr);
  return rgbToHex(255 * (1 - c) * (1 - k), 255 * (1 - m) * (1 - k), 255 * (1 - y) * (1 - k));
};

// hex <-> HSV (for the color picker)
const hexToHsv = (hex: string): { h: number; s: number; v: number } => {
  const [r, g, b] = hexToRgb(hex).map((x) => x / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
};
const hsvToHex = (h: number, s: number, v: number): string => {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
};

// --- SVG utilities ---

const getSvgSize = (svgStr: string): { w: number; h: number } => {
  const svg = new DOMParser().parseFromString(svgStr, 'image/svg+xml').documentElement;
  let w = parseFloat(svg.getAttribute('width') || '0');
  let h = parseFloat(svg.getAttribute('height') || '0');
  const vb = svg.getAttribute('viewBox');
  if (vb && (!w || !h)) {
    const p = vb.split(/[\s,]+/).map(parseFloat);
    w = p[2];
    h = p[3];
  }
  if (!w || !h) { w = 100; h = 100; }
  return { w, h };
};

const ensureSvgSize = (svgStr: string): string => {
  const doc = new DOMParser().parseFromString(svgStr, 'image/svg+xml');
  const svg = doc.documentElement;
  const { w, h } = getSvgSize(svgStr);
  if (!svg.getAttribute('width')) svg.setAttribute('width', String(w));
  if (!svg.getAttribute('height')) svg.setAttribute('height', String(h));
  return new XMLSerializer().serializeToString(doc);
};

const recolorSvg = (svgStr: string, mapping: Record<string, string>): string => {
  if (!svgStr) return '';
  const doc = new DOMParser().parseFromString(svgStr, 'image/svg+xml');
  doc.querySelectorAll('*').forEach((el) => {
    const fill = el.getAttribute('fill');
    const stroke = el.getAttribute('stroke');
    const style = el.getAttribute('style');
    if (fill && mapping[fill.toUpperCase()]) el.setAttribute('fill', mapping[fill.toUpperCase()]);
    if (stroke && mapping[stroke.toUpperCase()]) el.setAttribute('stroke', mapping[stroke.toUpperCase()]);
    if (style) {
      let ns = style;
      Object.entries(mapping).forEach(([o, n]) => (ns = ns.replace(new RegExp(o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), n)));
      el.setAttribute('style', ns);
    }
    if (el.tagName.toLowerCase() === 'style' && el.textContent) {
      let nc = el.textContent;
      Object.entries(mapping).forEach(([o, n]) => (nc = nc.replace(new RegExp(o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), n)));
      el.textContent = nc;
    }
  });
  return new XMLSerializer().serializeToString(doc);
};

// Elements that actually paint something.
const PAINTABLE = 'path,rect,circle,ellipse,line,polyline,polygon,text,tspan,textPath,use';
// Their paint is structural (clipping, masking, symbol definitions) — not brand color.
const NON_PAINT_ANCESTOR = 'defs,clipPath,mask,marker,symbol,pattern';

// "rgb(0, 0, 0)" / "rgba(...)" / a named color, as resolved by the browser -> "#RRGGBB".
// Returns null for none / transparent / url(#gradient).
const computedPaintToHex = (paint: string): string | null => {
  const m = paint.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (!m) return null;
  if (/rgba\(/i.test(paint) && /,\s*0\s*\)$/.test(paint.trim())) return null; // fully transparent
  return normalizeHex(rgbToHex(+m[1], +m[2], +m[3]));
};

const stripPaintDeclarations = (css: string): string =>
  css.replace(/\b(fill|stroke)\s*:\s*[^;}"']*;?/gi, '');

// --- Flatten every paint into an explicit hex presentation attribute ---
// SVGs in the wild state their colors in a dozen ways: named colors (fill="black"),
// rgb() notation, a <style> block with classes, or nothing at all (fill defaults to
// black). Only the last one is even visible to a hex scan, so a plain single-color
// wordmark used to arrive with zero editable colors. Here the SVG is mounted offscreen
// and the browser resolves the real painted color of each element for us — inheritance,
// stylesheets and defaults included. Then the paint declarations are removed from the
// CSS so the attribute we write is the single source of truth for recoloring.
// Live text in a logo is a defect, not a style choice: the shape then depends on a font
// the reader may not have, and the PDF writer quietly substitutes Helvetica. Returns the
// offending strings so the warning can name them.
const findLiveText = (svgStr: string): string[] => {
  const doc = new DOMParser().parseFromString(svgStr, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.tagName.toLowerCase() === 'parsererror' || !root.querySelectorAll) return [];
  const out: string[] = [];
  root.querySelectorAll('text, textPath').forEach((el) => {
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (t) out.push(t);
    else out.push('(טקסט ריק)');
  });
  return [...new Set(out)];
};

const flattenSvgPaint = (svgStr: string): string => {
  const doc = new DOMParser().parseFromString(svgStr, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.tagName.toLowerCase() === 'parsererror' || !root.querySelector) return svgStr;

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:absolute;left:-99999px;top:0;width:0;height:0;overflow:hidden;';
  const live = document.importNode(root, true) as unknown as SVGElement;
  host.appendChild(live);
  document.body.appendChild(host);

  try {
    const liveEls = Array.from(live.querySelectorAll(PAINTABLE));
    const docEls = Array.from(root.querySelectorAll(PAINTABLE));
    if (liveEls.length !== docEls.length) return svgStr;

    liveEls.forEach((liveEl, i) => {
      const target = docEls[i];
      if (target.closest(NON_PAINT_ANCESTOR)) return;
      const cs = getComputedStyle(liveEl);
      const fill = computedPaintToHex(cs.fill);
      if (fill) target.setAttribute('fill', fill);
      const stroke = computedPaintToHex(cs.stroke);
      if (stroke && parseFloat(cs.strokeWidth) > 0) target.setAttribute('stroke', stroke);

      const inline = target.getAttribute('style');
      if (inline) {
        const rest = stripPaintDeclarations(inline).trim();
        if (rest) target.setAttribute('style', rest);
        else target.removeAttribute('style');
      }
    });

    root.querySelectorAll('style').forEach((el) => {
      if (el.textContent) el.textContent = stripPaintDeclarations(el.textContent);
    });
  } catch {
    return svgStr;
  } finally {
    host.remove();
  }

  return new XMLSerializer().serializeToString(doc);
};

const detectColors = (svgStr: string): string[] => {
  const doc = new DOMParser().parseFromString(svgStr, 'image/svg+xml');
  const found = new Set<string>();
  const grab = (s: string | null) => {
    if (!s) return;
    (s.match(/#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}\b/g) || []).forEach((h) => found.add(h.toUpperCase()));
  };
  doc.querySelectorAll('*').forEach((el) => {
    grab(el.getAttribute('fill'));
    grab(el.getAttribute('stroke'));
    grab(el.getAttribute('style'));
  });
  if (found.size === 0) grab(svgStr);
  return Array.from(found);
};

// --- Rasterize SVG to a blob. Transparent PNG, or JPEG with background + margin. ---
const svgToRaster = (
  svgStr: string,
  opts: { targetW?: number; type?: 'png' | 'jpeg'; bg?: string; marginRatio?: number; quality?: number }
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const { targetW = 2000, type = 'png', bg = '#FFFFFF', marginRatio = 0, quality = 0.92 } = opts;
    const { w, h } = getSvgSize(svgStr);
    const logoW = targetW;
    const logoH = Math.round((h / w) * targetW);
    const margin = Math.round(marginRatio * Math.max(logoW, logoH));
    const cw = logoW + margin * 2;
    const ch = logoH + margin * 2;
    const img = new Image();
    const url = URL.createObjectURL(new Blob([ensureSvgSize(svgStr)], { type: 'image/svg+xml;charset=utf-8' }));
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas context failed');
      if (type === 'jpeg') {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, cw, ch);
      } else {
        ctx.clearRect(0, 0, cw, ch); // transparent
      }
      ctx.drawImage(img, margin, margin, logoW, logoH);
      canvas.toBlob(
        (b) => { URL.revokeObjectURL(url); b ? resolve(b) : reject('Raster conversion failed'); },
        type === 'jpeg' ? 'image/jpeg' : 'image/png',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject('SVG load failed'); };
    img.src = url;
  });

// --- Parse a brand color-guidelines document (PDF / TXT / CSV) into exact color values ---
// A guidelines page is read the way a person reads it: swatch by swatch. That matters
// because the PDF text layer is usually grouped by KIND, not by swatch — every Pantone
// name first, then every RGB triplet, then every hex. Pairing those lists by index breaks
// as soon as one swatch has no Pantone (a plain white in the middle of the row silently
// stole the next swatch's name). So the reader below groups text by its position on the
// page first, and only falls back to whole-document matching when that yields nothing.

interface ColorDoc { text: string; blocks: string[] }
interface ParsedColor { hex: string; cmyk: string; name: string; pantone?: string }

// One swatch block: whatever of name / hex / RGB / CMYK / Pantone happens to be printed in
// it, in any of the notations colorNotation.ts knows.
const parseColorBlock = (block: string, profile: CmykProfileKey): ParsedColor | null => {
  const rgb = readRgb(block);
  const hex = readHex(block) ?? (rgb ? rgbToHex(...rgb).toUpperCase() : null);
  if (!hex) return null;
  const [r, g, b] = hexToRgb(hex);
  const cmyk = readCmyk(block) ?? calculateCMYK(r, g, b, profile);
  const pantone = readPantone(block) ?? undefined;
  return { hex, cmyk, name: readName(block) || pantone || '', pantone };
};

// Fallback for documents with no usable geometry (plain text, CSV, a flattened PDF):
// anchor on the colors and attach the CMYK group that is closest to each one.
const parseColorsFlat = (text: string, profile: CmykProfileKey): ParsedColor[] => {
  const hexes = [...new Set(readAllHex(text))];
  const rgbs = [...new Set(readAllRgb(text).map((c) => rgbToHex(...c).toUpperCase()))];
  const cmyks = readAllCmyk(text).map((str) => ({ str, rgb: hexToRgb(cmykToRgbHex(str)) }));
  const base = hexes.length ? hexes : rgbs;
  const usedCmyk = new Set<number>();
  return base.map((hex, i) => {
    const rgb = hexToRgb(hex);
    let best = -1, bestD = Infinity;
    cmyks.forEach((c, ci) => {
      if (usedCmyk.has(ci)) return;
      const d = getRgbDistance(rgb, c.rgb);
      if (d < bestD) { bestD = d; best = ci; }
    });
    let cmyk: string;
    if (best >= 0 && bestD < 60) { cmyk = cmyks[best].str; usedCmyk.add(best); }
    else cmyk = calculateCMYK(rgb[0], rgb[1], rgb[2], profile);
    return { hex, cmyk, name: `Brand ${i + 1}` };
  });
};

const parseColorDocument = (doc: ColorDoc, profile: CmykProfileKey): ParsedColor[] => {
  const byBlock: ParsedColor[] = [];
  const seen = new Set<string>();
  doc.blocks.forEach((b) => {
    const c = parseColorBlock(b, profile);
    if (!c || seen.has(c.hex)) return;
    seen.add(c.hex);
    byBlock.push(c);
  });
  // Geometry is only trusted when it actually separated the swatches. One giant block
  // holding every color means the layout told us nothing.
  const flat = parseColorsFlat(doc.text, profile);
  const chosen = byBlock.length >= 2 && byBlock.length >= flat.length ? byBlock : flat;
  return chosen.map((c, i) => ({ ...c, name: c.name || `Brand ${i + 1}` }));
};

// Read a guidelines file into plain text plus, for a PDF, one text block per swatch.
// Blocks come from the geometry: items printed in the same column belong together.
const readColorDocument = async (file: File): Promise<ColorDoc> => {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (!isPdf) {
    const text = await file.text();
    // In a text/CSV file a swatch is a line or a paragraph.
    return { text, blocks: text.split(/\r?\n\s*\r?\n|\r?\n/).filter((b) => b.trim()) };
  }
  const pdfjs: any = await import('pdfjs-dist');
  const workerCode = (await import('pdfjs-dist/build/pdf.worker.min.mjs?raw')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([workerCode], { type: 'text/javascript' }));
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;

  let text = '';
  const blocks: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const width = page.getViewport({ scale: 1 }).width || 1000;
    const items = content.items
      .filter((it: any) => typeof it.str === 'string' && it.str.trim())
      .map((it: any) => ({ str: it.str, x: it.transform[4] as number, y: it.transform[5] as number }));
    text += items.map((it: { str: string }) => it.str).join('\n') + '\n';

    // Column clustering: a swatch's labels are left-aligned under its own chip, so a gap
    // much wider than a normal indent means the next swatch has started.
    const gap = Math.max(24, width * 0.04);
    const columns: { x: number; items: typeof items }[] = [];
    [...items].sort((a, b) => a.x - b.x).forEach((it) => {
      const last = columns[columns.length - 1];
      if (last && it.x - last.x <= gap) last.items.push(it);
      else columns.push({ x: it.x, items: [it] });
    });
    columns.forEach((col) => {
      blocks.push(col.items.sort((a, b) => b.y - a.y).map((it) => it.str).join('\n'));
    });
  }
  return { text, blocks };
};

// --- Detect colors from an uploaded palette image ---
const extractColorsFromImage = (imageUrl: string, existing: BrandColor[], profile: CmykProfileKey): Promise<BrandColor[]> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve([]);
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const sx = Math.max(1, Math.floor(canvas.width / 22));
      const sy = Math.max(1, Math.floor(canvas.height / 22));
      const clustered: [number, number, number][] = [];
      const existingRgb = existing.map((e) => hexToRgb(e.rgbHex));
      for (let y = 0; y < canvas.height; y += sy) {
        for (let x = 0; x < canvas.width; x += sx) {
          const i = (y * canvas.width + x) * 4;
          if (data[i + 3] < 128) continue; // skip transparent
          const rgb: [number, number, number] = [data[i], data[i + 1], data[i + 2]];
          if (clustered.some((c) => getRgbDistance(c, rgb) < 24)) continue;
          if (existingRgb.some((c) => getRgbDistance(c, rgb) < 24)) continue;
          clustered.push(rgb);
        }
      }
      resolve(
        clustered.map((rgb, i) => {
          const hex = normalizeHex(rgbToHex(rgb[0], rgb[1], rgb[2]));
          return {
            id: `img-${hex}-${Math.random().toString(36).slice(2, 6)}`,
            originalHex: hex,
            name: `Palette ${i + 1}`,
            rgbHex: hex,
            cmyk: calculateCMYK(rgb[0], rgb[1], rgb[2], profile),
            source: 'image' as const,
          };
        })
      );
    };
    img.onerror = () => resolve([]);
    img.src = imageUrl;
  });

// --- Vector PDF, tight to artwork, no background. True DeviceCMYK when cmykByHex supplied. ---
// A spot color as it will appear on press: the plate name plus the CMYK build a
// non-separating device falls back to.
export interface SpotColor {
  name: string;
  cmyk: [number, number, number, number];
}

// PDF name escaping: everything outside the regular character set becomes #xx.
const pdfName = (s: string): string =>
  s.replace(/[^\x21-\x7e]|[#()<>\[\]{}\/%]/g, (ch) => '#' + ch.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase());

const fmt = (n: number): string => (Math.round(n * 1e4) / 1e4).toString();

// jsPDF has no Separation color space, so the spot resources are written into the
// finished file: a /ColorSpace entry per plate in the page resource dictionary, each
// one a Separation whose tint transform (Type 2, linear) lands on the CMYK build.
// The content stream already refers to them by name — see the wrapper below.
// Inserting bytes invalidates every offset in the cross-reference table, so it is
// rebuilt from scratch afterwards.
const injectSpotColorSpaces = (pdf: string, spots: { key: string; spot: SpotColor }[]): string => {
  if (spots.length === 0) return pdf;

  const entries = spots
    .map(({ key, spot }) => {
      const tint = `<< /FunctionType 2 /Domain [0 1] /C0 [0 0 0 0] /C1 [${spot.cmyk.map(fmt).join(' ')}] /N 1 >>`;
      return `/${key} [/Separation /${pdfName(spot.name)} /DeviceCMYK ${tint}]`;
    })
    .join('\n');

  const anchor = '/ProcSet [/PDF /Text /ImageB /ImageC /ImageI]';
  const at = pdf.indexOf(anchor);
  if (at < 0) throw new Error('resource dictionary not found');
  const withCs = pdf.slice(0, at + anchor.length) + `\n/ColorSpace <<\n${entries}\n>>` + pdf.slice(at + anchor.length);

  // Rebuild the xref: object offsets moved, and Illustrator does not forgive that.
  const offsets = new Map<number, number>();
  const objRe = /(?:^|\n)(\d+) 0 obj/g;
  let m: RegExpExecArray | null;
  while ((m = objRe.exec(withCs))) {
    offsets.set(+m[1], m.index + (m[0].startsWith('\n') ? 1 : 0));
  }
  const size = Math.max(...offsets.keys()) + 1;

  const bodyEnd = withCs.lastIndexOf('\nxref\n');
  if (bodyEnd < 0) throw new Error('xref not found');
  const trailerMatch = withCs.slice(bodyEnd).match(/trailer\n([\s\S]*?)\nstartxref/);
  if (!trailerMatch) throw new Error('trailer not found');

  const body = withCs.slice(0, bodyEnd + 1); // keep the newline that ends the last object
  const rows = ['0000000000 65535 f \n'];
  for (let i = 1; i < size; i++) {
    const off = offsets.get(i);
    rows.push(off === undefined ? '0000000000 65535 f \n' : `${String(off).padStart(10, '0')} 00000 n \n`);
  }
  const xrefAt = body.length;
  return `${body}xref\n0 ${size}\n${rows.join('')}trailer\n${trailerMatch[1]}\nstartxref\n${xrefAt}\n%%EOF`;
};

const generateVectorPdf = async (
  svgStr: string,
  cmykByHex?: Record<string, [number, number, number, number]>,
  bg?: { hex: string; cmyk?: [number, number, number, number]; marginRatio?: number },
  spotByHex?: Record<string, SpotColor>
): Promise<Blob> => {
  const { w: svgW, h: svgH } = getSvgSize(svgStr);
  const target = 200; // long side of the artwork, in mm
  const scale = target / Math.max(svgW, svgH);
  const artW = svgW * scale;
  const artH = svgH * scale;
  // Background plate + margin around the artwork, same framing as the rgb JPEG.
  const margin = bg ? (bg.marginRatio ?? 0) * Math.max(artW, artH) : 0;
  const pageW = artW + margin * 2;
  const pageH = artH + margin * 2;

  // Spot files stay uncompressed: the cross-reference table is rebuilt by scanning the
  // file for object headers, and binary stream data could imitate one.
  const usedSpots: { key: string; spot: SpotColor }[] = [];
  const spotKeyByHex: Record<string, string> = {};

  const doc = new jsPDF({
    orientation: pageW >= pageH ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageW, pageH],
    compress: !spotByHex,
  });

  // Painted before the color wrapper below, so it keeps its own exact values.
  if (bg) {
    if (bg.cmyk) (doc as any).setFillColor(...bg.cmyk);
    else doc.setFillColor(bg.hex);
    doc.rect(0, 0, pageW, pageH, 'F');
  }

  let restore = () => {};
  if (cmykByHex || spotByHex) {
    const anyDoc = doc as any;
    const origFill = anyDoc.setFillColor.bind(doc);
    const origDraw = anyDoc.setDrawColor.bind(doc);
    const origText = anyDoc.setTextColor.bind(doc);
    const toHex = (args: any[]): string | null => {
      if (args.length === 1 && typeof args[0] === 'string') {
        const s = args[0].trim();
        if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return normalizeHex(s);
        const rgb = s.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
        if (rgb) return rgbToHex(+rgb[1], +rgb[2], +rgb[3]).toUpperCase();
        return null;
      }
      if (args.length === 3 && args.every((a) => typeof a === 'number')) return rgbToHex(args[0], args[1], args[2]).toUpperCase();
      return null;
    };
    // A color that carries a Pantone becomes a Separation reference in the content
    // stream — `/CSn cs 1 scn` paints the plate at full tint. Text keeps the CMYK
    // path: jsPDF emits the text color at draw time, so a raw write would not stick.
    const spotKeyFor = (hex: string): string | null => {
      const spot = spotByHex?.[hex];
      if (!spot) return null;
      if (!spotKeyByHex[hex]) {
        const key = `CS${usedSpots.length}`;
        spotKeyByHex[hex] = key;
        usedSpots.push({ key, spot });
      }
      return spotKeyByHex[hex];
    };
    const wrap = (orig: any, spotOps?: [string, string]) => (...args: any[]) => {
      const hex = toHex(args);
      if (hex) {
        const key = spotOps ? spotKeyFor(hex) : null;
        if (key) return anyDoc.internal.write(`/${key} ${spotOps![0]} 1 ${spotOps![1]}`);
        if (cmykByHex?.[hex]) {
          const [c, m, y, k] = cmykByHex[hex];
          return orig(c, m, y, k); // 4 channels => DeviceCMYK
        }
      }
      return orig(...args);
    };
    anyDoc.setFillColor = wrap(origFill, ['cs', 'scn']);
    anyDoc.setDrawColor = wrap(origDraw, ['CS', 'SCN']);
    anyDoc.setTextColor = wrap(origText);
    restore = () => { anyDoc.setFillColor = origFill; anyDoc.setDrawColor = origDraw; anyDoc.setTextColor = origText; };
  }

  const svgEl = new DOMParser().parseFromString(svgStr, 'image/svg+xml').documentElement as unknown as SVGElement;
  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
  container.appendChild(svgEl);
  document.body.appendChild(container);
  try {
    await svg2pdf(svgEl, doc, { x: margin, y: margin, width: artW, height: artH });
  } finally {
    document.body.removeChild(container);
    restore();
  }

  if (usedSpots.length === 0) return doc.output('blob');

  const patched = injectSpotColorSpaces(doc.output(), usedSpots);
  const bytes = new Uint8Array(patched.length);
  for (let i = 0; i < patched.length; i++) bytes[i] = patched.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: 'application/pdf' });
};

// --- Live preview (shadow DOM) ---
const LogoPreview = ({ svgContent, mapping, bg }: { svgContent: string; mapping: Record<string, string>; bg?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const shadow = useRef<ShadowRoot | null>(null);
  useEffect(() => {
    if (!ref.current || !svgContent) return;
    if (!shadow.current) shadow.current = ref.current.attachShadow({ mode: 'open' });
    const recolored = recolorSvg(svgContent, mapping);
    const clone = new DOMParser().parseFromString(recolored, 'image/svg+xml').documentElement;
    (clone as any).style.width = '100%';
    (clone as any).style.height = '100%';
    (clone as any).setAttribute('preserveAspectRatio', 'xMidYMid meet');
    shadow.current.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;';
    wrap.appendChild(clone);
    shadow.current.appendChild(wrap);
  }, [svgContent, mapping]);
  return <div ref={ref} className="w-full h-full" style={{ backgroundColor: bg }} />;
};

// --- Dropdown to pick a color from the palette (+ absolute white/black). Palette only — no free color. ---
const PaletteDropdown = ({ value, onChange, options }: { value: string; onChange: (hex: string) => void; options: { hex: string; name: string }[] }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const upper = new Set(options.map((o) => o.hex.toUpperCase()));
  const extras: { hex: string; name: string }[] = [];
  if (!upper.has('#FFFFFF')) extras.push({ hex: '#FFFFFF', name: 'Absolute white / לבן מוחלט' });
  if (!upper.has('#000000')) extras.push({ hex: '#000000', name: 'Absolute black / שחור מוחלט' });
  const all = [...options, ...extras];
  const selected = all.find((o) => o.hex.toUpperCase() === (value || '').toUpperCase());
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} className="w-full bg-black/5 rounded-lg px-2 py-1.5 flex items-center gap-2 hover:bg-black/10 transition-all">
        <div className="w-5 h-5 rounded border border-black/10 shrink-0" style={{ backgroundColor: value }} />
        <span className="text-[11px] font-semibold truncate flex-1 text-left">{selected ? selected.name : value}</span>
        <ChevronDown size={12} className={`shrink-0 text-black/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-0 right-0 min-w-[180px] bg-white border border-black/10 rounded-xl shadow-xl max-h-56 overflow-y-auto p-1">
          {all.map((o) => (
            <button
              key={o.hex + o.name}
              type="button"
              onClick={() => { onChange(o.hex.toUpperCase()); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 text-left transition-all ${o.hex.toUpperCase() === (value || '').toUpperCase() ? 'bg-emerald-50' : ''}`}
            >
              <div className="w-4 h-4 rounded border border-black/10 shrink-0" style={{ backgroundColor: o.hex }} />
              <span className="text-xs font-semibold truncate flex-1">{o.name}</span>
              <span dir="ltr" className="text-[9px] font-mono text-black/30 shrink-0">{o.hex}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Free color picker popover (SV area + hue slider + hex + OK) ---
const ColorPickerPopover = ({ value, onChange, onClose, align = 'left' }: { value: string; onChange: (hex: string) => void; onClose: () => void; align?: 'left' | 'right' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const svRef = useRef<HTMLDivElement>(null);
  const { h, s, v } = hexToHsv(value);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const setFromSV = (cx: number, cy: number) => {
    const el = svRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const ns = Math.min(1, Math.max(0, (cx - r.left) / r.width));
    const nv = 1 - Math.min(1, Math.max(0, (cy - r.top) / r.height));
    onChange(hsvToHex(h, ns, nv).toUpperCase());
  };
  const onSVDown = (e: React.PointerEvent) => {
    setFromSV(e.clientX, e.clientY);
    const move = (ev: PointerEvent) => setFromSV(ev.clientX, ev.clientY);
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return (
    <div ref={ref} onClick={(e) => e.stopPropagation()} className={`absolute z-[60] top-full mt-2 ${align === 'right' ? 'right-0' : 'left-0'} bg-white border border-black/10 rounded-xl shadow-2xl p-3 w-56`}>
      <div ref={svRef} onPointerDown={onSVDown} className="relative w-full h-32 rounded-lg cursor-crosshair mb-3 touch-none" style={{ backgroundColor: `hsl(${h},100%,50%)` }}>
        <div className="absolute inset-0 rounded-lg" style={{ background: 'linear-gradient(to right, #fff, rgba(255,255,255,0))' }} />
        <div className="absolute inset-0 rounded-lg" style={{ background: 'linear-gradient(to top, #000, rgba(0,0,0,0))' }} />
        <div className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%` }} />
      </div>
      {/* dir=ltr: inside the RTL layout a range input runs right-to-left, which would
          put the thumb on the mirror image of its own gradient. */}
      <input dir="ltr" type="range" min={0} max={360} value={Math.round(h)} onChange={(e) => onChange(hsvToHex(+e.target.value, s || 1, v || 1).toUpperCase())} className="w-full mb-3 h-3 rounded-full appearance-none cursor-pointer" style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }} />
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg border border-black/10 shrink-0" style={{ backgroundColor: value }} />
        <input dir="ltr" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="flex-1 min-w-0 bg-black/5 rounded-lg px-2 py-1.5 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500" />
        <button onClick={onClose} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 shrink-0">OK</button>
      </div>
    </div>
  );
};

const slug = (s: string) =>
  s.trim().toLowerCase().replace(/\.svg$/i, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'asset';

const DEFAULT_NAMES = ['logo', 'symbol', 'variation-1', 'variation-2', 'variation-3', 'variation-4'];
// Names the tool made up, which a name read from a document or a board may replace.
const AUTO_NAME = /^(Color|Brand|Custom|Palette) \d+$/;

const README = `BRAND LOGO EXPORT — color spaces / מרחבי צבע
================================================

Every asset folder holds one sub-folder per color space you asked for, with the
files for the color combinations you defined:

  <asset>/rgb/<asset>_<combination>.svg   vector, sRGB
  <asset>/rgb/<asset>_<combination>.pdf   vector, sRGB (DeviceRGB)
  <asset>/rgb/<asset>_<combination>.png   raster, transparent background, sRGB
  <asset>/rgb/<asset>_<combination>.jpg   raster, on the combination background, sRGB

  <asset>/cmyk/<asset>_<combination>.pdf  vector, true DeviceCMYK (give this to the printer)

  <asset>/pantone/<asset>_<combination>.pdf
                                          vector, every color that has a Pantone name is a
                                          real Separation plate; the rest stay DeviceCMYK

NOTES
- cmyk/ holds PDFs only, on purpose. A PDF is the only one of these formats that
  can actually carry CMYK, so nothing in that folder lies about its color space.
- pantone/ only appears if you asked for it. A spot color has to be named in the
  palette — a Pantone cannot be guessed from an RGB value. Open one of these PDFs in
  Illustrator and the plate shows up in the Separations preview under its own name.
- Everything in rgb/ is sRGB, including the JPEG. The JPEG is there so anyone with
  no design software can still see and use the combination.
- A combination on a WHITE background gives a CMYK PDF with no background at all —
  white is the paper, and the page is sized to the artwork.
- A combination on a COLORED background paints that color into the CMYK PDF, with a
  margin. Without it a white logo would be invisible on an empty page.
- Need the artwork with no background at all? Take the rgb/ SVG or the PNG.
- NO DUPLICATES: the SVG, the PDF and the transparent PNG know nothing about the
  background, so two combinations that differ only by background would produce
  identical files. They are written once, named after the first of those
  combinations. Only the JPEG, which has the background baked in, appears once per
  combination.

הערה: קובץ שאין בו התייחסות לרקע (SVG, PDF, PNG שקוף) נכתב פעם אחת בלבד. אם
הגדרת אותו לוגו על שני רקעים שונים, תקבלי JPEG לכל שילוב, אבל PNG אחד.

הערה: בכל תיקייה תקבלי קובץ נפרד לכל וריאציה צבעונית שהגדרת. תיקיית cmyk מכילה
רק PDF, כי הוא הפורמט היחיד כאן שבאמת יודע לשאת CMYK. כל מה שבתיקיית rgb הוא
sRGB, כולל ה-JPEG שנועד למי שאין לו תוכנה גרפית. שילוב על רקע לבן מיוצא ל-PDF
בלי רקע בכלל; שילוב על רקע צבעוני מקבל את הרקע גם ב-PDF, כדי שלוגו לבן לא ייעלם.
`;

// Fold what was read off a palette board into the palette. A swatch whose color is already
// there (from the logo, or read earlier) receives the board's exact values; the rest are added.
const mergeReadings = (prev: BrandColor[], readings: SwatchReading[], profile: CmykProfileKey) => {
  const next = prev.map((c) => ({ ...c }));
  const seen = new Set<string>();
  let updated = 0;
  let added = 0;
  for (const r of readings) {
    const hex = normalizeHex(r.hex);
    if (seen.has(hex)) continue;
    seen.add(hex);
    const rgb = hexToRgb(hex);
    // Exact match first, then a near miss: a logo exported with #1B1563 is the brand's #1B1564.
    let hit: BrandColor | undefined = next.find((c) => normalizeHex(c.rgbHex) === hex);
    if (!hit) {
      let bestD = 10;
      for (const c of next) {
        const d = getRgbDistance(hexToRgb(normalizeHex(c.rgbHex)), rgb);
        if (d <= bestD) { bestD = d; hit = c; }
      }
    }
    if (hit) {
      const moved = normalizeHex(hit.rgbHex) !== hex;
      hit.rgbHex = hex;
      if (hit.source === 'manual') hit.originalHex = hex;
      if (r.cmyk) { hit.cmyk = r.cmyk; hit.cmykExact = true; }
      else if (moved && !hit.cmykExact) hit.cmyk = calculateCMYK(rgb[0], rgb[1], rgb[2], profile);
      if (r.pantone) hit.pantone = r.pantone;
      if (r.name && (!hit.name || AUTO_NAME.test(hit.name))) hit.name = r.name;
      updated++;
    } else {
      next.push({
        id: `img-${hex}-${Math.random().toString(36).slice(2, 6)}`,
        originalHex: hex,
        name: r.name || `Palette ${next.length + 1}`,
        rgbHex: hex,
        cmyk: r.cmyk ?? calculateCMYK(rgb[0], rgb[1], rgb[2], profile),
        cmykExact: !!r.cmyk,
        pantone: r.pantone,
        source: 'image',
      });
      added++;
    }
  }
  return { next, updated, added };
};

const ocrStatus = (p: OcrProgress): string =>
  p.stage === 'engine' ? 'טוען מנוע OCR…' : p.stage === 'read' ? `קורא טקסט ${p.done + 1}/${p.total}…` : 'מחפש משבצות…';

// ================================================================
export default function App() {
  const [step, setStep] = useState(1);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [colors, setColors] = useState<BrandColor[]>([]);
  const [backgrounds, setBackgrounds] = useState<Background[]>([
    { id: 'bg-white', name: 'full-on-white', color: '#FFFFFF', logoColors: {} },
  ]);
  const [paletteFileName, setPaletteFileName] = useState<string | null>(null);
  const [paletteStatus, setPaletteStatus] = useState<string | null>(null);
  const [docFileName, setDocFileName] = useState<string | null>(null);
  const [docStatus, setDocStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [pickerColorId, setPickerColorId] = useState<string | null>(null);
  const [cmykProfile, setCmykProfile] = useState<CmykProfileKey>('swop');
  const [outputs, setOutputs] = useState<OutputTargets>({ rgb: true, cmyk: true, pantone: false });
  const fileRef = useRef<HTMLInputElement>(null);
  const paletteRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  // The palette as last rendered, for the board reader: it finishes long after the
  // closure that started it, and must fold its result into what is on screen by then.
  const colorsRef = useRef(colors);
  colorsRef.current = colors;

  const mergePalette = (svgStr: string) => {
    setColors((prev) => {
      const existing = new Set(prev.map((c) => c.originalHex.toUpperCase()));
      const additions: BrandColor[] = [];
      detectColors(svgStr).forEach((raw) => {
        const norm = normalizeHex(raw);
        if (existing.has(norm) || additions.some((a) => a.originalHex === norm)) return;
        const [r, g, b] = hexToRgb(norm);
        additions.push({
          id: `c-${norm}-${Math.random().toString(36).slice(2, 7)}`,
          originalHex: norm,
          name: `Color ${prev.length + additions.length + 1}`,
          rgbHex: norm,
          cmyk: calculateCMYK(r, g, b, cmykProfile),
          source: 'svg',
        });
      });
      return [...prev, ...additions];
    });
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from<File>(e.target.files || []).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = flattenSvgPaint(ev.target?.result as string);
        const liveText = findLiveText(content);
        setAssets((prev) => {
          const name = DEFAULT_NAMES[prev.length] || `variation-${prev.length}`;
          return [...prev, { id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name, fileName: file.name, svgContent: content, liveText: liveText.length ? liveText : undefined }];
        });
        mergePalette(content);
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  };

  // Guidelines document → exact, already-defined color values (hex + CMYK).
  const handleColorDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setDocFileName(file.name);
    setDocStatus('קורא…');
    try {
      const found = parseColorDocument(await readColorDocument(file), cmykProfile);
      if (found.length === 0) {
        setDocStatus('לא נמצאו ערכי צבע במסמך');
        return;
      }
      setColors((prev) => {
        const byHex = new Map(found.map((f) => [f.hex.toUpperCase(), f]));
        let updated = 0;

        // Colors already in the palette come from the logo itself — those are exactly the
        // ones that need the document's exact CMYK and Pantone. Skipping them (which is
        // what this used to do) left the logo's own colors without a spot name.
        const merged = prev.map((c) => {
          const f = byHex.get(normalizeHex(c.rgbHex));
          if (!f) return c;
          byHex.delete(normalizeHex(c.rgbHex));
          updated++;
          return {
            ...c,
            cmyk: f.cmyk,
            cmykExact: true,
            pantone: f.pantone ?? c.pantone,
            // Only replace a name the tool invented, never one the user typed.
            name: f.name && !AUTO_NAME.test(f.name) && AUTO_NAME.test(c.name) ? f.name : c.name,
          };
        });

        const additions = [...byHex.values()].map((f) => ({
          id: `doc-${f.hex}-${Math.random().toString(36).slice(2, 6)}`,
          originalHex: f.hex,
          name: f.name,
          rgbHex: f.hex,
          cmyk: f.cmyk,
          cmykExact: true,
          pantone: f.pantone,
          source: 'manual' as const,
        }));

        const parts = [];
        if (updated) parts.push(`${updated} צבעים קיימים עודכנו`);
        if (additions.length) parts.push(`${additions.length} צבעים נוספו`);
        setDocStatus(parts.length ? `${parts.join(' · ')} — עם ערכים מדויקים מהמסמך` : 'לא נמצאה התאמה לצבעים במסמך');
        return [...merged, ...additions];
      });
    } catch (err) {
      setDocStatus(`שגיאה בקריאת הקובץ: ${err}`);
    }
  };

  // Palette board image: swatches from the pixels, values from the text printed on them.
  // An image with no flat swatches (a photo, a gradient) falls back to pixel sampling.
  const handlePaletteImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPaletteFileName(file.name);
    setPaletteStatus('מחפש משבצות…');
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const readings = await readPaletteBoard(url, (p) => setPaletteStatus(ocrStatus(p)));
      if (readings.length === 0) {
        const found = await extractColorsFromImage(url, colorsRef.current, cmykProfile);
        setColors((prev) => {
          const have = new Set(prev.map((c) => c.originalHex.toUpperCase()));
          return [...prev, ...found.filter((c) => !have.has(c.originalHex.toUpperCase()))];
        });
        setPaletteStatus(found.length ? `לא זוהו משבצות, ${found.length} צבעים נדגמו מהפיקסלים` : 'לא נמצאו צבעים בתמונה');
        return;
      }
      const { next, updated, added } = mergeReadings(colorsRef.current, readings, cmykProfile);
      setColors(next);
      const read = readings.filter((r) => r.name || r.cmyk || r.pantone).length;
      const parts = [`${readings.length} משבצות זוהו`, read ? `${read} עם ערכים כתובים` : 'בלי ערכים כתובים'];
      if (updated) parts.push(`${updated} צבעים קיימים עודכנו`);
      if (added) parts.push(`${added} נוספו`);
      setPaletteStatus(parts.join(' · '));
    } catch (err) {
      setPaletteStatus(`שגיאה בקריאת התמונה: ${err}`);
    }
  };

  const updateAssetName = (id: string, name: string) => setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)));
  const removeAsset = (id: string) => setAssets((prev) => prev.filter((a) => a.id !== id));

  const updateColor = (id: string, field: keyof BrandColor, value: string) =>
    setColors((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c, [field]: value } as BrandColor;
        // For manual colors the "original" is just a reference — keep it in sync with the RGB value.
        if (c.source === 'manual' && field === 'rgbHex') next.originalHex = normalizeHex(value || c.originalHex);
        // Picking an RGB value re-derives the print value through the profile, the way
        // Illustrator converts an RGB color pasted into a CMYK document.
        if (field === 'rgbHex' && /^#?[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(value.trim())) {
          const [r, g, b] = hexToRgb(normalizeHex(value));
          next.cmyk = calculateCMYK(r, g, b, cmykProfile);
          next.cmykExact = false;
        }
        // Typing a CMYK value by hand means the user knows better than the profile.
        if (field === 'cmyk') next.cmykExact = true;
        return next;
      })
    );
  const removeColor = (id: string) => setColors((prev) => prev.filter((c) => c.id !== id));
  const addColor = () =>
    setColors((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        originalHex: '#000000',
        name: `Custom ${prev.length + 1}`,
        rgbHex: '#000000',
        cmyk: calculateCMYK(0, 0, 0, cmykProfile),
        source: 'manual',
      },
    ]);
  const recalcCmyk = (id: string) =>
    setColors((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        try { const [r, g, b] = hexToRgb(normalizeHex(c.rgbHex)); return { ...c, cmyk: calculateCMYK(r, g, b, cmykProfile), cmykExact: false }; } catch { return c; }
      })
    );

  // Switching print profile re-derives every value we calculated ourselves,
  // and leaves values that came from a document (or were typed) untouched.
  const changeCmykProfile = (profile: CmykProfileKey) => {
    setCmykProfile(profile);
    setColors((prev) =>
      prev.map((c) => {
        if (c.cmykExact) return c;
        try { const [r, g, b] = hexToRgb(normalizeHex(c.rgbHex)); return { ...c, cmyk: calculateCMYK(r, g, b, profile) }; } catch { return c; }
      })
    );
  };

  const addBackground = (color = '#000000', name = 'combination', logoColors: Record<string, string> = {}) =>
    setBackgrounds((prev) => [...prev, { id: `bg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, name, color, logoColors }]);
  const updateBackground = (id: string, field: 'name' | 'color', value: string) =>
    setBackgrounds((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  const removeBackground = (id: string) => setBackgrounds((prev) => prev.filter((b) => b.id !== id));
  // Override one logo color inside a combination.
  const setComboLogo = (id: string, key: string, hex: string) =>
    setBackgrounds((prev) => prev.map((b) => (b.id === id ? { ...b, logoColors: { ...b.logoColors, [key.toUpperCase()]: hex } } : b)));
  // Set all logo colors at once: a hex flattens the whole logo; null clears overrides (= full color).
  const setComboAllLogo = (id: string, hex: string | null) =>
    setBackgrounds((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        if (hex === null) return { ...b, logoColors: {} };
        const m: Record<string, string> = {};
        svgColorKeys.forEach((k) => (m[k] = hex));
        return { ...b, logoColors: m };
      })
    );

  const svgColorKeys = colors.filter((c) => c.source === 'svg').map((c) => c.originalHex.toUpperCase());

  const previewMapping = () => {
    const m: Record<string, string> = {};
    colors.filter((c) => c.source === 'svg').forEach((c) => (m[c.originalHex.toUpperCase()] = c.rgbHex));
    return m;
  };

  const paletteRgbByKey: Record<string, string> = {};
  colors.filter((c) => c.source === 'svg').forEach((c) => (paletteRgbByKey[c.originalHex.toUpperCase()] = c.rgbHex));

  // All palette colors as dropdown options (for the combinations screen).
  const paletteOptions = colors.map((c) => ({ hex: c.rgbHex, name: c.name }));

  // Effective recolor mapping for a combination: each logo color = its override, else its palette (RGB) value.
  const effectiveLogoMapping = (combo: Background) => {
    const m: Record<string, string> = {};
    svgColorKeys.forEach((k) => (m[k] = combo.logoColors[k] ?? paletteRgbByKey[k]));
    return m;
  };

  // --- Export ---
  const handleExport = async () => {
    if (assets.length === 0) return;
    setIsExporting(true);
    setProgress(0);
    setErrors([]);
    const errs: string[] = [];
    try {
      const zip = new JSZip();
      zip.file('README.txt', README);

      // Print value for any hex a combination can use: a palette entry keeps its own
      // CMYK (which may have come from a guidelines document), anything else — a free
      // custom color, absolute white/black — is converted through the chosen profile.
      const cmykForHex = (hex: string): string => {
        const norm = normalizeHex(hex);
        const hit = colors.find((c) => normalizeHex(c.rgbHex) === norm);
        if (hit) return hit.cmyk;
        const [r, g, b] = hexToRgb(norm);
        return calculateCMYK(r, g, b, cmykProfile);
      };

      const bgs = backgrounds.length > 0 ? backgrounds : [{ id: 'w', name: 'full-on-white', color: '#FFFFFF', logoColors: {} }];

      const dedupe = () => {
        const used = new Set<string>();
        return (name: string) => {
          const base = slug(name);
          let n = base, i = 2;
          while (used.has(n)) n = `${base}-${i++}`;
          used.add(n);
          return n;
        };
      };

      const folderFor = dedupe();
      const comboNames = new Map<string, string>();
      const comboSlug = dedupe();
      bgs.forEach((bg) => comboNames.set(bg.id, comboSlug(bg.name)));

      const total = assets.length * bgs.length;
      let done = 0;

      // Files whose content does not depend on the background get written once. The key
      // is what actually determines the bytes, so identical output can never be produced
      // twice under two names. Reset per asset.
      let writtenOnce = new Map<string, string>();
      const once = (key: string, variant: string) => {
        const owner = writtenOnce.get(key);
        if (owner) return false;
        writtenOnce.set(key, variant);
        return true;
      };

      for (const asset of assets) {
        writtenOnce = new Map();
        const folderName = folderFor(asset.name);
        const folder = zip.folder(folderName)!;
        const rgb = outputs.rgb ? folder.folder('rgb')! : null;
        const cmyk = outputs.cmyk ? folder.folder('cmyk')! : null;
        const pantone = outputs.pantone ? folder.folder('pantone')! : null;

        // Every color variation gets the full set of deliverables, in both color spaces.
        for (const bg of bgs) {
          const variant = `${folderName}_${comboNames.get(bg.id)}`;

          // The logo colors this combination actually asks for.
          const rgbMapping = effectiveLogoMapping(bg);

          // Same artwork, but each color replaced by the RGB approximation of its CMYK,
          // plus the exact 4-channel values the PDF writer needs.
          const cmykMapping: Record<string, string> = {};
          const cmykByHex: Record<string, [number, number, number, number]> = {};
          Object.entries(rgbMapping).forEach(([key, target]) => {
            const cmyk = cmykForHex(target);
            const approx = normalizeHex(cmykToRgbHex(cmyk));
            cmykMapping[key] = approx;
            cmykByHex[approx] = parseCmyk(cmyk);
          });

          const rgbSvg = recolorSvg(asset.svgContent, rgbMapping);
          const cmykSvg = recolorSvg(asset.svgContent, cmykMapping);

          // RGB: svg + vector pdf + transparent png, plus a JPEG on the combination
          // background for anyone with no design software. Every file here is sRGB.
          // The transparent three know nothing about the background, so two combinations
          // that only differ by background would produce byte-identical files — they are
          // written once, under the name of the first combination that asked for them.
          if (rgb) {
            if (once(`rgb:${rgbSvg}`, variant)) {
              try { rgb.file(`${variant}.svg`, rgbSvg); } catch { errs.push(`${variant} rgb svg`); }
              try { rgb.file(`${variant}.pdf`, await generateVectorPdf(rgbSvg)); } catch { errs.push(`${variant} rgb pdf`); }
              try { rgb.file(`${variant}.png`, await svgToRaster(rgbSvg, { type: 'png' })); } catch { errs.push(`${variant} rgb png`); }
            }
            // The JPEG does carry the background, so it stays one per combination.
            try {
              rgb.file(`${variant}.jpg`, await svgToRaster(rgbSvg, { type: 'jpeg', bg: normalizeHex(bg.color), marginRatio: MARGIN_RATIO }));
            } catch { errs.push(`${variant} rgb jpg`); }
          }

          // CMYK: the vector pdf only — it is the one file that really carries CMYK.
          // A colored combination background is painted into it so a white logo does
          // not land invisible on an empty page; a white background is the paper, so
          // the page stays background-free and sized to the artwork.
          const bgCmyk = cmykForHex(bg.color);
          const pdfBg = normalizeHex(bg.color) === '#FFFFFF'
            ? undefined
            : { hex: normalizeHex(cmykToRgbHex(bgCmyk)), cmyk: parseCmyk(bgCmyk), marginRatio: MARGIN_RATIO };
          // Two white-background combinations with the same logo colors also collapse:
          // with no plate painted, the pages are identical.
          const printKey = `${cmykSvg}|${pdfBg ? pdfBg.hex : 'none'}`;
          if (cmyk && once(`cmyk:${printKey}`, variant)) {
            try { cmyk.file(`${variant}.pdf`, await generateVectorPdf(cmykSvg, cmykByHex, pdfBg)); } catch { errs.push(`${variant} cmyk pdf`); }
          }

          // Pantone: the same CMYK pdf, except every color that carries a spot name is
          // written as a Separation plate instead of a CMYK build. Colors with no
          // Pantone stay CMYK in the very same file, which is how a real spot job runs.
          if (pantone) {
            const spotByHex: Record<string, SpotColor> = {};
            Object.entries(rgbMapping).forEach(([, target]) => {
              const hit = colors.find((c) => normalizeHex(c.rgbHex) === normalizeHex(target));
              if (!hit?.pantone?.trim()) return;
              spotByHex[normalizeHex(cmykToRgbHex(cmykForHex(target)))] = {
                name: hit.pantone.trim(),
                cmyk: parseCmyk(cmykForHex(target)),
              };
            });
            if (once(`pantone:${printKey}|${JSON.stringify(spotByHex)}`, variant)) {
              try { pantone.file(`${variant}.pdf`, await generateVectorPdf(cmykSvg, cmykByHex, pdfBg, spotByHex)); } catch (e) { errs.push(`${variant} pantone pdf: ${e}`); }
            }
          }

          done++;
          setProgress(Math.round((done / total) * 100));
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'brand_logo_package.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setErrors(errs);
    } catch (e) {
      setErrors([`Export failed: ${e}`]);
    } finally {
      setIsExporting(false);
    }
  };

  const stepsMeta = [
    { n: 1, label: 'Assets / נכסים' },
    { n: 2, label: 'Palette / פלטה' },
    { n: 3, label: 'Combinations / שילובים' },
    { n: 4, label: 'Export / ייצוא' },
  ];
  // Live text blocks the whole flow, not just the export: every later screen is about
  // colors and files that would be wrong anyway.
  const textAssets = assets.filter((a) => a.liveText?.length);
  const gate = (n: number) => (n >= 2 && (assets.length === 0 || textAssets.length > 0));

  return (
    <div dir="rtl" className="min-h-screen bg-[#f4f6f4] text-black/90">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 grid place-items-center text-white font-black">L</div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">Brand Logo Export Pro</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 mt-1">Identity tool · כלי זהות מותג</p>
            </div>
          </div>
          <nav className="flex items-center gap-1 text-sm flex-wrap justify-end">
            {stepsMeta.map((s) => (
              <button
                key={s.n}
                onClick={() => setStep(s.n)}
                disabled={gate(s.n)}
                className={`px-3 py-2 rounded-xl font-semibold transition-all disabled:opacity-30 ${
                  step === s.n ? 'bg-emerald-500 text-white shadow-sm' : 'text-black/50 hover:bg-black/5'
                }`}
              >
                {s.n}. {s.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* STEP 1 — ASSETS */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">1. Upload logo & variations / העלאת לוגו ווריאציות</h2>
              <p className="text-black/50 mt-1">העלה SVG של הלוגו, וגם וריאציות אופציונליות (סמל בלבד, גרסת גובה ועוד). כל אחד יקבל תיקייה משלו.</p>
            </div>
            <input ref={fileRef} type="file" accept=".svg,image/svg+xml" multiple className="hidden" onChange={handleUpload} />

            {/* The big drop zone is only the empty state — once something is uploaded the
                grid takes over and the "+" tile is what adds more. */}
            {assets.length === 0 && (
              <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-black/10 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition-all bg-white">
                <Upload size={36} className="text-black/30 mb-3" />
                <p className="font-semibold">Click to upload SVG(s) / לחץ להעלאת SVG</p>
                <p className="text-xs text-black/40 mt-2">אפשר לבחור כמה קבצים בבת אחת · SVG בלבד</p>
              </div>
            )}

            {textAssets.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-bold text-red-800">טקסט חי בקובץ — צריך להמיר לאאוטליין</div>
                    <p className="text-sm text-red-700/90 mt-1 leading-relaxed">
                      {textAssets.length === 1 ? 'קובץ אחד מכיל' : `${textAssets.length} קבצים מכילים`} טקסט שלא הומר לצורות.
                      הצורה של טקסט כזה תלויה בפונט שמותקן אצל מי שפותח את הקובץ, ובייצוא ל-PDF הוא יוחלף ב-Helvetica.
                      גם צבע של טקסט חי לא ייכנס לפלטות הפנטון.
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {textAssets.map((a) => (
                        <li key={a.id} className="text-xs text-red-800 bg-white/70 rounded-lg px-3 py-2">
                          <span dir="ltr" className="font-bold">{a.fileName}</span>
                          <span className="text-red-700/70"> · {a.liveText!.map((t) => `"${t}"`).join(' · ')}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-red-700/80 mt-3">
                      באילוסטרייטור: בחרי הכל ואז <b dir="ltr">Type · Create Outlines</b> (⇧⌘O), שמרי מחדש כ-SVG והעלי שוב.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {assets.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map((a, idx) => (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${a.liveText?.length ? 'border-red-300 ring-1 ring-red-200' : 'border-black/5'}`}>
                    <div className="h-36 bg-[repeating-conic-gradient(#e9ece9_0%_25%,#f4f6f4_0%_50%)] bg-[length:20px_20px]">
                      <LogoPreview svgContent={a.svgContent} mapping={previewMapping()} />
                    </div>
                    {a.liveText?.length ? (
                      <div className="bg-red-50 border-t border-red-200 px-4 py-2 flex items-center gap-2 text-[11px] font-bold text-red-700">
                        <AlertCircle size={13} className="shrink-0" /> טקסט חי — לא ניתן להמשיך
                      </div>
                    ) : null}
                    <div className="p-4 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-black/30 shrink-0">#{idx + 1}</span>
                      <input dir="ltr" value={a.name} onChange={(e) => updateAssetName(a.id, e.target.value)} className="flex-1 min-w-0 bg-black/5 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none" />
                      <button onClick={() => removeAsset(a.id)} className="p-2 text-black/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                    <p className="px-4 pb-3 -mt-1 text-[10px] text-black/30 truncate">{a.fileName}</p>
                  </motion.div>
                ))}

                <button
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-black/15 rounded-2xl min-h-[220px] flex flex-col items-center justify-center gap-2 px-5 text-black/40 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/40 transition-all"
                >
                  <Plus size={26} />
                  <span className="font-bold text-sm">הוספת וריאציה / Add variation</span>
                  <span className="text-[11px] text-black/35 leading-snug text-center">סמל בלבד, גרסת גובה, גרסה מקוצרת…<br />כל קובץ יקבל תיקייה משלו</span>
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block">Output formats / פורמטים לייצוא</label>
              <p className="text-black/50 text-sm mb-4">בחרי אילו מרחבי צבע ייכנסו ל-ZIP. כל אחד מקבל תיקייה משלו בתוך כל נכס.</p>
              <div className="grid sm:grid-cols-3 gap-3">
                {OUTPUT_OPTIONS.map((o) => {
                  const on = outputs[o.key];
                  return (
                    <button
                      key={o.key}
                      onClick={() => setOutputs((p) => ({ ...p, [o.key]: !p[o.key] }))}
                      className={`text-right rounded-xl border p-3 transition-all ${on ? 'border-emerald-500 bg-emerald-50/60' : 'border-black/10 hover:border-black/25'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-4 h-4 rounded shrink-0 border flex items-center justify-center ${on ? 'bg-emerald-500 border-emerald-500' : 'border-black/25'}`}>
                          {on && <Check size={11} className="text-white" strokeWidth={3} />}
                        </span>
                        <span className="font-bold text-sm">{o.label}</span>
                      </div>
                      <span className="text-[11px] text-black/45 leading-snug block">{o.hint}</span>
                    </button>
                  );
                })}
              </div>
              {outputs.pantone && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                  לייצוא פנטון צריך למלא שם פנטון לצבעים במסך הפלטה. צבע בלי שם פנטון יישאר CMYK בתוך אותו קובץ.
                </p>
              )}
              {!outputs.rgb && !outputs.cmyk && !outputs.pantone && (
                <p className="text-[11px] text-red-600 mt-3">צריך לבחור לפחות פורמט אחד.</p>
              )}
            </div>
            {assets.length > 0 && (
              <div className="flex justify-end">
                <button onClick={() => setStep(2)} disabled={textAssets.length > 0} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed">Continue to palette / המשך לפלטה ←</button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — PALETTE */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">2. Define colors / הגדרת צבעים</h2>
              <p className="text-black/50 mt-1">פלטה גלובלית לכל הנכסים. לכל צבע: ערך <b>RGB</b> למסך וערך <b>CMYK</b> לדפוס. אפשר גם להעלות תמונת פלטה כדי לשאוב ממנה צבעי מותג.</p>
            </div>

            {/* Print profile — decides how RGB is converted to CMYK */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="min-w-0">
                <div className="font-bold text-sm">פרופיל דפוס</div>
                <div className="text-xs text-black/45 mt-0.5">לפיו ה-RGB מומר ל-CMYK, בדיוק כמו באילוסטרייטור. כדאי שיהיה זהה למה שמוגדר אצלך ב-Color Settings.</div>
              </div>
              <select
                value={cmykProfile}
                onChange={(e) => changeCmykProfile(e.target.value as CmykProfileKey)}
                dir="ltr"
                className="bg-black/5 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500 ms-auto"
              >
                {CMYK_PROFILES.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Optional sources: guidelines document + palette image */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* 1. Palette image — sampled colors (first child = right side in RTL) */}
              <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center shrink-0"><ImageIcon size={18} /></div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm">תמונת פלטה <span className="text-black/30 font-normal">(רשות)</span></div>
                    <div className="text-xs text-black/45 mt-0.5">לוח צבעים של המותג. המשבצות <b>נדגמות מהפיקסלים</b>, והערכים הכתובים עליהן (שם, HEX, CMYK, פנטון) <b>נקראים מהתמונה</b> בתוך הדפדפן. כדאי לעבור על התוצאה.</div>
                    <div className="text-[10px] text-black/30 mt-1">JPG · PNG · WebP</div>
                  </div>
                </div>
                <button onClick={() => paletteRef.current?.click()} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"><Upload size={14} /> העלאת תמונה</button>
                <input ref={paletteRef} type="file" accept="image/*" className="hidden" onChange={handlePaletteImage} />
                {paletteFileName && <div className="text-xs text-black/50 truncate"><b>{paletteFileName}</b>{paletteStatus ? ` · ${paletteStatus}` : ''}</div>}
              </div>

              {/* 2. Guidelines document — exact defined values */}
              <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 grid place-items-center shrink-0"><FileText size={18} /></div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm">מסמך הגדרות צבע <span className="text-black/30 font-normal">(רשות)</span></div>
                    <div className="text-xs text-black/45 mt-0.5">מסמך שכבר מכיל <b>ערכים כתובים</b> — HEX ו-CMYK. הערכים נלקחים מהמסמך במדויק, בלי ניחוש.</div>
                    <div className="text-[10px] text-black/30 mt-1">PDF · TXT · CSV</div>
                  </div>
                </div>
                <button onClick={() => docRef.current?.click()} className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"><Upload size={14} /> העלאת מסמך</button>
                <input ref={docRef} type="file" accept=".pdf,.txt,.csv,application/pdf,text/plain,text/csv" className="hidden" onChange={handleColorDocument} />
                {docFileName && <div className="text-xs text-black/50 truncate"><b>{docFileName}</b>{docStatus ? ` — ${docStatus}` : ''}</div>}
              </div>
            </div>

            {colors.length === 0 ? (
              <p className="text-black/40 italic">No colors detected yet.</p>
            ) : (
              <div className="space-y-3">
                {colors.map((c) => {
                  const deletable = c.source !== 'svg';
                  return (
                    <div key={c.id} className="bg-white rounded-2xl border border-black/5 shadow-sm p-3 flex flex-col sm:flex-row items-stretch gap-3">
                      {/* Big clickable swatch — ~half the row — opens the color picker */}
                      <div className="relative sm:w-1/2 shrink-0">
                        <button
                          onClick={() => setPickerColorId(pickerColorId === c.id ? null : c.id)}
                          className="w-full h-24 sm:h-full min-h-[6rem] rounded-xl border border-black/10 shadow-inner cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all"
                          style={{ backgroundColor: c.rgbHex }}
                          title="Click to pick a color / לחצי לבחירת צבע"
                        />
                        {pickerColorId === c.id && (
                          <ColorPickerPopover value={c.rgbHex} onChange={(hex) => updateColor(c.id, 'rgbHex', hex)} onClose={() => setPickerColorId(null)} />
                        )}
                      </div>

                      {/* Right half: name + values + delete */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2 py-1">
                        <div className="flex items-center gap-2">
                          <input value={c.name} onChange={(e) => updateColor(c.id, 'name', e.target.value)} className="flex-1 min-w-0 bg-black/5 rounded-lg px-2.5 py-1.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
                          {deletable ? (
                            <button onClick={() => removeColor(c.id)} className="shrink-0 p-1.5 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-all" title="Remove color / מחק צבע"><Trash2 size={14} /></button>
                          ) : (
                            <span className="shrink-0 p-1.5 text-black/25" title="צבע מהלוגו — לא ניתן למחוק / from the logo"><Lock size={13} /></span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 mb-0.5 block">RGB hex</label>
                            <input dir="ltr" value={c.rgbHex} onChange={(e) => updateColor(c.id, 'rgbHex', e.target.value)} className="w-full bg-black/5 rounded-lg px-2 py-1.5 text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none" />
                          </div>
                          <div className="flex-1">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-blue-600 mb-0.5 flex items-center gap-1">
                              CMYK
                              <button onClick={() => recalcCmyk(c.id)} title="Recalculate from RGB" className="text-black/30 hover:text-emerald-600"><RefreshCw size={10} /></button>
                            </label>
                            <input dir="ltr" value={c.cmyk} onChange={(e) => updateColor(c.id, 'cmyk', e.target.value)} className="w-full bg-black/5 rounded-lg px-2 py-1.5 text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-amber-600 mb-0.5 block">
                            Pantone <span className="text-black/30 normal-case tracking-normal font-semibold">· רק אם מוגדר במיתוג</span>
                          </label>
                          <input
                            dir="ltr"
                            value={c.pantone || ''}
                            placeholder="PANTONE 286 C"
                            onChange={(e) => updateColor(c.id, 'pantone', e.target.value)}
                            className="w-full bg-black/5 rounded-lg px-2 py-1.5 text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none placeholder:text-black/20"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button onClick={addColor} className="w-full border-2 border-dashed border-black/15 rounded-2xl py-4 flex items-center justify-center gap-2 text-black/40 hover:border-emerald-400 hover:text-emerald-600 transition-all font-semibold text-sm">
              <Plus size={18} /> Add color manually / הוסף צבע ידני
            </button>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl font-bold text-black/50 hover:bg-black/5 transition-all">→ Back / חזרה</button>
              <button onClick={() => setStep(3)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">Continue to combinations / המשך לשילובים ←</button>
            </div>
          </div>
        )}

        {/* STEP 3 — BACKGROUNDS */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">3. Logo × background combinations / שילובי לוגו ורקע</h2>
              <p className="text-black/50 mt-1">כל שילוב בוחר <b>צבע לוגו</b> ו-<b>צבע רקע</b>, ומייצר קבצים לכל שילוב. הרקע נצרב ל-JPEG וגם ל-PDF של ה-CMYK, כדי שלוגו לבן לא ייעלם. ה-PNG וה-SVG תמיד נשארים שקופים.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {backgrounds.map((b) => {
                const svgColors = colors.filter((c) => c.source === 'svg');
                const isFull = Object.keys(b.logoColors).length === 0;
                return (
                  <div key={b.id} className="bg-white rounded-2xl border border-black/5 shadow-sm">
                    {/* Every asset gets its own row, because one combination recolors all of
                        them together — the mapping below is per combination, never per asset.
                        Rows shrink as assets pile up so a card stays a card. */}
                    <div className="rounded-t-2xl overflow-hidden flex flex-col" style={{ backgroundColor: b.color }}>
                      {assets.map((a) => (
                        <div key={a.id} className="relative" style={{ height: assets.length > 2 ? 80 : assets.length === 2 ? 96 : 128 }}>
                          <LogoPreview svgContent={a.svgContent} mapping={effectiveLogoMapping(b)} bg={b.color} />
                          {assets.length > 1 && (
                            <span
                              dir="ltr"
                              className="absolute top-1 left-2 text-[9px] font-mono opacity-40 pointer-events-none"
                              style={{ color: onColor(b.color) }}
                            >
                              {slug(a.name)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <input dir="ltr" value={b.name} onChange={(e) => updateBackground(b.id, 'name', e.target.value)} className="flex-1 min-w-0 bg-black/5 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none" />
                        <button onClick={() => removeBackground(b.id)} className="p-2 text-black/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block">Logo colors / צבעי הלוגו</label>
                        {/* Presets */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <button onClick={() => setComboAllLogo(b.id, null)} className={`px-2 h-6 rounded-md text-[9px] font-bold border transition-all ${isFull ? 'ring-2 ring-emerald-500 border-emerald-500 text-emerald-700' : 'border-black/10 text-black/40 hover:text-black/70'}`}>FULL</button>
                          <button onClick={() => setComboAllLogo(b.id, '#FFFFFF')} className="px-2 h-6 rounded-md text-[9px] font-bold border border-black/15 text-black/50 hover:bg-black/5" title="All white / הכל לבן">All ⬜</button>
                          <button onClick={() => setComboAllLogo(b.id, '#000000')} className="px-2 h-6 rounded-md text-[9px] font-bold border border-black/15 text-black/50 hover:bg-black/5" title="All black / הכל שחור">All ⬛</button>
                        </div>
                        {/* Per-color dropdowns */}
                        <div className="space-y-1.5">
                          {svgColors.map((c) => {
                            const key = c.originalHex.toUpperCase();
                            const eff = b.logoColors[key] ?? c.rgbHex;
                            return (
                              <div key={c.id} className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded border border-black/10 shrink-0" style={{ backgroundColor: c.rgbHex }} title={`original: ${c.name}`} />
                                <span className="text-black/30 text-xs shrink-0">←</span>
                                <div className="flex-1 min-w-0">
                                  <PaletteDropdown value={eff} onChange={(hex) => setComboLogo(b.id, key, hex)} options={paletteOptions} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1 block">Background / רקע</label>
                        <PaletteDropdown value={b.color} onChange={(hex) => updateBackground(b.id, 'color', hex)} options={paletteOptions} />
                      </div>
                    </div>
                  </div>
                );
              })}
              <button onClick={() => addBackground()} className="border-2 border-dashed border-black/15 rounded-2xl flex flex-col items-center justify-center gap-2 text-black/40 hover:border-emerald-400 hover:text-emerald-600 transition-all min-h-[180px]">
                <Plus size={24} /> <span className="font-semibold text-sm">Add combination / הוסף שילוב</span>
              </button>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-6 py-3 rounded-xl font-bold text-black/50 hover:bg-black/5 transition-all">→ Back / חזרה</button>
              <button onClick={() => setStep(4)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">Continue to export / המשך לייצוא ←</button>
            </div>
          </div>
        )}

        {/* STEP 4 — EXPORT */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">4. Export / ייצוא</h2>
              <p className="text-black/50 mt-1">תצוגה מקדימה של כל מה שייכנס ל-ZIP. קבצים שאין בהם רקע (svg · pdf · png שקוף) נכתבים פעם אחת גם אם כמה שילובים חולקים את אותם צבעי לוגו.</p>
            </div>

            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-6">
              {assets.map((a) => (
                <div key={a.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <span dir="ltr" className="font-mono text-sm font-bold text-emerald-700">{slug(a.name)}/</span>
                    <span className="text-xs text-black/30">[ {[outputs.rgb && 'rgb (svg·pdf·png·jpg)', outputs.cmyk && 'cmyk (pdf)', outputs.pantone && 'pantone (pdf)'].filter(Boolean).join(' + ')} ]</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {/* RGB full-color transparent */}
                    <div className="w-28">
                      <div className="h-20 rounded-xl border border-black/10 overflow-hidden bg-[repeating-conic-gradient(#e9ece9_0%_25%,#fff_0%_50%)] bg-[length:14px_14px]">
                        <LogoPreview svgContent={a.svgContent} mapping={previewMapping()} />
                      </div>
                      <div className="text-[9px] text-center mt-1 text-black/40 truncate">rgb · transparent</div>
                    </div>
                    {/* One thumbnail per combination */}
                    {backgrounds.map((b) => (
                      <div key={b.id} className="w-28">
                        <div className="h-20 rounded-xl border border-black/10 overflow-hidden" style={{ backgroundColor: b.color }}>
                          <LogoPreview svgContent={a.svgContent} mapping={effectiveLogoMapping(b)} bg={b.color} />
                        </div>
                        <div dir="ltr" className="text-[9px] text-center mt-1 text-black/40 truncate">{slug(b.name)}.jpg</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-xs text-black/40 pt-2 border-t border-black/5">{assets.length} נכסים · {colors.length} צבעים בפלטה · {backgrounds.length} שילובים · CMYK אמיתי ב-PDF.</p>
            </div>
            {isExporting && (
              <div className="bg-white rounded-2xl border border-black/5 p-6">
                <div className="flex justify-between text-sm font-semibold mb-2"><span>Generating… / מייצא…</span><span>{progress}%</span></div>
                <div className="h-2 bg-black/5 rounded-full overflow-hidden"><motion.div className="h-full bg-emerald-500" animate={{ width: `${progress}%` }} /></div>
              </div>
            )}
            {errors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 flex gap-2"><AlertCircle size={18} className="shrink-0 mt-0.5" /><div>Some files were skipped: {errors.join(', ')}</div></div>
            )}
            <div className="flex justify-between items-center">
              <button onClick={() => setStep(3)} className="px-6 py-3 rounded-xl font-bold text-black/50 hover:bg-black/5 transition-all">→ Back / חזרה</button>
              <button onClick={handleExport} disabled={isExporting || assets.length === 0 || !(outputs.rgb || outputs.cmyk || outputs.pantone)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50">
                {isExporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                {isExporting ? 'Exporting…' : 'Export ZIP / ייצוא'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
