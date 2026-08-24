#!/usr/bin/env node
/**
 * Seeds and tears down the visual-fixture events used for Phase 2's
 * end-of-phase visual UAT pass (plan 02-02, Task 3).
 *
 * Run with:
 *   node --env-file=.env.local scripts/seed-visual-fixtures.mjs seed
 *   node --env-file=.env.local scripts/seed-visual-fixtures.mjs cleanup
 *
 * This script manages data only — it does NOT launch or manage a dev-server
 * process, unlike scripts/verify-events-api.mjs. Start the application
 * yourself (see package.json's dev script) once fixtures are seeded.
 *
 * Every fixture event is created exclusively through the `save_event` RPC
 * (never a direct table insert) and titled with a `gsd-visual-` prefix.
 * Tag names are deterministic — derived from fixed constants rather than
 * randomly suffixed like the verify-*.mjs scripts' fixtures — so a
 * `cleanup` run in a later, fresh process can still find and remove them.
 * That is the one place these fixtures deliberately differ from the
 * verifier scripts' random-suffix convention: these fixtures are meant to
 * outlive the process that created them, sitting in the database for a
 * developer's manual visual pass.
 *
 * Three fixtures cover the visual cases DISP-03 and the UI-SPEC's
 * long-name backstop need eyes on:
 *   1. neutral — two ordinary short tags, no color override
 *   2. colored — one tag, colored directly on public.tags to #9146FF
 *      after creation (the sanctioned way to set a color: TAGS-05 /
 *      Phase 1 D-13 — save_event's write path never touches tags.color)
 *   3. wrapping — one ~60-character tag name plus several short tags, to
 *      exercise both the truncation backstop and row-wrapping
 */

import { createClient } from "@supabase/supabase-js";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(
      `Missing required environment variable: ${name}. ` +
      "Run with: node --env-file=.env.local scripts/seed-visual-fixtures.mjs <seed|cleanup>",
    );
    process.exit(1);
  }
  return value;
}

const SUPABASE_URL = requireEnv("PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_KEY = requireEnv("SUPABASE_SERVICE_KEY");
const TABLE_NAME = requireEnv("SUPABASE_TABLE_NAME");

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TITLE_PREFIX = "gsd-visual-";

const NEUTRAL_TITLE = `${TITLE_PREFIX}neutral-demo`;
const COLORED_TITLE = `${TITLE_PREFIX}colored-demo`;
const WRAPPING_TITLE = `${TITLE_PREFIX}wrapping-demo`;

const TAG_NEUTRAL_ONE = "gsd-visual-tag-neutral-one";
const TAG_NEUTRAL_TWO = "gsd-visual-tag-neutral-two";

const TAG_COLORED = "gsd-visual-tag-colored";
const TAG_COLOR_HEX = "#9146FF";

// About 60 characters of running text, well past the UI-SPEC's 12rem/
// truncate backstop and comfortably above the 50-character floor this
// fixture is asserted against.
const TAG_LONG_NAME = "a remarkably long tag name meant to exercise the truncation backstop";

const WRAPPING_EXTRA_TAGS = [
  "gsd-visual-wrap-one",
  "gsd-visual-wrap-two",
  "gsd-visual-wrap-three",
  "gsd-visual-wrap-four",
  "gsd-visual-wrap-five",
  "gsd-visual-wrap-six",
];

const ALL_FIXTURE_TAG_NAMES = [
  TAG_NEUTRAL_ONE,
  TAG_NEUTRAL_TWO,
  TAG_COLORED,
  TAG_LONG_NAME,
  ...WRAPPING_EXTRA_TAGS,
];

function farFutureDate() {
  // Roughly a year out, so the fixture sorts predictably on the homepage
  // and stays visible for the whole visual pass.
  return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
}

async function createFixtureEvent(title, tagNames) {
  const { data, error } = await serviceClient.rpc("save_event", {
    event_id: null,
    event_data: { title, priority: 0, date: farFutureDate() },
    tag_names: tagNames,
  });
  if (error) {
    throw new Error(`Failed to create fixture event "${title}" via save_event: ${error.message}`);
  }
  return data;
}

async function seed() {
  const created = [];

  // 1. Neutral demo — two ordinary short tags, default zinc style.
  const neutral = await createFixtureEvent(NEUTRAL_TITLE, [TAG_NEUTRAL_ONE, TAG_NEUTRAL_TWO]);
  created.push({ title: NEUTRAL_TITLE, id: neutral.id });

  // 2. Colored demo — one tag, created uncolored through save_event like
  //    every other tag, then colored via a direct update on public.tags.
  const colored = await createFixtureEvent(COLORED_TITLE, [TAG_COLORED]);
  created.push({ title: COLORED_TITLE, id: colored.id });

  const { error: colorError } = await serviceClient
    .from("tags")
    .update({ color: TAG_COLOR_HEX })
    .ilike("name", TAG_COLORED);
  if (colorError) {
    throw new Error(`Failed to color the fixture tag "${TAG_COLORED}": ${colorError.message}`);
  }

  // 3. Wrapping demo — an oversized tag name plus enough short tags to
  //    force the chip row onto a second line.
  const wrapping = await createFixtureEvent(WRAPPING_TITLE, [TAG_LONG_NAME, ...WRAPPING_EXTRA_TAGS]);
  created.push({ title: WRAPPING_TITLE, id: wrapping.id });

  console.log("Seeded visual fixtures:");
  for (const event of created) {
    console.log(`  ${event.title} (id: ${event.id})`);
  }
}

async function cleanup() {
  // Every delete below is filtered — either on the title prefix or on the
  // fixed set of generated tag names — so cleanup can never touch a row
  // outside these fixtures, and is safe to run against an empty database
  // (nothing left to remove is not an error).
  const { error: eventsError } = await serviceClient
    .from(TABLE_NAME)
    .delete()
    .ilike("title", `${TITLE_PREFIX}%`);
  if (eventsError) {
    throw new Error(`Failed to delete fixture events: ${eventsError.message}`);
  }

  const { error: tagsError } = await serviceClient
    .from("tags")
    .delete()
    .in("name", ALL_FIXTURE_TAG_NAMES);
  if (tagsError) {
    throw new Error(`Failed to delete fixture tags: ${tagsError.message}`);
  }

  // Self-verify the deletes actually took. This script starts no HTTP
  // server, so its own exit status — not an HTTP round trip — is the
  // assertion that cleanup succeeded and left zero rows behind.
  const { data: remainingEvents, error: remainingEventsError } = await serviceClient
    .from(TABLE_NAME)
    .select("id")
    .ilike("title", `${TITLE_PREFIX}%`);
  if (remainingEventsError) {
    throw new Error(`Failed to verify event cleanup: ${remainingEventsError.message}`);
  }
  if ((remainingEvents ?? []).length > 0) {
    throw new Error(`Cleanup left ${remainingEvents.length} fixture event(s) behind.`);
  }

  const { data: remainingTags, error: remainingTagsError } = await serviceClient
    .from("tags")
    .select("id")
    .in("name", ALL_FIXTURE_TAG_NAMES);
  if (remainingTagsError) {
    throw new Error(`Failed to verify tag cleanup: ${remainingTagsError.message}`);
  }
  if ((remainingTags ?? []).length > 0) {
    throw new Error(`Cleanup left ${remainingTags.length} fixture tag(s) behind.`);
  }

  console.log("Cleaned up visual fixtures — zero fixture events and zero fixture tags remain.");
}

async function main() {
  const mode = process.argv[2];

  if (mode !== "seed" && mode !== "cleanup") {
    console.error("Usage: node --env-file=.env.local scripts/seed-visual-fixtures.mjs <seed|cleanup>");
    process.exit(1);
  }

  if (mode === "seed") {
    await seed();
  } else {
    await cleanup();
  }
}

main().catch((error) => {
  console.error("Unhandled error in seed-visual-fixtures.mjs:", error);
  process.exit(1);
});
