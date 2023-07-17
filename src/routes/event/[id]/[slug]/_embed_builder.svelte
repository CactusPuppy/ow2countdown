<script lang="ts">
  import type { CountdownDate } from "$lib/types";
  import { titleToSlug } from "$lib/utils/event_helpers";
  import { fade } from "svelte/transition";
  import { FontAwesomeIcon } from "fontawesome-svelte";
  import { faCopy, faChevronRight } from "@fortawesome/free-solid-svg-icons";

  import { page } from "$app/stores";
  import Embed from "./embed/_embed.svelte";

  export let event: CountdownDate;

  let embedOptions: Record<string, boolean> = {
    "title": true,
    "timestamp": false,
    "progress_bar": false,
    "dark_mode": true
  }

  let baseEmbedURL: string;
  $: baseEmbedURL = `/event/${event.id}/${titleToSlug(event.title)}/embed`;

  let finalPath: string;
  let finalURL: string;
  $: {
    let options = Object.entries(embedOptions).filter(([key, value]) => value && key != "dark_mode").map(([key, value]) => [key, "1"]);
    options.push(["theme", (embedOptions["dark_mode"] ? "dark" : "light")])
    finalPath = `${baseEmbedURL}?${(new URLSearchParams(options))}`;
    finalURL = window.location.origin + finalPath;
  }

  async function handleClick() {
    await navigator.clipboard.writeText(finalURL);
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

<div class="flex flex-col items-center max-w-full" transition:fade>
  <div class="embed_build__options">
    <div class="min-w-max">
      <label class="embed-option">
        <input class="embed-option__input" type="checkbox" name="title" bind:checked={embedOptions["title"]} />
        <span class="embed-option__span">Title</span>
      </label>
    </div>

    <div class="min-w-max">
      <label class="embed-option">
        <input class="embed-option__input" type="checkbox" name="timestamp" bind:checked={embedOptions["timestamp"]} />
        <span class="embed-option__span">Timestamp</span>
      </label>
    </div>

    <div class="min-w-max">
      <label class="embed-option">
        <input class="embed-option__input" type="checkbox" name="progress_bar" bind:checked={embedOptions["progress_bar"]} />
        <span class="embed-option__span">Progress Bar</span>
      </label>
    </div>

    <div class="min-w-max">
      <label class="embed-option">
        <input class="embed-option__input" type="checkbox" name="dark_mode" bind:checked={embedOptions["dark_mode"]} />
        <span class="embed-option__span">Dark Mode</span>
      </label>
    </div>
  </div>
  <button
    on:click={handleClick}
    class="flex items-center relative max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl mt-4 rounded bg-zinc-200 dark:bg-zinc-800 p-1 cursor-pointer font-mono text-ow2-orange dark:text-ow2-light-orange whitespace-nowrap"
  >
    <FontAwesomeIcon icon={faCopy} />
    <p class="ml-2 overflow-hidden">{finalURL}</p>
    <div class="absolute inset-0 opacity-0 bg-zinc-200 dark:bg-zinc-800 pointer-events-none" bind:this={copyNotification}>
      <p class="m-auto translate-y-1">(copied)</p>
    </div>
  </button>
  <button class="flex items-center text-xl mt-4 hover:underline focus-visible:underline" on:click={() => showPreview = !showPreview}>
    <p>{showPreview ? "Hide" : "Show"} Preview</p>
    <div class={"ml-4 text-base transition-transform" + (showPreview ? " rotate-90" : "")}><FontAwesomeIcon icon={faChevronRight} /></div>
  </button>
  <p><small>Note: Preview does not reflect status of dark mode toggle</small></p>
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
  .embed_build__options {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    max-width: 100%;
  }

  .embed-option {
    position: relative;
  }

  .embed-option__input {
    appearance: none;
    position: absolute;
    left: 0; top: 0;
    width: 0; height: 0;
  }

  .embed-option span {
    display: inline-block;
    padding-left: 2.25rem;
    cursor: pointer;
  }

  .embed-option span::before {
    display: block;
    content: "";
    position: absolute;
    top: 7px; left: 4px;
    border-radius: 99999px;
    pointer-events: none;
    height: calc(1rem - 8px);
    width: calc(1rem - 8px);
    pointer-events: all;
    transition: left 100ms,
    background-color 100ms;
    @apply bg-zinc-500;
  }

  :global(.dark) .embed-option__span::before {
    @apply bg-zinc-400;
  }

  .embed-option span::after {
    display: block;
    content: "";
    position: absolute;
    top: 3px; left: 0;
    height: 1rem; width: 2rem;
    border-radius: 99999px;
    @apply border-zinc-500 border-2 border-solid;
    transition: border-color 100ms;
  }

  :global(.dark) .embed-option__span::after {
    @apply border-zinc-400;
  }

  .embed-option__input:checked + span::before {
    left: calc(1rem + 4px);
    @apply bg-ow2-orange;
  }

  :global(.dark) .embed-option__input:checked + span::before {
    @apply bg-ow2-light-orange;
  }

  .embed-option__input:checked + span::after {
    @apply border-ow2-orange;
  }

  :global(.dark) .embed-option__input:checked + span::after {
    @apply border-ow2-light-orange;
  }
</style>
