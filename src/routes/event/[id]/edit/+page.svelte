<script lang="ts">
  import EventForm from "$lib/components/event/_form.svelte";
  import { enhance } from "$app/forms";
  import type { CountdownDate } from "$lib/types";
  import type { ActionData, PageData } from "./$types";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  let submitting = false;

  export let data: PageData;
  export let form: ActionData;
  let event: CountdownDate;
  $: event = data.event;

  onMount(() => {
    if (!$page.data.session) goto("/");
  });
</script>

<h1 class="text-4xl m-8 font-bold text-center text-ow2-orange dark:text-ow2-light-orange whitespace-pre-line">Edit {event.title}</h1>

<form
  class="dark:text-white flex flex-col"
  method="POST"
  use:enhance={() => {
    submitting = true;

    return async ({result, update}) => {
      if (result.type == "redirect") {
        goto(result.location, { invalidateAll: true });
      }
      submitting = false;
      update();
    }
  }}
>
  <EventForm event={event} />
  {#if form?.error}
    <p class="w-full bg-red-300 dark:bg-red-700 text-center mt-4 py-1 rounded-sm">{form.error}</p>
  {/if}
  <input type="submit" class="bg-ow2-orange dark:bg-ow2-light-orange mt-4 px-2 py-1 w-min text-lg font-semibold rounded-md cursor-pointer" value={submitting ? "Loading..." : "Save"}>
</form>
