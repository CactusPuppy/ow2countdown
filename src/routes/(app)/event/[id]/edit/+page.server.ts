import { fail, redirect, type Actions } from "@sveltejs/kit";
import { entriesToEventObject } from "../../../../../stores/dates";
import { splitTags } from "$lib/utils/event_helpers";

export const actions: Actions = {
  default: async (event) => {
    const { user, supabase } = event.locals;
    if (!user) {
      return fail(401, { error: "Unauthorized" });
    }

    const id = event.params.id;
    const data = await event.request.formData();

    const title = data.get("title");
    if (title.toString().length == 0) {
      return fail(400, { error: "Title is required" });
    }

    const eventData = entriesToEventObject(data.entries());
    const tagNames = splitTags(String(data.get("tags") ?? ""));

    const { error, status, statusText } = await supabase.rpc("save_event", {
      event_id: Number.parseInt(id, 10),
      event_data: eventData,
      tag_names: tagNames,
    });

    if (error) {
      return fail(status, { error: statusText });
    }

    throw redirect(302, `/event/${id}`);
  },
};
