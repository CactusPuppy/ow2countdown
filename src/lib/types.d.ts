import type { Database } from "$lib/database.types";

export type CountdownDate = Database["public"]["Tables"]["upcoming-events"]["Row"];

// A single tag as returned by the API: a name plus an optional color
// override. `color` is nullable to match the `tags.color` DB column, which
// is freeform nullable text with no format constraint (Phase 1 D-13).
export type EventTag = { name: string; color: string | null };

// The legacy `tags` column on `upcoming-events` (a delimited string) was
// dropped from the schema in plan 01-04, so `CountdownDate` no longer declares
// a `tags` field at all. `GET /api/event/{id}` and `GET /api/events` both
// return the normalized tags as an array of name+color pairs instead — this
// is that response shape, shared by both endpoints (D-02: no v1/v2 or
// list-vs-single divergence). `Omit` is kept defensively rather than a plain
// intersection: it stays correct even if a `tags` field is ever reintroduced
// onto `CountdownDate` in the future.
export type CountdownDateWithTags = Omit<CountdownDate, "tags"> & { tags: EventTag[] };

