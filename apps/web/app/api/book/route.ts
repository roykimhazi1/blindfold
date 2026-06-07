import { NextResponse } from "next/server";
import type { TripParams } from "@sv/engine";
import { bookBundle } from "@sv/engine";
import { orchestrateDeals } from "@sv/agents";
import { decodeParams } from "@/lib/trip";
import { createBooking } from "@/lib/bookings";

export const runtime = "nodejs";

// A re-quote only interrupts the user if the price moved by more than this.
const PRICE_DELTA_TOLERANCE = 0.005; // 0.5%

/**
 * POST /api/book — { p, dealId, contact, shownTotal?, confirmPriceChange? }
 *
 * 1. Re-runs the search from the encoded params (recovers the chosen option +
 *    the *current* price).
 * 2. **Re-quote + confirm delta**: if the live price drifted past tolerance from
 *    what the user was shown, return `{ priceChanged, newTotal }` so the client
 *    can confirm before we charge. (No-op in mock mode — prices are
 *    deterministic — but live the instant real suppliers are wired in.)
 * 3. Runs the **booking saga** (`bookBundle`: flight → hotel → attractions,
 *    compensating on partial failure).
 * 4. Persists the booking (holds the secret server-side) and returns its id.
 *
 * No real payment in the MVP — this stands in for Stripe authorize+capture.
 */
export async function POST(req: Request) {
  let body: {
    p?: string;
    dealId?: string;
    contact?: { name?: string; email?: string };
    shownTotal?: number;
    confirmPriceChange?: boolean;
  };
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
    const option = options[idx]!;

    // [2] Re-quote + confirm delta.
    if (typeof body.shownTotal === "number" && !body.confirmPriceChange) {
      const tolerance = Math.max(1, body.shownTotal * PRICE_DELTA_TOLERANCE);
      if (Math.abs(deal.priceTotal - body.shownTotal) > tolerance) {
        return NextResponse.json(
          { priceChanged: true, newTotal: deal.priceTotal, currency: deal.currency },
          { status: 200 },
        );
      }
    }

    // [3] Booking saga — secure all three legs or roll back.
    const booked = await bookBundle(option.components, { bookingId: `${body.dealId}:${email}` });
    if (!booked.ok) {
      return NextResponse.json(
        { error: "We couldn't secure the whole trip just now — please try again." },
        { status: 502 },
      );
    }

    // [4] Persist the booking; record the supplier refs for ops.
    const supplierRefs = booked.orders.map((o) => o.ref);
    const booking = await createBooking(option, params, deal, { name, email }, supplierRefs);
    return NextResponse.json({ id: booking.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
