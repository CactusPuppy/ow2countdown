#!/usr/bin/env node
/**
 * End-to-end HTTP verifier for GET /api/events (Phase 2, plan 02-01, Task 1).
 *
 * Run with: node --env-file=.env.local scripts/verify-events-api.mjs
 *
 * Asserts against a real running dev server over HTTP, exactly like
 * scripts/verify-event-api.mjs: it owns the dev server's lifecycle (spawns
 * `yarn dev`, polls the base URL to a 60s timeout, kills the child in a
 * `finally`), creates fixtures exclusively through the `save_event` RPC with
 * a `gsd-verify-` title prefix plus a random suffix, and deletes both
 * fixture events and fixture tag rows in a `finally` regardless of outcome.
 *
 * This is the list endpoint's contract check for D-01/D-02: the flattened
 * `{ name, color }` tags array, its case-insensitive alphabetical ordering,
 * the always-array (never null/missing) empty-tags case, the absence of the
 * raw `event_tags` embed, and that a single transformation feeds both the v1
 * plain-array and v2 {meta, data} response shapes, including under
 * pagination.
 *
 * At the time this file was authored (Task 1), GET /api/events has no tags
 * join at all, so this script is EXPECTED to fail — that red result is
 * Task 1's deliverable. Task 2 makes it green.
 */

import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(
      `Missing required environment variable: ${name}. ` +
      `Run with: node --env-file=.env.local scripts/verify-events-api.mjs`,
    );
    process.exit(1);
  }
  return value;
}

const SUPABASE_URL = requireEnv("PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_KEY = requireEnv("SUPABASE_SERVICE_KEY");
const TABLE_NAME = requireEnv("SUPABASE_TABLE_NAME");

const BASE_URL = process.env.VERIFY_EVENTS_API_BASE_URL ?? "http://localhost:5173";
const SERVER_START_TIMEOUT_MS = 60_000;
const SERVER_POLL_INTERVAL_MS = 500;

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Spawns `yarn dev` and resolves once the base URL responds, or rejects on
 *  timeout. The child process is returned so the caller can kill it. */
async function startDevServer() {
  const child = spawn("yarn", ["dev"], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  child.stdout?.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr?.on("data", (chunk) => { output += chunk.toString(); });

  child.on("exit", (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`yarn dev exited early with code ${code} (signal ${signal}). Output:\n${output}`);
    }
  });

  const deadline = Date.now() + SERVER_START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE_URL);
      if (res.ok || res.status < 500) {
        return child;
      }
    } catch {
      // Server not up yet; keep polling.
    }
    await sleep(SERVER_POLL_INTERVAL_MS);
  }

  child.kill("SIGTERM");
  throw new Error(`Dev server at ${BASE_URL} did not respond within ${SERVER_START_TIMEOUT_MS}ms. Output:\n${output}`);
}

function stopDevServer(child) {
  if (!child || child.killed) return;
  child.kill("SIGTERM");
}

async function fetchEvents(query) {
  const res = await fetch(`${BASE_URL}/api/events?${query}`);
  let body = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON body (e.g. an error page) — leave body null.
  }
  return { status: res.status, body };
}

function findByTitle(list, title) {
  return (list ?? []).find((item) => item?.title === title);
}

/** A single tag pair must be an object with exactly a string `name` and a
 *  `color` that is either a string or null, distinguishing a missing
 *  `color` key from an explicit `null` value via `hasOwnProperty`. */
function isValidTagPair(tag) {
  if (tag === null || typeof tag !== "object") return false;
  const keys = Object.keys(tag).sort();
  if (keys.length !== 2 || keys[0] !== "color" || keys[1] !== "name") return false;
  if (typeof tag.name !== "string") return false;
  if (!Object.prototype.hasOwnProperty.call(tag, "color")) return false;
  return typeof tag.color === "string" || tag.color === null;
}

async function main() {
  const SUFFIX = randomSuffix();
  const TITLE_PREFIX = "gsd-verify-";
  const TAGGED_TITLE = `${TITLE_PREFIX}${SUFFIX}-events-tagged`;
  const UNTAGGED_TITLE = `${TITLE_PREFIX}${SUFFIX}-events-untagged`;
  const COLORED_TITLE = `${TITLE_PREFIX}${SUFFIX}-events-colored`;
  const FILTER_TITLE = `${TITLE_PREFIX}${SUFFIX}-events-filter-target`;

  // Chosen so alphabetical order differs from creation order and so
  // case-insensitivity is exercised: "Alpha" sorts before "mike" sorts
  // before "zulu" case-insensitively, but they are NOT passed in that order
  // below.
  const TAG_ZULU = `zulu-${SUFFIX}`;
  const TAG_ALPHA = `Alpha-${SUFFIX}`;
  const TAG_MIKE = `mike-${SUFFIX}`;
  const EXPECTED_ORDER = [TAG_ALPHA, TAG_MIKE, TAG_ZULU];

  // Colored-fixture tag (plan 02-02, Task 2): created uncolored through
  // save_event like every other tag, then colored via a direct update on
  // public.tags — the sanctioned way to set a color per TAGS-05 / Phase 1
  // D-13, since save_event's write path never touches tags.color.
  const TAG_COLORED = `coral-${SUFFIX}`;
  const TAG_COLOR_HEX = "#9146FF";

  // ?tags= filter fixture (Phase 4, plan 04-01, Task 3): a distinctive tag no
  // other fixture in this file carries, so a request for it must return
  // exactly the filter-target fixture and none of the tagged/untagged/
  // colored fixtures above.
  const TAG_FILTER = `gsd-filter-${SUFFIX}`;
  const TAG_FILTER_NONEXISTENT = `gsd-filter-none-${SUFFIX}`;

  const FAR_FUTURE_DATE = new Date(Date.now() + 400 * 24 * 60 * 60 * 1000).toISOString();

  let devServer;

  try {
    devServer = await startDevServer();

    try {
      // ----------------------------------------------------------------
      // Fixture setup — all writes go through save_event, never a direct
      // table insert.
      // ----------------------------------------------------------------
      {
        const { data, error } = await serviceClient.rpc("save_event", {
          event_id: null,
          event_data: { title: TAGGED_TITLE, priority: 0, date: FAR_FUTURE_DATE },
          tag_names: [TAG_ZULU, TAG_ALPHA, TAG_MIKE],
        });
        assertTrue(!error && !!data?.id, "setup: created the tagged fixture event via save_event");
      }

      {
        const { data, error } = await serviceClient.rpc("save_event", {
          event_id: null,
          event_data: { title: UNTAGGED_TITLE, priority: 0, date: FAR_FUTURE_DATE },
          tag_names: [],
        });
        assertTrue(!error && !!data?.id, "setup: created the untagged fixture event via save_event");
      }

      {
        const { data, error } = await serviceClient.rpc("save_event", {
          event_id: null,
          event_data: { title: COLORED_TITLE, priority: 0, date: FAR_FUTURE_DATE },
          tag_names: [TAG_COLORED],
        });
        assertTrue(!error && !!data?.id, "setup: created the colored fixture event via save_event");

        // Direct table update, matching on the lowercased tag name — the
        // sanctioned way to set a color (TAGS-05 / Phase 1 D-13); save_event
        // never writes tags.color.
        const { error: colorError } = await serviceClient
          .from("tags")
          .update({ color: TAG_COLOR_HEX })
          .ilike("name", TAG_COLORED);
        assertTrue(!colorError, "setup: colored the fixture tag directly on the tags table");
      }

      {
        const { data, error } = await serviceClient.rpc("save_event", {
          event_id: null,
          event_data: { title: FILTER_TITLE, priority: 0, date: FAR_FUTURE_DATE },
          tag_names: [TAG_FILTER],
        });
        assertTrue(!error && !!data?.id, "setup: created the ?tags= filter-target fixture event via save_event");
      }

      // ----------------------------------------------------------------
      // v1: a plain JSON array; the tagged fixture carries a sorted
      // { name, color } tags array and the untagged fixture carries an
      // empty one
      // ----------------------------------------------------------------
      {
        const { status, body } = await fetchEvents(
          "v=1&order_by=id&order_direction=desc&page_size=25&include_past=true",
        );
        assertTrue(status === 200, "v1: GET /api/events returns 200");
        assertTrue(Array.isArray(body), "v1: response body is a plain JSON array");

        const taggedV1 = findByTitle(body, TAGGED_TITLE);
        assertTrue(taggedV1 !== undefined, "v1: the tagged fixture event is present in the response");

        assertTrue(
          Array.isArray(taggedV1?.tags) && taggedV1.tags.length === 3,
          "v1 tagged: tags is an array of length 3",
        );
        assertTrue(
          Array.isArray(taggedV1?.tags) && taggedV1.tags.every(isValidTagPair),
          "v1 tagged: every tag is an object with exactly a string name and a string-or-null color",
        );
        assertTrue(
          Array.isArray(taggedV1?.tags) &&
            taggedV1.tags.map((tag) => tag.name).every((name, i) => name === EXPECTED_ORDER[i]),
          "v1 tagged: tag names, in returned order, equal the same names sorted case-insensitively",
        );
        assertTrue(
          !Object.prototype.hasOwnProperty.call(taggedV1 ?? {}, "event_tags"),
          "v1 tagged: the response does not expose the raw event_tags embed",
        );

        const untaggedV1 = findByTitle(body, UNTAGGED_TITLE);
        assertTrue(untaggedV1 !== undefined, "v1: the untagged fixture event is present in the response");
        assertTrue(
          Object.prototype.hasOwnProperty.call(untaggedV1 ?? {}, "tags"),
          "v1 untagged: response has a tags key",
        );
        assertTrue(
          Array.isArray(untaggedV1?.tags) && untaggedV1.tags.length === 0,
          "v1 untagged: tags is an empty array, not null/undefined/missing",
        );
        assertTrue(
          !Object.prototype.hasOwnProperty.call(untaggedV1 ?? {}, "event_tags"),
          "v1 untagged: the response does not expose the raw event_tags embed",
        );

        // A tag whose color was never set (the tagged fixture's zulu/alpha/
        // mike tags) must come back as null — never an empty string or a
        // missing key.
        const uncoloredTag = taggedV1?.tags?.find((tag) => tag.name === TAG_ALPHA);
        assertTrue(
          uncoloredTag !== undefined && uncoloredTag.color === null,
          "v1: a tag whose color was never set returns color: null (not an empty string or missing key)",
        );
      }

      // ----------------------------------------------------------------
      // Color round trip (plan 02-02, Task 2): a color set directly on the
      // tags table survives GET /api/events verbatim.
      // ----------------------------------------------------------------
      {
        const { status, body } = await fetchEvents(
          "v=1&order_by=id&order_direction=desc&page_size=25&include_past=true",
        );
        assertTrue(status === 200, "color: GET /api/events returns 200");

        const coloredV1 = findByTitle(body, COLORED_TITLE);
        assertTrue(coloredV1 !== undefined, "color: the colored fixture event is present in the response");
        assertTrue(
          Array.isArray(coloredV1?.tags) && coloredV1.tags.length === 1,
          "color: the colored fixture carries exactly one tag",
        );
        assertTrue(
          coloredV1?.tags?.[0]?.name === TAG_COLORED,
          "color: the colored fixture's tag name matches",
        );
        assertTrue(
          coloredV1?.tags?.[0]?.color === TAG_COLOR_HEX,
          `color: the colored fixture's tag color round-trips verbatim as ${TAG_COLOR_HEX}`,
        );
      }

      // ----------------------------------------------------------------
      // v2: the {meta, data} envelope carries the same flattened shape,
      // proving the flattening runs once ahead of the version branch
      // ----------------------------------------------------------------
      {
        const { status, body } = await fetchEvents(
          "v=2&order_by=id&order_direction=desc&page_size=25&include_past=true",
        );
        assertTrue(status === 200, "v2: GET /api/events returns 200");
        assertTrue(typeof body?.meta?.total === "number", "v2: meta.total is a number");
        assertTrue(Array.isArray(body?.data), "v2: data is an array");

        const taggedV2 = findByTitle(body?.data, TAGGED_TITLE);
        assertTrue(taggedV2 !== undefined, "v2: the tagged fixture event is present in data");
        assertTrue(
          Array.isArray(taggedV2?.tags) &&
            taggedV2.tags.every(isValidTagPair) &&
            taggedV2.tags.map((tag) => tag.name).every((name, i) => name === EXPECTED_ORDER[i]),
          "v2: the tagged fixture carries the same sorted { name, color } tags shape as v1",
        );
      }

      // ----------------------------------------------------------------
      // v2 pagination is undisturbed by the join
      // ----------------------------------------------------------------
      {
        const { status, body } = await fetchEvents("v=2&page_size=1");
        assertTrue(status === 200, "v2 pagination: GET /api/events?page_size=1 returns 200");
        assertTrue(
          Array.isArray(body?.data) && body.data.length === 1,
          "v2 pagination: data.length is exactly 1",
        );
        assertTrue(
          Array.isArray(body?.data?.[0]?.tags),
          "v2 pagination: the single returned event still carries a tags array",
        );
      }

      // ----------------------------------------------------------------
      // ?tags= single tag (Phase 4, plan 04-01, Task 3, API-01): only the
      // fixture carrying the requested tag is present; every other fixture
      // in this file (tagged/untagged/colored) is absent.
      // ----------------------------------------------------------------
      {
        const { status, body } = await fetchEvents(
          `v=1&tags=${encodeURIComponent(TAG_FILTER)}&include_past=true&page_size=25`,
        );
        assertTrue(status === 200, "?tags= single: GET /api/events?tags=<tag> returns 200");
        assertTrue(
          findByTitle(body, FILTER_TITLE) !== undefined,
          "?tags= single: the filter-target fixture is present in the response",
        );
        assertTrue(
          findByTitle(body, TAGGED_TITLE) === undefined,
          "?tags= single: the tagged fixture (different tags) is absent",
        );
        assertTrue(
          findByTitle(body, UNTAGGED_TITLE) === undefined,
          "?tags= single: the untagged fixture is absent",
        );
        assertTrue(
          findByTitle(body, COLORED_TITLE) === undefined,
          "?tags= single: the colored fixture (different tag) is absent",
        );
      }

      // ----------------------------------------------------------------
      // ?tags= case-insensitive (D-05): an upper-cased spelling of the
      // stored tag name returns the identical fixture-title set as the
      // lower-case spelling above.
      // ----------------------------------------------------------------
      {
        const { status, body } = await fetchEvents(
          `v=1&tags=${encodeURIComponent(TAG_FILTER.toUpperCase())}&include_past=true&page_size=25`,
        );
        assertTrue(status === 200, "?tags= case-insensitive: GET /api/events?tags=<TAG> returns 200");
        assertTrue(
          findByTitle(body, FILTER_TITLE) !== undefined,
          "?tags= case-insensitive (D-05): an upper-cased spelling still matches the filter-target fixture",
        );
      }

      // ----------------------------------------------------------------
      // ?tags= zero-match (D-04/D-06, RESEARCH Pitfall 1): a tag name no
      // fixture carries returns a well-formed empty 200 under both v1 and
      // v2 — never a 4xx/5xx, and never a special-cased shape.
      // ----------------------------------------------------------------
      {
        const { status, body } = await fetchEvents(
          `v=1&tags=${encodeURIComponent(TAG_FILTER_NONEXISTENT)}&include_past=true`,
        );
        assertTrue(status === 200, "?tags= zero-match v1: GET /api/events?tags=<unknown> returns 200");
        assertTrue(
          Array.isArray(body) && body.length === 0,
          "?tags= zero-match v1: response body is an empty array",
        );
      }
      {
        const { status, body } = await fetchEvents(
          `v=2&tags=${encodeURIComponent(TAG_FILTER_NONEXISTENT)}&include_past=true`,
        );
        assertTrue(status === 200, "?tags= zero-match v2: GET /api/events?tags=<unknown> returns 200");
        assertTrue(
          Array.isArray(body?.data) && body.data.length === 0,
          "?tags= zero-match v2: data is an empty array",
        );
        assertTrue(
          body?.meta?.total === 0 && body?.meta?.total_pages === 0,
          "?tags= zero-match v2: meta.total and meta.total_pages are both 0",
        );
      }

      // ----------------------------------------------------------------
      // ?tags= concurrency (API-01 edge): several identical requests issued
      // in parallel all return 200 with byte-identical bodies — the RPC is
      // a single read-only stable statement and the handler keeps no
      // request-scoped shared state, so interleaving cannot corrupt a
      // response.
      // ----------------------------------------------------------------
      {
        const query = `v=1&tags=${encodeURIComponent(TAG_FILTER)}&include_past=true&page_size=25`;
        const responses = await Promise.all([
          fetchEvents(query),
          fetchEvents(query),
          fetchEvents(query),
          fetchEvents(query),
        ]);
        assertTrue(
          responses.every((res) => res.status === 200),
          "?tags= concurrency: every concurrent identical request returns 200",
        );
        const serialized = responses.map((res) => JSON.stringify(res.body));
        assertTrue(
          serialized.every((body) => body === serialized[0]),
          "?tags= concurrency: every concurrent identical request returns a byte-identical body",
        );
      }
    } finally {
      // Cleanup: delete any leftover fixture events (covers a failed
      // assertion leaving one behind) and every fixture tag row.
      try {
        await serviceClient.from(TABLE_NAME).delete().ilike("title", `${TITLE_PREFIX}${SUFFIX}%`);
      } catch (cleanupError) {
        console.error("cleanup: failed to delete fixture events", cleanupError);
      }
      try {
        await serviceClient.from("tags").delete().in("name", [TAG_ZULU, TAG_ALPHA, TAG_MIKE, TAG_COLORED, TAG_FILTER]);
      } catch (cleanupError) {
        console.error("cleanup: failed to delete fixture tags", cleanupError);
      }
    }
  } finally {
    stopDevServer(devServer);
  }

  if (failures > 0) {
    console.error(`\n${failures} assertion(s) failed.`);
    process.exit(1);
  }

  console.log("\nAll assertions passed.");
}

main().catch((error) => {
  console.error("Unhandled error in verify-events-api.mjs:", error);
  process.exit(1);
});
