<script lang="ts">
  export let handleClick : ((ev: MouseEvent) => void) | undefined;
</script>

<button
  class="bg-gray-100 text-gray-900 block px-4 py-2 w-full rounded-md text-sm text-left hover:text-gray-700 hover:bg-transparent"
  role="menuitem"
  tabindex="-1"
  id="menu-item-0"
  on:click={handleClick}
>
  <slot />
</button>
