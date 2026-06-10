import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * PATCH /api/profile — update the signed-in user's own profile.
 *
 * Only `full_name` is editable. We write via the service-role client and never
 * touch `is_admin`, so a user can't escalate privileges by editing their row.
 * The name is mirrored into auth `user_metadata` so the nav greeting (which
 * reads metadata) reflects the change too.
 */
export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  let body: { fullName?: string; citizenId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const fullName = body.fullName?.trim();
  if (!fullName || fullName.length < 2) {
    return NextResponse.json({ error: "Please enter your name (at least 2 characters)." }, { status: 422 });
  }
  if (fullName.length > 120) {
    return NextResponse.json({ error: "That name is too long." }, { status: 422 });
  }

  const citizenId = body.citizenId?.trim() || null;
  if (citizenId && citizenId.length > 50) {
    return NextResponse.json({ error: "That ID number is too long." }, { status: 422 });
  }

  const admin = supabaseAdmin();
  const { error: pErr } = await admin
    .from("profiles")
    .upsert({ id: user.id, full_name: fullName, citizen_id: citizenId, email: user.email ?? null }, { onConflict: "id" });
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  // Mirror into auth metadata so the nav (which reads user_metadata) updates.
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...(user.user_metadata ?? {}), full_name: fullName },
  });

  return NextResponse.json({ fullName });
}
