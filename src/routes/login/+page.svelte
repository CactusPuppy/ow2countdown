<script lang="ts">
  import client from "$lib/client";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  let loading = false;

  let loginError: string;

  onMount(() => {
    if ($page.data.session) goto("/");
  })

  const login = async() => {
    loading = true;
    let { data, error } = await client.auth.signInWithOAuth({
      provider: "discord"
    });

    if (error) {
      loginError = error.message;
    }

    loading = false;
  }
</script>

<form on:submit|preventDefault={ login } class="dark:text-white">
  <h1 class="text-3xl mb-4">Login</h1>
  <p>
    Sign in with Discord below.<br>
    <b>If you don't already have an account, this page is of no use to you.</b>
  </p>

  {#if loginError}
    <div class="bg-red-500 dark:bg-red-700 px-3 py-2 rounded-sm">
      <p>{loginError}</p>
    </div>
  {/if}

  <div class="mt-4">
    <input type="submit" class="bg-ow2-orange dark:bg-ow2-light-orange rounded-xl mt-1 px-2 py-1 text-lg font-semibold cursor-pointer" value={ loading ? "Redirecting..." : "Login" } disabled={ loading } />
  </div>
</form>
