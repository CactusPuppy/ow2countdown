<script lang="ts">
  import client from "$lib/client";
  import { goto } from "$app/navigation";

  let loading = false;

  let email: string;
  // let password: string;

  let loginError: string;

  const login = async() => {
    loading = true;
    let { data, error } = await client.auth.signInWithOtp({
      email
    });

    if (error) {
      loginError = error.message;
    }

    loading = false;
    if (data.user) goto("/admin");
  }
</script>

<form on:submit|preventDefault={ login } class="dark:text-white">
  <h1 class="text-3xl mb-4">Login</h1>
  <p>
    Sign in with your account below.<br>
    <b>If you don't already have an account, this page is of no use to you.</b>
  </p>

  <div class="my-2 dark:text-black">
    <input type="email" class="mt-2 rounded-lg px-3 py-2 w-full" placeholder="Email" bind:value={email} />
    <!-- <input type="password" class="mt-2 rounded-lg px-3 py-2 w-full" placeholder="Password" bind:value={password} /> -->
  </div>

  {#if loginError}
    <div class="bg-red-500 dark:bg-red-700 px-3 py-2 rounded-sm">
      <p>{loginError}</p>
    </div>
  {/if}

  <div class="mt-4">
    <input type="submit" class="bg-ow2-orange dark:bg-ow2-light-orange rounded-xl mt-1 px-2 py-1 text-lg font-semibold" value={ loading ? "Submitting..." : "Submit" } disabled={ loading } />
  </div>
</form>
