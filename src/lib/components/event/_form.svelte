<script module>
  export const AUTO_SAVE_KEY = "ow2countdown_new_event_draft";
</script>

<script lang="ts">
  import type { CountdownDate } from "$lib/types";
  import { getUserTimeZone, getGroupedTimeZones } from "$lib/utils/timezone_helpers";
  import { parseISO, format } from "date-fns";
  import { toZonedTime } from "date-fns-tz";
  import { browser } from "$app/environment";
  import type { Snippet } from "svelte";

  const {
    event,
    submitButton,
  }: { event?: CountdownDate; submitButton: Snippet } = $props();

  let title = $state("");
  let description = $state("");
  let group = $state("");
  let date = $state("");
  let date_timezone = $state(getUserTimeZone());
  let end_date = $state("");
  let end_date_timezone = $state(getUserTimeZone());
  let tags = $state("");
  let priority = $state(0);

  if (browser) {
    if (event !== undefined) {
      setEventData(event);
    } else {
      // Load from localStorage if creating a new event
      loadFromLocalStorage();
    }
  }

  function setEventData(event: CountdownDate) {
    title = event.title;
    description = event.description ?? "";
    group = event.group ?? "";
    date_timezone = event.date_timezone ?? getUserTimeZone();
    if (event.date)
      date = format(toZonedTime(parseISO(event.date), date_timezone), "yyyy-LL-dd'T'HH:mm:ss"); // Localize datetime
    end_date_timezone = event.end_date_timezone ?? getUserTimeZone();
    if (event.end_date)
      end_date = format(
        toZonedTime(parseISO(event.end_date), end_date_timezone),
        "yyyy-LL-dd'T'HH:mm:ss",
      ).slice(0, 19); // Localize datetime
    priority = event?.priority || 0;
    tags = event.tags ?? "";
  }

  function loadFromLocalStorage() {
    if (!browser) return;

    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        title = data.title || "";
        description = data.description || "";
        group = data.group || "";
        date = data.date || "";
        date_timezone = data.date_timezone || getUserTimeZone(),
        end_date = data.end_date || "";
        end_date_timezone = data.end_date_timezone || getUserTimeZone(),
        tags = data.tags || "";
        priority = data.priority || 0;
      }
    } catch (error) {
      console.warn("Failed to load form data from localStorage:", error);
    }
  }

  function saveToLocalStorage() {
    if (!browser || event !== undefined) return;

    try {
      const formData = {
        title,
        description,
        group,
        date,
        date_timezone,
        end_date,
        end_date_timezone,
        tags,
        priority,
      };
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.warn("Failed to save form data to localStorage:", error);
    }
  }

  function clearLocalStorage() {
    if (!browser) return;
    try {
      localStorage.removeItem(AUTO_SAVE_KEY);
    } catch (error) {
      console.warn("Failed to clear form data from localStorage:", error);
    }
  }

  // Auto-save whenever form data changes using Svelte 5 $effect rune
  $effect(saveToLocalStorage);

  // Export clearLocalStorage function for parent components to use after successful form submission
  export { clearLocalStorage };
</script>

<label for="event__title" class="mb-2 text-lg">Title</label>
<textarea
  id="event__title"
  name="title"
  class="w-full px-2 py-1 rounded-sm dark:bg-zinc-800"
  placeholder="Title"
  required
  rows="1"
  bind:value={title}
></textarea>

<label for="event__description" class="mb-2 mt-4 text-lg optional-label"
  >Description</label
>
<textarea
  id="event__description"
  name="description"
  class="w-full px-2 py-1 rounded-sm dark:bg-zinc-800"
  placeholder="Description"
  rows="5"
  bind:value={description}
></textarea>

<label for="event__date" class="mb-2 mt-4 text-lg">Start Date</label>
<div class="flex gap-2">
  <input
    id="event__date"
    name="date"
    type="datetime-local"
    class="flex-4 px-2 py-1 rounded-sm dark:bg-zinc-800"
    required
    step="1"
    bind:value={date}
  />
  <select
    id="event__date-timezone"
    name="date_timezone"
    class="flex-3 min-w-px px-2 py-1 rounded-sm dark:bg-zinc-800"
    bind:value={date_timezone}
  >
    {#each getGroupedTimeZones() as [continent, timezones]}
      <optgroup label={continent}>
        {#each timezones as timezone}
          <option value={timezone.name}>
            {timezone.pretty}
          </option>
        {/each}
      </optgroup>
    {/each}
  </select>
</div>

<label for="event__end-date" class="mb-2 mt-4 text-lg optional-label"
  >End Date</label
>
<div class="flex gap-2">
  <input
    id="event__end-date"
    name="end_date"
    type="datetime-local"
    class="flex-4 px-2 py-1 rounded-sm dark:bg-zinc-800"
    step="1"
    bind:value={end_date}
  />
  <select
    id="event__end-date-timezone"
    name="end_date_timezone"
    class="flex-3 min-w-px px-2 py-1 rounded-sm dark:bg-zinc-800"
    bind:value={end_date_timezone}
  >
    {#each getGroupedTimeZones() as [continent, timezones]}
      <optgroup label={continent}>
        {#each timezones as timezone}
          <option value={timezone.name}>
            {timezone.pretty}
          </option>
        {/each}
      </optgroup>
    {/each}
  </select>
</div>

<label for="event__group" class="mb-2 mt-4 text-lg optional-label">Group</label>
<input
  id="event__group"
  name="group"
  type="text"
  class="w-full px-2 py-1 rounded-sm dark:bg-zinc-800"
  placeholder="Group Name"
  bind:value={group}
/>

<label for="event__tags" class="mb-2 mt-4 text-lg optional-label">Tags</label>
<input
  id="event__tags"
  name="tags"
  type="text"
  class="w-full px-2 py-1 rounded-sm dark:bg-zinc-800"
  placeholder="tag1, tag2, etc."
  bind:value={tags}
/>

<label for="event__priority" class="mb-2 mt-4 text-lg optional-label"
  >Priority</label
>
<input
  id="event__priority"
  name="priority"
  type="number"
  class="w-full px-2 py-1 rounded-sm dark:bg-zinc-800"
  placeholder="priority"
  bind:value={priority}
/>

{@render submitButton()}

<style>
  @reference "../../../app.css";
  label:has(+ :required)::after {
    content: "*";
    @apply text-red-400;
    @apply pl-1;
  }
  .optional-label::after {
    content: "(optional)";
    @apply text-zinc-500;
    @apply text-xs;
    @apply ml-1;
  }
</style>
