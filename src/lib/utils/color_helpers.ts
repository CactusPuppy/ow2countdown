// Pure color helpers for tag chip rendering (Phase 2, plan 02-02).
//
// This module is deliberately dependency-free: no Svelte, SvelteKit,
// $app/$env, or Tailwind imports, and no Tailwind class literals. Tailwind 4
// here is CSS-first with content auto-detection (no `@config`), so any class
// name this module might return would never be scanned into the generated
// CSS. Callers map the semantic tone this module returns onto a literal
// Tailwind class string themselves, inside the .svelte file where Tailwind's
// scanner can see it.
//
// `tags.color` is a freeform, DB-trusted `text null` column with no format
// constraint (Phase 1 D-13 / sql/001_tags_schema.sql). Per D-08, no
// color-format validation code is added here — `chipBackground` passes a
// non-empty string through unchanged, and an unparseable-but-browser-valid
// value (e.g. `hsl()`, `oklch()`, or a name outside the lookup below) is
// left to the browser to render, while `chipTextTone` honestly reports it
// cannot compute a tone and lets the caller fall back to its neutral text
// treatment.

type Rgb = { r: number; g: number; b: number };

const NAMED_COLORS: Record<string, Rgb> = {
  black: { r: 0, g: 0, b: 0 },
  silver: { r: 192, g: 192, b: 192 },
  gray: { r: 128, g: 128, b: 128 },
  grey: { r: 128, g: 128, b: 128 },
  white: { r: 255, g: 255, b: 255 },
  maroon: { r: 128, g: 0, b: 0 },
  red: { r: 255, g: 0, b: 0 },
  purple: { r: 128, g: 0, b: 128 },
  fuchsia: { r: 255, g: 0, b: 255 },
  magenta: { r: 255, g: 0, b: 255 },
  green: { r: 0, g: 128, b: 0 },
  lime: { r: 0, g: 255, b: 0 },
  olive: { r: 128, g: 128, b: 0 },
  yellow: { r: 255, g: 255, b: 0 },
  navy: { r: 0, g: 0, b: 128 },
  blue: { r: 0, g: 0, b: 255 },
  teal: { r: 0, g: 128, b: 128 },
  aqua: { r: 0, g: 255, b: 255 },
  cyan: { r: 0, g: 255, b: 255 },
  orange: { r: 255, g: 165, b: 0 },
  pink: { r: 255, g: 192, b: 203 },
};

function clampChannel(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function parseHex(value: string): Rgb | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(value);
  if (!match) return null;

  const hex = match[1];
  let r: number, g: number, b: number;

  if (hex.length === 3 || hex.length === 4) {
    // Short form: each digit is doubled. Alpha (4th digit, if present) is
    // ignored since chips are rendered opaque.
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    // Long form (6 or 8 digits); trailing alpha pair, if present, is ignored.
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  }

  return { r: clampChannel(r), g: clampChannel(g), b: clampChannel(b) };
}

function parseChannel(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed.endsWith("%")) {
    const percent = Number.parseFloat(trimmed.slice(0, -1));
    if (Number.isNaN(percent)) return null;
    return clampChannel((percent / 100) * 255);
  }
  const value = Number.parseFloat(trimmed);
  if (Number.isNaN(value)) return null;
  return clampChannel(value);
}

function parseRgbFunction(value: string): Rgb | null {
  const match = /^rgba?\(([^)]*)\)$/.exec(value);
  if (!match) return null;

  const inner = match[1].trim();
  // Accept either comma-separated (`r, g, b[, a]`) or space-separated
  // (`r g b[ / a]`) channel lists.
  const parts = inner.includes(",")
    ? inner.split(",").map((part) => part.trim())
    : inner.split("/")[0].trim().split(/\s+/);

  if (parts.length < 3) return null;

  const r = parseChannel(parts[0]);
  const g = parseChannel(parts[1]);
  const b = parseChannel(parts[2]);
  if (r === null || g === null || b === null) return null;

  return { r, g, b };
}

/**
 * Parses a freeform CSS color string into an `{ r, g, b }` triple with each
 * channel clamped to 0-255. Recognises hex (3/4/6/8-digit), `rgb()`/`rgba()`
 * (comma- or space-separated), and a small lookup of plain CSS color names.
 * Returns null for null/undefined/empty/whitespace-only input and for
 * anything else this module does not recognise (e.g. `hsl()`, `oklch()`, or
 * a color name outside the lookup) — this is an honest "cannot determine
 * this" answer, not a validation failure, and callers degrade accordingly.
 */
export function parseCssColorToRgb(color: string | null | undefined): Rgb | null {
  if (color == null) return null;

  const trimmed = color.trim().toLowerCase();
  if (trimmed === "") return null;

  if (trimmed.startsWith("#")) return parseHex(trimmed);
  if (trimmed.startsWith("rgb")) return parseRgbFunction(trimmed);

  return NAMED_COLORS[trimmed] ?? null;
}

/**
 * Computes WCAG relative luminance (0-1) for an `{ r, g, b }` triple. Each
 * channel is normalized to 0-1, gamma-linearized per the standard sRGB
 * transfer function, then combined with the WCAG coefficients.
 */
export function relativeLuminance(rgb: Rgb): number {
  const linearize = (channel: number): number => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const r = linearize(rgb.r);
  const g = linearize(rgb.g);
  const b = linearize(rgb.b);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Chooses a chip label tone from a color string. Returns `"auto"` when the
 * color cannot be parsed, meaning the caller should keep its neutral
 * light-and-dark text treatment rather than guess. Returns `"dark"` when the
 * parsed color's relative luminance is greater than 0.5 (a light
 * background), and `"light"` otherwise (a dark background).
 */
export function chipTextTone(color: string | null | undefined): "dark" | "light" | "auto" {
  const rgb = parseCssColorToRgb(color);
  if (rgb === null) return "auto";

  return relativeLuminance(rgb) > 0.5 ? "dark" : "light";
}

/**
 * Collapses a tag's color value into either the trimmed override string or
 * null. This is deliberately NOT format validation: any non-empty,
 * non-whitespace string is passed through byte-for-byte unchanged (per
 * D-08, a malformed value is left to fail naturally when bound to the chip's
 * `background-color` style property). Its only job is to collapse
 * null/undefined/empty/whitespace-only input into a single "no override"
 * answer.
 */
export function chipBackground(color: string | null | undefined): string | null {
  if (color == null) return null;

  const trimmed = color.trim();
  return trimmed === "" ? null : trimmed;
}
