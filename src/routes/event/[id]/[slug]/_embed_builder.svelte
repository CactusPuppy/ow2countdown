<script lang="ts">
  import type { CountdownDate } from "$lib/types";
  import { titleToSlug } from "$lib/utils/event_helpers";
  import { fade } from "svelte/transition";
  import { FontAwesomeIcon } from "fontawesome-svelte";
  import { faCopy, faChevronRight } from "@fortawesome/free-solid-svg-icons";

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

  async function handleClick() {
    await navigator.clipboard.writeText("https://ow2countdown.com" + finalURL);
    fadeInOutCopyConfirmation();
  }

  let copyNotification: HTMLDivElement;
  function fadeInOutCopyConfirmation() {
    copyNotification.animate([
        { opacity: 0, offset: 0 },
        { opacity: 0.85, offset: 0.05 },
        { opacity: 0.85, offset: 0.95 },
        { opacity: 0, offset: 1.0 }
      ],
      1000
    );
  }

  let showPreview = false;
</script>

<div class="flex flex-col items-center">
  <div class="embed_build__options">
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
  <button
    on:click={handleClick}
    class="flex items-center relative max-w-xl mt-4 rounded bg-zinc-200 dark:bg-zinc-800 p-1 cursor-pointer font-mono text-ow2-orange dark:text-ow2-light-orange whitespace-nowrap"
  >
    <FontAwesomeIcon icon={faCopy} />
    <p class="ml-2 overflow-hidden">{"https://ow2countdown.com" + finalURL}</p>
    <div class="absolute inset-0 opacity-0 bg-zinc-200 dark:bg-zinc-800 pointer-events-none" bind:this={copyNotification}>
      <p class="m-auto translate-y-1">(copied)</p>
    </div>
  </button>
  <button class="flex items-center text-xl mt-4 hover:underline focus-visible:underline" on:click={() => showPreview = !showPreview}>
    <p>{showPreview ? "Hide" : "Show"} Preview</p>
    <div class={"ml-4 text-base transition-transform" + (showPreview ? " rotate-90" : "")}><FontAwesomeIcon icon={faChevronRight} /></div>
  </button>
  {#if showPreview}
    <div transition:fade>
      <Embed
        {event}
        title={embedOptions["title"]}
        timestamp={embedOptions["timestamp"]}
        progressBar={embedOptions["progress_bar"]} />
    </div>
  {/if}
</div>

<style>
  .embed_build__options > label {
    padding: 0.25rem;
    border-radius: 0.25rem;
  }
</style>
