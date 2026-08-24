// Unit tests for src/lib/utils/color_helpers.ts (Phase 2, plan 02-02, Task 1).
//
// Run with: node --test scripts/color-helpers.test.mts
//
// Lives in scripts/ rather than src/ deliberately: this file is outside the
// tsconfig include set, so svelte-check will not try to typecheck the
// explicit `.ts` import extension below, which the project's TypeScript
// settings would otherwise reject. Node v22's native TypeScript stripping
// handles both this file and the imported module directly.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  parseCssColorToRgb,
  relativeLuminance,
  chipTextTone,
  chipBackground,
} from "../src/lib/utils/color_helpers.ts";

// ---------------------------------------------------------------------------
// parseCssColorToRgb: hex forms
// ---------------------------------------------------------------------------

test("parseCssColorToRgb: 3-digit hex expands each digit", () => {
  assert.deepEqual(parseCssColorToRgb("#abc"), { r: 170, g: 187, b: 204 });
});

test("parseCssColorToRgb: 3-digit hex is case-insensitive", () => {
  assert.deepEqual(parseCssColorToRgb("#ABC"), { r: 170, g: 187, b: 204 });
});

test("parseCssColorToRgb: 4-digit hex expands RGB channels and ignores alpha", () => {
  assert.deepEqual(parseCssColorToRgb("#abcf"), { r: 170, g: 187, b: 204 });
});

test("parseCssColorToRgb: 6-digit hex parses directly", () => {
  assert.deepEqual(parseCssColorToRgb("#9146ff"), { r: 145, g: 70, b: 255 });
});

test("parseCssColorToRgb: 8-digit hex parses RGB and ignores trailing alpha", () => {
  assert.deepEqual(parseCssColorToRgb("#9146ffcc"), { r: 145, g: 70, b: 255 });
});

// ---------------------------------------------------------------------------
// parseCssColorToRgb: rgb()/rgba()
// ---------------------------------------------------------------------------

test("parseCssColorToRgb: rgb() with comma-separated integers", () => {
  assert.deepEqual(parseCssColorToRgb("rgb(145, 70, 255)"), { r: 145, g: 70, b: 255 });
});

test("parseCssColorToRgb: rgba() with comma-separated integers and alpha ignored", () => {
  assert.deepEqual(parseCssColorToRgb("rgba(145, 70, 255, 0.5)"), { r: 145, g: 70, b: 255 });
});

test("parseCssColorToRgb: rgb() with space-separated integers", () => {
  assert.deepEqual(parseCssColorToRgb("rgb(145 70 255)"), { r: 145, g: 70, b: 255 });
});

test("parseCssColorToRgb: rgb() with space-separated percentages", () => {
  assert.deepEqual(parseCssColorToRgb("rgb(100% 0% 0%)"), { r: 255, g: 0, b: 0 });
});

test("parseCssColorToRgb: rgba() with space-separated channels and slash alpha ignored", () => {
  assert.deepEqual(parseCssColorToRgb("rgba(145 70 255 / 0.5)"), { r: 145, g: 70, b: 255 });
});

// ---------------------------------------------------------------------------
// parseCssColorToRgb: named colors
// ---------------------------------------------------------------------------

test("parseCssColorToRgb: named color 'red'", () => {
  assert.deepEqual(parseCssColorToRgb("red"), { r: 255, g: 0, b: 0 });
});

test("parseCssColorToRgb: named color 'navy'", () => {
  assert.deepEqual(parseCssColorToRgb("navy"), { r: 0, g: 0, b: 128 });
});

test("parseCssColorToRgb: named colors are case-insensitive", () => {
  assert.deepEqual(parseCssColorToRgb("WHITE"), { r: 255, g: 255, b: 255 });
});

// ---------------------------------------------------------------------------
// parseCssColorToRgb: null/empty/unrecognized fallbacks
// ---------------------------------------------------------------------------

test("parseCssColorToRgb: null returns null", () => {
  assert.equal(parseCssColorToRgb(null), null);
});

test("parseCssColorToRgb: undefined returns null", () => {
  assert.equal(parseCssColorToRgb(undefined), null);
});

test("parseCssColorToRgb: empty string returns null", () => {
  assert.equal(parseCssColorToRgb(""), null);
});

test("parseCssColorToRgb: whitespace-only string returns null", () => {
  assert.equal(parseCssColorToRgb("   "), null);
});

test("parseCssColorToRgb: hsl() is unrecognized and returns null", () => {
  assert.equal(parseCssColorToRgb("hsl(120, 50%, 50%)"), null);
});

test("parseCssColorToRgb: oklch() is unrecognized and returns null", () => {
  assert.equal(parseCssColorToRgb("oklch(0.7 0.15 30)"), null);
});

test("parseCssColorToRgb: a nonsense word is unrecognized and returns null", () => {
  assert.equal(parseCssColorToRgb("notacolor"), null);
});

// ---------------------------------------------------------------------------
// relativeLuminance
// ---------------------------------------------------------------------------

test("relativeLuminance: pure black is 0", () => {
  assert.equal(relativeLuminance({ r: 0, g: 0, b: 0 }), 0);
});

test("relativeLuminance: pure white is 1 within a small epsilon", () => {
  const luminance = relativeLuminance({ r: 255, g: 255, b: 255 });
  assert.ok(Math.abs(luminance - 1) < 0.0001, `expected ~1, got ${luminance}`);
});

// ---------------------------------------------------------------------------
// chipTextTone
// ---------------------------------------------------------------------------

test("chipTextTone: white yields dark text", () => {
  assert.equal(chipTextTone("#ffffff"), "dark");
});

test("chipTextTone: yellow yields dark text", () => {
  assert.equal(chipTextTone("yellow"), "dark");
});

test("chipTextTone: black yields light text", () => {
  assert.equal(chipTextTone("#000000"), "light");
});

test("chipTextTone: navy yields light text", () => {
  assert.equal(chipTextTone("navy"), "light");
});

test("chipTextTone: unparseable color yields auto", () => {
  assert.equal(chipTextTone("hsl(120, 50%, 50%)"), "auto");
});

test("chipTextTone: absent color yields auto", () => {
  assert.equal(chipTextTone(null), "auto");
  assert.equal(chipTextTone(undefined), "auto");
});

// ---------------------------------------------------------------------------
// chipBackground
// ---------------------------------------------------------------------------

test("chipBackground: null returns null", () => {
  assert.equal(chipBackground(null), null);
});

test("chipBackground: undefined returns null", () => {
  assert.equal(chipBackground(undefined), null);
});

test("chipBackground: empty string returns null", () => {
  assert.equal(chipBackground(""), null);
});

test("chipBackground: whitespace-only string returns null", () => {
  assert.equal(chipBackground("  "), null);
});

test("chipBackground: trims and passes through a value with surrounding spaces", () => {
  assert.equal(chipBackground(" #9146FF "), "#9146FF");
});

test("chipBackground: passes through an unrecognized-but-non-empty value unchanged", () => {
  assert.equal(chipBackground("hsl(120, 50%, 50%)"), "hsl(120, 50%, 50%)");
});
