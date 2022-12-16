<script lang="ts">
  import EventForm from "$lib/components/event/_form.svelte";
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  import type { ActionData } from "./$types";

  let submitting = false;

  export let form: ActionData;

  onMount(() => {
    if (!$page.data.session) goto("/");
  });
</script>


<h1 class="text-4xl m-8 font-bold text-center text-ow2-orange dark:text-ow2-light-orange">Create a new event</h1>
<form
  method="POST"
  class="dark:text-white flex flex-col "
  use:enhance={() => {
    submitting = true;

    return async ({update}) => {
      submitting = false;
      update();
    };
  }}
>
  <EventForm />
  {#if form?.error}
    <p class="w-full bg-red-300 dark:bg-red-700 text-center mt-4 py-1 rounded-sm">{form.error}</p>
  {/if}
  <input type="submit" class="bg-ow2-orange dark:bg-ow2-light-orange mt-4 px-2 py-1 w-min text-lg font-semibold rounded-md cursor-pointer" value={submitting ? "Loading..." : "Create"}>
</form>
