import { SUPABASE_TABLE_NAME } from "$env/static/private";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { CountdownDateWithTags, EventTag } from "$lib/types";
import { compareTagNames } from "$lib/utils/event_helpers";

export const GET: RequestHandler = async (request) => {
  const { params, setHeaders } = request;
  const { supabase } = request.locals;
  const { data, error: err } = await supabase.from(SUPABASE_TABLE_NAME)
    .select("*, event_tags(tags(name, color))")
    .eq("id", params.id);

  if (err) throw error(500, "Database error");

  setHeaders({
    "cache-control": "public, max-age=60"
  });

  if (data.length <= 0) throw error(404, "Not found");

  // Flatten the embedded join into a plain `tags: {name, color}[]` and drop
  // the raw `event_tags` embed property, so the response shape stays the
  // flat event object plus `tags` and nothing else new. Sorted through the
  // shared tag-name comparator imported above (D-02) — the same function
  // the list endpoint's sort calls, so chip order cannot diverge between
  // the two.
  const { event_tags: eventTags, ...event } = data[0];
  const tags: EventTag[] = (eventTags ?? [])
    .map((row: { tags: EventTag | null }) => row.tags)
    .filter((tag: EventTag | null): tag is EventTag => tag !== null)
    .sort(compareTagNames);

  const result: CountdownDateWithTags = { ...event, tags };

  return json(result);
}
