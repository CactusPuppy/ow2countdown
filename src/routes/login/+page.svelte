<script lang="ts">
  import client from "$lib/client";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  let loading = false;

  let loginError: string;
  let email: string;

  onMount(() => {
    if ($page.data.session) goto("/");
  })

  const login = async() => {
    loading = true;
    let { data, error } = await client.auth.signInWithOtp({
      email: email
    });

    if (error) {
      loginError = error.message;
    } else {
      alert("Check your email for the login link!");
    }

    loading = false;
  }
</script>

<div class="flex flex-col justify-center dark:text-white">
  <h1 class="text-3xl mb-4">Login</h1>
  {#if loginError}
    <div class="bg-red-500 dark:bg-red-700 px-3 py-2 rounded-sm">
      <p>{loginError}</p>
    </div>
  {/if}


  <form on:submit|preventDefault={ login }>
    <p>
      Sign in with your email below.<br>
      <b>If you don't already have an account, this page is of no use to you.</b>
    </p>

    <div class="mt-2">
      <input type="email" placeholder="Email" bind:value={ email } class="px-2 py-1 w-1/2 min-w-[15rem] rounded-md bg-zinc-300 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300" />
    </div>

    <div class="mt-4">
      <input type="submit" class="bg-ow2-orange rounded-xl mt-1 px-2 py-1 text-lg font-semibold cursor-pointer text-white" value={ loading ? "Redirecting..." : "Login" } disabled={ loading } />
    </div>
  </form>
</div>
