import client from "$lib/db";

import type { CountdownDate } from "$lib/types";
// import { addSeconds, addMinutes, addHours, addDays, formatISO, parseISO } from "date-fns";
import { writable } from "svelte/store";

const tableName = "Upcoming Dates";
const select = `id, title, description, date, group`;

export const dates = writable([] as CountdownDate[]);
export const DATES_PAGE_SIZE = 50;

export async function getDates(page = 0): Promise<CountdownDate[]> {
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
    .order("priority", {ascending: false})
    .order("date", {ascending: true})
    .range(page * DATES_PAGE_SIZE, (page + 1) * DATES_PAGE_SIZE);

  if (error) throw new Error(error.message);

  return data;
}
