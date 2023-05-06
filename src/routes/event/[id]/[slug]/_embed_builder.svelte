<script lang="ts">
  import type { CountdownDate } from "$lib/types";
  import { titleToSlug } from "$lib/utils/event_helpers";

  import Embed from "./embed/_embed.svelte";

  export let event: CountdownDate;

  let embedOptions: Record<string, boolean> = {
    "title": true,
    "timestamp": false,
    "progress_bar": false
  }

  let baseEmbedURL: string;
  $: baseEmbedURL = `/event/${event.id}/${titleToSlug(event.title)}/embed`;

  let finalURL: string;
  $: finalURL = `${baseEmbedURL}?${(new URLSearchParams(Object.entries(embedOptions).filter(([key, value]) => value).map(([key, value]) => [key, "1"])))}`;
</script>

<div class="flex flex-col items-center">
  <div class="embed_build__options">
    <h3 class="text-center">Embed Options</h3>

    <label>
      <input type="checkbox" name="title" bind:checked={embedOptions["title"]} />
      Title
    </label>

    <label>
      <input type="checkbox" name="timestamp" bind:checked={embedOptions["timestamp"]} />
      Timestamp
    </label>

    <label>
      <input type="checkbox" name="progress_bar" bind:checked={embedOptions["progress_bar"]} />
      Progress Bar
    </label>
  </div>
  <a href={finalURL} target="_blank" rel="noreferrer" class="underline text-ow2-orange dark:text-ow2-light-orange">{"https://workshop.codes" + finalURL}</a>
  <Embed
    {event}
    title={embedOptions["title"]}
    timestamp={embedOptions["timestamp"]}
    progressBar={embedOptions["progress_bar"]} />
</div>

<style>
  .embed_build__options > label {
    padding: 0.25rem;
    border-radius: 0.25rem;
    @apply bg-zinc-300;
  }

  :global(.dark) .embed_build__options > label {
    @apply bg-zinc-700;
  }
</style>
