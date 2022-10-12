<script>
  import "../app.css";
</script>

<div class="flex flex-col md:justify-center items-center min-h-[100vh] w-full overflow-x-hidden">
  <slot />
  <div class="flex justify-between gap-2 my-4 mx-2 px-4 h-8 w-full">
    <p class="text-xs text-zinc-500 dark:text-zinc-400 italic text-left">Created by <a class="text-ow2-orange dark:text-ow2-light-orange underline" href="https://twitter.com/Cactus_Puppy" rel="noreferrer noopener" target="_blank">@Cactus_Puppy</a><br /><a href="https://github.com/CactusPuppy/ow2countdown" rel="noreferrer noopener" target="_blank" class="text-ow2-orange dark:text-ow2-light-orange underline">GitHub</a></p>
    <p class="text-xs text-zinc-500 dark:text-zinc-400 italic text-right">
      This site and its creator are not affiliated with Overwatch or Blizzard Entertainment.
      <br />Overwatch 2 and the Overwatch 2 logo are ©2022 Blizzard Entertainment, Inc.
    </p>
  </div>
</div>
