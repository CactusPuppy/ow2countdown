<script lang="ts">
  export let handleClick : ((ev: MouseEvent) => void) | undefined;
</script>

<button
  class="text-gray-900 block px-4 py-2 w-full text-sm text-left hover:text-gray-700 hover:bg-gray-200 focus:underline hover:underline"
  role="menuitem"
  id="menu-item-0"
  on:click={handleClick}
>
  <slot />
</button>
