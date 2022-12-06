<script lang="ts">
  import { quintInOut } from "svelte/easing";
  import { fade } from "svelte/transition";
</script>

<div
  class="my-auto flex flex-col gap-4 md:justify-center items-center w-full dark:text-zinc-50"
>
  <slot />
  <p
  class="px-6 py-3 md:px-8 md:py-4 text-lg md:text-xl focus:underline hover:underline text-ow2-orange dark:text-ow2-light-orange max-w-3xl rounded-md bg-zinc-100 dark:bg-zinc-800"
  in:fade={{ duration: 500, delay: 900, easing: quintInOut }}
  >
    <a href="/" class="hover:underline focus:underline">View All Events</a>
  </p>
</div>
