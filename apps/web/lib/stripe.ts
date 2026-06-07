import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  _stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-05-27.dahlia" });
  return _stripe;
}

export const stripeEnabled = (): boolean => Boolean(process.env.STRIPE_SECRET_KEY);

/** Returns true only if the payment intent exists and has status = succeeded. */
export async function verifyPaymentIntent(id: string): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe) return false;
  try {
    const intent = await stripe.paymentIntents.retrieve(id);
    return intent.status === "succeeded";
  } catch {
    return false;
  }
}
