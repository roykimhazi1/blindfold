"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { PassengerIdentity, PassengerType, Gender } from "@sv/engine";
import { CURRENCY_SYMBOL, decodeParams } from "@/lib/trip";
import type { SavedTraveller } from "@/lib/travellers";
import { PassengerFields, emptyIdentity, type IdentityFields } from "@/components/passenger-fields";
import { validatePassenger, isPassengerValid, type PassengerErrors } from "@/lib/passenger";
import {
  Lock, Mail, Unlock, Car, Shield, Check, ArrowRight, Gift, CreditCard, Users,
} from "@/components/icons";

const stripePromise =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : null;

type Step = "contact" | "travellers" | "payment";

// One seat in the party. `type` is fixed by the trip's composition; `fields`
// are the passport details; `sourceId` is the saved traveller it was filled
// from (so we don't re-save it); `save` offers to add a fresh one to the book.
interface Slot {
  type: PassengerType;
  label: string;
  fields: IdentityFields;
  sourceId: string | null;
  save: boolean;
}

function toIdentity(t: SavedTraveller): IdentityFields {
  return {
    givenName: t.givenName,
    familyName: t.familyName,
    dateOfBirth: t.dateOfBirth,
    gender: t.gender,
    nationality: t.nationality,
    citizenId: t.citizenId,
    passportNumber: t.passportNumber,
    passportExpiry: t.passportExpiry,
    passportIssuingCountry: t.passportIssuingCountry,
  };
}

function slotToPassenger(s: Slot): PassengerIdentity {
  return {
    type: s.type,
    givenName: s.fields.givenName,
    familyName: s.fields.familyName,
    dateOfBirth: s.fields.dateOfBirth,
    gender: (s.fields.gender || "x") as Gender,
    nationality: s.fields.nationality,
    passportNumber: s.fields.passportNumber,
    passportExpiry: s.fields.passportExpiry,
    passportIssuingCountry: s.fields.passportIssuingCountry,
  };
}

function buildSlots(adults: number, childrenAges: number[], saved: SavedTraveller[]): Slot[] {
  const slots: Slot[] = [];
  for (let i = 0; i < adults; i++) {
    slots.push({
      type: "adult",
      label: i === 0 ? "Lead traveller" : `Adult ${i + 1}`,
      fields: emptyIdentity(),
      sourceId: null,
      save: i === 0,
    });
  }
  for (const age of childrenAges) {
    slots.push({
      type: age < 2 ? "infant" : "child",
      label: `${age < 2 ? "Infant" : "Child"} · age ${age}`,
      fields: emptyIdentity(),
      sourceId: null,
      save: false,
    });
  }
  // Prefill seats in order from the saved travellers (self first).
  saved.forEach((t, idx) => {
    if (slots[idx]) {
      slots[idx]!.fields = toIdentity(t);
      slots[idx]!.sourceId = t.id;
      slots[idx]!.save = false;
    }
  });
  return slots;
}

export function CheckoutClient({
  defaultName = "",
  defaultEmail = "",
  savedTravellers = [],
}: {
  defaultName?: string;
  defaultEmail?: string;
  savedTravellers?: SavedTraveller[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const dealId = sp.get("deal") ?? "";
  const p = sp.get("p") ?? "";
  const price = Number(sp.get("price") ?? 0);
  const cur = sp.get("cur") ?? "EUR";
  const sym = CURRENCY_SYMBOL[cur] ?? "";

  const params = useMemo(() => (p ? decodeParams(p) : null), [p]);
  const hasSelf = useMemo(() => savedTravellers.some((t) => t.isSelf), [savedTravellers]);

  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  // Who gets the airline/hotel emails: "ops" keeps the surprise sealed (our
  // concierge handles supplier mail); "self" hands the customer every receipt.
  const [commsMode, setCommsMode] = useState<"ops" | "self">("ops");
  const [step, setStep] = useState<Step>("contact");
  const [slots, setSlots] = useState<Slot[]>(() =>
    params ? buildSlots(params.travelers.adults, params.travelers.childrenAges, savedTravellers) : [],
  );
  const [slotErrors, setSlotErrors] = useState<PassengerErrors[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ newTotal: number } | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [didPersist, setDidPersist] = useState(false);

  const contactReady = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email);
  const stripeEnabled = stripePromise !== null;
  const allTravellersValid = slots.length > 0 && slots.every((s) => isPassengerValid(s.fields));
  const readyCount = slots.filter((s) => isPassengerValid(s.fields)).length;
  const passengers = useMemo(() => slots.map(slotToPassenger), [slots]);

  function patchSlot(index: number, patch: Partial<Slot>) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function setSlotFields(index: number, patch: Partial<IdentityFields>) {
    setSlots((prev) =>
      prev.map((s, i) =>
        i === index
          ? { ...s, fields: { ...s.fields, ...patch }, sourceId: null } // editing detaches from the saved row
          : s,
      ),
    );
  }

  function pickSaved(index: number, travellerId: string) {
    if (travellerId === "") {
      patchSlot(index, { sourceId: null });
      return;
    }
    const t = savedTravellers.find((x) => x.id === travellerId);
    if (t) patchSlot(index, { fields: toIdentity(t), sourceId: t.id, save: false });
  }

  // Best-effort: persist freshly typed travellers to the address book so they're
  // ready next time. Never blocks the booking.
  async function persistNewTravellers() {
    if (didPersist) return; // never double-save (e.g. on a price-change re-submit)
    setDidPersist(true);
    await Promise.all(
      slots.map(async (s, i) => {
        if (!s.save || s.sourceId || !isPassengerValid(s.fields)) return;
        try {
          await fetch("/api/travellers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...s.fields, isSelf: i === 0 && !hasSelf }),
          });
        } catch {
          // Saving for reuse is a convenience — ignore failures.
        }
      }),
    );
  }

  function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contactReady) return;
    setError(null);
    setStep("travellers");
  }

  async function handleTravellersSubmit() {
    // Validate every seat; surface per-field hints if anything is missing.
    const found = slots.map((s) => validatePassenger(s.fields));
    setSlotErrors(found);
    if (found.some((e) => Object.keys(e).length > 0)) return;

    setBusy(true);
    setError(null);
    await persistNewTravellers();

    if (stripeEnabled) {
      try {
        const res = await fetch("/api/checkout/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: price, currency: cur, dealId, p, name, email, commsMode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Something went wrong");
        setClientSecret(data.clientSecret);
        setStep("payment");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setBusy(false);
      }
      return;
    }

    // Demo mode — no Stripe. Book directly (with the re-quote confirm flow).
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          p,
          dealId,
          contact: { name, email },
          travellers: passengers,
          sourceTravellerIds: slots.map((s) => s.sourceId),
          shownTotal: confirm?.newTotal ?? price,
          confirmPriceChange: !!confirm,
          commsMode,
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

      <Steps step={step} />

      {/* Step 1 — Contact details */}
      {step === "contact" && (
        <form onSubmit={handleContactSubmit} className="card mt-6 space-y-4 p-6">
          {/* Preserve the booking context: if the form ever submits natively
              (e.g. Enter pressed before hydration attaches the handler), it
              reloads /checkout WITH the deal still attached, instead of
              navigating to a context-less empty state. */}
          <input type="hidden" name="deal" value={dealId} />
          <input type="hidden" name="p" value={p} />
          <input type="hidden" name="price" value={String(price)} />
          <input type="hidden" name="cur" value={cur} />
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

          <fieldset>
            <legend className="text-sm text-white/60">Booking emails &amp; receipts</legend>
            <div className="mt-1 space-y-2">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                  commsMode === "ops" ? "border-brand-400 bg-brand-500/10" : "border-white/15 bg-white/5 hover:border-white/30"
                }`}
              >
                <input
                  type="radio"
                  name="commsMode"
                  value="ops"
                  checked={commsMode === "ops"}
                  onChange={() => setCommsMode("ops")}
                  className="mt-1 h-4 w-4 accent-brand-500"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <Lock size={14} className="text-brand-300" /> Full surprise
                    <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-200">Recommended</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-white/55">
                    Airline &amp; hotel emails go to our concierge desk — you only get our spoiler-free updates.
                  </span>
                </span>
              </label>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                  commsMode === "self" ? "border-brand-400 bg-brand-500/10" : "border-white/15 bg-white/5 hover:border-white/30"
                }`}
              >
                <input
                  type="radio"
                  name="commsMode"
                  value="self"
                  checked={commsMode === "self"}
                  onChange={() => setCommsMode("self")}
                  className="mt-1 h-4 w-4 accent-brand-500"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <Unlock size={14} className="text-white/50" /> Keep me in control
                  </span>
                  <span className="mt-0.5 block text-xs text-white/55">
                    Confirmations &amp; receipts land in your inbox — fair warning: they&apos;ll name the destination.
                  </span>
                </span>
              </label>
            </div>
          </fieldset>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-sm text-white/70">All-in total</span>
            <span className="tabnum font-display text-2xl font-extrabold">
              {sym}{Math.round(price).toLocaleString()}
            </span>
          </div>

          <button type="submit" disabled={!contactReady} className="btn-primary w-full disabled:opacity-50">
            Continue <ArrowRight size={18} />
          </button>
        </form>
      )}

      {/* Step 2 — Who's travelling */}
      {step === "travellers" && (
        <div className="mt-6 space-y-4">
          <div className="card space-y-1 p-5">
            <p className="flex items-center gap-2 font-display text-lg font-bold">
              <Users size={20} className="text-brand-300" /> Who&apos;s travelling?
            </p>
            <p className="text-sm text-white/60">
              Airlines need each traveller&apos;s passport details to issue tickets. We ask once, here.
            </p>
            {slots.length > 1 && (
              <p className="mt-2 text-xs text-white/45">
                {readyCount === slots.length
                  ? "Everyone's set — you're good to go."
                  : `${readyCount} of ${slots.length} travellers ready`}
              </p>
            )}
          </div>

          {slots.map((s, i) => {
            const ready = isPassengerValid(s.fields);
            return (
            <div key={i} className="card space-y-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-semibold">
                  {s.label}
                  {ready && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                      <Check size={12} /> Ready
                    </span>
                  )}
                </h3>
                {savedTravellers.length > 0 && (
                  <select
                    value={s.sourceId ?? ""}
                    onChange={(e) => pickSaved(i, e.target.value)}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/80 outline-none focus:border-brand-400"
                    aria-label="Use a saved traveller"
                  >
                    <option value="">Enter manually</option>
                    {savedTravellers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.givenName} {t.familyName}{t.isSelf ? " (You)" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <PassengerFields
                value={s.fields}
                onChange={(patch) => setSlotFields(i, patch)}
                errors={slotErrors[i] ?? {}}
                idPrefix={`pax-${i}`}
              />

              {!s.sourceId && (
                <label className="flex items-center gap-2.5 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={s.save}
                    onChange={(e) => patchSlot(i, { save: e.target.checked })}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-brand-500"
                  />
                  Save to my travellers for next time
                </label>
              )}
            </div>
            );
          })}

          {confirm && (
            <div className="rounded-xl bg-amber-500/15 px-3 py-2.5 text-sm text-amber-100" role="alert">
              The price moved to <span className="tabnum font-semibold">{sym}{Math.round(confirm.newTotal).toLocaleString()}</span> since you picked it — availability shifts in real time.
              <button onClick={handleTravellersSubmit} disabled={busy}
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

          {!confirm && (
            <div className="flex gap-3">
              <button onClick={() => { setStep("contact"); setError(null); }} className="btn-ghost px-5" disabled={busy}>
                Back
              </button>
              <button
                onClick={handleTravellersSubmit}
                disabled={!allTravellersValid || busy}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {busy
                  ? "One moment…"
                  : stripeEnabled
                    ? <>Continue to payment <ArrowRight size={18} /></>
                    : <>Pay &amp; lock it in <ArrowRight size={18} /></>}
              </button>
            </div>
          )}

          {!stripeEnabled && !confirm && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-white/45">
              <Shield size={14} className="text-mint-400" />
              Demo checkout — no real card, no real charge. Fully refundable anyway.
            </p>
          )}
        </div>
      )}

      {/* Step 3 — Stripe payment */}
      {step === "payment" && clientSecret && stripePromise && (
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
            travellers={passengers}
            sourceTravellerIds={slots.map((s) => s.sourceId)}
            clientSecret={clientSecret}
            commsMode={commsMode}
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

function Steps({ step }: { step: Step }) {
  const items: { id: Step; label: string }[] = [
    { id: "contact", label: "Contact" },
    { id: "travellers", label: "Travellers" },
    { id: "payment", label: "Payment" },
  ];
  const activeIndex = items.findIndex((i) => i.id === step);
  return (
    <div className="mt-6 flex items-center justify-center gap-2 text-xs">
      {items.map((it, i) => (
        <div key={it.id} className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${
              i <= activeIndex ? "bg-brand-500/20 text-brand-200" : "bg-white/5 text-white/40"
            }`}
          >
            {i < activeIndex ? <Check size={12} /> : <span className="tabnum">{i + 1}</span>}
            {it.label}
          </span>
          {i < items.length - 1 && <span className="h-px w-4 bg-white/15" />}
        </div>
      ))}
    </div>
  );
}

function StripePaymentForm({
  price, sym, name, email, dealId, p, travellers, sourceTravellerIds, clientSecret, commsMode,
}: {
  price: number;
  sym: string;
  name: string;
  email: string;
  dealId: string;
  p: string;
  travellers: PassengerIdentity[];
  sourceTravellerIds: (string | null)[];
  clientSecret: string;
  commsMode: "ops" | "self";
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
        body: JSON.stringify({ p, dealId, contact: { name, email }, travellers, sourceTravellerIds, paymentIntentId, commsMode }),
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
    <form onSubmit={handlePay} className="card mt-6 space-y-5 p-6">
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
