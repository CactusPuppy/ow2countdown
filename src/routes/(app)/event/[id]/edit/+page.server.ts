import { fail, redirect, type Actions } from "@sveltejs/kit";
import { entriesToEventObject } from "../../../../../stores/dates";
import { SUPABASE_TABLE_NAME } from "$env/static/private";

export const actions: Actions = {
  default: async (event) => {
    const { session, supabase } = event.locals;
    if (!session) {
      return fail(401, { error: "Unauthorized" });
    }

    const id = event.params.id;
    const data = await event.request.formData();

    const title = data.get("title");
    if (title.toString().length == 0) {
      return fail(400, { error: "Title is required" });
    }

    const eventData = entriesToEventObject(data.entries());

    const { error, status, statusText } = await supabase.from(SUPABASE_TABLE_NAME)
      .update(eventData)
      .eq("id", id);

    if (error) {
      return fail(status, { error: statusText });
    }

    throw redirect(302, `/event/${id}`);
  }
}
