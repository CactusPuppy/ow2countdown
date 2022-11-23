<script lang="ts">
  import client from "$lib/client";

  async function logout() {
    const { error } = await client.auth.signOut();

    if (error) throw new Error(error.message);
  }
</script>

{ #await logout() }
  <p class="dark:text-white">Logging you out...</p>
{ :then data }
  <p class="dark:text-white">Successfully logged out!</p>
{ :catch error }
  <p class="text-red-700 dark:text-red-500">Something went wrong!</p>
  <p class="text-red-700 dark:text-red-500">{ error }</p>
{ /await }

