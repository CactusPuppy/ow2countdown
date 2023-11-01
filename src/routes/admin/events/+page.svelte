<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { format } from "date-fns";
  import WidthLimiter from "$lib/utils/WidthLimiter.svelte";
  import Spinner from "$lib/components/_spinner.svelte";
  import { FontAwesomeIcon } from "fontawesome-svelte";
  import { faPlus, faPencil, faEye, faTrash } from "@fortawesome/free-solid-svg-icons";
  import { enhance } from "$app/forms";

  let isLoading = writable(true);
  let events = writable([]);
  let currentPage = 1;
  let totalPages = 1;
  let pageSize = 25;

  async function fetchEvents(page: number) {
    isLoading.set(true);
    const response = await fetch(`/api/events?include_past=true&page=${page}&page_size=${pageSize}&order_by=id&order_direction=desc&v=2&ts=${Date.now()}`);
    const data = await response.json();
    events.set(data.data);
    totalPages = data.meta.total_pages;
    isLoading.set(false);
  }

  function changePage(delta: number) {
    currentPage += delta;
    fetchEvents(currentPage);
  }

  function formatDate(date?: string) {
    if (!date) return "null";

    const d1 = format(new Date(date), "EEEE do MMM yyyy");
    const d2 = format(new Date(date), "yyyy-MM-dd h:mm a");

    return `${d1}\n${d2}`;
  }

  function getState(event) {
    if (event.date == null || event.end_date == null) return "Active";

    const now = new Date();
    const startDate = new Date(event.date);
    const endDate = new Date(event.end_date);

    if (now < startDate) return "Upcoming";
    if (now > endDate) return "Ended";
    return "Active";
  }

  onMount(() => {
    // if the user isn't logged in, redirect them to the login page
    if (!$page.data.session) {
      return goto("/login");
    }

    fetchEvents(currentPage);
  });
</script>

<WidthLimiter vagueWidthInPx={700} class="w-full mx-auto px-2">
  <h1 class="text-4xl mt-2 mb-4 font-bold tracking-tight text-center text-ow2-orange dark:text-ow2-light-orange">All Events</h1>

  {#if $isLoading}
    <div class="flex justify-center">
      <Spinner class="w-10 h-10" />
    </div>
  {:else}
    <div class="flex justify-center mb-4">
      <a href={`/event/new`} data-sveltekit-reload>
        <button
          class="dark:text-white dark:bg-zinc-700 hover:dark:bg-zinc-600 hover:bg-zinc-400 text-black bg-zinc-300 rounded-lg px-3 py-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none">
          <FontAwesomeIcon icon={faPlus}/><span class="pl-2">New Event</span>
        </button>
      </a>
    </div>

    <table class="table table-auto w-full rounded-lg overflow-hidden px-4 md:px-8 pt-6 pb-2 relative">
      <thead class="bg-zinc-300 dark:bg-zinc-800 text-left">
        <tr>
          <th class="px-4 py-3">ID</th>
          <th class="px-4 py-3">Title</th>
          <th class="px-4 py-3">Date</th>
          <th class="px-4 py-3">End Date</th>
          <th class="px-4 py-3">Status</th>
          <th class="px-4 py-3">Actions</th>
        </tr>
      </thead>
      <tbody class="events_list bg-zinc-200 dark:bg-zinc-700">
        {#each $events as event (event.id)}
          <tr>
            <td class="px-4 py-3 text-center">{event.id}</td>
            <td class="px-4 py-3">{event.title}</td>
            <td class="px-4 py-3 whitespace-pre">{formatDate(event.date)}</td>
            <td class="px-4 py-3 whitespace-pre">{formatDate(event.end_date)}</td>
            <td class="px-4 py-3 whitespace-pre">{getState(event)}</td>
            <td class="px-2 py-3 text-center whitespace-nowrap">
              <a href={`/event/${event.id}`}>
                <button class="bg-zinc-800 bg-opacity-30 hover:bg-zinc-600 rounded-lg px-3 py-2">
                  <FontAwesomeIcon icon={faEye}/>
                </button>
              </a>

              <a class="ml-0.5" href={`/event/${event.id}/edit`}>
                <button class="bg-zinc-800 bg-opacity-30 hover:bg-zinc-600 rounded-lg px-3 py-2">
                  <FontAwesomeIcon icon={faPencil}/>
                </button>
              </a>

              <form
                class="inline-block ml-0.5"
                action={`/event/${event.id}/destroy`}
                method="POST"
                use:enhance={({ cancel }) => {
                if (!window.confirm(`Are you sure you want to delete '${event.title}'?`)) {
                  cancel();
                }
                return async ({ result }) => {
                  if (result.type === "success" || result.type === "redirect") {
                    changePage(0)
                  } else {
                    alert("Something went wrong. Sorry about that!");
                  }
                };
              }}
              >
                <button type="submit" class="bg-red-700 bg-opacity-50 hover:bg-red-600 rounded-lg px-3 py-2">
                  <FontAwesomeIcon icon={faTrash}/>
                </button>
              </form>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

  <div class="flex justify-center mt-4 gap-3">
    <button
      on:click={() => changePage(-1)}
      disabled={currentPage === 1 || $isLoading}
      class="dark:text-white dark:bg-zinc-700 hover:dark:bg-zinc-600 hover:bg-zinc-400 text-black bg-zinc-300 rounded-lg px-4 py-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none">
      Previous
    </button>
    <button
      on:click={() => changePage(1)}
      disabled={currentPage === totalPages || $isLoading}
      class="dark:text-white dark:bg-zinc-700 hover:dark:bg-zinc-600 hover:bg-zinc-400 text-black bg-zinc-300 rounded-lg px-6 py-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none">
      Next
    </button>
  </div>
</WidthLimiter>

<style>
  .events_list tr:nth-child(even) {
    background-color: rgba(0, 0, 0, 0.08);
  }
</style>

