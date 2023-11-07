import { error, json, type RequestEvent } from "@sveltejs/kit"
import type { RequestHandler } from "@sveltejs/kit";
import { getSupabase } from "@supabase/auth-helpers-sveltekit";
import { formatISO } from "date-fns";
import { SUPABASE_TABLE_NAME } from '$env/static/private'

const DEFAULT_VERSION = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 25;

const SUPPORTED_ORDER_BY = ["date", "id"];
const SUPPORTED_VERSIONS = [1, 2];

export const GET: RequestHandler = async (request) => {
  const { supabaseClient } = await getSupabase(request);
  const { setHeaders } = request;
  const filters = getRequestFilters(request);

  let query = supabaseClient.from(SUPABASE_TABLE_NAME)
      .select("*", { count: filters.version === 2 ? "exact" : undefined })

  // if there is no order by, use the default sort of priority and date which is used by the homepage
  if (!filters.orderBy) {
    query = query
        .order("priority", { ascending: false })
        .order("date", { ascending: true })
  } else {
    query = query.order(filters.orderBy, { ascending: filters.orderDirection === "asc" })
  }

  // if we aren't including past events, limit the query to only events that are currently happening or in the future
  if (!filters.includePast) {
    query = query.or(`date.gte.${formatISO(new Date())},end_date.gte.${formatISO(new Date())},date.is.null`)
  }

  query = query.range((filters.pageNum - 1) * filters.pageSize, (filters.pageNum * filters.pageSize) - 1);

  const { data, error: err, count, status } = await query;

  if (err) throw error(500, "Database error");

  setHeaders({
    "cache-control": "public, max-age=60"
  })

  if (filters.version === 2) {
    return json({
      meta: {
        total: count,
        total_pages: Math.ceil(count / filters.pageSize)
      },
      data
    });
  }

  return json(data);
}

function getRequestFilters (request: RequestEvent) {
  const searchParams = request.url.searchParams;

  let version = Number.parseInt(searchParams.get("v"), 10);
  version = SUPPORTED_VERSIONS.includes(version) ? version : DEFAULT_VERSION;

  let orderBy = searchParams.get("order_by");
  orderBy = SUPPORTED_ORDER_BY.includes(orderBy) ? orderBy : null;

  let pageNum = Number.parseInt(searchParams.get("page"), 10) || 1;
  pageNum = pageNum < 1 ? 1 : pageNum;

  let pageSize = Number.parseInt(searchParams.get("page_size"), 10) || DEFAULT_PAGE_SIZE;
  pageSize = (pageSize < 1 || pageSize > MAX_PAGE_SIZE) ? DEFAULT_PAGE_SIZE : pageSize;

  const orderDirection = searchParams.get("order_direction") === "desc" ? "desc" : "asc";
  const includePast = searchParams.get("include_past") === "true";

  return {
    version,
    orderBy,
    pageNum,
    pageSize,
    orderDirection,
    includePast
  }
}
