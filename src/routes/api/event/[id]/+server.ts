import { SUPABASE_TABLE_NAME } from "$env/static/private";
import db from "$lib/db";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ params, setHeaders }) => {
  const { data, error: err } = await db.from(SUPABASE_TABLE_NAME)
    .select("*")
    .eq("id", params.id);

  if (err) throw error(500, "Database error");

  setHeaders({
    "cache-control": "public, max-age=60"
  });

  if (data.length <= 0) throw error(404, "Not found");

  return json(data[0]);
}
