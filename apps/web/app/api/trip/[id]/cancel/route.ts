import { NextResponse } from "next/server";
import { cancelBooking, getBooking } from "@/lib/bookings";
import { toTripView } from "@/lib/trip-view";
import { getSession, canAccessBooking } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * POST /api/trip/[id]/cancel — cancel the booking and refund it in full
 * (the MVP "change your mind anytime" policy). Returns the updated TripView.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  // Owner-or-admin only — "not yours" looks like "not found".
  const session = await getSession();
  const existing = await getBooking(id);
  if (!existing || !canAccessBooking(session, existing.userId)) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const booking = await cancelBooking(id);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  return NextResponse.json(toTripView(booking));
}
