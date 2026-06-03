import { NextResponse } from "next/server";
import type { RevealStage } from "@sv/engine";
import { REVEAL_ORDER } from "@sv/engine";
import { advanceBooking } from "@/lib/bookings";
import { toTripView } from "@/lib/trip-view";

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

  const booking = advanceBooking(id, body.stage as RevealStage);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  return NextResponse.json(toTripView(booking));
}
