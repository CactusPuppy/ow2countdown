<script>
  import client from "$lib/client";
  import { webVitals } from "$lib/webVitals";
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import { invalidate } from "$app/navigation";
  import { onMount } from "svelte";
  import Ow2CountdownLogo from "$lib/svgs/OW2CountdownLogo.svelte";
  import RssFeedIcon from "$lib/svgs/RSSFeedIcon.svelte";
  import GitHubIcon from "$lib/svgs/GitHubIcon.svelte";
  import DiscordIcon from "$lib/svgs/DiscordIcon.svelte";

  let analyticsID = import.meta.env.VERCEL_ANALYTICS_ID;

  $: if (browser && analyticsID) {
    webVitals({
      page: $page.url.pathname,
      params: $page.params,
      analyticsID
    });
  }

  import "../../app.css";

  onMount(() => {
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(() => {
      invalidate("supabase:auth");
    })

    return () => {
      subscription.unsubscribe();
    }
  });
</script>

<div class="wrapper min-h-screen max-w-[100dvw]">
  <header class="flex justify-between sm:grid sm:grid-cols-3 justify-items-center items-center w-full py-2 px-4 dark:text-white">
    <div class="justify-self-start w-12"><a href="/">
      <Ow2CountdownLogo />
    </a></div>
    <nav class="flex gap-4 sm:gap-10 text-lg sm:text-2xl items-center justify-center">
      <a href="/" class="hover:underline focus-visible:underline">Home</a>
      <a href="/about" class="hover:underline focus-visible:underline">About</a>
    </nav>
    <div class="justify-self-end flex items-center justify-center gap-4 text-2xl">
      <a href="/discord" target="_blank"><DiscordIcon /></a>
      <a href="/feed.xml" target="_blank"><RssFeedIcon /></a>
      <a href="https://github.com/CactusPuppy/ow2countdown" target="_blank" rel="noreferrer noopener"><GitHubIcon /></a>
    </div>
  </header>

  <main class="main__wrapper w-full relative dark:text-zinc-50">
    <slot />
  </main>

  <footer
    class="flex justify-between gap-2 px-2 pt-4 mt-8 mb-2 w-full overflow-y-visible border-t-[1px] border-t-zinc-400 dark:border-t-zinc-700"
  >
    <p class="text-xs text-zinc-500 dark:text-zinc-400 text-left">
      Created by CactusPuppy  |  <a href="https://github.com/CactusPuppy/ow2countdown" rel="noreferrer noopener" target="_blank" class="text-ow2-orange dark:text-ow2-light-orange underline">GitHub</a><br>
      <a href="/privacy-policy" class="text-ow2-orange dark:text-ow2-light-orange underline">Privacy Policy</a>
    </p>
    <p class="text-xs text-zinc-500 dark:text-zinc-400 text-right">
      This site is not affiliated with Overwatch or Blizzard Entertainment.
      <br />Overwatch 2 and the Overwatch 2 logo are ©2022 Blizzard Entertainment, Inc.
    </p>
  </footer>
</div>

<style>
  .wrapper {
    display: grid;
    grid-template-rows: auto 1fr auto;
  }

  .main__wrapper {
    /* max-width: min(calc(900px - 4rem + 20vw), 100%); */
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    /* align-self: stretch; */
  }

  :global(.main__wrapper > *) {
    grid-area: 1 / 1 / -1 / -1;
  }
</style>
