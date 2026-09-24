// Unit tests for src/lib/utils/event_helpers.ts (compareTagNames / distinctSortedTags /
// filterEventsByTags — Phase 3, plan 03-01, Task 1).
//
// Run with: node --test scripts/tag-filter-helpers.test.mts
//
// Lives in scripts/ rather than src/ deliberately: this file is outside the
// tsconfig include set, so svelte-check will not try to typecheck the
// explicit `.ts` import extension below, which the project's TypeScript
// settings would otherwise reject. Node v22's native TypeScript stripping
// handles both this file and the imported module directly.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  activeTagNames,
  compareTagNames,
  distinctSortedTags,
  filterEventsByTags,
  hasActiveSelection,
} from "../src/lib/utils/event_helpers.ts";

// Minimal in-memory event literals shaped as CountdownDateWithTags. Only
// `id` and `tags` need to be realistic for these pure helpers, so a small
// cast object is fine — no database or network fixture is required.
function makeEvent(id: number, tagNames: string[]): any {
  return {
    id,
    tags: tagNames.map((name) => ({ name, color: null })),
  };
}

// ---------------------------------------------------------------------------
// compareTagNames
// ---------------------------------------------------------------------------

test("compareTagNames: orders a lowercase name before an uppercase name that sorts later alphabetically", () => {
  const result = compareTagNames({ name: "apple", color: null }, { name: "Banana", color: null });
  assert.ok(result < 0);
});

test("compareTagNames: returns zero for two names differing only in case", () => {
  assert.equal(compareTagNames({ name: "Esports", color: null }, { name: "esports", color: null }), 0);
});

// ---------------------------------------------------------------------------
// distinctSortedTags
// ---------------------------------------------------------------------------

test("distinctSortedTags: dedupes the same tag name appearing on several events down to one entry", () => {
  const events = [makeEvent(1, ["alpha"]), makeEvent(2, ["alpha"])];
  const result = distinctSortedTags(events);
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "alpha");
});

test("distinctSortedTags: returns entries in case-insensitive alphabetical order for a deliberately shuffled input", () => {
  const events = [makeEvent(1, ["zulu", "Alpha", "mike"])];
  const result = distinctSortedTags(events);
  assert.deepEqual(result.map((tag) => tag.name), ["Alpha", "mike", "zulu"]);
});

test("distinctSortedTags: treats two names differing only in case as two distinct adjacent entries", () => {
  const events = [makeEvent(1, ["Esports"]), makeEvent(2, ["esports"])];
  const result = distinctSortedTags(events);
  assert.deepEqual(result.map((tag) => tag.name).sort(), ["Esports", "esports"].sort());
  assert.equal(result.length, 2);
});

test("distinctSortedTags: returns an empty array for an empty event list", () => {
  assert.deepEqual(distinctSortedTags([]), []);
});

test("distinctSortedTags: skips an event whose tag array is empty", () => {
  const events = [makeEvent(1, []), makeEvent(2, ["alpha"])];
  const result = distinctSortedTags(events);
  assert.deepEqual(result.map((tag) => tag.name), ["alpha"]);
});

test("distinctSortedTags: sort stability keeps two equal-comparing names in first-encountered order", () => {
  // "esports" and "ESPORTS" are distinct exact strings, so both survive as
  // separate entries (case-variant dedup is covered by the adjacent-entries
  // test above). They compare equal under sensitivity: "base", so a stable
  // sort must keep them in encounter order — "esports" (event 1) before
  // "ESPORTS" (event 2) — rather than reordering them on every render.
  const events = [makeEvent(1, ["esports"]), makeEvent(2, ["ESPORTS"])];
  const result = distinctSortedTags(events);
  assert.deepEqual(result.map((tag) => tag.name), ["esports", "ESPORTS"]);
});

// ---------------------------------------------------------------------------
// filterEventsByTags
// ---------------------------------------------------------------------------

test("filterEventsByTags: returns the input array's contents unchanged and in original order for an empty selection", () => {
  const events = [makeEvent(1, ["a"]), makeEvent(2, ["b"])];
  assert.deepEqual(filterEventsByTags(events, []), events);
});

test("filterEventsByTags: narrows to only events carrying a single selected tag", () => {
  const events = [makeEvent(1, ["a"]), makeEvent(2, ["b"])];
  const result = filterEventsByTags(events, ["a"]);
  assert.deepEqual(result.map((e) => e.id), [1]);
});

test("filterEventsByTags: requires all of two selected tags so an event carrying only one of them is excluded", () => {
  const events = [makeEvent(1, ["a"]), makeEvent(2, ["a", "b"])];
  const result = filterEventsByTags(events, ["a", "b"]);
  assert.deepEqual(result.map((e) => e.id), [2]);
});

test("filterEventsByTags: keeps an event that carries extra tags beyond the selection", () => {
  const events = [makeEvent(1, ["a", "b", "c"])];
  const result = filterEventsByTags(events, ["a", "b"]);
  assert.deepEqual(result.map((e) => e.id), [1]);
});

test("filterEventsByTags: keeps an event whose tag set is exactly the selection", () => {
  const events = [makeEvent(1, ["a", "b"])];
  const result = filterEventsByTags(events, ["a", "b"]);
  assert.deepEqual(result.map((e) => e.id), [1]);
});

test("filterEventsByTags: excludes a tagless event as soon as any tag is selected", () => {
  const events = [makeEvent(1, []), makeEvent(2, ["a"])];
  const result = filterEventsByTags(events, ["a"]);
  assert.deepEqual(result.map((e) => e.id), [2]);
});

test("filterEventsByTags: returns an empty array when the selection matches no event", () => {
  const events = [makeEvent(1, ["a"]), makeEvent(2, ["b"])];
  assert.deepEqual(filterEventsByTags(events, ["c"]), []);
});

test("filterEventsByTags: produces identical output for the same two names supplied in either order", () => {
  const events = [makeEvent(1, ["a", "b"]), makeEvent(2, ["a"]), makeEvent(3, ["b"])];
  assert.deepEqual(filterEventsByTags(events, ["a", "b"]), filterEventsByTags(events, ["b", "a"]));
});

test("filterEventsByTags: preserves the incoming order of the events that survive", () => {
  const events = [makeEvent(3, ["a"]), makeEvent(1, ["a"]), makeEvent(2, ["a"])];
  const result = filterEventsByTags(events, ["a"]);
  assert.deepEqual(result.map((e) => e.id), [3, 1, 2]);
});

// ---------------------------------------------------------------------------
// activeTagNames
// ---------------------------------------------------------------------------

test("activeTagNames: returns an empty selection unchanged", () => {
  const events = [makeEvent(1, ["a"])];
  assert.deepEqual(activeTagNames(events, []), []);
});

test("activeTagNames: returns a selection whose names are all carried by some event unchanged and in order", () => {
  const events = [makeEvent(1, ["a"]), makeEvent(2, ["b"])];
  assert.deepEqual(activeTagNames(events, ["a", "b"]), ["a", "b"]);
});

test("activeTagNames: drops a selected name carried by no event while keeping the others", () => {
  const events = [makeEvent(1, ["a"])];
  assert.deepEqual(activeTagNames(events, ["a", "gone"]), ["a"]);
});

test("activeTagNames: returns an empty array when no selected name is carried by any event", () => {
  const events = [makeEvent(1, ["a"])];
  assert.deepEqual(activeTagNames(events, ["gone"]), []);
});

test("activeTagNames: drops every selected name for an empty event list", () => {
  assert.deepEqual(activeTagNames([], ["a"]), []);
});

test("activeTagNames composed with filterEventsByTags: a vanished selected tag restores the full event list rather than emptying it", () => {
  const events = [makeEvent(1, ["a"]), makeEvent(2, ["b"])];
  const result = filterEventsByTags(events, activeTagNames(events, ["gone"]));
  assert.deepEqual(result, events);
});

// ---------------------------------------------------------------------------
// hasActiveSelection
// ---------------------------------------------------------------------------

test("hasActiveSelection: an empty selection returns false regardless of the available tags", () => {
  const available = distinctSortedTags([makeEvent(1, ["a", "b"])]);
  assert.equal(hasActiveSelection(available, []), false);
});

test("hasActiveSelection: a selection whose every name is available returns true", () => {
  const available = distinctSortedTags([makeEvent(1, ["a", "b"])]);
  assert.equal(hasActiveSelection(available, ["a", "b"]), true);
});

test("hasActiveSelection: a partial drop-out (one name available, one gone) still returns true", () => {
  const available = distinctSortedTags([makeEvent(1, ["a"])]);
  assert.equal(hasActiveSelection(available, ["a", "gone"]), true);
});

test("hasActiveSelection: returns false when no selected name is available (G-03-7 itself)", () => {
  const available = distinctSortedTags([makeEvent(1, ["a"])]);
  assert.equal(hasActiveSelection(available, ["gone"]), false);
});

test("hasActiveSelection: returns false for a non-empty selection against an empty available-tag list", () => {
  assert.equal(hasActiveSelection([], ["a"]), false);
});

test("hasActiveSelection: a name differing only in letter case from an available tag is not a match", () => {
  const available = distinctSortedTags([makeEvent(1, ["Esports"])]);
  assert.equal(hasActiveSelection(available, ["esports"]), false);
});

test("hasActiveSelection composed with activeTagNames: agrees with activeTagNames(...).length > 0 across a tag-drop transition", () => {
  // Before: both events present, TAG_ONLY_ONE's only carrier still in the list.
  const before = [makeEvent(1, ["shared", "only-one"]), makeEvent(2, ["shared"])];
  // After: the only carrier of "only-one" has dropped out of the dataset.
  const after = [makeEvent(2, ["shared"])];
  const selection = ["only-one"];

  const beforeHasActive = hasActiveSelection(distinctSortedTags(before), selection);
  const beforeNarrowedNonEmpty = activeTagNames(before, selection).length > 0;
  assert.equal(beforeHasActive, beforeNarrowedNonEmpty);
  assert.equal(beforeHasActive, true);

  const afterHasActive = hasActiveSelection(distinctSortedTags(after), selection);
  const afterNarrowedNonEmpty = activeTagNames(after, selection).length > 0;
  assert.equal(afterHasActive, afterNarrowedNonEmpty);
  assert.equal(afterHasActive, false);
});
