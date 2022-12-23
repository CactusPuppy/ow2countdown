<script lang="ts">
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import { compareAsc, differenceInMilliseconds, formatDistanceStrict, parseISO, addSeconds } from "date-fns";
  import { onDestroy, onMount } from "svelte";
  import { flip } from "svelte/animate";

  import type { CountdownDate } from "$lib/types";

  import { FontAwesomeIcon } from "fontawesome-svelte";
  import { faPlus } from "@fortawesome/free-solid-svg-icons";

  import { dates } from "../stores/dates";
  import EventCard from "./_event_card.svelte";

  let now : Date;
  let nextAttemptMarker: Date;
  let timeToNextAttempt: string;

  let displayDates: CountdownDate[];
  // Gets the earliest date in each group
  $: if ($dates.errored !== true) displayDates = Object.values($dates.reduce((accumulator, date) => {
    const itemKey = (date?.group != undefined && date.group != "") ? `GROUP-${date?.group}` : `ID-${date.id}`;
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
      nextAttemptMarker = addSeconds(Date.now(), 5);
      dateUpdateTimer = setTimeout(updateDates, 5000);
    } else if ($dates?.errored) {
      nextAttemptMarker = result;
      dateUpdateTimer = setTimeout(updateDates, differenceInMilliseconds(result, new Date()));
    } else {
      nextAttemptMarker = addSeconds(Date.now(), 60);
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

<svelte:head>
  <title>Home | OW2Countdown.com</title>

  <meta name="og:title" content="OW2Countdown.com | Live countdowns to important Overwatch 2 events" />
  <meta name="og:url" content="https://ow2countdown.com" />
</svelte:head>

{#if $dates.errored}
  <div class="fixed top-0 left-0 z-30 w-full text-center p-4 bg-[#f15047df] dark:bg-[#7F1D1DDF] dark:text-zinc-50">
    A problem arose while contacting the server for updated information. Don't refresh, we'll try to contact the server again for you {nextAttemptMarker !== undefined && compareAsc(now, nextAttemptMarker) < 0 ? `in ${timeToNextAttempt}` : "soon"}.</div>
{/if}
<div class="flex-grow flex flex-col gap-8 md:justify-center items-center md:mx-4 my-8 w-full dark:text-zinc-50">
  {#if displayDates?.length != undefined && displayDates.length > 0}
    {#each displayDates as date (date.id)}
      <div animate:flip>
        <EventCard {now} {date} />
      </div>
    {/each}
  {:else}
      <div class="text-center">
        <h1 class="text-5xl mb-4 text-ow2-orange dark:text-ow2-light-orange">No events found</h1>
        <p class="text-xl">Next refresh {nextAttemptMarker !== undefined && compareAsc(now, nextAttemptMarker) < 0 ? `in ${timeToNextAttempt}` : "soon"}</p>
      </div>
  {/if}
</div>
{#if $page.data.session}
  <a href="/event/new" class="fixed bottom-8 right-8 p-4 rounded-md dark:text-white bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 hover:dark:bg-zinc-700 hover:underline transition-colors ease-out duration-200">
    <FontAwesomeIcon icon={faPlus}/><span class="pl-2 font-semibold">New Event</span>
  </a>
{/if}
