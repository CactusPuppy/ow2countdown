<script lang="ts">
  import { differenceInCalendarDays, differenceInSeconds } from "date-fns";
  import TimerSegment from "./_timer_segment.svelte";

  const SECONDS_IN_A_DAY = 86400;

  export let start : Date;
  export let end : Date;
  $: daysToGo = differenceInCalendarDays(end, start);
  $: totalSeconds = Math.ceil(differenceInSeconds(end, start)) % SECONDS_IN_A_DAY;
  $: hoursToGo = Math.floor(totalSeconds / 3600);
  $: minutesToGo = Math.floor(totalSeconds / 60) % 60;
  $: secondsToGo = Math.floor(totalSeconds % 60);
</script>

<div class="flex w-64 justify-between">
  <TimerSegment value={daysToGo} unit="days" />
  <TimerSegment value={hoursToGo} unit="hours" />
  <TimerSegment value={minutesToGo} unit="mins" />
  <TimerSegment value={secondsToGo} unit="secs" />
</div>
