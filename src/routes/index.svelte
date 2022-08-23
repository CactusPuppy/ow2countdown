<script lang="ts">
  import type { CountdownDate } from "$lib/types";
  import { getDates, dates } from "../stores/dates";
  import Timer from "./_timer.svelte";
  import CopyTimeDropdown from "./_copy_time.svelte";
  import { onMount, onDestroy } from "svelte";
  import { addSeconds, compareAsc, format, formatISO, min, parseISO } from "date-fns";
  import { browser } from "$app/env";

  import { fade } from "svelte/transition";
  import { flip } from "svelte/animate";

  const DATE_FADEOUT_DELAY = 3000;

  let now : Date;
  $: dateMarker = min($dates.map(({ date }) => parseISO(date)));
  $: if (now > dateMarker && !fetching) {
    setTimeout(updateDates, $dates.length === 1 && $dates[0].id != -1 ? DATE_FADEOUT_DELAY : 0);
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
    if ($dates?.[0]?.id === -1) {
      $dates[0].date = null;
    };
    let hadError = false;
    try {
      $dates = await getDates();
      $dates = $dates.filter(
        (d) => compareAsc(now, parseISO(d.date)) < 0
      );
    } catch (error) {
      hadError = true;
      console.error(error);
    }

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
      $dates = [{
        id: -1,
        date: formatISO(addSeconds(now, backoff + 1)),
        title: hadError ? "Error getting countdown data, retrying in..." : "No countdown found, refreshing in...",
        description: "",
      }];
      backoff = clamp(backoff + getAdditionalBackoffAmount(backoff), 5, 59);
    } else {
      backoff = 5;
    }
  }

  let animationRequest : number;
  function updateTime(timestamp : DOMHighResTimeStamp) {
    now = new Date();
    animationRequest = requestAnimationFrame(updateTime);
  }

  onMount(() => {
    if (browser) now = new Date();
    updateDates();
    if (browser) animationRequest = window.requestAnimationFrame(updateTime);
  });

  onDestroy(() => {
    clearTimeout(previousUpdate);
    if (browser) window.cancelAnimationFrame(animationRequest);
  })

</script>

<div class="flex flex-col md:justify-center items-center min-h-[100vh] w-full overflow-x-hidden">
  <div class="flex-grow flex flex-col gap-12 md:justify-center items-center py-8 w-full dark:text-zinc-50">
   {#each $dates as date (date.id)}
      <div
        class="bg-zinc-200 dark:bg-zinc-800 rounded-lg px-4 md:px-8 pt-8 pb-4"
        in:fade
        out:fade
        animate:flip>
        <p class="text-center text-xl md:text-2xl lg:text-3xl text-ow2-orange dark:text-ow2-light-orange" in:fade="{{duration: 500, delay: 200}}">
          {date.title}
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
  </div>
  <div class="flex justify-between my-4 mx-2 px-4 h-8 w-full">
    <p class="text-xs text-zinc-500 dark:text-zinc-400 italic text-left">Created by <a class="text-ow2-orange dark:text-ow2-light-orange underline" href="https://twitter.com/Cactus_Puppy" rel="noreferrer noopener" target="_blank">@Cactus_Puppy</a><br /><a href="https://github.com/CactusPuppy/ow2countdown" rel="noreferrer noopener" target="_blank" class="text-ow2-orange dark:text-ow2-light-orange underline">GitHub</a></p>
    <p class="text-xs text-zinc-500 dark:text-zinc-400 italic text-right">
      This site and its creator are not affiliated with Overwatch or Blizzard Entertainment.
      <br />Overwatch 2 and the Overwatch 2 logo are ©2022 Blizzard Entertainment, Inc.
    </p>
  </div>
</div>
