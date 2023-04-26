<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { browser } from "$app/environment";

  import type { PageData } from "./$types";
  import type { CountdownDate } from "$lib/types";

  import Timer from "$lib/components/_timer.svelte";

  import { parseISO } from "date-fns";

  let now: Date;
  const EVENT_ARRIVAL_LINGER_TIME_SECONDS = 3;
  $: dateStringToDisplay = (now && event.date && now.getTime() > parseISO(event.date).getTime() + EVENT_ARRIVAL_LINGER_TIME_SECONDS * 1000 && event.end_date) ? event.end_date : event.date;
  let animationRequest: number;
  function updateTime() {
    now = new Date();
    animationRequest = requestAnimationFrame(updateTime);
  }

  export let data: PageData;
  let event: CountdownDate;
  $: event = data.event;

  onMount(() => {
    if (browser) now = new Date();
    if (browser) animationRequest = window.requestAnimationFrame(updateTime);
  })

  onDestroy(() => {
    if (browser) cancelAnimationFrame(animationRequest);
  })
</script>

<div class="flex justify-center dark:text-zinc-50">
  <Timer start={now} end={parseISO(dateStringToDisplay)} id={event.id} additionalDelay={700}/>
</div>
