import { error, json, type RequestEvent } from "@sveltejs/kit"
import type { RequestHandler } from "@sveltejs/kit";
import { formatISO } from "date-fns";
import { SUPABASE_TABLE_NAME } from '$env/static/private'
import type { EventTag } from "$lib/types";
import { compareTagNames, splitTags } from "$lib/utils/event_helpers";

const DEFAULT_VERSION = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 25;

const SUPPORTED_ORDER_BY = ["date", "id"];
const SUPPORTED_VERSIONS = [1, 2];

export const GET: RequestHandler = async (request) => {
  const { supabase } = request.locals;
  const { setHeaders } = request;
  const filters = getRequestFilters(request);

  let query = supabase.from(SUPABASE_TABLE_NAME)
      .select("*, event_tags(tags(name, color))", { count: filters.version === 2 ? "exact" : undefined })

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

  // if a tags filter is present, narrow the same query object (the one
  // count: "exact" was set on above) to only the event ids the RPC reports
  // as carrying every requested tag (D-01/D-02/D-03). A zero-match result is
  // a normal outcome (D-06), so it short-circuits to an empty response
  // rather than ever calling .in("id", []) — postgrest-js@1.19.4 builds an
  // empty .in() into the literal `id=in.()`, a shape PostgREST has a
  // documented history of mishandling (RESEARCH Pitfall 1).
  if (filters.tags) {
    const { data: matches, error: rpcErr } = await supabase.rpc(
      "events_matching_all_tags",
      { tag_names: filters.tags }
    );

    if (rpcErr) throw error(500, "Database error");

    const matchingIds = (matches ?? []).map((row: { event_id: number }) => row.event_id);

    if (matchingIds.length === 0) {
      setHeaders({
        "cache-control": "public, max-age=60"
      })

      return filters.version === 2
        ? json({ meta: { total: 0, total_pages: 0 }, data: [] })
        : json([]);
    }

    query = query.in("id", matchingIds);
  }

  query = query.range((filters.pageNum - 1) * filters.pageSize, (filters.pageNum * filters.pageSize) - 1);

  const { data, error: err, count, status } = await query;

  if (err) throw error(500, "Database error");

  setHeaders({
    "cache-control": "public, max-age=60"
  })

  // Flatten the embedded join into a plain `tags: {name, color}[]` per row
  // and drop the raw `event_tags` embed property, so every event object
  // keeps its existing shape plus a `tags` field and nothing else new. This
  // runs once, ahead of the version branch, so both the v1 plain array and
  // the v2 {meta, data} envelope are fed from the same transformed array.
  const flattenedData = (data ?? []).map((row) => {
    const { event_tags: eventTags, ...event } = row;
    const tags: EventTag[] = (eventTags ?? [])
      .map((link: { tags: EventTag | null }) => link.tags)
      .filter((tag: EventTag | null): tag is EventTag => tag !== null)
      .sort(compareTagNames);

    return { ...event, tags };
  });

  if (filters.version === 2) {
    return json({
      meta: {
        total: count,
        total_pages: Math.ceil(count / filters.pageSize)
      },
      data: flattenedData
    });
  }

  return json(flattenedData);
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

  // D-07/D-08/D-09: clean via the shared splitTags() utility (comma-split,
  // trim, drop-empty), then dedup with a Set. An absent param, a bare
  // "?tags=", and a param whose entries are all blank/whitespace all
  // converge on null, the unfiltered sentinel.
  const rawTags = searchParams.get("tags");
  const cleanedTags = rawTags ? splitTags(rawTags) : [];
  const tags = cleanedTags.length > 0 ? [...new Set(cleanedTags)] : null;

  return {
    version,
    orderBy,
    pageNum,
    pageSize,
    orderDirection,
    includePast,
    tags
  }
}
