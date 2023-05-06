<script lang="ts">
  export let depth: number;
</script>

{#if depth === 1}
  <h1 class="font-bold text-4xl py-4"><slot></slot></h1>
{:else if depth === 2}
  <h2 class="font-bold text-3xl py-3"><slot></slot></h2>
{:else if depth === 3}
  <h3 class="font-bold text-2xl py-2"><slot></slot></h3>
{:else if depth === 4}
  <h4 class="font-bold text-xl py-2"><slot></slot></h4>
{:else if depth === 5}
  <h5 class="font-bold text-lg py-2"><slot></slot></h5>
{:else if depth === 6}
  <h6 class="font-bold"><slot></slot></h6>
{:else}
  <slot></slot>
{/if}
