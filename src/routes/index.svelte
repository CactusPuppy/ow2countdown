<script context="module" lang="ts">
  export async function load({ url, params, query }) {
    // const dates = await getDates();

    return {
      props: {
        _dates: [] // TODO: Change this once we have dates
      }
    }
  }
</script>

<script lang="ts">
  import type { CountdownDate } from "$lib/types";
  import { getDates, dates } from "../stores/dates";
  import Timer from "./_timer.svelte";
  import { onMount } from "svelte";
import { compareAsc, isPast, parseISO } from "date-fns";

  export let _dates : CountdownDate[];
  if (!$dates.length) $dates = _dates;

  let now = null;

  async function getData() {
    let data : any;
    try {
      data = await getDates();
    } catch (error) {
      throw new Error(error.message);
    }
    $dates = [...$dates, ...data]
  }

  function updateTime() {
    now = new Date();
    if (compareAsc(now, dateMarker) > 0) {
      // TODO: Move to next event
      activeDate = {
        id: 1,
        date: "2022-04-27T18:00:00.000-07:00",
        title: "Twitch Drops End for OW2 Beta Access",
        description: ""
      }
    }
    setTimeout(updateTime, 100);
  }

  onMount(() => {
    updateTime();
  });

  let activeDate : CountdownDate = {
    id: 0,
    date: "2022-04-27T10:00:00.000-07:00",
    title: "Twitch Drops for Overwatch 2 Beta 1 Access",
    description: ""
  };
  $: dateMarker = parseISO(activeDate.date);
</script>

<div class="flex flex-col justify-center items-center h-[100vh] w-[100vw] dark:bg-slate-800">
  <div class="flex-grow flex flex-col justify-center items-center gap-6 py-8 w-[100vw] dark:text-gray-50">
    <p class="text-center">
      <b class="text-3xl">Current Countdown:</b>
      <br>{activeDate.title}
    </p>
    <Timer start={now} end={dateMarker} /> <!-- TODO: Make this actually pull from the dates -->
  </div>
  <div class="flex justify-between my-4 mx-2 px-4 h-8 w-full">
    <p class="text-xs text-gray-500 dark:text-slate-400 italic text-left">Created by <a class="text-blue-600 dark:text-blue-300 underline" href="https://twitter.com/Cactus_Puppy" rel="noreferrer noopener" target="_blank">@Cactus_Puppy</a><br /><a href="https://github.com/CactusPuppy/ow2countdown" rel="noreferrer noopener" target="_blank" class="text-blue-600 dark:text-blue-300 underline">GitHub</a></p>
    <p class="text-xs text-gray-500 dark:text-slate-400 italic text-right">
      This site and its creator are not affiliated with Overwatch or Blizzard Entertainment.
      <br />Overwatch 2 and the Overwatch 2 logo are ©2022 Blizzard Entertainment, Inc.
    </p>
  </div>
</div>
