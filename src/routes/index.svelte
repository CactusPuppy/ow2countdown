<script lang="ts">
  import type { CountdownDate } from "$lib/types";
  import { getDates, dates } from "../stores/dates";
  import Timer from "./_timer.svelte";
  import { onMount } from "svelte";
  import { addSeconds, compareAsc, formatISO, getMilliseconds, parseISO } from "date-fns";

  let now : Date;
  let activeDate : CountdownDate;
  $: dateMarker = activeDate == null ? null : parseISO(activeDate.date);
  $: if (now > dateMarker && !fetching) {
    updateDates();
  }
  let backoff = 5;
  let fetching = false;

  function clamp(value : number, min : number, max : number) {
    return Math.min(Math.max(value, min), max);
  }

  let previousUpdate : NodeJS.Timeout;

  async function updateDates() {
    if (previousUpdate != null) {
      clearTimeout(previousUpdate);
    }
    fetching = true;
    if (activeDate?.id === -1) {
      activeDate = null;
      dateMarker = null;
    }
    let hadError = false;
    try {
      $dates = await getDates();
    } catch (error) {
      hadError = true;
      console.error(error);
    }
    $dates = $dates.filter(
      (d) => compareAsc(now, parseISO(d.date)) < 0
    );
    setActiveDate(hadError);
    previousUpdate = setTimeout(updateDates, 60 * 1000);
    fetching = false;
  }

  function getAdditionalBackoffAmount(number : Number) {
    if (number < 15) {
      return 5;
    }
    if (number < 30) {
      return 15;
    }
    if (number < 60) {
      return 30;
    }
    return 60;
  }

  function setActiveDate(hadError : Boolean) {
    if ($dates.length === 0) {
      activeDate = {
        id: -1,
        date: formatISO(addSeconds(now, backoff + 1)),
        title: hadError ? "Error getting countdown data, retrying in..." : "No countdown found, refreshing in...",
        description: "",
      };
      backoff = clamp(backoff + getAdditionalBackoffAmount(backoff), 5, 60);
    } else {
      backoff = 5;
      activeDate = $dates[0];
    }
  }

  function updateTime() {
    now = new Date();
    setTimeout(updateTime, 100);
  }

  onMount(() => {
    updateDates();
    updateTime();
  });
</script>

<div class="flex flex-col justify-center items-center h-[100vh] w-[100vw]">
  <div class="flex-grow flex flex-col justify-center items-center gap-6 py-8 w-[100vw] dark:text-zinc-50">
    <p class="text-center text-xl">
      <b class="text-3xl">Current Countdown:</b>
      <br><span class="text-ow2-orange dark:text-ow2-light-orange">{activeDate ? activeDate.title : "Loading..."}</span>
    </p>
    <Timer start={now} end={dateMarker} />
  </div>
  <div class="flex justify-between my-4 mx-2 px-4 h-8 w-full">
    <p class="text-xs text-zinc-500 dark:text-zinc-400 italic text-left">Created by <a class="text-ow2-orange dark:text-ow2-light-orange underline" href="https://twitter.com/Cactus_Puppy" rel="noreferrer noopener" target="_blank">@Cactus_Puppy</a><br /><a href="https://github.com/CactusPuppy/ow2countdown" rel="noreferrer noopener" target="_blank" class="text-ow2-orange dark:text-ow2-light-orange underline">GitHub</a></p>
    <p class="text-xs text-zinc-500 dark:text-zinc-400 italic text-right">
      This site and its creator are not affiliated with Overwatch or Blizzard Entertainment.
      <br />Overwatch 2 and the Overwatch 2 logo are ©2022 Blizzard Entertainment, Inc.
    </p>
  </div>
</div>
