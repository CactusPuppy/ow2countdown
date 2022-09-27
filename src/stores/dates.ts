import client from "$lib/db";

import type { CountdownDate } from "$lib/types";
import { addSeconds, addMinutes, addHours, addDays, formatISO } from "date-fns";
import { writable } from "svelte/store";

const tableName = "Upcoming Dates";
const select = `id, title, description, date`;

export const dates = writable([] as CountdownDate[]);
export const DATES_PAGE_SIZE = 10;

export async function getDates(page = 0): Promise<CountdownDate[]> {
  // return [
  //   {
  //     id: 1,
  //     title: "The End of the World",
  //     description: "The end of the world is coming",
  //     date: "2022-06-08T17:10:00-07:00",
  //   },
  //   {
  //     id: 2,
  //     title: "The End of the World 2",
  //     description: "The end of the world is coming again",
  //     date: formatISO(addSeconds(addDays(new Date(), 1), 17)),
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
