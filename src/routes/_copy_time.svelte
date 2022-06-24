<script lang="ts">
  import { faCopy } from '@fortawesome/free-solid-svg-icons';
  import { faDiscord } from '@fortawesome/free-brands-svg-icons';
  import { FontAwesomeIcon } from 'fontawesome-svelte';
  import Dropdown from './_dropdown.svelte';
  import CopyTimeButton from './_copy_time_button.svelte';
  import type { CountdownDate } from '$lib/types';
  import { parseISO } from 'date-fns';

  export let date : CountdownDate;

  const dateObj = parseISO(date.date);

  async function copyToClipboard(text: string) {
    const { state } = await navigator.permissions.query({
      // @ts-ignore ts(2322): lib.dom.ts doesn't have "clipboard-write" as a valid permission
      name: "clipboard-write"
    });
    if (!(state === "granted" || state === "prompt")) {
      throw new Error("user disallowed copying")
    }
    await navigator.clipboard.writeText(text);
  }

  async function copyDiscordTimestamp() {
    await copyToClipboard(`<t:${Math.floor(dateObj.getTime() / 1000)}:f> (<t:${Math.floor(dateObj.getTime() / 1000)}:R>)`);
  }
</script>

<Dropdown defaultOpenSide="right" {...$$restProps}>
  <slot name="button-text" slot="button-text" />
  <CopyTimeButton slot="items" handleCopy={copyDiscordTimestamp}>
    <FontAwesomeIcon icon={faDiscord} />
    Copy as Discord Timestamp
  </CopyTimeButton>
</Dropdown>
