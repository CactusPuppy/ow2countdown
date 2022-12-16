import type { CountdownDate } from "$lib/types";
import { addSeconds, compareAsc } from "date-fns";
import { writable } from "svelte/store";

const MIN_BACKOFF = 10;
const MAX_BACKOFF = 60;
const BACKOFF_VARIANCE = 0.5;

export const CountdownDateKeys: (keyof CountdownDate)[] = ["date", "description", "end_date", "group", "priority", "tags", "title"];

export type CountdownDateContainer = CountdownDate[] & {errored?: boolean};

function createDates() {
  const { subscribe, update } = writable([] as CountdownDateContainer);

  let updateLocked = false;
  let backoff = MIN_BACKOFF;
  let nextPermissibleUpdate = new Date();

  return {
    subscribe,
    /**
     * Requests an update to the dates container if the most recent request was not too recent.
     * @returns The date at which a new request can be made, or -1 if a request is being processed
     */
    requestUpdate: function updateRequest(): Promise< -1 | Date > {
      if (updateLocked) return new Promise((resolve) => resolve(-1));
      updateLocked = true;

      const now = new Date();
      if (compareAsc(now, nextPermissibleUpdate) < 0) {
        return new Promise((resolve) => resolve(new Date(nextPermissibleUpdate.getTime())));
      }

      return getDates().then(result => {
        update(() => result);

        nextPermissibleUpdate = addSeconds(new Date(), result.length > 0 ? MIN_BACKOFF : backoff);
        if (result.length > 0) {
          backoff = MIN_BACKOFF;
        } else {
          backoff = clamp(backoff + getAdditionalBackoffAmount(backoff), MIN_BACKOFF, MAX_BACKOFF) + Math.random() * BACKOFF_VARIANCE;
        }
        return nextPermissibleUpdate;
      }).catch(error => {
        const result = [] as CountdownDateContainer;
        result.errored = true;
        update(() => result);
        console.error(error);

        nextPermissibleUpdate = addSeconds(new Date(), backoff);
        backoff = clamp(backoff + getAdditionalBackoffAmount(backoff), MIN_BACKOFF, MAX_BACKOFF) + Math.random() * BACKOFF_VARIANCE;
        return nextPermissibleUpdate;
      }).finally(() => {
        updateLocked = false;
      })
    }
  }
}

export const dates = createDates();

async function getDates(): Promise<CountdownDate[]> {
  const response = await fetch("/api/events", {
    redirect: "follow"
  });

  if (!response.ok) throw "API error";

  return await response.json();
}

function clamp(value : number, min : number, max : number) {
  return Math.min(Math.max(value, min), max);
}

function getAdditionalBackoffAmount(number : number) {
  if (number < 15) {
    return 5;
  }
  if (number < 30) {
    return 15;
  }
  if (number < 60) {
    return 30;
  }
  return 60;
}

export function entriesToEventObject(entries: IterableIterator<[string, FormDataEntryValue]>) {
  const result = <Partial<CountdownDate>>Object.fromEntries(Array.from(entries).filter((entry) => (CountdownDateKeys as string[]).includes(entry[0])));

  if (!result.date?.length) delete result.date;
  if (!result.end_date?.length) delete result.end_date;
  if (String(result["priority"]) === "") {
    result.priority = 0;
  } else if (/^\d+$/.test(String(result.priority))) {
    result.priority = Number.parseInt(String(result.priority));
  } else {
    delete result.priority;
  }

  return result;
}
