import client from "$lib/db";

import type { CountdownDate } from "$lib/types";
import type { PostgrestError } from "@supabase/supabase-js";
import { addSeconds, addMinutes, addHours, addDays, formatISO, getDate, compareAsc, differenceInSeconds } from "date-fns";
import { writable } from "svelte/store";

const tableName = "Upcoming Dates";
const select = `id, title, description, date, group`;

export const DATES_PAGE_SIZE = 25;

const MIN_BACKOFF = 10;
const MAX_BACKOFF = 60;
const BACKOFF_VARIANCE = 0.5;

export type CountdownDateContainer = CountdownDate[] & {errored?: boolean}

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
        return new Promise((resolve, _) => resolve(new Date(nextPermissibleUpdate.getTime())));
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

async function getDates(page = 0): Promise<CountdownDate[]> {
  // const timeInTheFuture = "2022-10-06T17:57:00-07:00";
  // return [
  //   {
  //     id: 1,
  //     title: "The End of the World",
  //     description: "The end of the world is coming",
  //     date: timeInTheFuture,
  //     priority: 0,
  //     group: "ohno",
  //   },
  //   {
  //     id: 2,
  //     title: "The End of the World 2",
  //     description: "The end of the world is coming again",
  //     date: formatISO(addSeconds(addDays(parseISO(timeInTheFuture), 1), 17)),
  //     priority: 0,
  //     group: "ohno",
  //   },
  //   {
  //     id: 3,
  //     title: "A new element",
  //     description: "asdf",
  //     date: formatISO(addSeconds(addDays(parseISO(timeInTheFuture), 1), 17)),
  //     priority: 0,
  //     group: null
  //   }
  // ]
  const { data, error } = await client.from(tableName)
    .select(select)
    .gte("date", formatISO(new Date()))
    .order("priority", {ascending: false})
    .order("date", {ascending: true})
    .range(page * DATES_PAGE_SIZE, (page + 1) * DATES_PAGE_SIZE);

  if (error) throw new Error(error.message);

  return data;
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

// FIXME: SOME DEBUG STUFF LOL

// client.removeAllSubscriptions();

// const subscription = client
//   .from('*')
//   .on("*", (payload) => { console.log(payload) })
//   .subscribe((status) => { console.log("Subscription status: ", status) });

// console.log(subscription);
