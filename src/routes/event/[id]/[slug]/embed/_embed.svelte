<script lang="ts">
  import { browser } from "$app/environment";
  import type { CountdownDate } from "$lib/types";
  import { eventRelationToNow, isEventHappeningNow } from "$lib/utils/event_helpers";
  import { onDestroy, onMount } from "svelte";
  import ProgressBar from "$lib/components/_progress_bar.svelte";
  import Timer from "$lib/components/_timer.svelte";

  import { differenceInSeconds, format, parseISO } from "date-fns";
  import { formatInTimeZone } from "date-fns-tz";

  export let title: boolean;
  export let timestamp: boolean;
  export let progressBar: boolean;
  export let timezone: string | undefined = undefined;

  export let event: CountdownDate;

  let now: Date;
  const EVENT_ARRIVAL_LINGER_TIME_SECONDS = 3;
  $: dateStringToDisplay = (now && event.date && now.getTime() > parseISO(event.date).getTime() + EVENT_ARRIVAL_LINGER_TIME_SECONDS * 1000 && event.end_date) ? event.end_date : event.date;
  let animationRequest: number;
  function updateTime() {
    now = new Date();
    animationRequest = requestAnimationFrame(updateTime);
  }

  $: displayVerb = eventRelationToNow(event, now);

  let eventDurationInSeconds: number;
  let timeRemainingInSeconds: number;
  $: if (isEventHappeningNow(event, now)) {
    eventDurationInSeconds = differenceInSeconds(parseISO(event.date), parseISO(event.end_date));
    timeRemainingInSeconds = differenceInSeconds(now, parseISO(event.end_date), { roundingMethod: "ceil" })
  }

  onMount(() => {
    if (browser) now = new Date();
    if (browser) animationRequest = window.requestAnimationFrame(updateTime);
  })

  onDestroy(() => {
    if (browser) cancelAnimationFrame(animationRequest);
  })
</script>

<div class="w-full flex flex-col gap-2 items-center dark:text-zinc-50">
  {#if title}
    <h1 class="mx-4 mt-2 text-center text-5xl text-ow2-orange dark:text-ow2-light-orange">{event.title}</h1>
  {/if}
  {#if timestamp}
    <div>
      <p
        class="text-center text-lg md:text-xl lg:text-2xl"
      >
        Event {displayVerb} on
      </p>
      <p
        class="text-center text-lg md:text-xl lg:text-2xl"
      >
        {#if event.date !== null}
          <time datetime={dateStringToDisplay}>{formatInTimeZone(parseISO(dateStringToDisplay), timezone ?? "America/Los_Angeles", "PPPPp zzz")}</time>
        {/if}
      </p>
    </div>
  {/if}
  {#if isEventHappeningNow(event, now) && progressBar}
    <div
      class="mt-2.5 w-3/4"
    >
      <ProgressBar progress={100 - timeRemainingInSeconds / eventDurationInSeconds * 100} />
    </div>
  {/if}
  <Timer start={now} end={parseISO(dateStringToDisplay)} id={event.id} additionalDelay={700}/>
</div>
