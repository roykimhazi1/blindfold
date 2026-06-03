"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CURRENCY_SYMBOL } from "@/lib/trip";
import { Lock, Mail, Unlock, Car, Shield, Check, ArrowRight, Gift } from "@/components/icons";

export function CheckoutClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const dealId = sp.get("deal") ?? "";
  const p = sp.get("p") ?? "";
  const price = Number(sp.get("price") ?? 0);
  const cur = sp.get("cur") ?? "ILS";
  const sym = CURRENCY_SYMBOL[cur] ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ p, dealId, contact: { name, email } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/trip/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  if (!dealId || !p) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-brand-300"><Gift size={28} /></div>
        <p className="mt-5 text-white/70">Pick a surprise first and we'll bring you here to lock it in.</p>
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

      <form onSubmit={submit} className="card mt-8 space-y-4 p-6">
        <div>
          <label htmlFor="name" className="text-sm text-white/60">Who's the trip under?</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name"
            placeholder="Your full name"
            className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-brand-400" />
        </div>
        <div>
          <label htmlFor="email" className="text-sm text-white/60">Where do we send the reveal?</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
            placeholder="you@email.com"
            className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-brand-400" />
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-sm text-white/70">All-in total</span>
          <span className="tabnum font-display text-2xl font-extrabold">{sym}{Math.round(price).toLocaleString()}</span>
        </div>

        {error && <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p>}

        <button type="submit" disabled={!ready || busy} className="btn-primary w-full disabled:opacity-50">
          {busy ? "Locking it in…" : <>Pay &amp; lock it in <ArrowRight size={18} /></>}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-xs text-white/45">
          <Shield size={14} className="text-mint-400" /> Demo checkout — no real card, no real charge. Fully refundable anyway.
        </p>
      </form>

      <div className="mt-6 space-y-2 text-sm text-white/75">
        <p className="text-center text-xs uppercase tracking-wide text-white/35">What happens next</p>
        <Row Icon={Mail} text="A week before — a packing nudge by email" />
        <Row Icon={Unlock} text="At the gate — your destination is revealed" />
        <Row Icon={Car} text="On arrival — your driver reveals the hotel" />
      </div>
    </div>
  );
}

function Row({ Icon, text }: { Icon: typeof Mail; text: string }) {
  return (
    <div className="card flex items-center gap-3 p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-brand-200"><Icon size={18} /></span>
      <span className="flex-1">{text}</span>
      <Check size={16} className="text-white/25" />
    </div>
  );
}
