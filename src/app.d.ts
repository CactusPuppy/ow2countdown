/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#the-app-namespace
// for information about these interfaces
declare namespace App {
	// interface Locals {}
	interface PageData {
		session: import("@supabase/supabase-js").Session | null;
	}
	// interface Platform {}
	// interface Session {}
	// interface Stuff {}
}
