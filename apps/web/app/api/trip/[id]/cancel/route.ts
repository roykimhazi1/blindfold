import { NextResponse } from "next/server";
import { cancelBooking } from "@/lib/bookings";
import { toTripView } from "@/lib/trip-view";

export const runtime = "nodejs";

/**
 * POST /api/trip/[id]/cancel — cancel the booking and refund it in full
 * (the MVP "change your mind anytime" policy). Returns the updated TripView.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const booking = cancelBooking(id);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  return NextResponse.json(toTripView(booking));
}
