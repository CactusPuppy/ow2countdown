import type { Database } from "$lib/database.types";

export type CountdownDate = Database["public"]["Tables"]["upcoming-events"]["Row"];

// The legacy `tags` column on `upcoming-events` (a delimited string) was
// dropped from the schema in plan 01-04, so `CountdownDate` no longer declares
// a `tags` field at all. `GET /api/event/{id}` returns the normalized tag
// names as an array instead — this is that response shape. `Omit` is kept
// defensively rather than a plain intersection: it stays correct even if a
// `tags` field is ever reintroduced onto `CountdownDate` in the future.
export type CountdownDateWithTags = Omit<CountdownDate, "tags"> & { tags: string[] };

