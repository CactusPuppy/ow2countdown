<script lang="ts">
  import { browser } from "$app/environment";
  import client from "$lib/client";
  import { goto } from "$app/navigation";

  async function logout() {
    const { error } = await client.auth.signOut();

    if (error) throw new Error(error.message);

    if (browser) setTimeout(() => goto("/"), 5000);
  }
</script>

<div class="flex flex-col justify-center">
  { #await logout() }
    <p class="dark:text-white text-center">Logging you out...</p>
  { :then _ }
    <p class="dark:text-white text-center">Successfully logged out!</p>
    <p class="dark:text-white text-center">You will be redirected soon.</p>
  { :catch error }
    <p class="text-red-700 dark:text-red-500 text-center">Something went wrong!</p>
    <p class="text-red-700 dark:text-red-500 text-center">{ error }</p>
  { /await }
</div>

