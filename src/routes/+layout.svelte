<script>
  import client from "$lib/client";
  import { webVitals } from "$lib/webVitals";
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import { invalidate } from "$app/navigation";
  import { onMount } from "svelte";

  let analyticsID = import.meta.env.VERCEL_ANALYTICS_ID;

  $: if (browser && analyticsID) {
    webVitals({
      page: $page.url.pathname,
      params: $page.params,
      analyticsID
    });
  }

  import "../app.css";

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

<div class="wrapper min-h-screen max-w-full overflow-x-hidden mx-2">
  <main class="main__wrapper max-w-full mx-auto relative">
    <slot />
  </main>
  <footer
    class="flex justify-between gap-2 px-2 pt-4 mt-8 mb-2 w-full overflow-y-visible border-t-[1px] border-t-zinc-400 dark:border-t-zinc-700"
  >
    <p class="text-xs text-zinc-500 dark:text-zinc-400 text-left">
      Created by CactusPuppy  |  <a href="https://github.com/CactusPuppy/ow2countdown" rel="noreferrer noopener" target="_blank" class="text-ow2-orange dark:text-ow2-light-orange underline">GitHub</a><br>
      <a href="/privacy-policy" target="_self" class="text-ow2-orange dark:text-ow2-light-orange underline">Privacy Policy</a>
    </p>
    <p class="text-xs text-zinc-500 dark:text-zinc-400 text-right">
      This site and its creator are not affiliated with Overwatch or Blizzard Entertainment.
      <br />Overwatch 2 and the Overwatch 2 logo are ©2022 Blizzard Entertainment, Inc.
    </p>
  </footer>
</div>

<style>
  .wrapper {
    display: grid;
    grid-template-rows: 1fr auto;
  }

  .main__wrapper {
    max-width: min(calc(900px - 4rem + 20vw), 100%);
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    /* align-self: stretch; */
  }

  :global(.main__wrapper > *) {
    grid-area: 1 / 1 / -1 / -1;
  }

  @media (min-width: 768px) {
    .main__wrapper {
      padding: 0 calc(10vw - 2rem);
    }
  }
</style>
