<script lang="ts">
  import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from 'fontawesome-svelte';

  import { onMount } from 'svelte';
  import { scale } from 'svelte/transition';

  // Based on https://codechips.me/tailwind-ui-react-vs-svelte/
  let dropdownMenu = null;
  let isOpen = false;

  onMount(() => {
    const handleOutsideClick = (event) => {
      if (isOpen && !dropdownMenu.contains(event.target)) {
        isOpen = false;
      }
    };

    const handleEscape = (event) => {
      if (isOpen && event.key === 'Escape') {
        isOpen = false;
      }
    };

    document.addEventListener('click', handleOutsideClick, false);
    document.addEventListener('keyup', handleEscape, false);

    return () => {
      document.removeEventListener('click', handleOutsideClick, false);
      document.removeEventListener('keyup', handleEscape, false);
    };
  });
</script>

<div class="relative inline" bind:this={dropdownMenu}>
  <button
    type="button"
    class="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-2 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
    aria-label="copy-dropdown-button"
    aria-expanded="true"
    aria-haspopup="true"
    on:click={() => { isOpen = true; }}
  >
    <slot name="button-text" />
    <FontAwesomeIcon icon={faChevronDown} class="ml-2" />
  </button>

  {#if isOpen}
    <div
      class="origin-top-right absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="copy-dropdown-button"
      tabindex="-1"
      in:scale={{ duration: 100, start: 0.95 }}
      out:scale={{ duration: 75, start: 0.95 }}
    >
      <slot name="items" />
    </div>
  {/if}
</div>
