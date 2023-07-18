<script lang="ts">
  import { quintInOut } from "svelte/easing";
  import { fade } from "svelte/transition";
</script>

<div
  class="self-start flex flex-col items-center w-full dark:text-zinc-50"
>
  <slot />
</div>
