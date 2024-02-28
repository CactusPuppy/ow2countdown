import { fail, redirect, type Actions } from "@sveltejs/kit";
import { entriesToEventObject } from "../../../../../stores/dates";
import { SUPABASE_TABLE_NAME } from "$env/static/private";
import type { CountdownDate } from "$lib/types";
import { getSupabase } from "@supabase/auth-helpers-sveltekit";

export const actions: Actions = {
  default: async (event) => {
    const { session, supabaseClient } = await getSupabase(event);
    if (!session) {
      return fail(401, { error: "Unauthorized" });
    }

    const { error, status, statusText } = await supabaseClient.from(SUPABASE_TABLE_NAME)
      .delete()
      .eq("id", event.params.id);

    if (error) {
      return fail(status, { error: statusText });
    }

    throw redirect(301, `/`);
  }
}
