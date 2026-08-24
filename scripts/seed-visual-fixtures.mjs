#!/usr/bin/env node
/**
 * Seeds and tears down the visual-fixture events used for Phase 2's
 * end-of-phase visual UAT pass (plan 02-02, Task 3).
 *
 * Run with:
 *   node --env-file=.env.local scripts/seed-visual-fixtures.mjs seed
 *   node --env-file=.env.local scripts/seed-visual-fixtures.mjs drop-only-one
 *   node --env-file=.env.local scripts/seed-visual-fixtures.mjs restore-only-one
 *   node --env-file=.env.local scripts/seed-visual-fixtures.mjs cleanup
 *
 * `drop-only-one` and `restore-only-one` (Phase 3, plan 03-04, Task 3)
 * reproduce UAT gap G-03-7 on demand: the scenario is a selected tag's last
 * carrying event dropping out of the polled dataset in the background,
 * something that cannot be triggered from the browser alone. `drop-only-one`
 * re-saves `gsd-visual-and-both` with only TAG_SHARED, removing
 * TAG_ONLY_ONE from every rendered event and therefore from the panel's
 * derived tag list; `restore-only-one` re-saves it with both tags again.
 * Run `seed` first — both modes require the `and-both` fixture to already
 * exist. Together with `cleanup`, they also let the D-12 tag-return
 * re-narrowing behaviour (UAT test 1) be re-checked in the same sitting.
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
 * Five fixtures cover the visual cases DISP-03, the UI-SPEC's long-name
 * backstop, and Phase 3's AND-semantics filter demonstration need eyes on:
 *   1. neutral — two ordinary short tags, no color override
 *   2. colored — one tag, colored directly on public.tags to #9146FF
 *      after creation (the sanctioned way to set a color: TAGS-05 /
 *      Phase 1 D-13 — save_event's write path never touches tags.color)
 *   3. wrapping — one ~60-character tag name plus several short tags, to
 *      exercise both the truncation backstop and row-wrapping
 *   4. and-both (gsd-visual-and-both) — carries both AND-demo tags, so
 *      selecting the shared tag then also selecting the second one narrows
 *      down to just this event
 *   5. and-shared (gsd-visual-and-shared) — carries only the shared
 *      AND-demo tag, so selecting the shared tag alone shows this event
 *      alongside gsd-visual-and-both, proving AND (not OR) semantics once
 *      the second tag is also selected
 */

import { createClient } from "@supabase/supabase-js";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(
      `Missing required environment variable: ${name}. ` +
      "Run with: node --env-file=.env.local scripts/seed-visual-fixtures.mjs <seed|drop-only-one|restore-only-one|cleanup>",
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
const AND_BOTH_TITLE = `${TITLE_PREFIX}and-both`;
const AND_SHARED_TITLE = `${TITLE_PREFIX}and-shared`;

const TAG_NEUTRAL_ONE = "gsd-visual-tag-neutral-one";
const TAG_NEUTRAL_TWO = "gsd-visual-tag-neutral-two";

const TAG_SHARED = "gsd-visual-tag-shared";
const TAG_ONLY_ONE = "gsd-visual-tag-only-one";

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
  TAG_SHARED,
  TAG_ONLY_ONE,
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

async function findFixtureEventByTitle(title) {
  const { data, error } = await serviceClient
    .from(TABLE_NAME)
    .select("id, title, priority, date, end_date")
    .eq("title", title)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to look up fixture event "${title}": ${error.message}`);
  }
  if (!data) {
    throw new Error(
      `Fixture event "${title}" not found. Run ` +
      "`node --env-file=.env.local scripts/seed-visual-fixtures.mjs seed` first.",
    );
  }
  return data;
}

async function readEventTagNames(eventId) {
  const { data, error } = await serviceClient
    .from(TABLE_NAME)
    .select("event_tags(tags(name))")
    .eq("id", eventId)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to read back tags for event ${eventId}: ${error.message}`);
  }
  const eventTags = data?.event_tags ?? [];
  return eventTags.map((link) => link.tags.name);
}

async function resaveAndBothTags(tagNames) {
  const existing = await findFixtureEventByTitle(AND_BOTH_TITLE);

  const { error } = await serviceClient.rpc("save_event", {
    event_id: existing.id,
    event_data: {
      title: existing.title,
      priority: existing.priority,
      date: existing.date,
      end_date: existing.end_date,
    },
    tag_names: tagNames,
  });
  if (error) {
    throw new Error(`Failed to re-save fixture event "${AND_BOTH_TITLE}" via save_event: ${error.message}`);
  }

  return existing.id;
}

async function dropOnlyOne() {
  const eventId = await resaveAndBothTags([TAG_SHARED]);

  const tagNames = await readEventTagNames(eventId);
  if (tagNames.includes(TAG_ONLY_ONE)) {
    throw new Error(`drop-only-one: "${TAG_ONLY_ONE}" is still present on "${AND_BOTH_TITLE}" after re-save.`);
  }
  if (!tagNames.includes(TAG_SHARED)) {
    throw new Error(`drop-only-one: "${TAG_SHARED}" is unexpectedly missing from "${AND_BOTH_TITLE}" after re-save.`);
  }

  console.log(`Dropped "${TAG_ONLY_ONE}" from "${AND_BOTH_TITLE}" — it should now be gone from the panel's tag list.`);
}

async function restoreOnlyOne() {
  const eventId = await resaveAndBothTags([TAG_SHARED, TAG_ONLY_ONE]);

  const tagNames = await readEventTagNames(eventId);
  if (!tagNames.includes(TAG_ONLY_ONE)) {
    throw new Error(`restore-only-one: "${TAG_ONLY_ONE}" is still missing from "${AND_BOTH_TITLE}" after re-save.`);
  }
  if (!tagNames.includes(TAG_SHARED)) {
    throw new Error(`restore-only-one: "${TAG_SHARED}" is unexpectedly missing from "${AND_BOTH_TITLE}" after re-save.`);
  }

  console.log(`Restored "${TAG_ONLY_ONE}" on "${AND_BOTH_TITLE}" — a selection on it should immediately re-narrow the list.`);
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

  // 4 & 5. AND-semantics demo — two events sharing one tag, only one of
  //    which also carries a second tag. Selecting the shared tag alone
  //    shows both; adding the second tag narrows to exactly and-both,
  //    making AND (not OR) semantics demonstrable by eye.
  const andBoth = await createFixtureEvent(AND_BOTH_TITLE, [TAG_SHARED, TAG_ONLY_ONE]);
  created.push({ title: AND_BOTH_TITLE, id: andBoth.id });

  const andShared = await createFixtureEvent(AND_SHARED_TITLE, [TAG_SHARED]);
  created.push({ title: AND_SHARED_TITLE, id: andShared.id });

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

const VALID_MODES = ["seed", "drop-only-one", "restore-only-one", "cleanup"];

async function main() {
  const mode = process.argv[2];

  if (!VALID_MODES.includes(mode)) {
    console.error(
      "Usage: node --env-file=.env.local scripts/seed-visual-fixtures.mjs " +
      "<seed|drop-only-one|restore-only-one|cleanup>",
    );
    process.exit(1);
  }

  if (mode === "seed") {
    await seed();
  } else if (mode === "drop-only-one") {
    await dropOnlyOne();
  } else if (mode === "restore-only-one") {
    await restoreOnlyOne();
  } else {
    await cleanup();
  }
}

main().catch((error) => {
  console.error("Unhandled error in seed-visual-fixtures.mjs:", error);
  process.exit(1);
});
