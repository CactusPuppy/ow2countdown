<script lang="ts">
  import { quintInOut } from "svelte/easing";
  import { fade } from "svelte/transition";
</script>

<svelte:head>
  <title>404 | OW2 Countdown</title>
</svelte:head>


<h1
  class="mx-4 mt-6 text-center text-6xl font-bold text-ow2-orange dark:text-ow2-light-orange event__title"
  in:fade={{duration: 1000, delay: 0, easing: quintInOut}}
>
  404
</h1>
<p
  class="text-center text-lg md:text-xl lg:text-2xl"
  in:fade={{duration: 1000, delay: 500, easing: quintInOut}}>
  Event Not Found
</p>

