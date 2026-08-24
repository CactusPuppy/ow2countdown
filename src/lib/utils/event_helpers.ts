import type { CountdownDate, CountdownDateWithTags, EventTag } from "$lib/types";
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

export function eventEffectiveDate(event: CountdownDate, now?: Date) {
  if (now == undefined) now = new Date();

  if (parseISO(event.date) < now && event.end_date) return event.end_date;

  return event.date;
}

export function eventRelationToNow(event: CountdownDate, now?: Date) {
  if (parseISO(eventEffectiveDate(event)) < now) {
    if (event.end_date) return "ended";
    return "happened";
  }

  if (isEventHappeningNow(event, now)) {
    return "ends";
  }

  if (event.end_date) {
    return "begins";
  }

   return "occurs";
}

export const TAGS_DELIMITER = ",";

export function splitTags(tags: string): string[] {
  return tags.split(TAGS_DELIMITER).map(tag => tag.trim()).filter(tag => tag.length > 0);
}

// Case-insensitive tag-name comparator, reproduced argument-for-argument from
// the sort callback inlined in both API route files
// (src/routes/api/events/+server.ts, src/routes/api/event/[id]/+server.ts)
// so the filter panel, the event card and both endpoints share one ordering
// convention (D-11).
export function compareTagNames(a: EventTag, b: EventTag): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

// Distinct, sorted available-tag derivation over an event list. Keyed on the
// exact tag.name string (not a lowercased/normalised key) so two tags whose
// names differ only in letter case surface as two separate, adjacently
// sorted chips rather than one silently swallowing the other. This is a
// function of the events passed in and never of the current selection — no
// faceted narrowing lives here (D-09/D-10). Array.prototype.sort is required
// to be stable, so names that compare equal under compareTagNames keep their
// first-encountered insertion order across renders, which is what keeps the
// chip row from reshuffling on every poll.
export function distinctSortedTags(events: CountdownDateWithTags[]): EventTag[] {
  const byName = new Map<string, EventTag>();
  for (const event of events) {
    for (const tag of event.tags) {
      if (!byName.has(tag.name)) byName.set(tag.name, tag);
    }
  }
  return [...byName.values()].sort(compareTagNames);
}

// AND-semantics filter predicate: an event survives only if it carries every
// selected tag name (carries-all-selected, not carries-exactly-the-selected
// — extra tags beyond the selection are fine). Written with an explicit
// empty-selection short-circuit rather than leaning on Array.prototype.every
// being vacuously true over an empty selectedTagNames array, because the
// explicit form documents FILT-04's clearing behaviour. Preserves the
// incoming order and never mutates the input array.
export function filterEventsByTags(
  events: CountdownDateWithTags[],
  selectedTagNames: string[],
): CountdownDateWithTags[] {
  if (selectedTagNames.length === 0) return events;

  return events.filter((event) =>
    selectedTagNames.every((name) => event.tags.some((tag) => tag.name === name)),
  );
}
