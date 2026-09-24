#!/usr/bin/env node
/**
 * No-data-loss gate for sql/002_migrate_legacy_tags.sql (Phase 1, plan
 * 01-02, Task 2/Task 3).
 *
 * Run with: node --env-file=.env.local scripts/verify-tag-migration.mjs
 *
 * This is an INDEPENDENT reimplementation of the migration's normalize-unwrap
 * parse rule, written in JavaScript rather than SQL. It re-derives, from the
 * legacy `tags` column, the tag names each event *should* have after
 * migration, then diffs that against the actual `event_tags` rows in the
 * live database. The point of the gate is that two implementations of the
 * same documented rule agree -- it is only as good as this reimplementation
 * matching the SQL parser's intent, not a first-principles proof.
 *
 * Uses the service-role client only.
 */

import { createClient } from "@supabase/supabase-js";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(
      `Missing required environment variable: ${name}. ` +
      `Run with: node --env-file=.env.local scripts/verify-tag-migration.mjs`,
    );
    process.exit(1);
  }
  return value;
}

const SUPABASE_URL = requireEnv("PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_KEY = requireEnv("SUPABASE_SERVICE_KEY");
const TABLE_NAME = requireEnv("SUPABASE_TABLE_NAME");

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

let failures = 0;

function assertTrue(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
  } else {
    failures += 1;
    console.log(`FAIL: ${message}`);
  }
  return condition;
}

// ---------------------------------------------------------------------------
// Independent reimplementation of the normalize-unwrap parse rule
// (mirrors sql/002_migrate_legacy_tags.sql step for step).
// ---------------------------------------------------------------------------

/** Trims every leading/trailing character that appears in `chars` (an array
 *  of single characters), matching Postgres btrim(text, text) semantics. */
function trimChars(str, chars) {
  const set = new Set(chars);
  let start = 0;
  let end = str.length;
  while (start < end && set.has(str[start])) start += 1;
  while (end > start && set.has(str[end - 1])) end -= 1;
  return str.slice(start, end);
}

function normalizeTypographicQuotes(str) {
  return str.replace(/“/g, '"').replace(/”/g, '"');
}

/** Strips a leading '[' and a trailing ']' only when BOTH are present. */
function unwrapMatchedBrackets(str) {
  if (str.length >= 2 && str[0] === "[" && str[str.length - 1] === "]") {
    return str.slice(1, -1);
  }
  return str;
}

/**
 * Parses a legacy `tags` column value into the array of tag names the
 * migration should have produced for it. Returns [] for null/blank input.
 */
function parseLegacyTagNames(raw) {
  if (raw === null || raw === undefined) return [];

  // Step 1-2: normalize typographic quotes, then btrim whitespace.
  const normalized = trimChars(normalizeTypographicQuotes(raw), [" "]);
  if (normalized === "") return [];

  // Step 3: unwrap matched brackets.
  const inner = unwrapMatchedBrackets(normalized);

  // Step 4: split on comma.
  const rawParts = inner.split(",");

  // Step 5-6: trim whitespace then quote characters from each element,
  // discard anything empty after trimming.
  const names = [];
  for (const part of rawParts) {
    const spaceTrimmed = trimChars(part, [" "]);
    const quoteTrimmed = trimChars(spaceTrimmed, ['"']);
    if (quoteTrimmed !== "") names.push(quoteTrimmed);
  }
  return names;
}

function sameSetCaseInsensitive(a, b) {
  const norm = (arr) => [...arr].map((s) => s.toLowerCase()).sort();
  const na = norm(a);
  const nb = norm(b);
  return na.length === nb.length && na.every((value, i) => value === nb[i]);
}

const BRACKET_OR_QUOTE_RE = /[[\]"“”]/;
const LEADING_TRAILING_WS_RE = /^\s|\s$/;

async function main() {
  // -------------------------------------------------------------------
  // Load legacy rows and derive the expected tag set per event.
  // -------------------------------------------------------------------
  const { data: legacyRows, error: legacyError } = await serviceClient
    .from(TABLE_NAME)
    .select("id, tags");

  if (legacyError) {
    console.error("Failed to read legacy rows:", legacyError);
    process.exit(1);
  }

  const expectedByEvent = new Map(); // event_id -> string[]
  const silentDropCandidates = [];

  for (const row of legacyRows ?? []) {
    const names = parseLegacyTagNames(row.tags);
    expectedByEvent.set(row.id, names);

    const isBlank = row.tags === null || row.tags === undefined || row.tags.trim() === "";
    if (!isBlank && names.length === 0) {
      silentDropCandidates.push(row.id);
    }
  }

  assertTrue(
    silentDropCandidates.length === 0,
    silentDropCandidates.length === 0
      ? "no-silent-drop: every non-null, non-blank legacy value parsed to at least one tag name"
      : `no-silent-drop: events with a non-blank legacy value that parsed to ZERO tag names (reported, not skipped): ${silentDropCandidates.join(", ")}`,
  );

  // -------------------------------------------------------------------
  // Load actual migrated rows: tags table, and event_tags joined to tags.
  // -------------------------------------------------------------------
  const { data: tagRows, error: tagsError } = await serviceClient
    .from("tags")
    .select("id, name");

  if (tagsError) {
    console.error("Failed to read tags table:", tagsError);
    process.exit(1);
  }

  const { data: eventTagRows, error: eventTagsError } = await serviceClient
    .from("event_tags")
    .select("event_id, tags(name)");

  if (eventTagsError) {
    console.error("Failed to read event_tags table:", eventTagsError);
    process.exit(1);
  }

  const actualByEvent = new Map(); // event_id -> string[]
  for (const row of eventTagRows ?? []) {
    const name = row.tags?.name;
    if (!name) continue;
    const list = actualByEvent.get(row.event_id) ?? [];
    list.push(name);
    actualByEvent.set(row.event_id, list);
  }

  // -------------------------------------------------------------------
  // Diff expected vs. actual, per event.
  // -------------------------------------------------------------------
  const mismatches = [];
  for (const [eventId, expected] of expectedByEvent.entries()) {
    const actual = actualByEvent.get(eventId) ?? [];
    if (!sameSetCaseInsensitive(expected, actual)) {
      mismatches.push({ eventId, expected, actual });
    }
  }

  if (mismatches.length === 0) {
    assertTrue(true, "no-data-loss: every event's migrated tag set matches its re-derived legacy tag set (case-insensitive)");
  } else {
    assertTrue(false, "no-data-loss: every event's migrated tag set matches its re-derived legacy tag set (case-insensitive)");
    for (const { eventId, expected, actual } of mismatches) {
      console.log(
        `  MISMATCH event ${eventId}: expected [${expected.join(", ")}] but found [${actual.join(", ")}]`,
      );
    }
  }

  // -------------------------------------------------------------------
  // Assert migrated tag names carry no residual encoding artifacts.
  // -------------------------------------------------------------------
  const dirtyNames = (tagRows ?? []).filter(
    (row) => BRACKET_OR_QUOTE_RE.test(row.name) || LEADING_TRAILING_WS_RE.test(row.name),
  );

  assertTrue(
    dirtyNames.length === 0,
    dirtyNames.length === 0
      ? "clean-names: no migrated tag name contains a bracket, quote character, or leading/trailing whitespace"
      : `clean-names: tag rows with residual encoding artifacts: ${dirtyNames.map((r) => `${r.id}:"${r.name}"`).join(", ")}`,
  );

  // -------------------------------------------------------------------
  // Report totals for the Task 3 checkpoint to compare against 13/28/24.
  // -------------------------------------------------------------------
  const distinctTagCount = tagRows?.length ?? 0;
  const eventTagsCount = eventTagRows?.length ?? 0;
  const taggedEventCount = [...actualByEvent.values()].filter((names) => names.length > 0).length;

  console.log("\nTotals:");
  console.log(`  distinct tags rows:    ${distinctTagCount}`);
  console.log(`  event_tags rows:       ${eventTagsCount}`);
  console.log(`  events with >=1 tag:   ${taggedEventCount}`);

  if (failures > 0) {
    console.error(`\n${failures} assertion(s) failed.`);
    process.exit(1);
  }

  console.log("\nAll assertions passed.");
}

main().catch((error) => {
  console.error("Unhandled error in verify-tag-migration.mjs:", error);
  process.exit(1);
});
