import { NextResponse } from "next/server";
import type { TripParams, PassengerIdentity } from "@sv/engine";
import { bookBundle } from "@sv/engine";
import { orchestrateDeals } from "@sv/agents";
import { decodeParams } from "@/lib/trip";
import { createBooking } from "@/lib/bookings";
import { verifyPaymentIntent, stripeEnabled } from "@/lib/stripe";
import { getSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isPassengerValid, passportValidThrough, normalizePassenger } from "@/lib/passenger";

export const runtime = "nodejs";

// A re-quote only interrupts the user if the price moved by more than this.
const PRICE_DELTA_TOLERANCE = 0.005; // 0.5%

/**
 * POST /api/book — { p, dealId, contact, shownTotal?, confirmPriceChange?, paymentIntentId? }
 *
 * 1. Re-runs the search from the encoded params (recovers the chosen option +
 *    the *current* price).
 * 2. **Re-quote + confirm delta**: if the live price drifted past tolerance from
 *    what the user was shown, return `{ priceChanged, newTotal }` so the client
 *    can confirm before we charge. (No-op in mock mode — prices are
 *    deterministic — but live the instant real suppliers are wired in.)
 * 3. When Stripe is configured, verifies the PaymentIntent is `succeeded`
 *    before creating the booking. In demo mode (no Stripe key) this step is skipped.
 * 4. Runs the **booking saga** (`bookBundle`: flight → hotel → attractions,
 *    compensating on partial failure).
 * 5. Persists the booking (holds the secret server-side) and returns its id.
 *    Idempotent by `paymentIntentId` — safe to retry.
 */
export async function POST(req: Request) {
  let body: {
    p?: string;
    dealId?: string;
    contact?: { name?: string; email?: string };
    travellers?: PassengerIdentity[];
    sourceTravellerIds?: (string | null)[];
    shownTotal?: number;
    confirmPriceChange?: boolean;
    paymentIntentId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Account-first: a booking must belong to a signed-in user.
  const { user } = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to book." }, { status: 401 });
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

  // Passenger identities — one per traveller in the party. Validated here as the
  // authoritative gate (never trust the client): right count, complete fields,
  // and a passport that's still valid on the return date.
  const expectedCount = params.travelers.adults + params.travelers.childrenAges.length;
  const travellers = Array.isArray(body.travellers) ? body.travellers : [];
  if (travellers.length !== expectedCount) {
    return NextResponse.json(
      { error: `Please add passport details for all ${expectedCount} traveller${expectedCount === 1 ? "" : "s"}.` },
      { status: 422 },
    );
  }
  const returnIso = (() => {
    const d = new Date(params.dates.start + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + params.dates.nights);
    return d.toISOString();
  })();
  for (const t of travellers) {
    if (t?.type !== "adult" && t?.type !== "child" && t?.type !== "infant") {
      return NextResponse.json({ error: "Invalid traveller type." }, { status: 422 });
    }
    if (!isPassengerValid(t)) {
      return NextResponse.json({ error: "Some traveller details are incomplete." }, { status: 422 });
    }
    if (!passportValidThrough(t.passportExpiry, returnIso)) {
      return NextResponse.json(
        { error: "A passport expires before your return date — please check the details." },
        { status: 422 },
      );
    }
  }
  const passengers = travellers.map(normalizePassenger);

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

    // [3] Verify Stripe payment when in Stripe mode.
    if (stripeEnabled()) {
      if (!body.paymentIntentId) {
        return NextResponse.json({ error: "Payment required" }, { status: 402 });
      }
      const paid = await verifyPaymentIntent(body.paymentIntentId);
      if (!paid) {
        return NextResponse.json({ error: "Payment not confirmed" }, { status: 402 });
      }
    }

    // [4] Booking saga — secure all three legs or roll back.
    const booked = await bookBundle(option.components, { bookingId: `${body.dealId}:${email}` });
    if (!booked.ok) {
      return NextResponse.json(
        { error: "We couldn't secure the whole trip just now — please try again." },
        { status: 502 },
      );
    }

    // [5] Persist the booking (tied to the user; secret held server-side);
    //     record the supplier refs for ops.
    const supplierRefs = booked.orders.map((o) => o.ref);

    // Link each passenger snapshot back to the saved traveller it was filled
    // from (when one was used). Validate ownership against the user's own rows so
    // a stale/foreign id can't fail the booking on the FK or mis-link a stranger.
    let sourceTravellerIds: (string | null)[] | undefined;
    if (Array.isArray(body.sourceTravellerIds) && body.sourceTravellerIds.some(Boolean)) {
      const supa = await createSupabaseServerClient();
      const { data: owned } = await supa.from("travellers").select("id");
      const ownedIds = new Set((owned ?? []).map((r) => r.id));
      sourceTravellerIds = passengers.map((_, i) => {
        const id = body.sourceTravellerIds?.[i] ?? null;
        return id && ownedIds.has(id) ? id : null;
      });
    }

    const booking = await createBooking(option, params, deal, { name, email }, passengers, user.id, supplierRefs, body.paymentIntentId, sourceTravellerIds);
    return NextResponse.json({ id: booking.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
