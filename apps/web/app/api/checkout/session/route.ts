import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * POST /api/checkout/session
 * Creates a Stripe PaymentIntent for the given deal and returns the client secret.
 * Body: { amount, currency, dealId, p, name, email }
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  let body: {
    amount?: number;
    currency?: string;
    dealId?: string;
    p?: string;
    name?: string;
    email?: string;
    commsMode?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { amount, currency, dealId, p, name, email } = body;
  // The secrecy choice rides the PaymentIntent so the durable webhook path
  // books with the same comms mode. Not PII — just "ops" | "self".
  const commsMode = body.commsMode === "self" ? "self" : "ops";
  if (!amount || !currency || !dealId || !p || !name || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 422 });
  }

  // Account-first: a booking must belong to a signed-in user. Carry the user id
  // in the PaymentIntent metadata so the durable webhook path can persist it.
  const { user } = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to book." }, { status: 401 });
  }

  // Amount in Stripe must be in smallest currency unit (cents/agora).
  const amountCents = Math.round(amount * 100);

  try {
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      // Stripe expects lowercase ISO currency code
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        dealId,
        p,
        name,
        email,
        userId: user.id,
        commsMode,
      },
      description: "Blindfold surprise trip",
      receipt_email: email,
    });

    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
