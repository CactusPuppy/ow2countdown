<script>
  import client from "$lib/client";
  import { invalidate } from "$app/navigation";
  import { onMount } from "svelte";

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

<div class="wrapper min-h-[100vh] max-w-full overflow-x-hidden mx-2">
  <main class="main__wrapper max-w-full m-auto">
    <slot />
  </main>
  <footer
    class="flex justify-between gap-2 px-2 pt-4 mt-8 mb-2 w-full overflow-x-hidden overflow-y-visible border-t-[1px] border-t-zinc-400 dark:border-t-zinc-700"
  >
    <p class="text-xs text-zinc-500 dark:text-zinc-400 italic text-left">Created by CactusPuppy<br /><a href="https://github.com/CactusPuppy/ow2countdown" rel="noreferrer noopener" target="_blank" class="text-ow2-orange dark:text-ow2-light-orange underline">GitHub</a></p>
    <p class="text-xs text-zinc-500 dark:text-zinc-400 italic text-right">
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
  }

  @media (min-width: 768px) {
    .main__wrapper {
      padding: 0 calc(10vw - 2rem);
    }
  }
</style>
