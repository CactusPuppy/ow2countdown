<script lang="ts">
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";

  /**
   * The percentage progress to display. 100 is the max.
   */
  export let progress = 50;
  $: usedProgress.set(progress);

  let usedProgress = tweened(0, {
    duration: 400,
    easing: cubicOut
  });
</script>

<div class="w-full bg-zinc-300 dark:bg-zinc-700 rounded-full p-1 flex flex-row">
  <div class="bg-gradient-to-r from-ow2-orange to-ow2-light-orange dark:from-ow2-light-orange dark:to-ow2-orange h-2 rounded-full" style="width: {$usedProgress}%"></div>
</div>
