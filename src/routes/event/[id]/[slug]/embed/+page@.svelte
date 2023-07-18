<script lang="ts">
  import { page } from "$app/stores";

  import type { CountdownDate } from "$lib/types";
  import type { PageData } from "./$types";

  import Embed from "./_embed.svelte";

  export let data: PageData;
  let event: CountdownDate;
  $: event = data.event;
</script>

<svelte:head>
  <title>{data.event?.title ?? "Event"} Embed</title>
  <meta name="og:title" content={`${data.event?.title ?? "Event"} Embed`} />
  <meta name="robots" content="noindex" />
</svelte:head>

<Embed
  title={$page.url.searchParams.has("title")}
  timestamp={$page.url.searchParams.has("timestamp")}
  progressBar={$page.url.searchParams.has("progress_bar")}
  timezone={$page.url.searchParams.get("timezone")}
  {event} />
