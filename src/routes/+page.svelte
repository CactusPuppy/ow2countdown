<script lang="ts">
  import { browser } from "$app/environment";
  import { navigating } from "$app/stores";
  import CopyTimeDropdown from "$lib/components/_copy_time_dropdown.svelte";
  import Timer from "$lib/components/_timer.svelte";
  import { compareAsc, differenceInMilliseconds, format, formatDistanceStrict, parseISO } from "date-fns";
  import { onDestroy, onMount } from "svelte";
  import { dates } from "../stores/dates";

  import type { CountdownDate } from "$lib/types";
  import { flip } from "svelte/animate";
  import { fade } from "svelte/transition";

  import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
  import { FontAwesomeIcon } from "fontawesome-svelte";

  let now : Date;
  let nextAttemptMarker: Date;
  let timeToNextAttempt: string;

  let displayDates: CountdownDate[];
  // Gets the earliest date in each group
  $: if ($dates.errored !== true) displayDates = Object.values($dates.reduce((accumulator, date) => {
    const itemKey = date?.group != undefined ? `GROUP-${date?.group}` : `ID-${date.id}`;
    if (accumulator[itemKey] === undefined) {
      accumulator[itemKey] = date;
    } else
          if (compareAsc(parseISO(date.date), parseISO(accumulator[itemKey].date)) < 0) {
      accumulator[itemKey] = date;
    }
    return accumulator;
  }, {} as Record<string, CountdownDate>));

  let animationRequest : number;
  function updateTime(timestamp : DOMHighResTimeStamp) {
    now = new Date();
    animationRequest = requestAnimationFrame(updateTime);
    if (nextAttemptMarker !== undefined) {
      timeToNextAttempt = formatDistanceStrict(nextAttemptMarker, now, { unit: "second", roundingMethod: "ceil" });
    }
  }

  let dateUpdateTimer: NodeJS.Timeout;

  async function updateDates() {
    const result = await dates.requestUpdate();
    if (result === -1) {
      dateUpdateTimer = setTimeout(updateDates, 5000);
    } else if ($dates?.errored) {
      nextAttemptMarker = result;
      dateUpdateTimer = setTimeout(updateDates, differenceInMilliseconds(result, new Date()));
    } else {
      dateUpdateTimer = setTimeout(updateDates, 60 * 1000);
    }
  };

  onMount(() => {
    if (browser) now = new Date();
    updateDates();
    if (browser) animationRequest = window.requestAnimationFrame(updateTime);
  });

  onDestroy(() => {
    clearTimeout(dateUpdateTimer);
    if (browser) window.cancelAnimationFrame(animationRequest);
  })

</script>

{#if $dates.errored}
  <div class="fixed top-0 z-30 w-full text-center p-4 bg-[#f15047df] dark:bg-[#7F1D1DDF] dark:text-zinc-50">
    A problem arose while contacting the server for updated information. Don't refresh, we'll try to contact the server again for you {nextAttemptMarker !== undefined && compareAsc(now, nextAttemptMarker) < 0 ? `in ${timeToNextAttempt}` : "soon"}.</div>
{/if}
<div class="flex-grow flex flex-col gap-8 md:justify-center items-center px-4 py-8 w-full dark:text-zinc-50">
  {#if displayDates?.length != undefined}
    {#each displayDates as date (date.id)}
      <div
        class="bg-zinc-200 dark:bg-zinc-800 rounded-lg px-4 md:px-8 pt-8 pb-4 relative"
        in:fade
        out:fade={$navigating ? { duration: 0 } : {}}
        animate:flip>
        <p
          class="text-center text-xl md:text-2xl lg:text-3xl timer__title"
          in:fade="{{duration: 500, delay: 200}}">
          <a href={`/event/${date.id}`} class="text-ow2-orange dark:text-ow2-light-orange hover:underline focus:underline">{date.title}</a>
          {#if date.id !== -1}
            <a
              class="inline md:absolute md:right-0 md:top-0 md:mr-4 md:mt-3 px-2 py-1 bg-zinc-700 text-zinc-200 rounded-md text-lg"
              href={`/event/${date.id}`}
            >
              <FontAwesomeIcon icon={faCircleInfo} />
              <span class="screenreader-only">{date.title + " Information"}</span>
            </a>
          {/if}
        </p>
        {#if date.id !== -1}
          <p
            class="text-center text-lg md:text-xl lg:text-2xl"
            in:fade="{{duration: 500, delay: 500}}">
            <CopyTimeDropdown class="ml-1" date={date}>
              <span slot="button-text">{format(parseISO(date.date), "PPPPp")}</span>
            </CopyTimeDropdown>
          </p>
        {/if}
        <div class="flex justify-center">
          <Timer start={now} end={parseISO(date.date)} id={date.id}/>
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .timer__title {
    white-space: pre-line;
  }

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
