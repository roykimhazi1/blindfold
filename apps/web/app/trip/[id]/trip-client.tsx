"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { stageAtLeast, type RevealStage } from "@sv/engine";
import type { TripView } from "@/lib/trip-view";
import { CURRENCY_SYMBOL } from "@/lib/trip";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Gift, Suitcase, Unlock, Lock, Car, Plane, MapPin, Building, Star, Ticket,
  Mail, Check, Sparkles, ArrowRight, Clock, Users,
} from "@/components/icons";

const FF: { stage: RevealStage; label: string }[] = [
  { stage: "teaser", label: "A week before" },
  { stage: "gate", label: "At the gate" },
  { stage: "arrival", label: "On arrival" },
];

export function TripClient({ initial }: { initial: TripView }) {
  const [view, setView] = useState<TripView>(initial);
  const [busy, setBusy] = useState<RevealStage | null>(null);
  const [reveal, setReveal] = useState(false); // sealed-reveal overlay
  const [cancelBusy, setCancelBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const hadDestination = useRef(!!initial.destination);
  const sym = CURRENCY_SYMBOL[view.currency] ?? "";

  // Apply a fresh TripView (from advance or a Realtime re-fetch), firing the
  // sealed-reveal overlay the first time the destination becomes visible.
  const applyView = useCallback((next: TripView) => {
    if (next.destination && !hadDestination.current) {
      hadDestination.current = true;
      setReveal(true);
    }
    setView(next);
  }, []);

  // Realtime: when this booking's row changes (advance/cancel — including from
  // another device), re-fetch the *gated* TripView from the server. The secret
  // is never in the Realtime payload; only the server reveals what the stage
  // has earned.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`booking:${initial.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings", filter: `id=eq.${initial.id}` },
        async () => {
          try {
            const res = await fetch(`/api/trip/${initial.id}`);
            if (res.ok) applyView(await res.json());
          } catch {
            // transient — the next event (or a manual advance) will resync
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [initial.id, applyView]);

  async function advance(stage: RevealStage) {
    if (busy) return;
    setBusy(stage);
    try {
      const res = await fetch(`/api/trip/${view.id}/advance`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }),
      });
      const next: TripView = await res.json();
      if (res.ok) applyView(next);
    } finally {
      setBusy(null);
    }
  }

  const stage = view.stage;
  const departed = stageAtLeast(stage, "gate");
  const cancelled = view.status === "cancelled";

  async function cancel() {
    if (cancelBusy) return;
    setCancelBusy(true);
    try {
      const res = await fetch(`/api/trip/${view.id}/cancel`, { method: "POST" });
      const next: TripView = await res.json();
      if (res.ok) { setView(next); setConfirmCancel(false); }
    } finally {
      setCancelBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      {reveal && view.destination && !cancelled && (
        <RevealOverlay city={view.destination.city} country={view.destination.country} onClose={() => setReveal(false)} />
      )}

      {/* header */}
      <div className="text-center">
        <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs ${cancelled ? "border-white/15 bg-white/5 text-white/55" : "border-white/15 bg-white/5 text-white/75"}`}>
          <Check size={14} className={cancelled ? "text-white/40" : "text-mint-400"} />
          {cancelled ? "Cancelled — fully refunded" : "Booked & paid — you're going somewhere"}
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold md:text-4xl">
          {cancelled
            ? "Maybe next time"
            : view.contactName ? `${view.contactName.split(" ")[0]}, pack a bag` : "Pack a bag"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-white/60">
          {cancelled
            ? `We've refunded ${sym}${Math.round(view.refunded ?? view.priceTotal).toLocaleString()} in full. The unknown will keep.`
            : departed ? "The secret's out — here's everything you need." : "We'll let the secret out a little at a time. Here's where things stand."}
        </p>
      </div>

      {!departed && !cancelled && <Countdown gateAt={view.schedule.gateAt} />}

      {/* demo time machine */}
      {!cancelled && (
      <div className="card mt-6 flex flex-wrap items-center gap-2 p-4">
        <span className="mr-1 inline-flex items-center gap-1.5 text-xs text-white/55"><Clock size={14} /> Demo time machine:</span>
        {FF.map((f) => {
          const done = stageAtLeast(stage, f.stage);
          return (
            <button key={f.stage} onClick={() => advance(f.stage)} disabled={done || busy !== null}
              className={`rounded-full px-3 py-1.5 text-xs transition active:scale-95 ${
                done ? "bg-mint-400/15 text-mint-300" : "border border-white/15 bg-white/5 text-white/75 hover:border-white/30"
              }`}>
              {done ? <Check size={13} className="mr-1 inline" /> : null}
              {busy === f.stage ? "…" : f.label}
            </button>
          );
        })}
      </div>
      )}

      {/* timeline */}
      <div className="mt-8 space-y-4">
        {/* 1 — booked */}
        <Stage Icon={Gift} title="Your surprise is locked in" tone="done">
          <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
            <Fact label="Nights" value={String(view.nights)} />
            <Fact label="Travellers" value={String(view.travelers)} />
            <Fact label="All-in" value={`${sym}${Math.round(view.priceTotal).toLocaleString()}`} />
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-white/70">
            {view.includes.map((i) => (
              <li key={i} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-mint-400" /> {i}</li>
            ))}
          </ul>
          {view.passengers && view.passengers.length > 0 && (
            <div className="mt-4">
              <div className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-medium"><Users size={16} className="text-brand-300" /> Who&apos;s coming</div>
              <div className="flex flex-wrap gap-1.5">
                {view.passengers.map((p, i) => (
                  <span key={i} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/75">
                    {p.givenName} {p.familyName.slice(0, 1)}.
                  </span>
                ))}
              </div>
            </div>
          )}
        </Stage>

        {/* future stages hidden once cancelled */}
        {!cancelled && <>
        {/* 2 — teaser */}
        {stageAtLeast(stage, "teaser") ? (
          <Stage Icon={Suitcase} title="A week to go — pack for this" tone="done">
            <p className="mt-2 text-white/80">{view.hints.packingTip}</p>
            <p className="mt-2 text-xs text-white/45">{climateLine(view.hints.climateBand)} · {view.hints.flightBand} flight</p>
          </Stage>
        ) : (
          <LockedStage Icon={Mail} title="A packing nudge" unlockAt={view.schedule.teaserAt}
            text="One week before you fly, we'll tell you how to pack — without giving the place away." />
        )}

        {/* 3 — gate reveal */}
        {view.destination ? (
          <Stage Icon={MapPin} title="Here's where you're going!" tone="reveal">
            <div className="mt-2 font-display text-3xl font-extrabold text-gradient">{view.destination.city}</div>
            <div className="text-white/70">{view.destination.country} · {view.destination.region}</div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm">
              <Plane size={15} /> {view.destination.carrier} · {view.destination.flightHours.toFixed(1)}h from Tel Aviv
            </div>
          </Stage>
        ) : (
          <LockedStage Icon={Lock} title="Your destination" unlockAt={view.schedule.gateAt}
            text="Sealed until departure day. Your boarding pass would spoil it — so we reveal it right here at the gate." />
        )}

        {/* 4 — arrival: hotel + driver + things to do */}
        {view.hotel ? (
          <Stage Icon={Car} title="You've landed — meet your driver" tone="reveal">
            <p className="mt-1 text-sm text-white/70">
              Your driver's outside (about {view.driver?.etaMinutes} min away). On the way in, they reveal your home for the trip:
            </p>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/20 text-brand-200"><Building size={20} /></span>
              <div>
                <div className="font-display text-lg font-bold">{view.hotel.name}</div>
                <div className="flex items-center gap-1 text-xs text-white/55">
                  <span className="inline-flex text-sun-400">{Array.from({ length: view.hotel.stars }).map((_, k) => <Star key={k} size={12} filled />)}</span>
                  · {view.hotel.board}
                </div>
              </div>
            </div>
            {view.attractions && (
              <div className="mt-3">
                <div className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-medium"><Ticket size={16} className="text-brand-300" /> What we've lined up</div>
                <ul className="space-y-1.5 text-sm text-white/70">
                  {view.attractions.map((a) => <li key={a} className="flex gap-2"><Sparkles size={14} className="mt-0.5 shrink-0 text-sun-400" /> {a}</li>)}
                </ul>
              </div>
            )}
          </Stage>
        ) : (
          <LockedStage Icon={Car} title="Your hotel &amp; your driver" unlockAt={view.schedule.arrivalAt}
            text="When you land, a driver meets you and reveals the hotel on the way there. The last little secret." />
        )}
        </>}
      </div>

      {/* cancellation — MVP full-refund policy */}
      {!cancelled && (
        <div className="mt-8 text-center">
          {confirmCancel ? (
            <div className="card mx-auto max-w-sm p-5">
              <p className="text-sm text-white/75">Cancel this trip? You'll be refunded <span className="font-semibold">{sym}{Math.round(view.priceTotal).toLocaleString()}</span> in full.</p>
              <div className="mt-4 flex justify-center gap-2">
                <button onClick={() => setConfirmCancel(false)} className="btn-ghost px-5 py-2.5 text-sm">Keep it</button>
                <button onClick={cancel} disabled={cancelBusy}
                  className="rounded-full bg-rose-500/90 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 active:scale-95 disabled:opacity-50">
                  {cancelBusy ? "Refunding…" : "Yes, cancel & refund"}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmCancel(true)} className="text-sm text-white/45 underline-offset-4 transition hover:text-white/75 hover:underline">
              Change of plans? Cancel for a full refund
            </button>
          )}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/" className="btn-ghost">Back home <ArrowRight size={18} /></Link>
      </div>
    </div>
  );
}

function climateLine(band: string) {
  return ({ cold: "Expect it chilly", mild: "Mild and pleasant", warm: "Nice and warm", hot: "Bring the heat" } as Record<string, string>)[band] ?? "";
}

function Countdown({ gateAt }: { gateAt: number }) {
  // `now` stays null until after mount so server and first client render match
  // (avoids a hydration mismatch on the ticking numbers).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = now === null ? null : Math.max(0, gateAt - now);
  const cell = (v: number | null) => (ms === null || v === null ? "--" : String(v).padStart(2, "0"));
  const d = ms === null ? null : Math.floor(ms / 86_400_000);
  const h = ms === null ? null : Math.floor((ms % 86_400_000) / 3_600_000);
  const m = ms === null ? null : Math.floor((ms % 3_600_000) / 60_000);
  const s = ms === null ? null : Math.floor((ms % 60_000) / 1000);
  const parts: [number | null, string][] = [[d, "days"], [h, "hrs"], [m, "min"], [s, "sec"]];
  return (
    <div className="card mt-6 p-5 text-center">
      <div className="text-xs uppercase tracking-wide text-white/45">Take-off in</div>
      <div className="mt-2 flex items-center justify-center gap-3">
        {parts.map(([v, l]) => (
          <div key={l} className="min-w-[3.5rem]">
            <div className="tabnum font-display text-3xl font-extrabold">{cell(v)}</div>
            <div className="text-xs text-white/45">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stage({ Icon, title, tone, children }: { Icon: typeof Gift; title: string; tone: "done" | "reveal"; children: React.ReactNode }) {
  return (
    <div className={`card animate-fade-up p-5 ${tone === "reveal" ? "ring-1 ring-brand-400/50" : ""}`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone === "reveal" ? "bg-gradient-to-br from-brand-500 to-violet-500 text-white" : "bg-mint-400/15 text-mint-300"}`}>
          <Icon size={20} />
        </span>
        <h2 className="font-display text-lg font-bold">{title}</h2>
      </div>
      <div className="pl-[52px]">{children}</div>
    </div>
  );
}

function LockedStage({ Icon, title, text, unlockAt }: { Icon: typeof Lock; title: string; text: string; unlockAt: number }) {
  return (
    <div className="card p-5 opacity-70">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 text-white/40"><Icon size={20} /></span>
        <div className="flex-1">
          <h2 className="font-display text-lg font-bold text-white/70">{title}</h2>
          <div className="text-xs text-white/40">Unlocks {new Date(unlockAt).toLocaleDateString("en-GB", { month: "short", day: "numeric", timeZone: "UTC" })}</div>
        </div>
        <Lock size={18} className="text-white/30" />
      </div>
      <p className="mt-2 pl-[52px] text-sm text-white/50">{text}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
      <div className="tabnum font-display text-lg font-bold">{value}</div>
      <div className="text-xs text-white/45">{label}</div>
    </div>
  );
}

function RevealOverlay({ city, country, onClose }: { city: string; country: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/80 p-6 backdrop-blur-md" onClick={onClose}>
      <div className="animate-pop relative text-center">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <span className="blob left-1/4 top-0 h-40 w-40 bg-brand-500/60" />
          <span className="blob right-1/4 bottom-0 h-44 w-44 bg-violet-500/50" style={{ animationDelay: "-5s" }} />
        </div>
        <div className="text-sm uppercase tracking-[0.2em] text-brand-300">You're going to…</div>
        <div className="mt-3 font-display text-6xl font-extrabold text-gradient md:text-7xl">{city}</div>
        <div className="mt-2 text-xl text-white/70">{country}</div>
        <div className="mt-4 text-4xl">🎉</div>
        <button onClick={onClose} className="btn-primary mt-8">Let's go <ArrowRight size={18} /></button>
        <p className="mt-3 text-xs text-white/40">(tap anywhere to close)</p>
      </div>
    </div>
  );
}
