import { SUPABASE_TABLE_NAME } from "$env/static/private";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { CountdownDateWithTags } from "$lib/types";

export const GET: RequestHandler = async (request) => {
  const { params, setHeaders } = request;
  const { supabase } = request.locals;
  const { data, error: err } = await supabase.from(SUPABASE_TABLE_NAME)
    .select("*, event_tags(tags(name))")
    .eq("id", params.id);

  if (err) throw error(500, "Database error");

  setHeaders({
    "cache-control": "public, max-age=60"
  });

  if (data.length <= 0) throw error(404, "Not found");

  // Flatten the embedded join into a plain `tags: string[]` and drop the raw
  // `event_tags` embed property, so the response shape stays the flat event
  // object plus `tags` and nothing else new.
  const { event_tags: eventTags, ...event } = data[0];
  const tags: string[] = (eventTags ?? [])
    .map((row: { tags: { name: string } | null }) => row.tags?.name)
    .filter((name: string | undefined): name is string => Boolean(name));

  const result: CountdownDateWithTags = { ...event, tags };

  return json(result);
}
