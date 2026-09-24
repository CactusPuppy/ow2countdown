<script lang="ts">
  import { differenceInSeconds, format, parseISO } from "date-fns"

  import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
  import { FontAwesomeIcon } from "fontawesome-svelte";

  import { fade } from "svelte/transition";

  import CopyTimeDropdown from "$lib/components/_copy_time_dropdown.svelte";
  import type { CountdownDateWithTags } from "$lib/types";
  import Timer from "$lib/components/_timer.svelte";
  import { eventEffectiveDate, eventRelationToNow, titleToSlug, isEventHappeningNow } from "$lib/utils/event_helpers";
  import { chipBackground, chipTextTone } from "$lib/utils/color_helpers";
  import ProgressBar from "$lib/components/_progress_bar.svelte";

  export let event: CountdownDateWithTags;
  export let now: Date;
  export let additionalDelay = 0;

  $: dateStringToDisplay = eventEffectiveDate(event, now);

  $: displayVerb = eventRelationToNow(event, now);

  // Maps a tag's color to exactly one of three mutually exclusive Tailwind
  // class strings, chosen from chipTextTone's computed tone. Emitting a
  // single class string (rather than leaving the neutral pair on the
  // element and appending an override beside it) avoids a specificity
  // conflict: a `dark:`-prefixed utility outranks an unprefixed one, so a
  // lingering `dark:text-zinc-50` would otherwise win over an override's
  // `text-zinc-900` in dark mode.
  function chipToneClass(color: string | null): string {
    const tone = chipTextTone(color);
    if (tone === "dark") return "text-zinc-900";
    if (tone === "light") return "text-zinc-50";
    return "text-zinc-900 dark:text-zinc-50";
  }

  let eventDurationInSeconds: number;
  let timeRemainingInSeconds: number;
  $: if (isEventHappeningNow(event, now)) {
    eventDurationInSeconds = differenceInSeconds(parseISO(event.date), parseISO(event.end_date));
    timeRemainingInSeconds = differenceInSeconds(now, parseISO(event.end_date), { roundingMethod: "ceil" })
  }
</script>

<div
  class="bg-zinc-200 dark:bg-zinc-800 rounded-lg px-4 md:px-8 pt-6 pb-2 relative w-min"
  in:fade="{{delay: additionalDelay}}"
  out:fade>
  <p
    class="text-center text-balance text-xl md:text-2xl lg:text-3xl whitespace-pre-line"
    in:fade="{{duration: 500, delay: 200 + additionalDelay}}"
    out:fade>
    <a
      href={`/event/${event.id}/${titleToSlug(event.title)}`}
      class="tracking-tight text-ow2-orange dark:text-ow2-light-orange hover:underline focus:underline"
    >
      {event.title}
    </a>
  </p>
  {#if event.tags.length > 0}
    <ul
      data-testid="event-tags"
      class="flex flex-wrap justify-center gap-2 list-none mt-1"
      in:fade={{duration: 500, delay: 275 + additionalDelay}}
      out:fade
    >
      {#each event.tags as tag (tag.name)}
        <li
          class="px-2 py-1 rounded-full text-xs font-medium leading-tight bg-zinc-300 dark:bg-zinc-700 max-w-[12rem] truncate {chipToneClass(tag.color)}"
          style:background-color={chipBackground(tag.color)}
          title={tag.name}
        >{tag.name}</li>
      {/each}
    </ul>
  {/if}
  {#if event.id !== -1}
    <div
      class="absolute right-0 top-0 md:mr-3 md:mt-3 px-2 py-1
        bg-zinc-500 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600
        hover:shadow-md hover:shadow-gray-900 hover:active:shadow
        hover:-translate-y-[0.1rem] hover:active:translate-y-0
        text-zinc-200 rounded-bl-lg rounded-tr-md md:rounded-md text-base md:text-lg
        transition-colors transition-transform transition-shadow"
    >
      <a href={`/event/${event.id}/${titleToSlug(event.title)}`}>
        <FontAwesomeIcon icon={faCircleInfo} />
        <span class="screenreader-only">{event.title + " Information"}</span>
      </a>
    </div>
  {/if}
  {#if dateStringToDisplay !== null}
    <p
      class="text-center text-lg md:text-xl lg:text-2xl"
      in:fade={{duration: 500, delay: 350 + additionalDelay}}
      out:fade
    >
      Event {displayVerb} on
    </p>
    <p
      class="text-center text-lg md:text-xl lg:text-2xl"
      in:fade="{{duration: 500, delay: 500 + additionalDelay}}"
      out:fade>
      <CopyTimeDropdown class="ml-1" date={parseISO(dateStringToDisplay)} {now}>
        <span slot="button-text"><time datetime={dateStringToDisplay}>{format(parseISO(dateStringToDisplay), "PPPPp")}</time></span>
      </CopyTimeDropdown>
    </p>
  {/if}
  {#if isEventHappeningNow(event, now)}
    <div
      class="mt-2.5"
      in:fade="{{duration: 500, delay: 600 + additionalDelay}}">
      <ProgressBar progress={100 - timeRemainingInSeconds / eventDurationInSeconds * 100} />
    </div>
  {/if}
  <div class="flex justify-center my-6">
    <Timer start={now} end={parseISO(dateStringToDisplay)} id={event.id} additionalDelay={additionalDelay + 700} />
  </div>
</div>

<style>
  .screenreader-only {
    border: 0;
    clip: rect(0 0 0 0);
    height: 1px;
    margin: -1px;
    overflow: hidden;
    padding: 0;
    position: absolute;
    white-space: nowrap;
    width: 1px;
  }
</style>
