import { fail, redirect, type Actions } from "@sveltejs/kit";
import { entriesToEventObject } from "../../../stores/dates";
import { SUPABASE_TABLE_NAME } from "$env/static/private";
import type { CountdownDate } from "$lib/types";
import { getSupabase } from "@supabase/auth-helpers-sveltekit";

export const actions: Actions = {
  default: async (event) => {
    const { session, supabaseClient } = await getSupabase(event);
    if (!session) {
      return fail(401, { error: "Unauthorized" });
    }

    const data = await event.request.formData();
    const title = data.get("title");
    if (title.toString().length == 0) {
      return fail(400, { error: "Title is required" });
    }

    const eventData = entriesToEventObject(data.entries());

    const { data: returnedData, error, status, statusText } = await supabaseClient.from(SUPABASE_TABLE_NAME)
      .insert(eventData)
      .select();

    if (error) {
      return fail(status, { error: statusText });
    }
    const returnedEvent = <CountdownDate>returnedData[0];

    throw redirect(302, `/event/${returnedEvent.id}`);
  }
}
