<script>
  import { navigating } from "$app/stores";
  import { fade } from "svelte/transition";
</script>

<div
  class="px-2 mx-auto max-w-prose dark:text-zinc-50 text-xl"
  in:fade={{ duration: 300, delay: $navigating ? 200 : 0 }}
>
  <h1 class="tracking-tight my-4 text-2xl sm:text-3xl md:text-4xl font-bold text-ow2-orange dark:text-ow2-light-orange">About OW2Countdown</h1>
  <p class="my-2">OW2Countdown is an unofficial, community-run resource for keeping track of upcoming notable Overwatch 2 events. All dates and times are <span class="">automatically converted</span> to your local timezone unless a timezone is specified with the time.</p>

  <p class="my-2">OW2Countdown is currently maintained by CactusPuppy, with assistance from Js and Netux.</p>

  <p class="my-2">To suggest an Overwatch 2 event for addition to the site, or to contact the OW2Countdown team for any other reason, please visit the <a href="/discord" target="_blank" class="text-ow2-orange dark:text-ow2-light-orange underline">OW2Countdown Discord</a>.</p>

  <h2 class="uppercase font-bold my-4">Informational Accuracy Policy</h2>
  <p class="my-2">OW2Countdown is committed to providing accurate and reliably-sourced information. This means that OW2Countdown will not cover nor source leaks, rumors, gossip, or any other sources of unofficial information.</p>

  <h2 class="uppercase font-bold my-4">Legal</h2>
  <ul class="list-disc list-inside">
    <li><a class="text-ow2-orange dark:text-ow2-light-orange" href="/privacy-policy">Privacy Policy</a></li>
  </ul>
</div>
