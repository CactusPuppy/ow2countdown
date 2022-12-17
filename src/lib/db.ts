import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_KEY } from "$env/static/private";
import { PUBLIC_SUPABASE_URL } from "$env/static/public";

export default createClient(
  PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
);
