import { fail, redirect, type Actions } from "@sveltejs/kit";
import { entriesToEventObject } from "../../../../../stores/dates";
import { SUPABASE_TABLE_NAME } from "$env/static/private";

export const actions: Actions = {
  default: async (event) => {
    const { user, supabase } = event.locals;
    if (!user) {
      return fail(401, { error: "Unauthorized" });
    }

    const { error, status, statusText } = await supabase
      .from(SUPABASE_TABLE_NAME)
      .delete()
      .eq("id", event.params.id);

    if (error) {
      return fail(status, { error: statusText });
    }

    throw redirect(301, `/`);
  },
};
