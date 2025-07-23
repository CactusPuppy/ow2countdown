<script lang="ts">
  import { faDiscord } from "@fortawesome/free-brands-svg-icons";
  import { faCopy } from "@fortawesome/free-solid-svg-icons";
  import { FontAwesomeIcon } from "fontawesome-svelte";
  import Dropdown from "./_dropdown.svelte";
  import CopyTimeButton from "./_copy_time_button.svelte";
  import { format } from "date-fns";
  import { dateToDiscordTimestamp } from "$lib/utils/date_format_helpers";

  export let date : Date;

  async function copyDiscordTimestamp() {
    await navigator.clipboard.writeText(`${dateToDiscordTimestamp(date, "f")} (${dateToDiscordTimestamp(date, "R")})`);
  }

  async function copyNormalTimestamp() {
    await navigator.clipboard.writeText(format(date, "PPPPp"))
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
