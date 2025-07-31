<script lang="ts">
  import EventForm from "$lib/components/event/_form.svelte";
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  import type { ActionData, SubmitFunction } from "./$types";
  import WidthLimiter from "$lib/utils/WidthLimiter.svelte";

  let submitting = false;

  export let form: ActionData;

  onMount(() => {
    if (!$page.data.session) goto("/");
  });

  const handleFormSubmit: SubmitFunction = ({ formData }) => {
    const date = formData.get("date");
    if (typeof date === "string" && date != "") {
      formData.set("date", new Date(date).toISOString());
    }
    const endDate = formData.get("end_date");
    if (typeof endDate === "string" && endDate != "") {
      formData.set("end_date", new Date(endDate).toISOString());
    }

    submitting = true;

    return async ({update}) => {
      submitting = false;
      update();
    };
  }
</script>


<WidthLimiter vagueWidthInPx={300} class="w-full mx-auto px-2">
  <h1 class="text-4xl mt-2 mb-4 font-bold tracking-tight text-center text-ow2-orange dark:text-ow2-light-orange">Create a new event</h1>
  <form
    method="POST"
    class="dark:text-white flex flex-col "
    use:enhance={handleFormSubmit}
  >
    <EventForm>
      <div slot="submit">
        {#if form?.error}
          <p class="w-full bg-red-300 dark:bg-red-700 text-center mt-4 py-1 rounded-sm">{form.error}</p>
        {/if}
        <input type="submit" class="bg-ow2-orange dark:bg-ow2-light-orange mt-4 px-2 py-1 w-min text-lg font-semibold rounded-md cursor-pointer" value={submitting ? "Loading..." : "Create"}>
      </div>
    </EventForm>

  </form>
</WidthLimiter>
