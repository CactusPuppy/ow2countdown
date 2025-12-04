/// <reference types="@sveltejs/kit" />
import Supabase from "@supabase/supabase-js";

// See https://kit.svelte.dev/docs/types#the-app-namespace
// for information about these interfaces
declare global {
  namespace App {
    interface Locals {
      supabase: Supabase.SupabaseClient;
      safeGetSession: () => Promise<{ user: Supabase.User | null }>;
      user: Supabase.User;
    }
    interface PageData {
      user?: Supabase.User | null;
    }
    // interface Platform {}
    // interface Session {}
    // interface Stuff {}
  }
}
