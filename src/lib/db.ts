import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "$env/static/private";

export default createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);
