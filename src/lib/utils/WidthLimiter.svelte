<script>
  export let vagueWidthInPx = 900;
</script>

<div class={$$props.class} style={`max-width: min(calc(${vagueWidthInPx}px - 4rem + 20vw), 100%)`}>
  <slot />
</div>
