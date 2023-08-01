<script lang="ts">
  export let href = "";
  export let title = undefined;
  export let text = "";
</script>

<img src={href} {title} alt={text} loading="lazy">
