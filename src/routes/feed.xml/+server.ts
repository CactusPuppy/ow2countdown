import { SUPABASE_TABLE_NAME } from "$env/static/private";
import { getSupabase } from "@supabase/auth-helpers-sveltekit";
import type { CountdownDate } from "$lib/types";
import { type RequestHandler, error } from "@sveltejs/kit";
import { formatRFC7231, parseISO, isAfter, sub } from "date-fns";
import { eventEffectiveDate, titleToSlug } from "$lib/utils/event_helpers";
import { toXML } from "jstoxml";
import { markdownToPlaintext } from "$lib/utils/string_helpers";


export const GET: RequestHandler = async(fullRequest) => {
  const { supabaseClient } = await getSupabase(fullRequest);
  const { request, setHeaders } = fullRequest;
  const requestURL = new URL(request.url);
  const host = requestURL.host;

  const { data, error: err } = await supabaseClient.from(SUPABASE_TABLE_NAME).select('*');

  if (err) throw error(500, "Internal Server Error");

  setHeaders({
    "Content-Type": "application/xml",
    "cache-control": "public, max-age: 600"
  });

  const nowDate = new Date();

  const items = (data as CountdownDate[])
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
    .filter((event) => isAfter(parseISO(eventEffectiveDate(event, nowDate)), sub(nowDate, { weeks: 1 }))).map(event => {
    const baseItem = {
      title: event.title,
      link: `${requestURL.protocol}//${host}/event/${event.id}/${titleToSlug(event.title)}`,
      guid: `${requestURL.protocol}//${host}/event/${event.id}/${titleToSlug(event.title)}`,
      description: `${event.date ? `Event Date: ${formatRFC7231(parseISO(event.date))} | ` : ""}${event.end_date ? `Event End Date: ${formatRFC7231(parseISO(event.end_date))} | ` : ""}${markdownToPlaintext(event.description)}`,
      pubDate: formatRFC7231(parseISO(event.created_at)),
    };
    if (event.date) baseItem["eventDate"] = formatRFC7231(parseISO(event.date));
    if (event.end_date) baseItem["eventEndDate"] = formatRFC7231(parseISO(event.end_date));
    return {
      item: baseItem
    };
  })

  const body = toXML({
    _name: "rss",
    _attrs: [
      { 'version': "2.0" },
      { 'xmlns:atom': "http://www.w3.org/2005/Atom" }
    ],
    _content: {
      channel: [
        { title: "OW2Countdown" },
        { description: "Count down to important Overwatch 2 events" },
        { link: `${requestURL.protocol}//${requestURL.host}/` },
        { language: "en-us" },
        { _name: "atom:link", _attrs: { href: "http://ow2countdown.com/feed.xml", rel: "self", type: "application/rss+xml" } },
        ...[items]
      ]
    }
  }, {
    header: true,
    indent: '  '
  });

  return new Response(body);
}
