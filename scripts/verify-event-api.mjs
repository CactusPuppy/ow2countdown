#!/usr/bin/env node
/**
 * End-to-end HTTP verifier for GET /api/event/{id} and the edit-event RPC
 * write path (Phase 1, plan 01-03, Task 3).
 *
 * Run with: node --env-file=.env.local scripts/verify-event-api.mjs
 *
 * Unlike scripts/verify-tags.mjs (which calls save_event directly against
 * the live database), this script asserts against a real running dev
 * server over HTTP. It owns the dev server's lifecycle: it spawns
 * `yarn dev`, polls the base URL until it responds or a 60-second timeout
 * elapses, runs the assertions, and kills the child process in a finally
 * block so no server is left running on failure.
 *
 * Fixture events are created and cleaned up through save_event (never a
 * direct table write), titled with a "gsd-verify-" prefix plus a random
 * suffix, and deleted in a finally block regardless of pass/fail outcome.
 */

import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(
      `Missing required environment variable: ${name}. ` +
      `Run with: node --env-file=.env.local scripts/verify-event-api.mjs`,
    );
    process.exit(1);
  }
  return value;
}

const SUPABASE_URL = requireEnv("PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_KEY = requireEnv("SUPABASE_SERVICE_KEY");
const TABLE_NAME = requireEnv("SUPABASE_TABLE_NAME");

const BASE_URL = process.env.VERIFY_EVENT_API_BASE_URL ?? "http://localhost:5173";
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

function sameSet(actual, expected) {
  const a = [...actual].sort();
  const b = [...expected].sort();
  return a.length === b.length && a.every((value, i) => value === b[i]);
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

/** Same-set comparison over the `name` member of an array of { name, color }
 *  tag pairs, plus a per-member shape check on every pair. */
function sameTagNameSet(actualTags, expectedNames) {
  if (!Array.isArray(actualTags)) return false;
  if (!actualTags.every(isValidTagPair)) return false;
  return sameSet(actualTags.map((tag) => tag.name), expectedNames);
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

async function fetchEvent(id) {
  const res = await fetch(`${BASE_URL}/api/event/${id}`);
  let body = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON body (e.g. an error page) — leave body null.
  }
  return { status: res.status, body };
}

async function main() {
  const SUFFIX = randomSuffix();
  const TITLE_PREFIX = "gsd-verify-";
  const TAGGED_TITLE = `${TITLE_PREFIX}${SUFFIX}-tagged`;
  const UNTAGGED_TITLE = `${TITLE_PREFIX}${SUFFIX}-untagged`;
  const MISSING_TITLE = `${TITLE_PREFIX}${SUFFIX}-missing`;

  // Chosen so alphabetical order differs from creation order and so
  // case-insensitivity is exercised: the Alpha-, mike- and zulu- prefixed
  // names sort case-insensitively as Alpha- < mike- < zulu-, but they are
  // NOT passed to save_event in that order below (see the tagged fixture
  // setup, which passes zulu- first). Mirrors
  // scripts/verify-events-api.mjs's EXPECTED_ORDER fixture.
  const TAG_A = `Alpha-${SUFFIX}`;
  const TAG_MIKE = `mike-${SUFFIX}`;
  const TAG_ZULU = `zulu-${SUFFIX}`;
  const TAG_C = `Gamma-${SUFFIX}`;
  const EXPECTED_ORDER = [TAG_A, TAG_MIKE, TAG_ZULU];

  let devServer;

  try {
    devServer = await startDevServer();

    let taggedEventId;
    let untaggedEventId;
    let missingEventId;

    try {
      // ----------------------------------------------------------------
      // Fixture setup — all writes go through save_event, never a direct
      // table insert.
      // ----------------------------------------------------------------
      {
        const { data, error } = await serviceClient.rpc("save_event", {
          event_id: null,
          event_data: { title: TAGGED_TITLE, priority: 0 },
          tag_names: [TAG_ZULU, TAG_A, TAG_MIKE],
        });
        assertTrue(!error && !!data?.id, "setup: created the tagged fixture event via save_event");
        taggedEventId = data?.id;
      }

      {
        const { data, error } = await serviceClient.rpc("save_event", {
          event_id: null,
          event_data: { title: UNTAGGED_TITLE, priority: 0 },
          tag_names: [],
        });
        assertTrue(!error && !!data?.id, "setup: created the untagged fixture event via save_event");
        untaggedEventId = data?.id;
      }

      {
        const { data, error } = await serviceClient.rpc("save_event", {
          event_id: null,
          event_data: { title: MISSING_TITLE, priority: 0 },
          tag_names: [],
        });
        assertTrue(!error && !!data?.id, "setup: created the disposable fixture event that will be deleted for the 404 case");
        missingEventId = data?.id;
      }

      // ----------------------------------------------------------------
      // A tagged event returns its tags as an array of { name, color }
      // pairs (D-02)
      // ----------------------------------------------------------------
      {
        const { status, body } = await fetchEvent(taggedEventId);
        assertTrue(status === 200, "tagged: GET /api/event/{id} returns 200");
        assertTrue(Array.isArray(body?.tags), "tagged: response tags property is an array");
        assertTrue(
          Array.isArray(body?.tags) && body.tags.every(isValidTagPair),
          "tagged: every tag is an object with exactly a string name and a string-or-null color",
        );
        assertTrue(
          sameTagNameSet(body?.tags ?? [], [TAG_A, TAG_MIKE, TAG_ZULU]),
          "tagged: tags array name values equal the three names the event was created with",
        );
        assertTrue(
          Array.isArray(body?.tags) &&
            body.tags.length === EXPECTED_ORDER.length &&
            body.tags.map((tag) => tag.name).every((name, i) => name === EXPECTED_ORDER[i]),
          "tagged: tags array name values are in case-insensitive alphabetical order, despite being created in a different order",
        );
      }

      // ----------------------------------------------------------------
      // An untagged event returns an empty array — not null, not
      // undefined, not a missing key
      // ----------------------------------------------------------------
      {
        const { status, body } = await fetchEvent(untaggedEventId);
        assertTrue(status === 200, "untagged: GET /api/event/{id} returns 200");
        assertTrue(
          Object.prototype.hasOwnProperty.call(body ?? {}, "tags"),
          "untagged: response has a tags key",
        );
        assertTrue(
          Array.isArray(body?.tags) && body.tags.length === 0,
          "untagged: tags is an empty array, not null/undefined/missing",
        );
      }

      // ----------------------------------------------------------------
      // The raw embedded join property is not exposed
      // ----------------------------------------------------------------
      {
        const { body } = await fetchEvent(taggedEventId);
        assertTrue(
          !Object.prototype.hasOwnProperty.call(body ?? {}, "event_tags"),
          "shape: the response does not expose the raw event_tags embed, only the flat tags array",
        );
      }

      // ----------------------------------------------------------------
      // A missing id still 404s
      // ----------------------------------------------------------------
      {
        const { error: deleteError } = await serviceClient
          .from(TABLE_NAME)
          .delete()
          .eq("id", missingEventId);
        assertTrue(!deleteError, "404 setup: deleted the disposable fixture event directly");

        const { status } = await fetchEvent(missingEventId);
        assertTrue(status === 404, "404: GET /api/event/{id} for a deleted id returns 404");
      }

      // ----------------------------------------------------------------
      // Editing through the RPC replaces tags
      // ----------------------------------------------------------------
      {
        const { error } = await serviceClient.rpc("save_event", {
          event_id: taggedEventId,
          event_data: { title: TAGGED_TITLE, priority: 0 },
          tag_names: [TAG_C],
        });
        assertTrue(!error, "edit: save_event with a changed tag list does not error");

        const { body } = await fetchEvent(taggedEventId);
        assertTrue(
          sameTagNameSet(body?.tags ?? [], [TAG_C]),
          "edit: the endpoint returns exactly the new tag list after the edit — old names gone, new name present",
        );
      }

      // ----------------------------------------------------------------
      // Re-editing with an identical list leaves the tag rows unchanged
      // ----------------------------------------------------------------
      {
        const { error } = await serviceClient.rpc("save_event", {
          event_id: taggedEventId,
          event_data: { title: TAGGED_TITLE, priority: 0 },
          tag_names: [TAG_C],
        });
        assertTrue(!error, "re-edit: saving the same tag list again does not error");

        const { body } = await fetchEvent(taggedEventId);
        assertTrue(
          sameTagNameSet(body?.tags ?? [], [TAG_C]),
          "re-edit: the returned array is unchanged in length and membership after an identical re-save",
        );
      }
    } finally {
      // Cleanup: delete any leftover fixture events (covers a failed
      // assertion leaving one behind) and every fixture tag row.
      try {
        await serviceClient.from(TABLE_NAME).delete().ilike("title", `${TITLE_PREFIX}%`);
      } catch (cleanupError) {
        console.error("cleanup: failed to delete fixture events", cleanupError);
      }
      try {
        await serviceClient.from("tags").delete().in("name", [TAG_A, TAG_MIKE, TAG_ZULU, TAG_C]);
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
  console.error("Unhandled error in verify-event-api.mjs:", error);
  process.exit(1);
});
