<script>
  import { navigating } from "$app/stores";
  import { fade } from "svelte/transition";
</script>

<div
  class="px-2 mx-auto max-w-prose dark:text-zinc-50 text-xl"
  in:fade={{ duration: 300, delay: $navigating ? 200 : 0 }}
>
  <h1 class="tracking-tight my-6 text-2xl sm:text-3xl md:text-4xl font-bold text-ow2-orange dark:text-ow2-light-orange">OW2Countdown's Privacy Policy</h1>

  <h2 class="tracking-tight uppercase font-bold mb-4">Information we collect</h2>
  <p class="my-2">OW2Countdown.com does not knowingly collect any information which can personally identify you. The only information this site collects is via the Vercel Analytics API, which collects the following information:</p>
  <ul class="ml-4 list-inside list-disc">
    <li>The page you visited (e.g. <code class="bg-zinc-100 dark:bg-zinc-800 px-1 rounded-md">/event/42</code>)</li>
    <li>Your general network speed (e.g. 4G, 2G)</li>
    <li>The type of browser you are visiting from (e.g. Chrome 86, Firefox 107)</li>
    <li>Device type (e.g. Mobile, Desktop)</li>
    <li>Device OS (e.g. Android 10, Windows 11)</li>
    <li>Country (e.g. US, UK)</li>
    <li>When we received this information (e.g. 2020-10-31 09:06:30)</li>
    <li>Which site referred you to OW2Countdown (e.g. google.com, reddit.com, etc.)</li>
  </ul>
  <p class="my-2">If you'd like to learn more about how Vercel processes this data on behalf of OW2Countdown.com, please read <a target="_blank" rel="noreferrer noopener" class="underline text-ow2-orange dark:text-ow2-light-orange" href="https://vercel.com/legal/privacy-policy">Vercel's Privacy Policy</a>.</p>

  <h2 class="tracking-tight uppercase font-bold my-4">Purpose</h2>
  <p class="my-2">The information listed above is collected for the purposes of improving the website. This information is not used for any other purposes.</p>
  <p>OW2Countdown has never, and will never, sell your data.</p>
</div>
