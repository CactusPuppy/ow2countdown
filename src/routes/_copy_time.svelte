<script lang="ts">
  import { faDiscord } from "@fortawesome/free-brands-svg-icons";
  import { FontAwesomeIcon } from "fontawesome-svelte";
  import Dropdown from "./_dropdown.svelte";
  import CopyTimeButton from "./_copy_time_button.svelte";
  import type { CountdownDate } from "$lib/types";
  import { parseISO } from "date-fns";

  export let date : CountdownDate;

  const dateObj = parseISO(date.date);

  async function copyDiscordTimestamp() {
    await navigator.clipboard.writeText(`<t:${Math.floor(dateObj.getTime() / 1000)}:f> (<t:${Math.floor(dateObj.getTime() / 1000)}:R>)`);
  }
</script>

<Dropdown defaultOpenSide="right" {...$$restProps}>
  <slot name="button-text" slot="button-text" />
  <CopyTimeButton slot="items" handleCopy={copyDiscordTimestamp}>
    <FontAwesomeIcon icon={faDiscord} />
    Copy as Discord Timestamp
  </CopyTimeButton>
</Dropdown>
