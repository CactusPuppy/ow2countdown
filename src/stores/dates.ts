import client from "$lib/db";

import type { CountdownDate } from "$lib/types";
import { addSeconds, addMinutes, addHours, addDays, formatISO } from "date-fns";
import { writable } from "svelte/store";

const tableName = "Upcoming Dates";
const select = `id, title, description, date`;

export const dates = writable([] as CountdownDate[]);

export async function getDates(): Promise<CountdownDate[]> {
  // return [
  //   {
  //     id: 1,
  //     title: "The End of the World",
  //     description: "The end of the world is coming",
  //     date: formatISO(addSeconds(addDays(new Date(), 1), 7)),
  //   }
  // ]
  const { data, error } = await client.from(tableName).select(select).order("date", {ascending: true});

  if (error) throw new Error(error.message);

  return data;
}
