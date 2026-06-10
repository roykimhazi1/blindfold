import { NextResponse } from "next/server";
import { getBooking } from "@/lib/bookings";
import { toTripView } from "@/lib/trip-view";
import { getSession, canAccessBooking } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * GET /api/trip/[id] — the authoritative, stage-gated TripView. The Realtime
 * subscription on the trip page re-fetches this whenever the booking row
 * changes; the secret is merged server-side and only included once the stage
 * has earned it (gate → destination, arrival → hotel/driver).
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const session = await getSession();
  const booking = await getBooking(id);
  if (!booking || !canAccessBooking(session, booking.userId)) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  return NextResponse.json(toTripView(booking));
}
