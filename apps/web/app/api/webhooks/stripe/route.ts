import { NextResponse } from "next/server";
import type { TripParams } from "@sv/engine";
import { bookBundle, getFulfillment, requoteOption } from "@sv/engine";
import { recoverDeal } from "@/lib/deal-source";
import { decodeParams } from "@/lib/trip";
import { createBooking, type CommsMode } from "@/lib/bookings";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * POST /api/webhooks/stripe
 *
 * Handles `payment_intent.succeeded` from Stripe. This is the durable path —
 * if the browser closed between payment confirmation and the `/api/book` call,
 * the webhook still creates the booking from the PaymentIntent metadata
 * (which carries the signed-in user id set at checkout-session time).
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ received: true }); // no-op without Stripe

  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (event.type !== "payment_intent.succeeded") {
    return NextResponse.json({ received: true });
  }

  const intent = event.data.object;
  const { p, dealId, name, email, userId } = intent.metadata as {
    p?: string; dealId?: string; name?: string; email?: string; userId?: string;
  };

  if (!p || !dealId || !name || !email || !userId) {
    // Intent wasn't created by this app's checkout flow — ignore.
    return NextResponse.json({ received: true });
  }

  // Secrecy choice set at checkout-session time; 'ops' routes supplier
  // emails to the concierge inbox so receipts can't spoil the reveal.
  const commsMode: CommsMode = intent.metadata.commsMode === "self" ? "self" : "ops";
  const supplierEmail =
    commsMode === "ops" ? (process.env.OPS_CONTACT_EMAIL?.trim() || email) : email;

  try {
    const params: TripParams | null = decodeParams(p);
    if (!params) return NextResponse.json({ received: true });

    // Recover from the same source that generated the deal, then re-quote the
    // finalist live — the same two-step /api/book performs. The payment is
    // already captured here, so the fresh quote is recorded, not re-confirmed.
    const recovered = await recoverDeal(params, dealId);
    if (!recovered) return NextResponse.json({ received: true });
    const { option, deal } = await requoteOption(recovered.option, params);

    // No passport snapshot here (PII never rides Stripe metadata), so real
    // supplier legs fall back to mock refs — ops reconciles from the booking.
    const booked = await bookBundle(option.components, {
      bookingId: `${dealId}:${email}:webhook`,
      fulfillment: getFulfillment(),
      contact: { email: supplierEmail },
    });
    if (!booked.ok) return NextResponse.json({ received: true });

    const supplierRefs = booked.orders.map((o) => o.ref);
    await createBooking(
      option,
      params,
      deal,
      { name, email },
      [], // passport details aren't in Stripe metadata (PII) — this durable
          // fallback books without the passenger snapshot; the /api/book path
          // (with the browser open) is what captures it.
      userId,
      supplierRefs,
      intent.id,
      undefined,
      commsMode,
    );
  } catch {
    // Log but return 200 so Stripe doesn't retry indefinitely.
    console.error("[webhook] booking failed for PI", intent.id);
  }

  return NextResponse.json({ received: true });
}
