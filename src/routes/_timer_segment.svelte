<script lang="ts">
  export let value : number;
  export let unit : string;

  export const zeroPadAmount = 2;
  $: clampedValue = Math.max(0, value);
</script>

<div class="flex flex-col gap-2 items-center">
  <p class="text-3xl font-mono">{ value !== null ? String(clampedValue).padStart(zeroPadAmount, "0") : "--" }</p>
  <p class="text-sm font-thin">{ unit }</p>
</div>
