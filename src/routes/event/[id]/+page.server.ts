import { error, redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";
import { titleToSlug } from '$lib/utils/event_helpers'

export const load: PageLoad = async ({ params, fetch }) => {
  const response = await fetch(`/api/event/${params.id}`);

  if (!response.ok) throw error(response.status, response.statusText);

  const result = await response.json();

  throw redirect(301, `/event/${params.id}/${titleToSlug(result.title)}`);
}
