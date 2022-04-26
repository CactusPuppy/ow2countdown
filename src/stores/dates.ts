import client from "$lib/db";

import type { CountdownDate } from "$lib/types";
import { writable } from "svelte/store";

const tableName = "Upcoming Dates";
const select = `id, title, description, date`;

export const dates = writable([] as CountdownDate[]);

export async function getDates(): Promise<CountdownDate[]> {
  const { data, error } = await client.from(tableName).select(select).order("date", {ascending: true});

  if (error) throw new Error(error.message);

  return data;
}
