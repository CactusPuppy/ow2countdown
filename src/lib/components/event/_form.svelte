<script lang="ts">
  import type { CountdownDate } from "$lib/types";
  import { onMount } from "svelte";

  import { parseISO } from "date-fns";

  export let event: CountdownDate | undefined = undefined;

  let title: string;
  let description: string;
  let group: string;
  let date: string;
  let end_date: string;
  let tags: string;
  let priority: number = 0;

  if (event !== undefined) setEventData(event);

  function setEventData(event: CountdownDate) {
    title = event.title;
    description = event.description;
    group = event.group;
    if (event.date) date = event.date.slice(0, 19); // Remove timezone information
    if (event.end_date) end_date = event.end_date.slice(0, 19); // Remove timezone information
    priority = event?.priority || 0;
  }
</script>

<label for="event__title" class="mb-2 text-lg">Title</label>
<textarea id="event__title" name="title" type="text" class="w-full px-2 py-1 rounded-sm dark:bg-zinc-800" placeholder="Title" rows="1" bind:value={title} />

<label for="event__description" class="mb-2 mt-4 text-lg optional-label">Description</label>
<textarea id="event__description" name="description" class="w-full px-2 py-1 rounded-sm dark:bg-zinc-800" placeholder="Description" rows="5" bind:value={description}></textarea>

<label for="event__date" class="mb-2 mt-4 text-lg optional-label">Start Date</label>
<input id="event__date" name="date" type="datetime-local" class="px-2 py-1 rounded-sm dark:bg-zinc-800" step=1 bind:value={date}>

<label for="event__end-date" class="mb-2 mt-4 text-lg optional-label">End Date</label>
<input id="event__end-date" name="end_date" type="datetime-local" class="px-2 py-1 rounded-sm dark:bg-zinc-800" step=1 bind:value={end_date}>

<label for="event__group" class="mb-2 mt-4 text-lg optional-label">Group</label>
<input id="event__group" name="group" type="text" class="w-full px-2 py-1 rounded-sm dark:bg-zinc-800" placeholder="Group Name" bind:value={group}>

<label for="event__tags" class="mb-2 mt-4 text-lg optional-label">Tags</label>
<input id="event__tags" name="tags" type="text" class="w-full px-2 py-1 rounded-sm dark:bg-zinc-800" placeholder="tag1, tag2, etc." bind:value={tags}>

<label for="event__priority" class="mb-2 mt-4 text-lg optional-label">Priority</label>
<input id="event__priority" name="priority" type="number" class="w-full px-2 py-1 rounded-sm dark:bg-zinc-800" placeholder="priority" bind:value={priority}>

<style>
  .optional-label::after {
    content: "(optional)";
    @apply text-zinc-500;
    @apply text-xs;
    @apply ml-1;
  }
</style>
