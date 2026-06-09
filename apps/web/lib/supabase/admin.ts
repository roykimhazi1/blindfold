import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Service-role Supabase client — SERVER ONLY. Bypasses RLS, so it is the only
// thing allowed to read/write `booking_secrets` and to insert/update bookings.
// `import "server-only"` makes a client-bundle import a build error.
let cached: SupabaseClient<Database> | null = null;

export function supabaseAdmin(): SupabaseClient<Database> {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key === "REPLACE_WITH_SERVICE_ROLE_KEY") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing. Copy the service_role secret from " +
        "Supabase Dashboard → Project Settings → API into apps/web/.env.local.",
    );
  }
  cached = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
