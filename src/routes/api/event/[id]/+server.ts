import { SUPABASE_TABLE_NAME } from "$env/static/private";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import { getSupabase } from "@supabase/auth-helpers-sveltekit";

export const GET: RequestHandler = async (request) => {
  const { supabaseClient } = await getSupabase(request);
  const { params, setHeaders } = request;
  const { data, error: err } = await supabaseClient.from(SUPABASE_TABLE_NAME)
    .select("*")
    .eq("id", params.id);

  if (err) throw error(500, "Database error");

  setHeaders({
    "cache-control": "public, max-age=60"
  });

  if (data.length <= 0) throw error(404, "Not found");

  return json(data[0]);
}
