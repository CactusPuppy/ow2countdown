<script context="module" lang="ts">
  export async function load({ url, params, query }) {
    // const dates = await getDates();

    return {
      props: {
        _dates: [] // TODO: Change this once we have dates
      }
    }
  }
</script>

<script lang="ts">
  import type { CountdownDate } from "$lib/types";
  import { getDates, dates } from "../stores/dates";

  export let _dates : CountdownDate[];
  if (!$dates.length) $dates = _dates;


  async function getData() {
    let data : any;
    try {
      data = await getDates();
    } catch (error) {
      throw new Error(error.message);
    }
    $dates = [...$dates, ...data]
  }

  function updateTime() {
    //TODO
  }
</script>

<div class="flex flex-col justify-center items-center h-[100vh] w-[100vw]">
  <div class="flex-grow flex flex-col justify-center items-center py-8">
    <p><b>Now Live:</b> Overwatch 2 PVP Beta 1</p>
    <br />
    <p><b>Next Event:</b> Overwatch 2 PVP Beta 2</p>
    <p><code>00 Days 15 Hours 13 Minutes 57 Seconds</code></p>
    <br />
  </div>
  <div class="flex justify-between my-4 mx-2 px-4 h-8 w-full">
    <p class="text-xs text-gray-500 dark:text-slate-400 italic text-left">Created by <a class="text-blue-600 dark:text-blue-300 underline" href="https://twitter.com/Cactus_Puppy" rel="noreferrer noopener" target="_blank">@Cactus_Puppy</a><br /><a href="https://github.com/CactusPuppy/isow2outyet" rel="noreferrer noopener" target="_blank" class="text-blue-600 dark:text-blue-300 underline">GitHub</a></p>
    <p class="text-xs text-gray-500 dark:text-slate-400 italic text-right">
      This site and its creator are not affiliated with Overwatch or Blizzard Entertainment.
      <br />Overwatch 2 and the Overwatch 2 logo are ©2022 Blizzard Entertainment, Inc.
    </p>
  </div>
</div>
