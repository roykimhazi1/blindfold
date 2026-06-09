"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { CURRENCY_SYMBOL } from "@/lib/trip";
import {
  Lock, Mail, Unlock, Car, Shield, Check, ArrowRight, Gift, CreditCard,
} from "@/components/icons";

const stripePromise =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : null;

export function CheckoutClient({ defaultName = "", defaultEmail = "" }: { defaultName?: string; defaultEmail?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const dealId = sp.get("deal") ?? "";
  const p = sp.get("p") ?? "";
  const price = Number(sp.get("price") ?? 0);
  const cur = sp.get("cur") ?? "EUR";
  const sym = CURRENCY_SYMBOL[cur] ?? "";

  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ newTotal: number } | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const ready = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email);
  const stripeEnabled = stripePromise !== null;

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);

    if (stripeEnabled) {
      try {
        const res = await fetch("/api/checkout/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: price, currency: cur, dealId, p, name, email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Something went wrong");
        setClientSecret(data.clientSecret);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setBusy(false);
      }
    } else {
      // Demo mode — no Stripe configured
      try {
        const res = await fetch("/api/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            p,
            dealId,
            contact: { name, email },
            shownTotal: confirm?.newTotal ?? price,
            confirmPriceChange: !!confirm,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Something went wrong");
        if (data.priceChanged) {
          setConfirm({ newTotal: data.newTotal });
          setBusy(false);
          return;
        }
        router.push(`/trip/${data.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setBusy(false);
      }
    }
  }

  if (!dealId || !p) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-brand-300">
          <Gift size={28} />
        </div>
        <p className="mt-5 text-white/70">Pick a surprise first and we&apos;ll bring you here to lock it in.</p>
        <Link href="/start" className="btn-primary mt-6">Plan a trip</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-12">
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-xl shadow-brand-500/30">
          <Lock size={26} />
        </span>
        <h1 className="mt-5 font-display text-3xl font-extrabold">Lock in your mystery</h1>
        <p className="mt-2 text-white/65">Last step. Then the fun part — waiting to find out where.</p>
      </div>

      {/* Step 1 — Contact details */}
      {!clientSecret && (
        <form onSubmit={handleContactSubmit} className="card mt-8 space-y-4 p-6">
          <div>
            <label htmlFor="name" className="text-sm text-white/60">Who&apos;s the trip under?</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="Your full name"
              className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label htmlFor="email" className="text-sm text-white/60">Where do we send the reveal?</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@email.com"
              className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-brand-400"
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-sm text-white/70">All-in total</span>
            <span className="tabnum font-display text-2xl font-extrabold">
              {sym}{Math.round(price).toLocaleString()}
            </span>
          </div>

          {confirm && (
            <div className="rounded-xl bg-amber-500/15 px-3 py-2.5 text-sm text-amber-100" role="alert">
              The price moved to <span className="tabnum font-semibold">{sym}{Math.round(confirm.newTotal).toLocaleString()}</span> since you picked it — availability shifts in real time.
              <button type="submit" disabled={busy}
                className="mt-2 block w-full rounded-xl bg-amber-400/90 px-3 py-2 font-semibold text-black transition hover:bg-amber-300 disabled:opacity-50">
                {busy ? "Locking it in…" : `Continue at ${sym}${Math.round(confirm.newTotal).toLocaleString()}`}
              </button>
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={!ready || busy} className="btn-primary w-full disabled:opacity-50">
            {busy
              ? "One moment…"
              : stripeEnabled
                ? <>Continue to payment <ArrowRight size={18} /></>
                : <>Pay &amp; lock it in <ArrowRight size={18} /></>
            }
          </button>

          {!stripeEnabled && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-white/45">
              <Shield size={14} className="text-mint-400" />
              Demo checkout — no real card, no real charge. Fully refundable anyway.
            </p>
          )}
        </form>
      )}

      {/* Step 2 — Stripe payment */}
      {clientSecret && stripePromise && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "night",
              variables: {
                colorPrimary: "#8b5cf6",
                colorBackground: "#0f0a1e",
                colorText: "#f0ecff",
                colorDanger: "#f43f5e",
                borderRadius: "16px",
                fontFamily: "inherit",
              },
            },
          }}
        >
          <StripePaymentForm
            price={price}
            sym={sym}
            name={name}
            email={email}
            dealId={dealId}
            p={p}
            clientSecret={clientSecret}
          />
        </Elements>
      )}

      <div className="mt-6 space-y-2 text-sm text-white/75">
        <p className="text-center text-xs uppercase tracking-wide text-white/35">What happens next</p>
        <Row Icon={Mail} text="A week before — a packing nudge by email" />
        <Row Icon={Unlock} text="At the gate — your destination is revealed" />
        <Row Icon={Car} text="On arrival — your driver reveals the hotel" />
      </div>
    </div>
  );
}

function StripePaymentForm({
  price, sym, name, email, dealId, p, clientSecret,
}: {
  price: number;
  sym: string;
  name: string;
  email: string;
  dealId: string;
  p: string;
  clientSecret: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || busy) return;
    setBusy(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Payment error");
      setBusy(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
      setBusy(false);
      return;
    }

    // Payment confirmed — create the booking (pass PI ID for server-side verification)
    const paymentIntentId = clientSecret.split("_secret_")[0];
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ p, dealId, contact: { name, email }, paymentIntentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      router.push(`/trip/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm booking");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handlePay} className="card mt-8 space-y-5 p-6">
      <div className="flex items-center gap-2 text-sm text-white/60">
        <CreditCard size={16} className="text-brand-300" />
        <span>Secure card payment</span>
      </div>

      <PaymentElement options={{ layout: "tabs" }} />

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <span className="text-sm text-white/70">Charging today</span>
        <span className="tabnum font-display text-2xl font-extrabold">
          {sym}{Math.round(price).toLocaleString()}
        </span>
      </div>

      {error && (
        <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || busy}
        className="btn-primary w-full disabled:opacity-50"
      >
        {busy
          ? "Processing payment…"
          : <>Pay {sym}{Math.round(price).toLocaleString()} <ArrowRight size={18} /></>
        }
      </button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-white/45">
        <Shield size={14} className="text-mint-400" />
        Secured by Stripe · Fully refundable
      </p>
    </form>
  );
}

function Row({ Icon, text }: { Icon: typeof Mail; text: string }) {
  return (
    <div className="card flex items-center gap-3 p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-brand-200">
        <Icon size={18} />
      </span>
      <span className="flex-1">{text}</span>
      <Check size={16} className="text-white/25" />
    </div>
  );
}
