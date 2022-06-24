<script lang="ts">
  import DropdownItem from "./_dropdown_item.svelte";
  import { fade } from "svelte/transition";

  export let handleCopy : (() => Promise<void>);

  async function handleClick() {
    await handleCopy();
    showConfirmation = true;
  }

  let showConfirmation = false;
</script>

<DropdownItem slot="items" handleClick={handleClick}>
  <slot />
  {#if showConfirmation}
    <span
      transition:fade
      on:introend={() => { showConfirmation = false; }}
      class="text-xs text-gray-900 text-right pl-2"
    >(copied)</span>
  {/if}
</DropdownItem>
