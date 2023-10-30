import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { getSupabase } from "@supabase/auth-helpers-sveltekit";
import { formatISO } from "date-fns";
import { SUPABASE_TABLE_NAME } from '$env/static/private'


export const GET: RequestHandler = async (request) => {
  const { supabaseClient } = await getSupabase(request);
  const { url: { searchParams }, setHeaders } = request;

  let pageNum = Number.parseInt(searchParams.get("page"), 10) || 1;
  pageNum = pageNum < 1 ? 1 : pageNum;

  const DATES_PAGE_SIZE = 25;

  let query = supabaseClient.from(SUPABASE_TABLE_NAME)
    .select("*")
    .order("priority", {ascending: false})
    .order("date", {ascending: true})

  const includePast = searchParams.get("include_past") === "true";
  if (!includePast) { query = query.or(`date.gte.${formatISO(new Date())},end_date.gte.${formatISO(new Date())},date.is.null`) }

  query = query.range((pageNum - 1) * DATES_PAGE_SIZE, (pageNum * DATES_PAGE_SIZE) - 1);

  const { data, error: err } = await query;

  if (err) throw error(500, "Database error");

  setHeaders({
    "cache-control": "public, max-age=60"
  })
  return json(data);
}
