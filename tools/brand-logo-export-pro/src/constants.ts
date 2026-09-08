/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A single uploaded logo asset (full logo, symbol only, a height variation, etc.)
export interface Asset {
  id: string;
  name: string;        // used as the export folder name (logo, symbol, variation-1 ...)
  fileName: string;    // original file name
  svgContent: string;
  // Live <text> that was never converted to outlines. Such a logo renders with
  // whatever font the reader happens to have, so the export is blocked until it
  // is fixed in the drawing program.
  liveText?: string[];
}

// One entry in the global brand palette.
// The same palette is applied to every asset (symbol / variations are subsets of the logo).
export interface BrandColor {
  id: string;
  originalHex: string; // hex exactly as found in the SVG — the recolor key
  name: string;
  rgbHex: string;      // screen value (hex), used for all RGB outputs
  cmyk: string;        // print value "C:x M:x Y:x K:x", used for all CMYK outputs
  // True when the CMYK came from a guidelines document or was typed by hand.
  // Those values are authoritative — switching the print profile leaves them alone.
  cmykExact?: boolean;
  // Spot color name, e.g. "PANTONE 286 C". Only set by the user (typed, or read from a
  // guidelines document) — a Pantone cannot be derived from RGB without the licensed
  // color books. Colors without one stay CMYK inside the Pantone PDF.
  pantone?: string;
  source: 'svg' | 'image' | 'manual';
}

// Which color spaces the ZIP should contain. Pantone is off by default: it only
// produces something meaningful once the palette carries spot color names.
export interface OutputTargets {
  rgb: boolean;
  cmyk: boolean;
  pantone: boolean;
}

// A logo-on-background combination rendered as a CMYK JPEG (JPEG has no transparency).
export interface Background {
  id: string;
  name: string;   // used in the JPEG file name (…_<name>.jpg)
  color: string;  // background hex
  // Per-logo-color overrides: uppercase original hex -> target hex.
  // Sparse — any color not listed falls back to its palette (RGB) value = full color.
  logoColors: Record<string, string>;
}
