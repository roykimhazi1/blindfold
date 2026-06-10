import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Browser Supabase client for Client Components — the Google sign-in button and
// the Realtime subscription on the trip page. Anon key only; RLS applies.
// Returned as the hoisted SupabaseClient<Database> for correct row types (see
// the note in server.ts about the @supabase/ssr schema-generic mismatch).
export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ) as unknown as SupabaseClient<Database>;
}
