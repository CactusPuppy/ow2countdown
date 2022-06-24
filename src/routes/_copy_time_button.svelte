<script lang="ts">
  import DropdownItem from "./_dropdown_item.svelte";

  export let handleCopy : (() => Promise<void>);

  async function handleClick() {
    await handleCopy();
    fadeInOutConfirmation();
  }

  let confirmationLabel: HTMLSpanElement;
  function fadeInOutConfirmation() {
    confirmationLabel.animate(
      [
        { opacity: 0, offset: 0 },
        { opacity: 1, offset: 0.05 },
        { opacity: 1, offset: 0.95 },
        { opacity: 0, offset: 1.0 }
      ],
      1500
    );
  }
</script>

<DropdownItem slot="items" handleClick={handleClick}>
  <slot />
  <span
    bind:this={confirmationLabel}
    style="opacity: 0"
    class="text-xs text-gray-900 text-right pl-2"
  >(copied)</span>
</DropdownItem>
