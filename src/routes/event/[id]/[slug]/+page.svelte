<script lang="ts">
  import { page } from "$app/stores";
  import type { CountdownDate } from "$lib/types";
  import CopyTimeDropdown from "$lib/components/_copy_time_dropdown.svelte";
  import Timer from "$lib/components/_timer.svelte";
  import Ow2CLink from "$lib/components/markdown/OW2CLink.svelte";
  import Heading from "$lib/components/markdown/Heading.svelte";
  import { eventRelationToNow, titleToSlug, isEventHappeningNow } from '$lib/utils/event_helpers';
  import { markdownToPlaintext } from "$lib/utils/string_helpers";
  import type { PageData } from "./$types";

  import { format, parseISO, differenceInSeconds } from "date-fns";
  import SvelteMarkdown from "svelte-markdown";

  import { FontAwesomeIcon } from "fontawesome-svelte";
  import { faPencil, faTrash, faChevronRight } from "@fortawesome/free-solid-svg-icons";

  import { quintInOut } from "svelte/easing";
  import { browser } from "$app/environment";
  import { onDestroy, onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import ProgressBar from "$lib/components/_progress_bar.svelte";

  import EmbedBuilder from "./_embed_builder.svelte";

  export let data: PageData;
  let event: CountdownDate;
  $: event = data.event;

  const maxOGDescriptionLength = 200;
  $: plaintextDescription = markdownToPlaintext(event.description);
  $: ogDescription = plaintextDescription.length >= maxOGDescriptionLength ? `${plaintextDescription.substring(0, maxOGDescriptionLength)}...` : plaintextDescription;

  let now: Date;
  const EVENT_ARRIVAL_LINGER_TIME_SECONDS = 3;
  $: dateStringToDisplay = (now && event.date && now.getTime() > parseISO(event.date).getTime() + EVENT_ARRIVAL_LINGER_TIME_SECONDS * 1000 && event.end_date) ? event.end_date : event.date;
  let animationRequest: number;
  function updateTime() {
    now = new Date();
    animationRequest = requestAnimationFrame(updateTime);
  }

  $: displayVerb = eventRelationToNow(event, now);

  let eventDurationInSeconds: number;
  let timeRemainingInSeconds: number;
  $: if (isEventHappeningNow(event, now)) {
    eventDurationInSeconds = differenceInSeconds(parseISO(event.date), parseISO(event.end_date));
    timeRemainingInSeconds = differenceInSeconds(now, parseISO(event.end_date), { roundingMethod: "ceil" })
  }

  let isEmbedBuilderOpen = false;

  onMount(() => {
    if (browser) now = new Date();
    if (browser) animationRequest = window.requestAnimationFrame(updateTime);
  })

  onDestroy(() => {
    if (browser) cancelAnimationFrame(animationRequest);
  })
</script>

<svelte:head>
  <title>{data.event?.title ?? "Event"} | OW2Countdown.com</title>

  <meta name="description" content={ogDescription}/>
  <meta name="og:title" content={`${data.event?.title ?? "Event"} | OW2Countdown.com`} />
  <meta name="og:description" content={ogDescription}/>
  <meta name="og:url" content={`https://ow2countdown.com/event/${data.event.id}/${titleToSlug(data.event.title)}`} />
  <meta name="og:image" content="https://ow2countdown.com/og-image.jpg" />
  <meta name="og:image:alt" content="OW2Countdown Logo" />
  <meta name="og:image:width" content="600" />
  <meta name="og:image:height" content="600" />
</svelte:head>

<h1
  class="mx-4 mt-10 text-center text-5xl text-ow2-orange dark:text-ow2-light-orange event__title"
  in:fade={{duration: 1000, delay: 0, easing: quintInOut}}
  out:fade={{easing: quintInOut}}
>
  {event.title}
</h1>
<div>
  <p
    class="text-center text-lg md:text-xl lg:text-2xl"
    in:fade={{duration: 1000, delay: 450, easing: quintInOut}}
    out:fade
  >
    Event {displayVerb} on
  </p>
  <p
    class="text-center text-lg md:text-xl lg:text-2xl"
    in:fade={{duration: 1000, delay: 500, easing: quintInOut}}
    out:fade={{easing: quintInOut}}>
    {#if event.date !== null}
      <CopyTimeDropdown class="ml-1" date={parseISO(dateStringToDisplay)}>
        <span slot="button-text"><time datetime={dateStringToDisplay}>{format(parseISO(dateStringToDisplay), "PPPPp")}</time></span>
      </CopyTimeDropdown>
    {/if}
  </p>
</div>
{#if isEventHappeningNow(event, now)}
  <div
    class="mt-2.5 w-3/4 max-w-[48rem]"
    in:fade="{{duration: 500, delay: 600}}">
    <ProgressBar progress={100 - timeRemainingInSeconds / eventDurationInSeconds * 100} />
  </div>
{/if}
<div class="flex justify-center">
  <Timer start={now} end={parseISO(dateStringToDisplay)} id={event.id} additionalDelay={700}/>
</div>
{#if event.description}
  <div
    class="mx-4 my-8 text-lg md:text-xl max-w-3xl event__description"
    in:fade={{ duration: 500, delay: 700 }}
    out:fade={{easing: quintInOut}}
  >
    <SvelteMarkdown
      source={event.description}
      renderers={{
        "link": Ow2CLink,
        "heading": Heading
      }}
    />
  </div>
{/if}
{#if $page.data.session}
  <div class="sm:grid grid-cols-2 fixed bottom-8 right-8 rounded-md dark:text-white bg-zinc-200 dark:bg-zinc-800 overflow-hidden shadow-lg shadow-gray-900">
    <p class="p-4 pr-2 hover:bg-zinc-300 hover:dark:bg-zinc-700 hover:underline transition-colors ease-out duration-200">
      <a href={`/event/${event.id}/edit`} class="" data-sveltekit-reload>
        <FontAwesomeIcon icon={faPencil}/><span class="pl-2 font-semibold">Edit Event</span>
      </a>
    </p>
    <form
      class="p-4 hover:bg-zinc-300 hover:dark:bg-zinc-700 hover:underline transition-colors ease-out duration-200 text-red-700 dark:text-red-400"
      action={`/event/${event.id}/destroy`}
      method="POST"
      use:enhance={({ cancel }) => {
        if (!window.confirm(`Are you sure you want to delete '${event.title}'?`)) {
          cancel();
        }

        return async ({ result }) => {
          if (result.type == "success" || result.type == "redirect") {
            goto("/");
          } else {
            alert("Something went wrong. Sorry about that!");
          }
        };
      }}
    >
      <button type="submit">
        <FontAwesomeIcon icon={faTrash}/><span class="pl-2 font-semibold">Delete Event</span>
      </button>
    </form>
  </div>
{/if}

<a href="/"
    class="max-w-3xl px-6 py-3 md:px-8 md:py-4
      text-lg md:text-xl focus:underline hover:underline text-ow2-orange dark:text-ow2-light-orange
      rounded-md cursor-pointer
      bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700
      hover:shadow-lg hover:shadow-gray-900 hover:-translate-y-0.5 hover:active:shadow hover:active:translate-y-0
      transition-colors transition-shadow transition-transform"
    in:fade={{ duration: 500, delay: 900, easing: quintInOut }}
    out:fade={{ easing: quintInOut }}
  >
    View All Events
  </a>

<button
  aria-expanded="true"
  aria-haspopup="true"
  on:click={ () => isEmbedBuilderOpen = !isEmbedBuilderOpen }
  class="flex items-center"
>
  <p class="text-2xl">Stream Embed Builder</p>
  <div class={"ml-4 transition-transform" + (isEmbedBuilderOpen ? " rotate-90" : "")}>
    <FontAwesomeIcon icon={faChevronRight} />
  </div>
</button>

{#if isEmbedBuilderOpen}
  <EmbedBuilder {event} />
{/if}

<style>
  .event__title {
    white-space: pre-line;
  }

  .event__description {
    white-space: pre-line;
  }

  .event__description :global(a.link-wrap) {
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .event__description :global(p) {
    @apply pb-4;
  }

  .event__description :global(ul) {
    @apply list-disc list-inside;
  }
</style>
