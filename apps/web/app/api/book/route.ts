import { NextResponse } from "next/server";
import type { TripParams } from "@sv/engine";
import { orchestrateDeals } from "@sv/agents";
import { decodeParams } from "@/lib/trip";
import { createBooking } from "@/lib/bookings";

export const runtime = "nodejs";

/**
 * POST /api/book — { p, dealId, contact } → creates a booking.
 * Re-runs the deal pipeline from the encoded params, finds the chosen option
 * (so we recover the real, secret destination), persists it, and returns the
 * booking id. No payment integration in the MVP — this stands in for Stripe.
 */
export async function POST(req: Request) {
  let body: { p?: string; dealId?: string; contact?: { name?: string; email?: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const params: TripParams | null = body.p ? decodeParams(body.p) : null;
  if (!params || !body.dealId) {
    return NextResponse.json({ error: "Missing trip details or deal id" }, { status: 422 });
  }
  const name = body.contact?.name?.trim();
  const email = body.contact?.email?.trim();
  if (!name || !email) {
    return NextResponse.json({ error: "Please add a name and email" }, { status: 422 });
  }

  try {
    const { deals, options } = await orchestrateDeals(params);
    const idx = deals.findIndex((d) => d.id === body.dealId);
    if (idx === -1 || !options[idx]) {
      return NextResponse.json({ error: "That surprise has expired — please search again" }, { status: 409 });
    }
    const deal = deals[idx]!;
    const booking = createBooking(options[idx]!, params, deal, { name, email });
    return NextResponse.json({ id: booking.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
