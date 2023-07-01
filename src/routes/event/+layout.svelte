<div class="width-limiter mx-auto">
  <slot />
</div>

<style>
  .width-limiter {
    max-width: min(calc(900px - 4rem + 20vw), 100%);
  }
</style>
