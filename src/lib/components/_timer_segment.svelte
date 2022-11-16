<script lang="ts">
  export let value : number;
  export let unit : string;

  export const zeroPadAmount = 2;
  $: clampedValue = Math.max(0, value);
</script>

<div class={"flex flex-col gap-2 items-center " + (value === null ? "timer__segment--pulsing" : "")}>
  <p class="text-3xl md:text-4xl lg:text-5xl font-mono">{ value !== null ? String(clampedValue).padStart(zeroPadAmount, "0") : "..." }</p>
  <p class="text-base lg:text-lg font-thin">{ unit }</p>
</div>

<style>
  @keyframes pulse {
    0% {
      opacity: 100%;
      animation-timing-function: ease-in-out;
    }

    50% {
      opacity: 25%;
      animation-timing-function: ease-in-out;
    }

    100% {
      opacity: 100%;
      animation-timing-function: ease-in-out;
    }
  }
  .timer__segment--pulsing {
    animation-name: pulse;
    animation-duration: 2s;
    animation-iteration-count: infinite;
  }

  @media (prefers-reduced-motion) {
    .timer__segment--pulsing {
      animation: none;
    }
  }
</style>
