<script lang="ts">
  import { differenceInSeconds } from "date-fns";
  import TimerSegment from "./_timer_segment.svelte";

  const SECONDS_IN_A_DAY = 86400;

  export let start : Date;
  export let end : Date;
  $: daysToGo = Math.floor(differenceInSeconds(end, start) / SECONDS_IN_A_DAY);
  $: totalSeconds = Math.ceil(differenceInSeconds(end, start)) % SECONDS_IN_A_DAY;
  $: hoursToGo = Math.floor(totalSeconds / 3600);
  $: minutesToGo = Math.floor(totalSeconds / 60) % 60;
  $: secondsToGo = Math.floor(totalSeconds % 60);
</script>

<div class="flex w-72 md:w-96 lg:w-[30rem] justify-between">
  { #if start == null || end == null }
    <TimerSegment value={null} unit="days" />
    <TimerSegment value={null} unit="hours" />
    <TimerSegment value={null} unit="mins" />
    <TimerSegment value={null} unit="secs" />
  { :else }
    <TimerSegment value={daysToGo} unit="days" />
    <TimerSegment value={hoursToGo} unit="hours" />
    <TimerSegment value={minutesToGo} unit="mins" />
    <TimerSegment value={secondsToGo} unit="secs" />
  { /if }
</div>
