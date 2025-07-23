import { SUPABASE_TABLE_NAME } from "$env/static/private";
import type { CountdownDate } from "$lib/types";
import { type RequestHandler, error } from "@sveltejs/kit";
import { compareAsc, parseISO } from "date-fns";
import { titleToSlug } from "$lib/utils/event_helpers";

export const GET: RequestHandler = async(fullRequest) => {
  const { supabase } = fullRequest.locals;
  const { request, setHeaders } = fullRequest;
  const requestURL = new URL(request.url);
  const host = requestURL.host;

  const { data, error: err } = await supabase.from(SUPABASE_TABLE_NAME).select('*');

  if (err) throw error(500, "Internal Server Error");

  setHeaders({
    "Content-Type": "application/xml",
    "cache-control": "public, max-age: 600"
  });

  const body = `<?xml version="1.0" encoding="UTF-8" ?>
  <urlset
    xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
      http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
  >
    <url>
      <loc>https://${host}</loc>
      <changefreq>hourly</changefreq>
      <priority>1.0</priority>
    </url>

    ${ (data as CountdownDate[]).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map(date => `
      <url>
        <loc>${requestURL.protocol}//${host}/event/${date.id}/${titleToSlug(date.title)}</loc>
        <changefreq>hourly</changefreq>
        <priority>${ compareAsc(parseISO(date.date), new Date()) > 0 ? "0.8" : "0.5" }</priority>
      </url>
    `).join("") }
  </urlset>`;

  return new Response(body);
}
