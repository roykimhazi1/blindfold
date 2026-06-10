import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rowToTraveller, type SavedTraveller } from "@/lib/travellers";
import { isPassengerValid } from "@/lib/passenger";

export const runtime = "nodejs";

// Saved-travellers CRUD. All reads/writes go through the RLS-scoped server
// client, so Postgres itself enforces "you only ever see/touch your own rows".

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { data, error } = await supabase
    .from("travellers")
    .select("*")
    .order("is_self", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ travellers: (data ?? []).map(rowToTraveller) });
}

export async function POST(req: Request) {
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

  const { data, error } = await supabase
    .from("travellers")
    .insert({
      user_id: user.id,
      is_self: body.isSelf ?? false,
      given_name: body.givenName!.trim(),
      family_name: body.familyName!.trim(),
      date_of_birth: body.dateOfBirth!,
      gender: body.gender!,
      nationality: body.nationality!.trim().toUpperCase(),
      passport_number: body.passportNumber!.trim().toUpperCase(),
      passport_expiry: body.passportExpiry!,
      passport_issuing_country: body.passportIssuingCountry!.trim().toUpperCase(),
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ traveller: rowToTraveller(data) });
}
