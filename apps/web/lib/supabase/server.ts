import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// User-scoped, RLS-enforced Supabase client for Server Components and Route
// Handlers. Reads/writes the auth session from cookies (Next 15: cookies() is
// async). Use this for "act as the signed-in user" reads — never for the secret.
//
// NOTE: we return the hoisted `SupabaseClient<Database>` type. @supabase/ssr
// 0.6.1 computes the schema generic in a way that conflicts with supabase-js's
// newer `__InternalSupabase` (PostgrestVersion) type format, which makes
// `.from(...).select(...)` rows resolve to `never`. The runtime client is
// identical; this just gives callers the correct (working) row types.
export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component (cookies are read-only there) —
            // the middleware refreshes the session cookie instead. Safe to ignore.
          }
        },
      },
    },
  ) as unknown as SupabaseClient<Database>;
}
