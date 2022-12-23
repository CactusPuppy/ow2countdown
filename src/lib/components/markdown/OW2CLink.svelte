<script lang="ts">
  export let href = "";
  export let title = undefined;
  export let rel = "noreferrer noopener";
  export let target = "_blank";
  export let cssClass = "underline text-ow2-orange dark:text-ow2-light-orange";
  export let shouldWrapLink = false;

  let linkClass: string;
  $: linkClass = cssClass + (shouldWrapLink ? "link-wrap" : "");
</script>

<a
  {href}
  {title}
  {rel}
  {target}
  class={linkClass}
>
  <slot></slot>
</a>
