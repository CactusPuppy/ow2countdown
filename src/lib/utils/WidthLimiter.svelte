<script lang="ts">
  export let vagueWidthInPx = 900;

  let paddingAmount: string;
  $: paddingAmount = `min(calc(50dvw - (${vagueWidthInPx}px - 4rem + 20vw) / 2), 100%)`;
</script>

<div class={$$props.class} style={`padding-left: ${paddingAmount}; padding-right: ${paddingAmount};`}>
  <slot />
</div>
