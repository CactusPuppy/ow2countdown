<script lang="ts">
  import { fromZonedTime } from "date-fns-tz";
  import EventForm from "$lib/components/event/_form.svelte";
  import { enhance } from "$app/forms";
  import type { CountdownDate } from "$lib/types";
  import type { ActionData, PageData, SubmitFunction } from "./$types";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import type { ActionResult } from "@sveltejs/kit";
  import WidthLimiter from "$lib/utils/WidthLimiter.svelte";

  let submitting = false;

  export let data: PageData;
  export let form: ActionData;
  let event: CountdownDate;
  $: event = data.event;

  onMount(() => {
    if (!$page.data.user) goto("/");
  });

  const handleFormSubmit: SubmitFunction = ({
    formData,
  }: {
    formData: FormData;
  }) => {
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
      typeof endDateTimeZone === "string" && 
      endDateTimeZone != ""
    ) {
      formData.set("end_date", fromZonedTime(new Date(endDate), endDateTimeZone).toISOString());
    }
    submitting = true;

    return async ({
      result,
      update,
    }: {
      result: ActionResult;
      update: () => void;
    }) => {
      if (result.type == "redirect") {
        goto(result.location, { invalidateAll: true });
      }
      submitting = false;
      update();
    };
  };
</script>

<WidthLimiter vagueWidthInPx={300} class="w-full mx-auto">
  <h1
    class="text-4xl m-8 font-bold text-center text-ow2-orange dark:text-ow2-light-orange whitespace-pre-line"
  >
    Edit {event.title}
  </h1>

  <form
    class="dark:text-white flex flex-col"
    method="POST"
    use:enhance={handleFormSubmit}
  >
    <EventForm {event}>
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
            value={submitting ? "Loading..." : "Save"}
          />
        </div>
      {/snippet}
    </EventForm>
  </form>
</WidthLimiter>
