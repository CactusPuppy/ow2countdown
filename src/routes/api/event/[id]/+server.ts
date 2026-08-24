import { SUPABASE_TABLE_NAME } from "$env/static/private";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { CountdownDateWithTags, EventTag } from "$lib/types";

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
  // flat event object plus `tags` and nothing else new. Sorted the same way
  // as the list endpoint (D-02) so chip order is identical across both.
  const { event_tags: eventTags, ...event } = data[0];
  const tags: EventTag[] = (eventTags ?? [])
    .map((row: { tags: EventTag | null }) => row.tags)
    .filter((tag: EventTag | null): tag is EventTag => tag !== null)
    .sort((a: EventTag, b: EventTag) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  const result: CountdownDateWithTags = { ...event, tags };

  return json(result);
}
