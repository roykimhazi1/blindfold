import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

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
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { amount, currency, dealId, p, name, email } = body;
  if (!amount || !currency || !dealId || !p || !name || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 422 });
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
