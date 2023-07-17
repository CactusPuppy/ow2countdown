<script lang="ts">
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import { compareAsc, differenceInMilliseconds, formatDistanceStrict, parseISO, addSeconds } from "date-fns";
  import { onDestroy, onMount } from "svelte";
  import { flip } from "svelte/animate";

  import type { CountdownDate } from "$lib/types";

  import { FontAwesomeIcon } from "fontawesome-svelte";
  import { faPlus, faRssSquare } from "@fortawesome/free-solid-svg-icons";

  import { dates } from "../stores/dates";
  import EventCard from "./_event_card.svelte";
  import { eventEffectiveDate } from "$lib/utils/event_helpers";
  import { fade } from "svelte/transition";

  let now : Date;
  let nextAttemptMarker: Date;
  let timeToNextAttempt: string;

  let loading = true;

  let displayDates: CountdownDate[];
  // Gets the earliest date in each group, then orders the dates
  // (no specified datetime events inherently are treated as infinitely far in the future)
  $: if ($dates.errored !== true) {
      displayDates = Object.values($dates.reduce((accumulator, date) => {
        const itemKey = (date?.group != undefined && date.group != "") ? `GROUP-${date?.group}` : `ID-${date.id}`;
        if (accumulator[itemKey] === undefined) {
          accumulator[itemKey] = date;
        } else
              if (compareAsc(parseISO(date.date), parseISO(accumulator[itemKey].date)) < 0) {
          accumulator[itemKey] = date;
        }
        return accumulator;
      }, {} as Record<string, CountdownDate>))
      .sort((event1, event2) => {
        if (event1.priority != event2.priority) return event2.priority - event1.priority;

        const event1EffectiveDate = eventEffectiveDate(event1, now);
        const event2EffectiveDate = eventEffectiveDate(event2, now);

        // If both events have no specified effective date, they are equivalent
        if (!event1EffectiveDate && !event2EffectiveDate) return 0;

        if (!event1EffectiveDate) return 1;
        if (!event2EffectiveDate) return -1;

        return parseISO(event1EffectiveDate).getTime() - parseISO(event2EffectiveDate).getTime();
      });
    }

  let timeUpdateInterval : NodeJS.Timer;
  function updateTime() {
    now = new Date();
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

  onMount(async () => {
    if (browser) now = new Date();
    await updateDates();
    if (browser) timeUpdateInterval = setInterval(updateTime, 100);
    loading = false;
  });

  onDestroy(() => {
    clearTimeout(dateUpdateTimer);
    if (browser) clearInterval(timeUpdateInterval);
  })

</script>

<svelte:head>
  <title>Home | OW2Countdown.com</title>

  <meta name="og:title" content="OW2Countdown.com | Live countdowns to important Overwatch 2 events" />
  <meta name="og:description" content="Count down the time left until important Overwatch 2 events while seeing the times in your timezone! Visit an event page to get more information about the event, or copy the date and time down for later use." />

  <meta name="og:url" content="https://ow2countdown.com" />
  <meta name="og:image" content="https://ow2countdown.com/og-image.jpg" />
  <meta name="og:image:alt" content="OW2Countdown Logo" />
  <meta name="og:image:width" content="600" />
  <meta name="og:image:height" content="600" />
</svelte:head>

{#if $dates.errored}
  <div class="fixed top-0 left-0 z-30 w-full text-center p-4 bg-[#f15047df] dark:bg-[#7F1D1DDF] dark:text-zinc-50">
    A problem arose while contacting the server for updated information. Don't refresh, we'll try to contact the server again for you {nextAttemptMarker !== undefined && compareAsc(now, nextAttemptMarker) < 0 ? `in ${timeToNextAttempt}` : "soon"}.</div>
{/if}
<div class="relative min-h-full items-center my-4 w-full dark:text-zinc-50">
  {#if displayDates?.length != undefined && displayDates.length > 0}
    <div class="events-wrapper flex flex-col mx-auto items-center gap-8">
      {#each displayDates as event, eventIndex (event.id)}
        <div class="justify-self-center" animate:flip="{{duration: 500}}">
          <EventCard {now} {event} additionalDelay={eventIndex * 150} />
        </div>
      {/each}
    </div>
  {:else if loading}
    <div class="absolute top-[45vh] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center" transition:fade>
      <h1 class="text-5xl text-ow2-orange dark:text-ow2-light-orange">Loading...</h1>
    </div>
  {:else}
      <div class="absolute top-[45vh] left-1/2 -translate-x-1/2 -translate-y-1/2 w-max text-center" transition:fade>
        <h1 class="text-5xl text-ow2-orange dark:text-ow2-light-orange">No events found</h1>
        <p class="text-xl">Next refresh {nextAttemptMarker !== undefined && compareAsc(now, nextAttemptMarker) < 0 ? `in ${timeToNextAttempt}` : "soon"}</p>
      </div>
  {/if}

  {#if $page.data.session}
    <div class="sticky bottom-8 my-[-2rem] flex flex-row-reverse pr-4 sm:pr-8 z-20 pointer-events-none">
      <a
        href="/event/new"
        class="block pointer-events-auto p-4 rounded-md dark:text-white bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 hover:dark:bg-zinc-700 hover:underline
          transition-colors ease-out duration-200 shadow-lg shadow-gray-900"
      >
        <FontAwesomeIcon icon={faPlus}/><span class="pl-2 font-semibold">New Event</span>
      </a>
    </div>
  {/if}
</div>


<style>
  .events-wrapper {
    max-width: min(calc(1200px - 4rem + 20vw), 100%);
    /* align-self: stretch; */
  }
</style>
