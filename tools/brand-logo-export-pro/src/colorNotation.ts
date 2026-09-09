/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Every reader of brand values ends up here: the guidelines document (PDF / TXT / CSV),
// the OCR pass over a palette board, and the flat fallback. Documents write the same value
// a dozen ways, so each reader accepts all of them:
//
//   #1B1564                HEX: #1B1564            HEX 1B1564
//   R=27 G=21 B=100        R:27 G:21 B:100         RGB: 27, 21, 100        RGB 27/21/100
//   C=100 M=96 Y=30 K=20   C:100 M:96 Y:30 K:20    CMYK: 100, 96, 30, 20   CMYK 100/96/30/20
//   PANTONE 2756 C         PANTONE: 2756 C         PMS 2756C               PANTONE Cool Gray 9 C

export type Rgb = [number, number, number];

const N = '(\\d{1,3})';
// Between two numbers of one value: "100, 96" · "100 / 96" · "100 96" · "100%, 96%".
const SEP = '\\s*%?\\s*[,;/|]?\\s*';
const END = '(?![0-9A-Za-z])';

const HEX = /(?:#|\bHEX\s*[:=]?\s*#?)\s*([0-9A-Fa-f]{6})(?![0-9A-Za-z])/i;
// Six characters after "#" or "HEX", whatever they are: OCR output, which the caller checks
// against the pixels and repairs (O for 0, S for 5, A for 4 and so on).
const HEX_LOOSE = /(?:#|\bHEX\s*[:=]?\s*#?)\s*([0-9A-Za-z]{6})(?![0-9A-Za-z])/i;
const RGB_LABELED = /\bR\s*[=:]\s*(\d{1,3})\s*,?\s*G\s*[=:]\s*(\d{1,3})\s*,?\s*B\s*[=:]\s*(\d{1,3})/i;
const RGB_TRIPLE = new RegExp(`\\bRGB\\s*[:=]?\\s*\\(?\\s*${N}${SEP}${N}${SEP}${N}${END}`, 'i');
const CMYK_LABELED = /\bC\s*[=:]\s*(\d{1,3})\s*%?\s*,?\s*M\s*[=:]\s*(\d{1,3})\s*%?\s*,?\s*Y\s*[=:]\s*(\d{1,3})\s*%?\s*,?\s*K\s*[=:]\s*(\d{1,3})/i;
const CMYK_QUAD = new RegExp(`\\bCMYK\\s*[:=]?\\s*\\(?\\s*${N}${SEP}${N}${SEP}${N}${SEP}${N}${END}`, 'i');
const PANTONE_NUMBER = /\b(?:PANTONE|PMS)\s*[:=]?\s*(?:P\s*)?(\d{3,4})\s*-?\s*(C|U|M|CP|UP|TCX|TPX|XGC)?(?![0-9A-Za-z])/i;
const PANTONE_NAMED = /\b(?:PANTONE|PMS)\s*[:=]?\s*([A-Za-z]{2,}(?:\s+[A-Za-z]+){0,3}(?:\s+\d{1,3})?)\s+(C|U)(?![0-9A-Za-z])/i;

const all = (re: RegExp, text: string): RegExpMatchArray[] => [...text.matchAll(new RegExp(re.source, re.flags + 'g'))];
const inRange = (m: RegExpMatchArray, count: number, max: number): boolean => {
  for (let i = 1; i <= count; i++) if (+m[i] > max) return false;
  return true;
};
const triple = (m: RegExpMatchArray): Rgb => [+m[1], +m[2], +m[3]];
const quad = (m: RegExpMatchArray): string => `C:${+m[1]} M:${+m[2]} Y:${+m[3]} K:${+m[4]}`;

export const readHex = (text: string, loose = false): string | null => {
  const m = text.match(HEX) || (loose ? text.match(HEX_LOOSE) : null);
  return m ? '#' + m[1].toUpperCase() : null;
};
export const readAllHex = (text: string): string[] => all(HEX, text).map((m) => '#' + m[1].toUpperCase());

export const readRgb = (text: string): Rgb | null => {
  const m = text.match(RGB_LABELED) || text.match(RGB_TRIPLE);
  return m && inRange(m, 3, 255) ? triple(m) : null;
};
export const readAllRgb = (text: string): Rgb[] =>
  [...all(RGB_LABELED, text), ...all(RGB_TRIPLE, text)].filter((m) => inRange(m, 3, 255)).map(triple);

// "C:x M:x Y:x K:x", the form the palette stores.
export const readCmyk = (text: string): string | null => {
  const m = text.match(CMYK_LABELED) || text.match(CMYK_QUAD);
  return m && inRange(m, 4, 100) ? quad(m) : null;
};
export const readAllCmyk = (text: string): string[] =>
  [...all(CMYK_LABELED, text), ...all(CMYK_QUAD, text)].filter((m) => inRange(m, 4, 100)).map(quad);

// "PANTONE 2756 C" / "PANTONE Cool Gray 9 C", whatever the document wrote.
export const readPantone = (text: string): string | null => {
  const n = text.match(PANTONE_NUMBER);
  if (n) return `PANTONE ${n[1]}${n[2] ? ' ' + n[2].toUpperCase() : ''}`;
  const w = text.match(PANTONE_NAMED);
  if (w) return `PANTONE ${w[1].replace(/\s+/g, ' ')} ${w[2].toUpperCase()}`;
  return null;
};

// The swatch's name: the first line that is a plain label rather than a value.
const VALUE_WORDS = /\b(HEX|RGB|CMYK|PANTONE|PMS|LAB|HSB|HSL|HSV|RAL|NCS|WEB|PRINT|SCREEN)\b/i;
export const readName = (text: string): string | null => {
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (!line || line.length > 40) continue;
    if (VALUE_WORDS.test(line) || /[#:=]/.test(line) || /\d{3}/.test(line)) continue;
    if ((line.match(/[A-Za-z\u0590-\u05FF]/g) || []).length < 2) continue;
    return line;
  }
  return null;
};

// OCR reads a digit as a look-alike letter far more often than the reverse. Inside a
// value (after "RGB", "CMYK", "PANTONE" or "HEX") such letters are digits. A Pantone can
// be a name ("Cool Gray 9 C"), so only its tokens that already carry a digit are touched.
const DIGITS: Record<string, string> = { O: '0', o: '0', Q: '0', D: '0', I: '1', l: '1', '|': '1', S: '5', s: '5', Z: '2', z: '2', B: '8', G: '6' };
const HEX_DIGITS: Record<string, string> = { O: '0', o: '0', Q: '0', I: '1', l: '1', '|': '1' };
export const repairOcrDigits = (text: string): string =>
  text
    .split('\n')
    .map((line) => {
      const m = line.match(/^(.*?\b(HEX|RGB|CMYK|PANTONE|PMS)\b\s*[:=]?\s*)(.*)$/i);
      if (!m) return line;
      const kind = m[2].toUpperCase();
      const table = kind === 'HEX' ? HEX_DIGITS : DIGITS;
      const fix = (token: string) => token.replace(/[A-Za-z|]/g, (ch) => table[ch] ?? ch);
      const value = kind === 'PANTONE' || kind === 'PMS'
        ? m[3].replace(/[A-Za-z0-9|]+/g, (token) => (/\d/.test(token) ? fix(token) : token))
        : fix(m[3]);
      return m[1] + value;
    })
    .join('\n');
