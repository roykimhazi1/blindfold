import { NextResponse } from "next/server";
import type { RevealStage } from "@sv/engine";
import { REVEAL_ORDER } from "@sv/engine";
import { advanceBooking, getBooking } from "@/lib/bookings";
import { toTripView } from "@/lib/trip-view";
import { getSession, canAccessBooking } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * POST /api/trip/[id]/advance — { stage } : demo "fast-forward" the reveal clock.
 * Returns the updated TripView, which only includes the secret fields that the
 * new stage has earned. (In production, stages unlock on real time, not here.)
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let body: { stage?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.stage || !REVEAL_ORDER.includes(body.stage as RevealStage)) {
    return NextResponse.json({ error: "Unknown stage" }, { status: 422 });
  }

  // Owner-or-admin only — and treat "not yours" the same as "not found".
  const session = await getSession();
  const existing = await getBooking(id);
  if (!existing || !canAccessBooking(session, existing.userId)) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const booking = await advanceBooking(id, body.stage as RevealStage);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  return NextResponse.json(toTripView(booking));
}
