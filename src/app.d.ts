/// <reference types="@sveltejs/kit" />
import Supabase from "@supabase/supabase-js";

// See https://kit.svelte.dev/docs/types#the-app-namespace
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			supabase: Supabase.SupabaseClient;
			safeGetSession: () => Promise<{ session: Supabase.Session, user: Supabase.User } | { session: null, user: null }>;
			session: Supabase.Session;
			user: Supabase.User;
		}
		interface PageData {
			session?: Supabase.AuthSession | null;
		}
		// interface Platform {}
		// interface Session {}
		// interface Stuff {}
	}
}
