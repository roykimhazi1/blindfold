import "server-only";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SessionInfo {
  user: User | null;
  isAdmin: boolean;
}

// The signed-in user (if any) plus whether they're an admin. Reads from the
// RLS-scoped server client — a user can only ever see their own profile row.
export async function getSession(): Promise<SessionInfo> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return { user, isAdmin: profile?.is_admin === true };
}

/** Owner-or-admin access to a booking. The trip page/routes read via the
 *  service role (bypassing RLS), so this guard must be applied explicitly. */
export function canAccessBooking(session: SessionInfo, bookingUserId: string): boolean {
  return !!session.user && (session.user.id === bookingUserId || session.isAdmin);
}
