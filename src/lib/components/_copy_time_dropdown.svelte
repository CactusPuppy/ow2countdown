<script lang="ts">
  import { faDiscord } from "@fortawesome/free-brands-svg-icons";
  import { faCopy } from "@fortawesome/free-solid-svg-icons";
  import { FontAwesomeIcon } from "fontawesome-svelte";
  import Dropdown from "./_dropdown.svelte";
  import CopyTimeButton from "./_copy_time_button.svelte";
  import type { CountdownDate } from "$lib/types";
  import { format, parseISO } from "date-fns";

  export let event : CountdownDate;

  const dateObj = parseISO(event.date);

  async function copyDiscordTimestamp() {
    await navigator.clipboard.writeText(`<t:${Math.floor(dateObj.getTime() / 1000)}:f> (<t:${Math.floor(dateObj.getTime() / 1000)}:R>)`);
  }

  async function copyNormalTimestamp() {
    await navigator.clipboard.writeText(format(parseISO(event.date), "PPPPp"))
  }
</script>

<Dropdown defaultOpenSide="right" {...$$restProps}>
  <slot name="button-text" slot="button-text" />
  <div
    slot="items"
    class="bg-gray-100 rounded-md overflow-hidden"
  >
    <CopyTimeButton handleCopy={copyNormalTimestamp}>
      <FontAwesomeIcon icon={faCopy} class="mr-2" />
      Copy Date and Time
    </CopyTimeButton>
    <CopyTimeButton handleCopy={copyDiscordTimestamp}>
      <FontAwesomeIcon icon={faDiscord} class="mr-2" />
      Copy as Discord Timestamp
    </CopyTimeButton>
  </div>
</Dropdown>
