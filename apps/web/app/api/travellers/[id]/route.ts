import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rowToTraveller, type SavedTraveller } from "@/lib/travellers";
import { isPassengerValid } from "@/lib/passenger";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = "nodejs";

type TravellerUpdate = Database["public"]["Tables"]["travellers"]["Update"];

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  let body: Partial<SavedTraveller>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isPassengerValid(body)) {
    return NextResponse.json({ error: "Please complete all passport fields." }, { status: 422 });
  }

  const update: TravellerUpdate = {
    given_name: body.givenName!.trim(),
    family_name: body.familyName!.trim(),
    date_of_birth: body.dateOfBirth!,
    gender: body.gender!,
    nationality: body.nationality!.trim().toUpperCase(),
    passport_number: body.passportNumber!.trim().toUpperCase(),
    passport_expiry: body.passportExpiry!,
    passport_issuing_country: body.passportIssuingCountry!.trim().toUpperCase(),
    updated_at: new Date().toISOString(),
  };
  if (body.isSelf !== undefined) update.is_self = body.isSelf;

  // RLS scopes this to the signed-in user; a foreign id simply matches no row.
  const { data, error } = await supabase
    .from("travellers")
    .update(update)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Traveller not found" }, { status: 404 });

  return NextResponse.json({ traveller: rowToTraveller(data) });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { error } = await supabase.from("travellers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
