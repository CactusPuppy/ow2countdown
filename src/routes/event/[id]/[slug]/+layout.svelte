<script lang="ts">
  import { quintInOut } from "svelte/easing";
  import { fade } from "svelte/transition";
</script>

<div
  class="self-start flex flex-col gap-4 items-center w-full dark:text-zinc-50"
>
  <slot />
  <a href="/"
    class="px-6 py-3 md:px-8 md:py-4 text-lg md:text-xl focus:underline hover:underline text-ow2-orange dark:text-ow2-light-orange max-w-3xl rounded-md bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
    in:fade={{ duration: 500, delay: 900, easing: quintInOut }}
    out:fade={{ easing: quintInOut }}
  >
    View All Events
  </a>
</div>
