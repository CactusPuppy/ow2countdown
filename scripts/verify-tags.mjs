#!/usr/bin/env node
/**
 * End-to-end verifier for the save_event RPC and the tags/event_tags
 * schema (Phase 1, plan 01-01, Task 3).
 *
 * Run with: node --env-file=.env.local scripts/verify-tags.mjs
 *
 * Exercises the live Supabase database directly via @supabase/supabase-js.
 * All test data is prefixed with "gsd-verify-" and deleted in a finally
 * block, regardless of pass/fail outcome.
 */

import { createClient } from "@supabase/supabase-js";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(
      `Missing required environment variable: ${name}. ` +
      `Run with: node --env-file=.env.local scripts/verify-tags.mjs`,
    );
    process.exit(1);
  }
  return value;
}

const SUPABASE_URL = requireEnv("PUBLIC_SUPABASE_URL");
const SUPABASE_ANON_KEY = requireEnv("PUBLIC_SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_KEY = requireEnv("SUPABASE_SERVICE_KEY");
const TABLE_NAME = requireEnv("SUPABASE_TABLE_NAME");

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let failures = 0;

function assertTrue(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
  } else {
    failures += 1;
    console.log(`FAIL: ${message}`);
  }
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

const SUFFIX = randomSuffix();
const TITLE_PREFIX = "gsd-verify-";
const EVENT_TITLE = `${TITLE_PREFIX}${SUFFIX}`;
const ANON_EVENT_TITLE = `${TITLE_PREFIX}${SUFFIX}-anon`;

const TAG_A = `Alpha-${SUFFIX}`;
const TAG_B = `Beta-${SUFFIX}`;
const TAG_C = `Gamma-${SUFFIX}`;
const TAG_D = `Delta-${SUFFIX}`;
const TEST_COLOR = "#a970ff";

/** Returns the set of tag names currently linked to `eventId`, via a
 *  PostgREST embedded select against event_tags -> tags(name). */
async function getLinkedTagNames(eventId) {
  const { data, error } = await serviceClient
    .from("event_tags")
    .select("tag_id, tags(name)")
    .eq("event_id", eventId);

  if (error) throw error;
  return (data ?? []).map((row) => row.tags?.name).filter(Boolean);
}

function sameSet(actual, expected) {
  const a = [...actual].sort();
  const b = [...expected].sort();
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

async function main() {
  let eventId;

  try {
    // ------------------------------------------------------------------
    // Create
    // ------------------------------------------------------------------
    {
      const { data, error } = await serviceClient.rpc("save_event", {
        event_id: null,
        event_data: { title: EVENT_TITLE, priority: 0 },
        tag_names: [TAG_A, TAG_B, TAG_C],
      });

      assertTrue(!error && !!data?.id, "create: save_event returns a row with an id");
      eventId = data?.id;

      const linked = eventId ? await getLinkedTagNames(eventId) : [];
      assertTrue(
        sameSet(linked, [TAG_A, TAG_B, TAG_C]),
        "create: exactly 3 event_tags rows whose joined tag names equal the submitted set",
      );
    }

    // ------------------------------------------------------------------
    // Idempotency
    // ------------------------------------------------------------------
    {
      const { error } = await serviceClient.rpc("save_event", {
        event_id: eventId,
        event_data: { title: EVENT_TITLE, priority: 0 },
        tag_names: [TAG_A, TAG_B, TAG_C],
      });

      const linked = await getLinkedTagNames(eventId);
      assertTrue(
        !error && sameSet(linked, [TAG_A, TAG_B, TAG_C]),
        "idempotency: re-saving the same tag list still yields exactly 3 event_tags rows",
      );
    }

    // ------------------------------------------------------------------
    // Full replace
    // ------------------------------------------------------------------
    {
      const { error } = await serviceClient.rpc("save_event", {
        event_id: eventId,
        event_data: { title: EVENT_TITLE, priority: 0 },
        tag_names: [TAG_B, TAG_D],
      });

      const linked = await getLinkedTagNames(eventId);
      assertTrue(
        !error && sameSet(linked, [TAG_B, TAG_D]),
        "full replace: saving a different two-name list yields exactly those 2 event_tags rows, removed names gone",
      );
    }

    // ------------------------------------------------------------------
    // Empty
    // ------------------------------------------------------------------
    {
      const { error } = await serviceClient.rpc("save_event", {
        event_id: eventId,
        event_data: { title: EVENT_TITLE, priority: 0 },
        tag_names: [],
      });

      const linked = await getLinkedTagNames(eventId);
      assertTrue(
        !error && linked.length === 0,
        "empty: saving with an empty tag_names array yields 0 event_tags rows and does not error",
      );
    }

    // ------------------------------------------------------------------
    // Case-insensitive identity
    // ------------------------------------------------------------------
    let tagAId;
    {
      const { error } = await serviceClient.rpc("save_event", {
        event_id: eventId,
        event_data: { title: EVENT_TITLE, priority: 0 },
        tag_names: [TAG_A.toLowerCase()],
      });

      const { data: matches, error: selectError } = await serviceClient
        .from("tags")
        .select("id, name")
        .ilike("name", TAG_A);

      assertTrue(
        !error && !selectError && matches?.length === 1,
        "case-insensitive identity: submitting a lowercased variant creates NO new tags row (count stays 1)",
      );
      assertTrue(
        matches?.[0]?.name === TAG_A,
        "case-insensitive identity: the stored name still reads with its original first-entered casing",
      );
      tagAId = matches?.[0]?.id;
    }

    // ------------------------------------------------------------------
    // Color is never written by the app path
    // ------------------------------------------------------------------
    {
      const { error: updateError } = await serviceClient
        .from("tags")
        .update({ color: TEST_COLOR })
        .eq("id", tagAId);

      const { error: saveError } = await serviceClient.rpc("save_event", {
        event_id: eventId,
        event_data: { title: EVENT_TITLE, priority: 0 },
        tag_names: [TAG_A],
      });

      const { data: reread, error: rereadError } = await serviceClient
        .from("tags")
        .select("color")
        .eq("id", tagAId)
        .single();

      assertTrue(
        !updateError && !saveError && !rereadError && reread?.color === TEST_COLOR,
        "color: a color set directly via service client survives an application-path save byte-identical",
      );
    }

    // ------------------------------------------------------------------
    // Cascade
    // ------------------------------------------------------------------
    {
      const { error: deleteError } = await serviceClient
        .from(TABLE_NAME)
        .delete()
        .eq("id", eventId);

      const { data: remaining, error: remainingError } = await serviceClient
        .from("event_tags")
        .select("event_id")
        .eq("event_id", eventId);

      assertTrue(
        !deleteError && !remainingError && (remaining?.length ?? 0) === 0,
        "cascade: deleting the test event removes its event_tags rows",
      );
    }

    // ------------------------------------------------------------------
    // Anonymous rejection
    // ------------------------------------------------------------------
    {
      const { error } = await anonClient.rpc("save_event", {
        event_id: null,
        event_data: { title: ANON_EVENT_TITLE, priority: 0 },
        tag_names: [],
      });

      const { data: rows, error: checkError } = await serviceClient
        .from(TABLE_NAME)
        .select("id")
        .eq("title", ANON_EVENT_TITLE);

      assertTrue(
        !!error && !checkError && (rows?.length ?? 0) === 0,
        "anonymous rejection: an ANON-key call to save_event returns an error and creates no row",
      );
    }
  } finally {
    // Cleanup: delete any leftover test events (covers the case where an
    // assertion failed before the cascade step ran, or the anon-rejection
    // event was unexpectedly created) and every test tag row.
    try {
      await serviceClient.from(TABLE_NAME).delete().ilike("title", `${TITLE_PREFIX}%`);
    } catch (cleanupError) {
      console.error("cleanup: failed to delete test events", cleanupError);
    }
    try {
      await serviceClient.from("tags").delete().in("name", [TAG_A, TAG_B, TAG_C, TAG_D]);
    } catch (cleanupError) {
      console.error("cleanup: failed to delete test tags", cleanupError);
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} assertion(s) failed.`);
    process.exit(1);
  }

  console.log("\nAll assertions passed.");
}

main().catch((error) => {
  console.error("Unhandled error in verify-tags.mjs:", error);
  process.exit(1);
});
