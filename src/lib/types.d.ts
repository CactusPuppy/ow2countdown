import type { Database } from "$lib/database.types";

export type CountdownDate = Database["public"]["Tables"]["upcoming-events"]["Row"];

// The `tags` column on `upcoming-events` is legacy (a delimited string) and is
// dropped from the schema in plan 01-04. `GET /api/event/{id}` now returns the
// normalized tag names as an array instead — this is that response shape.
// `Omit` (not a plain intersection) is required: `CountdownDate` still declares
// `tags: string | null` at this point in the phase, and intersecting a wider
// type with a narrower `tags: string[]` would resolve the property to `never`.
export type CountdownDateWithTags = Omit<CountdownDate, "tags"> & { tags: string[] };

