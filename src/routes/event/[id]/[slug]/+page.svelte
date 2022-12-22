<script lang="ts">
  import { page } from "$app/stores";
  import type { CountdownDate } from "$lib/types";
  import CopyTimeDropdown from "$lib/components/_copy_time_dropdown.svelte";
  import Timer from "$lib/components/_timer.svelte";
  import type { PageData } from "./$types";

  import { format, parseISO } from "date-fns";

  import { FontAwesomeIcon } from "fontawesome-svelte";
  import { faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";

  import { quintInOut } from "svelte/easing";
  import { browser } from "$app/environment";
  import { onDestroy, onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";

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

  onDestroy(() => {
    if (browser) cancelAnimationFrame(animationRequest);
  })
</script>

<svelte:head>
  <title>{data.event?.title ?? "Event"} | OW2Countdown.com</title>

  <meta name="og:title" content={`${data.event?.title ?? "Event"} | OW2Countdown.com`} />
  <meta name="og:url" content={`https://ow2countdown.com/event/${data.event.id}`} />
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
  {#if event.date !== null}
    <CopyTimeDropdown class="ml-1" date={event}>
      <span slot="button-text"><time datetime={event.date}>{format(parseISO(event.date), "PPPPp")}</time></span>
    </CopyTimeDropdown>
  {/if}
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
{#if $page.data.session}
  <div class="sm:grid grid-cols-2 fixed bottom-8 right-8 rounded-md dark:text-white bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
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
</style>
