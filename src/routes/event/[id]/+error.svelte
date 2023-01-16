<script lang="ts">
  import { quintInOut } from "svelte/easing";
  import { fade } from "svelte/transition";
</script>

<svelte:head>
  <title>404 | OW2 Countdown</title>
  <meta name="robots" content="no-index">
</svelte:head>


<div class="flex flex-col justify-center">
  <h1
    class="mx-4 mt-6 text-center text-6xl font-bold text-ow2-orange dark:text-ow2-light-orange event__title"
    in:fade={{duration: 1000, delay: 0, easing: quintInOut}}
    out:fade
  >
    404
  </h1>
  <p
    class="text-center text-lg md:text-xl lg:text-2xl dark:text-zinc-50"
    in:fade={{duration: 1000, delay: 500, easing: quintInOut}}
    out:fade
  >
    Event Not Found
  </p>
  <a
    class="px-4 py-2 my-4 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-center text-lg md:text-xl lg:text-2xl dark:text-zinc-50 hover:underline hover:text-ow2-orange dark:hover:text-ow2-light-orange transition-colors"
    in:fade={{duration: 500, delay: 1000, easing: quintInOut}}
    out:fade
    href="/"
  >
    Home
  </a>
</div>
