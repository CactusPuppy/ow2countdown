<script lang="ts">
  import { differenceInSeconds } from "date-fns";
  import TimerSegment from "./_timer_segment.svelte";

  import { fade } from "svelte/transition";

  const SECONDS_IN_A_DAY = 86400;

  export let start : Date;
  export let end : Date;
  $: daysToGo = Math.floor(differenceInSeconds(end, start) / SECONDS_IN_A_DAY);
  $: totalSeconds = Math.ceil(differenceInSeconds(end, start)) % SECONDS_IN_A_DAY;
  $: hoursToGo = Math.floor(totalSeconds / 3600);
  $: minutesToGo = Math.floor(totalSeconds / 60) % 60;
  $: secondsToGo = Math.floor(totalSeconds % 60);

  $: hideValue = start == null || end == null;
</script>

<div class="flex w-72 md:w-96 lg:w-[30rem] justify-between">
  <div in:fade="{{duration: 500, delay: 0}}">
    <TimerSegment value={hideValue ? null : daysToGo} unit="days"    />
  </div>
  <div in:fade="{{duration: 500, delay: 300}}">
    <TimerSegment value={hideValue ? null : hoursToGo} unit="hours"  />
  </div>
  <div in:fade="{{duration: 500, delay: 600}}">
    <TimerSegment value={hideValue ? null : minutesToGo} unit="mins" />
  </div>
  <div in:fade="{{duration: 500, delay: 900}}">
    <TimerSegment value={hideValue ? null : secondsToGo} unit="secs" />
  </div>
</div>
