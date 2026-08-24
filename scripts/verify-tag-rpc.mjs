#!/usr/bin/env node
/**
 * Direct-RPC verifier for public.events_matching_all_tags (Phase 4, plan
 * 04-01, Task 1).
 *
 * Run with: node --env-file=.env.local scripts/verify-tag-rpc.mjs
 *
 * Calls the RPC directly via @supabase/supabase-js — never starts a dev
 * server, never issues an HTTP request. This is the only coverage that
 * reaches the RPC's own defensive behaviour (D-08's consequence note):
 * once src/routes/api/events/+server.ts cleans and dedupes its input via
 * splitTags() + Set, the RPC will never see raw/duplicate/blank input
 * through the HTTP path, so a direct-RPC test is the only way to prove the
 * RPC doesn't silently depend on that cleanup.
 *
 * All test data is prefixed with "gsd-verify-" and deleted in a finally
 * block, regardless of pass/fail outcome.
 */

import { createClient } from "@supabase/supabase-js";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(
      `Missing required environment variable: ${name}. ` +
      `Run with: node --env-file=.env.local scripts/verify-tag-rpc.mjs`,
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

function sameSet(actual, expected) {
  const a = [...actual].sort((x, y) => x - y);
  const b = [...expected].sort((x, y) => x - y);
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

async function callRpc(client, tagNames) {
  const { data, error } = await client.rpc("events_matching_all_tags", {
    tag_names: tagNames,
  });
  return { data, error };
}

function idsOf(rows) {
  return (rows ?? []).map((row) => row.event_id);
}

const SUFFIX = randomSuffix();
const TITLE_PREFIX = "gsd-verify-";

const TAG_SHARED = `gsd-shared-${SUFFIX}`;
const TAG_OTHER = `gsd-other-${SUFFIX}`;
const TAG_NONEXISTENT = `gsd-nonexistent-${SUFFIX}`;

const FAR_FUTURE_DATE = new Date(Date.now() + 400 * 24 * 60 * 60 * 1000).toISOString();

async function main() {
  const eventIds = [];

  try {
    // ------------------------------------------------------------------
    // Fixture setup — all writes go through save_event, never a direct
    // table insert. TAG_SHARED is carried by EVENT_A and EVENT_B; TAG_OTHER
    // is carried only by EVENT_C, so a query for TAG_SHARED must return
    // exactly { EVENT_A.id, EVENT_B.id } and never EVENT_C.id.
    // ------------------------------------------------------------------
    let eventAId;
    let eventBId;
    let eventCId;

    {
      const { data, error } = await serviceClient.rpc("save_event", {
        event_id: null,
        event_data: { title: `${TITLE_PREFIX}${SUFFIX}-a`, priority: 0, date: FAR_FUTURE_DATE },
        tag_names: [TAG_SHARED],
      });
      assertTrue(!error && !!data?.id, "setup: created fixture event A (carries TAG_SHARED) via save_event");
      eventAId = data?.id;
      if (eventAId) eventIds.push(eventAId);
    }

    {
      const { data, error } = await serviceClient.rpc("save_event", {
        event_id: null,
        event_data: { title: `${TITLE_PREFIX}${SUFFIX}-b`, priority: 0, date: FAR_FUTURE_DATE },
        tag_names: [TAG_SHARED],
      });
      assertTrue(!error && !!data?.id, "setup: created fixture event B (carries TAG_SHARED) via save_event");
      eventBId = data?.id;
      if (eventBId) eventIds.push(eventBId);
    }

    {
      const { data, error } = await serviceClient.rpc("save_event", {
        event_id: null,
        event_data: { title: `${TITLE_PREFIX}${SUFFIX}-c`, priority: 0, date: FAR_FUTURE_DATE },
        tag_names: [TAG_OTHER],
      });
      assertTrue(!error && !!data?.id, "setup: created fixture event C (carries TAG_OTHER only) via save_event");
      eventCId = data?.id;
      if (eventCId) eventIds.push(eventCId);
    }

    const expectedSharedIds = [eventAId, eventBId].filter((id) => id !== undefined);

    // ------------------------------------------------------------------
    // (1) One-element call returns exactly the ids of the fixture events
    //     carrying that tag, and never the id of the non-carrying fixture.
    // ------------------------------------------------------------------
    {
      const { data, error } = await callRpc(serviceClient, [TAG_SHARED]);
      const ids = idsOf(data);
      assertTrue(!error, "single tag: service-key call returns no error");
      assertTrue(
        sameSet(ids, expectedSharedIds),
        "single tag: returns exactly the ids of the fixture events carrying TAG_SHARED",
      );
      assertTrue(
        eventCId === undefined || !ids.includes(eventCId),
        "single tag: does not include the id of the fixture event that does not carry TAG_SHARED",
      );
    }

    // ------------------------------------------------------------------
    // (2) D-05: an upper-cased spelling of a lower-case-stored fixture tag
    //     returns the identical id set.
    // ------------------------------------------------------------------
    {
      const { data, error } = await callRpc(serviceClient, [TAG_SHARED.toUpperCase()]);
      const ids = idsOf(data);
      assertTrue(!error, "case-insensitive: upper-cased spelling call returns no error");
      assertTrue(
        sameSet(ids, expectedSharedIds),
        "case-insensitive (D-05): an upper-cased spelling of a lower-case-stored tag returns the identical id set",
      );
    }

    // ------------------------------------------------------------------
    // (3) D-08 consequence: a call with the same name repeated twice
    //     returns the identical id set as the one-element call.
    // ------------------------------------------------------------------
    {
      const { data, error } = await callRpc(serviceClient, [TAG_SHARED, TAG_SHARED]);
      const ids = idsOf(data);
      assertTrue(!error, "duplicate-tolerant: repeated-name call returns no error");
      assertTrue(
        sameSet(ids, expectedSharedIds),
        "duplicate-tolerant (D-08 consequence): a raw, un-deduplicated array with a repeated name returns the same id set as the single-element call",
      );
    }

    // ------------------------------------------------------------------
    // (4) A call including a blank and a whitespace-only element alongside
    //     a real name returns the identical id set as the clean call.
    // ------------------------------------------------------------------
    {
      const { data, error } = await callRpc(serviceClient, [TAG_SHARED, "", "   "]);
      const ids = idsOf(data);
      assertTrue(!error, "blank-tolerant: blank/whitespace-padded call returns no error");
      assertTrue(
        sameSet(ids, expectedSharedIds),
        "blank-tolerant: a call including a blank and a whitespace-only element returns the identical id set as the clean call",
      );
    }

    // ------------------------------------------------------------------
    // (5) D-06: a call naming a tag no fixture carries returns zero rows
    //     without error.
    // ------------------------------------------------------------------
    {
      const { data, error } = await callRpc(serviceClient, [TAG_NONEXISTENT]);
      assertTrue(!error, "zero-match (D-06): call for a nonexistent tag name returns no error");
      assertTrue(
        idsOf(data).length === 0,
        "zero-match (D-06): call for a nonexistent tag name returns zero rows",
      );
    }

    // ------------------------------------------------------------------
    // (6) The same one-element call issued through the anon client
    //     succeeds and returns the same id set, proving the anon grant
    //     landed.
    // ------------------------------------------------------------------
    {
      const { data, error } = await callRpc(anonClient, [TAG_SHARED]);
      const ids = idsOf(data);
      assertTrue(!error, "anon-callable: anon-key call returns no error");
      assertTrue(
        sameSet(ids, expectedSharedIds),
        "anon-callable: an anon-key call returns the same id set as the service-key call, proving the anon EXECUTE grant landed",
      );
    }
  } finally {
    // Cleanup: delete every fixture event by title prefix (covers the case
    // where an assertion failed before all fixtures were created) and every
    // fixture tag row by name.
    try {
      await serviceClient.from(TABLE_NAME).delete().ilike("title", `${TITLE_PREFIX}${SUFFIX}%`);
    } catch (cleanupError) {
      console.error("cleanup: failed to delete fixture events", cleanupError);
    }
    try {
      await serviceClient.from("tags").delete().in("name", [TAG_SHARED, TAG_OTHER]);
    } catch (cleanupError) {
      console.error("cleanup: failed to delete fixture tags", cleanupError);
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} assertion(s) failed.`);
    process.exit(1);
  }

  console.log("\nAll assertions passed.");
}

main().catch((error) => {
  console.error("Unhandled error in verify-tag-rpc.mjs:", error);
  process.exit(1);
});
