<script lang="ts">
  import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
  import { FontAwesomeIcon } from "fontawesome-svelte";
  import { fade } from "svelte/transition";

  import type { CountdownDateWithTags } from "$lib/types";
  import { distinctSortedTags } from "$lib/utils/event_helpers";
  import { chipBackground, chipTextTone } from "$lib/utils/color_helpers";

  let {
    events = [] as CountdownDateWithTags[],
    selectedTags = $bindable([] as string[]),
  } = $props();

  // Collapsed by default (D-02) and never persisted across reloads (D-04) —
  // plain component state, no browser-storage read/write and no
  // restore-on-mount.
  let open = $state(false);

  // A function of the events prop alone, never of the current selection
  // (D-09/D-10) — no faceted narrowing lives here.
  const availableTags = $derived(distinctSortedTags(events));
  const hasSelection = $derived(selectedTags.length > 0);

  // Maps a tag's color to exactly one of three mutually exclusive Tailwind
  // class strings, chosen from chipTextTone's computed tone. Emitting a
  // single class string (rather than leaving the neutral pair on the
  // element and appending an override beside it) avoids a specificity
  // conflict: a `dark:`-prefixed utility outranks an unprefixed one, so a
  // lingering `dark:text-zinc-50` would otherwise win over an override's
  // `text-zinc-900` in dark mode.
  //
  // Deliberate verbatim duplicate of src/routes/_event_card.svelte's copy —
  // Tailwind here is CSS-first with content auto-detection and no
  // `@config`, so every class literal must live inside a .svelte file. Do
  // not extract this to a shared module.
  function chipToneClass(color: string | null): string {
    const tone = chipTextTone(color);
    if (tone === "dark") return "text-zinc-900";
    if (tone === "light") return "text-zinc-50";
    return "text-zinc-900 dark:text-zinc-50";
  }

  // Reassign rather than mutate, mirroring src/lib/components/form/Tags.svelte's
  // add/remove idiom — a native Set/Map mutated in place is not deeply
  // proxied by Svelte 5's state rune, so add/delete calls would change the
  // value without ever re-rendering.
  function toggleTag(name: string) {
    selectedTags = selectedTags.includes(name)
      ? selectedTags.filter((t) => t !== name)
      : [...selectedTags, name];
  }
</script>

{#if availableTags.length > 0}
  <div data-testid="filter-panel">
    <button
      type="button"
      data-testid="filter-toggle"
      aria-expanded={open}
      aria-controls="filter-panel-content"
      class="flex items-center gap-1 px-2 py-1 rounded-md
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        focus-visible:outline-ow2-orange dark:focus-visible:outline-ow2-light-orange"
      onclick={() => (open = !open)}
    >
      Filter
      <FontAwesomeIcon
        icon={faChevronDown}
        class={open ? "rotate-180 transition-transform" : "transition-transform"}
      />
    </button>

    {#if open}
      <div id="filter-panel-content" transition:fade>
        <div class="flex flex-wrap gap-2 mt-2">
          {#each availableTags as tag (tag.name)}
            <button
              type="button"
              data-testid="filter-chip"
              aria-pressed={selectedTags.includes(tag.name)}
              title={tag.name}
              class="px-4 py-2 min-h-11 rounded-full text-sm font-medium leading-tight bg-zinc-300 dark:bg-zinc-700 max-w-[16rem] truncate {chipToneClass(tag.color)}
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                focus-visible:outline-ow2-orange dark:focus-visible:outline-ow2-light-orange"
              class:opacity-40={hasSelection && !selectedTags.includes(tag.name)}
              style:background-color={chipBackground(tag.color)}
              onclick={() => toggleTag(tag.name)}
            >
              {tag.name}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}
