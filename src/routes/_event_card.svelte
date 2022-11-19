<script lang="ts">
  import { format, parseISO } from "date-fns"

  import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
  import { FontAwesomeIcon } from "fontawesome-svelte";

  import { fade } from "svelte/transition";

  import { navigating } from "$app/stores";

  import CopyTimeDropdown from "$lib/components/_copy_time_dropdown.svelte";
  import type { CountdownDate } from "$lib/types";
  import Timer from "$lib/components/_timer.svelte";
  import { titleToSlug } from "$lib/utils/event_helpers";

  export let date: CountdownDate;
  export let now: Date;
</script>

<div
  class="bg-zinc-200 dark:bg-zinc-800 rounded-lg px-4 sm:px-12 pt-8 pb-4 relative w-min"
  in:fade
  out:fade={$navigating ? { duration: 0 } : {}}>
  <p
    class="text-center text-xl md:text-2xl lg:text-3xl whitespace-pre-line"
    in:fade="{{duration: 500, delay: 200}}">
    <a href={`/event/${date.id}/${titleToSlug(date.title)}`} class="text-ow2-orange dark:text-ow2-light-orange hover:underline focus:underline">{date.title}</a>
    {#if date.id !== -1}
      <a
        class="inline md:absolute md:right-0 md:top-0 md:mr-4 md:mt-3 px-2 py-1 bg-zinc-700 text-zinc-200 rounded-md text-lg"
        href={`/event/${date.id}/${titleToSlug(date.title)}`}
      >
        <FontAwesomeIcon icon={faCircleInfo} />
        <span class="screenreader-only">{date.title + " Information"}</span>
      </a>
    {/if}
  </p>
  {#if date.id !== -1 && date.date !== null}
    <p
      class="text-center text-lg md:text-xl lg:text-2xl"
      in:fade="{{duration: 500, delay: 500}}">
      <CopyTimeDropdown class="ml-1" date={date}>
        <span slot="button-text">{format(parseISO(date.date), "PPPPp")}</span>
      </CopyTimeDropdown>
    </p>
  {/if}
  <div class="flex justify-center">
    <Timer start={now} end={parseISO(date.date)} id={date.id}/>
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