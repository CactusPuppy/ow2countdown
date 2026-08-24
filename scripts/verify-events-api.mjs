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

  // Chosen so alphabetical order differs from creation order and so
  // case-insensitivity is exercised: "Alpha" sorts before "mike" sorts
  // before "zulu" case-insensitively, but they are NOT passed in that order
  // below.
  const TAG_ZULU = `zulu-${SUFFIX}`;
  const TAG_ALPHA = `Alpha-${SUFFIX}`;
  const TAG_MIKE = `mike-${SUFFIX}`;
  const EXPECTED_ORDER = [TAG_ALPHA, TAG_MIKE, TAG_ZULU];

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
    } finally {
      // Cleanup: delete any leftover fixture events (covers a failed
      // assertion leaving one behind) and every fixture tag row.
      try {
        await serviceClient.from(TABLE_NAME).delete().ilike("title", `${TITLE_PREFIX}${SUFFIX}%`);
      } catch (cleanupError) {
        console.error("cleanup: failed to delete fixture events", cleanupError);
      }
      try {
        await serviceClient.from("tags").delete().in("name", [TAG_ZULU, TAG_ALPHA, TAG_MIKE]);
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
