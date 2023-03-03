<script lang="ts">
  import { differenceInSeconds, format, parseISO } from "date-fns"

  import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
  import { FontAwesomeIcon } from "fontawesome-svelte";

  import { fade } from "svelte/transition";

  import CopyTimeDropdown from "$lib/components/_copy_time_dropdown.svelte";
  import type { CountdownDate } from "$lib/types";
  import Timer from "$lib/components/_timer.svelte";
  import { eventEffectiveDate, eventRelationToNow, titleToSlug, isEventHappeningNow } from "$lib/utils/event_helpers";
  import ProgressBar from "$lib/components/_progress_bar.svelte";

  export let event: CountdownDate;
  export let now: Date;
  export let additionalDelay = 0;

  $: dateStringToDisplay = eventEffectiveDate(event, now);

  $: displayVerb = eventRelationToNow(event, now);

  let eventDurationInSeconds: number;
  let timeRemainingInSeconds: number;
  $: if (isEventHappeningNow(event, now)) {
    eventDurationInSeconds = differenceInSeconds(parseISO(event.date), parseISO(event.end_date));
    timeRemainingInSeconds = differenceInSeconds(now, parseISO(event.end_date), { roundingMethod: "ceil" })
  }
</script>

<div
  class="bg-zinc-200 dark:bg-zinc-800 rounded-lg px-4 sm:px-12 pt-8 pb-4 relative w-min"
  in:fade="{{delay: additionalDelay}}"
  out:fade>
  <p
    class="text-center text-xl md:text-2xl lg:text-3xl whitespace-pre-line"
    in:fade="{{duration: 500, delay: 200 + additionalDelay}}"
    out:fade>
    <a href={`/event/${event.id}/${titleToSlug(event.title)}`} class="text-ow2-orange dark:text-ow2-light-orange hover:underline focus:underline">{event.title}</a>
    {#if event.id !== -1}
      <a
        class="inline sm:absolute sm:right-0 sm:top-0 sm:mr-4 sm:mt-3 px-2 py-1
          bg-zinc-500 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600
          hover:shadow-md hover:shadow-gray-900 hover:active:shadow
          hover:-translate-y-[0.1rem] hover:active:translate-y-0
          text-zinc-200 rounded-md text-lg
          transition-colors transition-transform transition-shadow"
        href={`/event/${event.id}/${titleToSlug(event.title)}`}
      >
        <FontAwesomeIcon icon={faCircleInfo} />
        <span class="screenreader-only">{event.title + " Information"}</span>
      </a>
    {/if}
  </p>
  {#if dateStringToDisplay !== null}
    <p
      class="text-center text-lg md:text-xl lg:text-2xl"
      in:fade={{duration: 500, delay: 350 + additionalDelay}}
      out:fade
    >
      Event {displayVerb} on
    </p>
    <p
      class="text-center text-lg md:text-xl lg:text-2xl"
      in:fade="{{duration: 500, delay: 500 + additionalDelay}}"
      out:fade>
      <CopyTimeDropdown class="ml-1" date={parseISO(dateStringToDisplay)} {now}>
        <span slot="button-text"><time datetime={dateStringToDisplay}>{format(parseISO(dateStringToDisplay), "PPPPp")}</time></span>
      </CopyTimeDropdown>
    </p>
  {/if}
  {#if isEventHappeningNow(event, now)}
    <div
      class="mt-2.5"
      in:fade="{{duration: 500, delay: 600 + additionalDelay}}">
      <ProgressBar progress={100 - timeRemainingInSeconds / eventDurationInSeconds * 100} />
    </div>
  {/if}
  <div class="flex justify-center">
    <Timer start={now} end={parseISO(dateStringToDisplay)} id={event.id} additionalDelay={additionalDelay + 700} />
  </div>
</div>

<style>
  .screenreader-only {
    border: 0;
    clip: rect(0 0 0 0);
    height: 1px;
    margin: -1px;
    overflow: hidden;
    padding: 0;
    position: absolute;
    white-space: nowrap;
    width: 1px;
  }
</style>
