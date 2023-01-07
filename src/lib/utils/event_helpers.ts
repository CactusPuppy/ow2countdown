import type { CountdownDate } from "$lib/types";
import { parseISO } from "date-fns";

export function titleToSlug(title: string) {
  return title.toLowerCase()
    .replace(/\[.*?\]/g, "")       // REMOVE STATUS MESSAGES
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/ +/g, "-");
}

export function isEventHappeningNow(event: CountdownDate, now?: Date) {
  if (now == undefined) now = new Date();

  return event && event.date && event.end_date
    && parseISO(event.date) < now
    && parseISO(event.end_date) > now;
}
