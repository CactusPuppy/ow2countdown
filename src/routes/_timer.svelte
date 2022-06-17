<script lang="ts">
  import { differenceInSeconds } from "date-fns";
  import TimerSegment from "./_timer_segment.svelte";
  import { flip } from "svelte/animate";

  import { fade, fly } from "svelte/transition";

  const SECONDS_IN_A_DAY = 86400;

  export let start : Date;
  export let end : Date;
  export let id : Number;
  $: diffInSeconds = Math.max(0, differenceInSeconds(end, start));
  $: daysToGo = Math.floor(diffInSeconds / SECONDS_IN_A_DAY);
  $: totalSeconds = Math.ceil(diffInSeconds) % SECONDS_IN_A_DAY;
  $: hoursToGo = Math.floor(totalSeconds / 3600);
  $: minutesToGo = Math.floor(totalSeconds / 60) % 60;
  $: secondsToGo = Math.floor(totalSeconds % 60);
  $: timerValues = [].concat([{
      value: daysToGo,
      units: "days"
    },{
      value: hoursToGo,
      units: "hours",
    },{
      value: minutesToGo,
      units: "mins",
    }, {
      value: secondsToGo,
      units: "secs",
    }
  ]).filter((_, i, array) => array.slice(0, i + 1).some(({ value }, i2) => value !== 0 || i2 === array.length - 1));

  $: hideValue = start == null || end == null;
</script>

<div class="relative flex justify-center gap-12 md:gap-20 lg:gap-28 my-6 w-80 md:w-[36rem] lg:w-[40rem]">
  {#each timerValues as timerValue, i (timerValue.units)}
    <div in:fade="{{ duration: 500, delay: i * 150 + 700 }}"
      out:fly="{{ duration: 500, y: 20 }}"
      animate:flip
    >
      <TimerSegment
        value={hideValue ? null : timerValue.value}
        unit={timerValue.units}
      />
    </div>
  {/each}
</div>
