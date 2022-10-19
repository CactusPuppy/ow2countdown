<script lang="ts">
  import { navigating } from "$app/stores";

  import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
  import { FontAwesomeIcon } from "fontawesome-svelte";

  import { onMount, afterUpdate } from "svelte";
  import { scale } from "svelte/transition";

  type OpenSide = "right" | "left";

  export let defaultOpenSide: OpenSide = "left";

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
      if (isOpen && event.key === "Escape") {
        isOpen = false;
      }
    };

    document.addEventListener("click", handleOutsideClick, false);
    document.addEventListener("keyup", handleEscape, false);

    return () => {
      document.removeEventListener("click", handleOutsideClick, false);
      document.removeEventListener("keyup", handleEscape, false);
    };
  });

  let menuEl: HTMLDivElement;
  let menuOpenDirection: OpenSide = defaultOpenSide;
  afterUpdate(() => {
    if (isOpen && menuEl) {
      const {
        left: menuLeftmost,
        right: menuRightmost
      } = menuEl.getBoundingClientRect();

      if (menuRightmost > window.innerWidth) {
        menuOpenDirection = "right";
      } else if (menuLeftmost < 0) {
        menuOpenDirection = "left";
      }
    }
  });
</script>

<div class={`relative z-10 ${$$props.class}`} bind:this={dropdownMenu}>
  <button
    type="button"
    class="justify-center rounded-md px-2 py-1"
    aria-label="copy-dropdown-button"
    aria-expanded="true"
    aria-haspopup="true"
    on:click={() => { isOpen = !isOpen; }}
  >
    <slot name="button-text" />
    <FontAwesomeIcon icon={faChevronDown} class="ml-2" />
  </button>

  {#if isOpen}
    <div
      bind:this={menuEl}
      class="origin-top-right absolute mt-1 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      style={`${menuOpenDirection}: 0px`}
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="copy-dropdown-button"
      tabindex="-1"
      in:scale={{ duration: 100, start: 0.95 }}
      out:scale={{ duration: $navigating ? 0 : 75, start: 0.95 }}
      on:click={() => { setTimeout(() => isOpen = !isOpen, 500) }}
    >
      <slot name="items" />
    </div>
  {/if}
</div>
