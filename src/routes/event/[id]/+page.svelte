<script lang="ts">
  import type { CountdownDate } from "$lib/types";
  import CopyTimeDropdown from "$lib/components/_copy_time_dropdown.svelte";
  import Timer from "$lib/components/_timer.svelte";
  import type { PageData } from "./$types";

  import { format, parseISO } from "date-fns";

  import { quintInOut } from "svelte/easing";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  export let data: PageData;
  let event: CountdownDate;
  $: event = data.event;

  let now: Date;

  let animationRequest: number;
  function updateTime() {
    now = new Date();
    animationRequest = requestAnimationFrame(updateTime);
  }

  onMount(() => {
    if (browser) now = new Date();
    if (browser) animationRequest = window.requestAnimationFrame(updateTime);
  })
</script>

<svelte:head>
  <title>{data.event?.title ?? "Event"} Countdown | OW2 Countdown</title>
</svelte:head>

<h1
  class="mx-4 mt-6 text-center text-5xl text-ow2-orange dark:text-ow2-light-orange event__title"
  in:fade={{duration: 1000, delay: 0, easing: quintInOut}}
>
  {event.title}
</h1>
<p
  class="text-center text-lg md:text-xl lg:text-2xl"
  in:fade={{duration: 1000, delay: 500, easing: quintInOut}}>
  <CopyTimeDropdown class="ml-1" date={event}>
    <span slot="button-text">{format(parseISO(event.date), "PPPPp")}</span>
  </CopyTimeDropdown>
</p>
<div class="flex justify-center">
  <Timer start={now} end={parseISO(event.date)} id={event.id}/>
</div>
{#if event.description != null}
  <p
    class="mx-4 my-8 text-lg md:text-xl max-w-3xl event__description"
    in:fade={{ duration: 500, delay: 700 }}
  >
    {@html event.description}
  </p>
{/if}

<style>
  .event__title {
    white-space: pre-line;
  }

  .event__description {
    white-space: pre-line;
  }
</style>
