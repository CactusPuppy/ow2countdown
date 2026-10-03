<script lang="ts">
  import { fromZonedTime } from "date-fns-tz";
  import EventForm, { AUTO_SAVE_KEY } from "$lib/components/event/_form.svelte";
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  import type { ActionData, SubmitFunction } from "./$types";
  import WidthLimiter from "$lib/utils/WidthLimiter.svelte";

  let submitting = false;

  export let form: ActionData;

  onMount(() => {
    if (!$page.data.user) goto("/");
  });

  const handleFormSubmit: SubmitFunction = ({ formData }) => {
    const date = formData.get("date");
    const dateTimeZone = formData.get("date_timezone");
    if (
      typeof date === "string" && 
      date != "" && 
      typeof dateTimeZone === "string" && 
      dateTimeZone != ""
    ) {
      formData.set("date", fromZonedTime(new Date(date), dateTimeZone).toISOString());
    }

    const endDate = formData.get("end_date");
    const endDateTimeZone = formData.get("end_date_timezone");
    if (
      typeof endDate === "string" && 
      endDate != "" && 
      typeof endDateTimeZone === "string" 
      && endDateTimeZone != ""
    ) {
      formData.set("end_date", fromZonedTime(new Date(endDate), endDateTimeZone).toISOString());
    }

    submitting = true;

    return async ({ update, result }) => {
      submitting = false;
      if (result.type === "redirect" || result.type === "success")
        localStorage.removeItem(AUTO_SAVE_KEY);
      update();
    };
  };
</script>

<WidthLimiter vagueWidthInPx={300} class="w-full mx-auto px-2">
  <h1
    class="text-4xl mt-2 mb-4 font-bold tracking-tight text-center text-ow2-orange dark:text-ow2-light-orange"
  >
    Create a new event
  </h1>
  <form
    method="POST"
    class="dark:text-white flex flex-col"
    use:enhance={handleFormSubmit}
  >
    <EventForm>
      {#snippet submitButton()}
        <div>
          {#if form?.error}
            <p
              class="w-full bg-red-300 dark:bg-red-700 text-center mt-4 py-1 rounded-sm"
            >
              {form.error}
            </p>
          {/if}
          <input
            type="submit"
            class="bg-ow2-orange dark:bg-ow2-light-orange mt-4 px-2 py-1 w-min text-lg font-semibold rounded-md cursor-pointer"
            value={submitting ? "Loading..." : "Create"}
          />
        </div>
      {/snippet}
    </EventForm>
  </form>
</WidthLimiter>
