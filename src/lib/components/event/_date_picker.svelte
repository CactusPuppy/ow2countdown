<script lang="ts">
  import { toLosAngelesDate, getGroupedTimeZones } from "$lib/utils/timezone_helpers";
  import { format } from "date-fns";
  
  interface DatePickerProps {
    id?: string;
    name: string; 
    required?: boolean; 
    date: string;
    timezone: string;
  };

  let { 
    id,
    name, 
    required = false,
    date = $bindable(), 
    timezone = $bindable() 
  }: DatePickerProps = $props();

  let los_angeles_date = $derived(toLosAngelesDate(date, timezone));
  let grouped_timezones = $derived(getGroupedTimeZones(date));

  function infoFormatter(date: typeof los_angeles_date, timezone: string) {
    const data = [];

    if (timezone !== "America/Los_Angeles")
      data.push(`Los Angeles time: ${date ? format(date.date, "h:mm a") : "N/A"}`);

    if (date?.diff)
      data.push(`${date.diff} from usual event time`)

    return data.join(", ");
  }
</script>

<div class="flex gap-2">
  <input
    {id}
    {name}
    type="datetime-local"
    class="flex-4 px-2 py-1 rounded-sm dark:bg-zinc-800"
    {required}
    step="1"
    bind:value={date}
  />
  <select
    id={`${id}-timezone`}
    name={`${name}_timezone`}
    class="flex-3 min-w-px px-2 py-1 rounded-sm dark:bg-zinc-800"
    required
    bind:value={timezone}
  >
    {#each grouped_timezones as [continent, timezones]}
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

<div class="pt-1 text-sm whitespace-pre-wrap">
  {infoFormatter(los_angeles_date, timezone) || " "}
</div>