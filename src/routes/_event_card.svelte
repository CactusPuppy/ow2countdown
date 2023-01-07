<script lang="ts">
  import { format, parseISO } from "date-fns"

  import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
  import { FontAwesomeIcon } from "fontawesome-svelte";

  import { fade } from "svelte/transition";

  import { navigating } from "$app/stores";

  import CopyTimeDropdown from "$lib/components/_copy_time_dropdown.svelte";
  import type { CountdownDate } from "$lib/types";
  import Timer from "$lib/components/_timer.svelte";
  import { isEventHappeningNow, titleToSlug } from "$lib/utils/event_helpers";

  export let event: CountdownDate;
  export let now: Date;

  $: displayDate = (isEventHappeningNow(event, now) && event.end_date) ? event.end_date : event?.date;
</script>

<div
  class="bg-zinc-200 dark:bg-zinc-800 rounded-lg px-4 sm:px-12 pt-8 pb-4 relative w-min"
  in:fade
  out:fade={$navigating ? { duration: 0 } : {}}>
  <p
    class="text-center text-xl md:text-2xl lg:text-3xl whitespace-pre-line"
    in:fade="{{duration: 500, delay: 200}}">
    <a href={`/event/${event.id}/${titleToSlug(event.title)}`} class="text-ow2-orange dark:text-ow2-light-orange hover:underline focus:underline">{event.title}</a>
    {#if event.id !== -1}
      <a
        class="inline sm:absolute sm:right-0 sm:top-0 sm:mr-4 sm:mt-3 px-2 py-1 bg-zinc-500 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-200 rounded-md text-lg transition-colors"
        href={`/event/${event.id}/${titleToSlug(event.title)}`}
      >
        <FontAwesomeIcon icon={faCircleInfo} />
        <span class="screenreader-only">{event.title + " Information"}</span>
      </a>
    {/if}
  </p>
  {#if event.id !== -1 && displayDate !== null}
    <p
      class="text-center text-lg md:text-xl lg:text-2xl"
      in:fade={{duration: 500, delay: 350}}
    >
      Event {isEventHappeningNow(event, now) ? "ends" : "begins"} on
    </p>
    <p
      class="text-center text-lg md:text-xl lg:text-2xl"
      in:fade="{{duration: 500, delay: 500}}">
      <CopyTimeDropdown class="ml-1" event={event}>
        <span slot="button-text"><time datetime={displayDate}>{format(parseISO(displayDate), "PPPPp")}</time></span>
      </CopyTimeDropdown>
    </p>
  {/if}
  <div class="flex justify-center">
    <Timer start={now} end={parseISO(displayDate)} id={event.id}/>
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
