import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "@/config/env";

let adminClient: SupabaseClient | null = null;

if (ENV.SUPABASE_URL && ENV.SUPABASE_SERVICE_ROLE_KEY) {
  adminClient = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY);
}

export const supabaseAdmin = adminClient;