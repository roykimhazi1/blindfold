"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type {
  TripParams, Currency, PartyType, VibeType, Temperature, Board, SurpriseIntensity,
} from "@sv/engine";
import { encodeParams, CURRENCY_SYMBOL } from "@/lib/trip";
import {
  Sparkles, Wallet, Calendar, Users, Umbrella, Building, Mountain, Wine, Landmark,
  Sun, Snow, Globe, Lock, Plane, Plus, Minus, ArrowRight, Check,
} from "@/components/icons";

type Mode = "express" | "full";

const VIBES: { v: VibeType; label: string; Icon: typeof Umbrella }[] = [
  { v: "beach", label: "Beach", Icon: Umbrella },
  { v: "city", label: "City", Icon: Building },
  { v: "nature", label: "Nature", Icon: Mountain },
  { v: "nightlife", label: "Nightlife", Icon: Wine },
  { v: "culture", label: "Culture", Icon: Landmark },
];

const STEP_META: Record<string, { Icon: typeof Wallet; eyebrow: string }> = {
  budget: { Icon: Wallet, eyebrow: "The only number that matters" },
  dates: { Icon: Calendar, eyebrow: "When can you slip away?" },
  travelers: { Icon: Users, eyebrow: "Who's in?" },
  vibe: { Icon: Sun, eyebrow: "Set the mood (if you like)" },
  hotel: { Icon: Building, eyebrow: "Where you'll rest your head" },
  constraints: { Icon: Globe, eyebrow: "Any ground rules?" },
};

export function WizardClient() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("express");
  const [step, setStep] = useState(0);

  const [amount, setAmount] = useState(6500);
  const [currency, setCurrency] = useState<Currency>("ILS");
  const [perPerson, setPerPerson] = useState(false);
  const [start, setStart] = useState("2026-07-10");
  const [nights, setNights] = useState(4);
  const [flexible, setFlexible] = useState(true);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [partyType, setPartyType] = useState<PartyType>("couple");
  const [vibes, setVibes] = useState<VibeType[]>([]);
  const [temperature, setTemperature] = useState<Temperature>("any");
  const [minStars, setMinStars] = useState(3);
  const [board, setBoard] = useState<Board>("breakfast");
  const [maxFlightHours, setMaxFlightHours] = useState<number | "">("");
  const [intensity, setIntensity] = useState<SurpriseIntensity>("full");

  const steps = useMemo(() => (mode === "express" ? EXPRESS_STEPS : FULL_STEPS), [mode]);
  const isLast = step === steps.length - 1;
  const progress = Math.round(((step + 1) / steps.length) * 100);

  function buildParams(): TripParams {
    return {
      budget: { amount, currency, perPerson },
      dates: { mode: flexible ? "flexible" : "exact", start, nights, flexDays: flexible ? 3 : undefined },
      travelers: { adults, childrenAges: Array.from({ length: children }, () => 8), partyType },
      departureAirport: "TLV",
      vibe: mode === "full" && (vibes.length || temperature !== "any") ? { types: vibes, temperature, pace: "any" } : undefined,
      hotel: mode === "full" ? { minStars, board, roomType: "double" } : undefined,
      constraints: mode === "full"
        ? { nationality: "IL", maxFlightHours: maxFlightHours === "" ? undefined : Number(maxFlightHours) }
        : { nationality: "IL" },
      surpriseIntensity: intensity,
    };
  }

  function next() {
    if (isLast) router.push(`/results?p=${encodeParams(buildParams())}`);
    else setStep((s) => s + 1);
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  const current = steps[step]!;
  const meta = STEP_META[current.id]!;

  return (
    <div>
      {/* mode toggle */}
      <div className="mb-6 flex items-center justify-center">
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 text-sm">
          <ModePill active={mode === "express"} onClick={() => { setMode("express"); setStep(0); }}>
            <Sparkles size={15} /> Quick
          </ModePill>
          <ModePill active={mode === "full"} onClick={() => { setMode("full"); setStep(0); }}>
            <Globe size={15} /> Fine-tune
          </ModePill>
        </div>
      </div>

      {/* progress */}
      <div className="mb-2 flex items-center justify-between text-xs text-white/45">
        <span>Step {step + 1} of {steps.length}</span>
        <span>{progress}%</span>
      </div>
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="card overflow-hidden p-7">
        {/* Keyed wrapper → content pops/morphs on each step change */}
        <div key={`${mode}-${step}`} className="animate-pop">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/30 to-violet-500/30 text-brand-200 ring-1 ring-white/10">
              <meta.Icon size={22} />
            </span>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-brand-300">{meta.eyebrow}</div>
              <h2 className="font-display text-2xl font-bold leading-tight">{current.title}</h2>
            </div>
          </div>
          {current.subtitle && <p className="mt-3 text-sm text-white/60">{current.subtitle}</p>}

          <div className="mt-6">
            {current.id === "budget" && (
              <div className="space-y-5">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="text-sm text-white/60">All-in budget</label>
                    <div className="mt-1 flex items-center rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-2xl font-bold focus-within:border-brand-400">
                      <span className="mr-1 text-white/50">{CURRENCY_SYMBOL[currency]}</span>
                      <input type="number" value={amount} min={500} step={100}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="tabnum w-full bg-transparent outline-none" aria-label="Budget amount" />
                    </div>
                  </div>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="rounded-2xl border border-white/15 bg-ink-800 px-3 py-3.5" aria-label="Currency">
                    <option value="ILS">ILS</option><option value="EUR">EUR</option><option value="USD">USD</option>
                  </select>
                </div>
                <input type="range" min={1500} max={20000} step={100} value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))} className="w-full accent-brand-500" aria-label="Budget slider" />
                <Toggle label="That's per person, not total" value={perPerson} onChange={setPerPerson} />
                <p className="text-xs text-white/45">Everything fits inside this — flights, hotel, the ride, the fun. No nasty extras at the end.</p>
              </div>
            )}

            {current.id === "dates" && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm text-white/60">Roughly when?</label>
                  <input type="date" value={start} onChange={(e) => setStart(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 focus:border-brand-400 outline-none" />
                </div>
                <div>
                  <label className="text-sm text-white/60">How many nights? <span className="tabnum text-white">({nights})</span></label>
                  <input type="range" min={2} max={14} value={nights} onChange={(e) => setNights(Number(e.target.value))}
                    className="mt-2 w-full accent-brand-500" />
                </div>
                <Toggle label="I'm flexible by a few days (cheaper!)" value={flexible} onChange={setFlexible} />
              </div>
            )}

            {current.id === "travelers" && (
              <div className="space-y-5">
                <Stepper label="Adults" value={adults} min={1} onChange={setAdults} />
                <Stepper label="Children" value={children} min={0} onChange={setChildren} />
                <div>
                  <label className="text-sm text-white/60">What's the trip?</label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {(["solo", "couple", "friends", "family"] as PartyType[]).map((p) => (
                      <Chip key={p} active={partyType === p} onClick={() => setPartyType(p)}>{p}</Chip>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {current.id === "vibe" && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm text-white/60">What are you in the mood for?</label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {VIBES.map((v) => (
                      <Chip key={v.v} active={vibes.includes(v.v)}
                        onClick={() => setVibes((c) => c.includes(v.v) ? c.filter((x) => x !== v.v) : [...c, v.v])}>
                        <v.Icon size={16} /> {v.label}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white/60">Warm or cold?</label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <Chip active={temperature === "warm"} onClick={() => setTemperature("warm")}><Sun size={16} /> Warm</Chip>
                    <Chip active={temperature === "any"} onClick={() => setTemperature("any")}><Globe size={16} /> Surprise me</Chip>
                    <Chip active={temperature === "cold"} onClick={() => setTemperature("cold")}><Snow size={16} /> Cold</Chip>
                  </div>
                </div>
              </div>
            )}

            {current.id === "hotel" && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm text-white/60">At least how many stars? <span className="tabnum text-white">({minStars}★)</span></label>
                  <input type="range" min={1} max={5} value={minStars} onChange={(e) => setMinStars(Number(e.target.value))}
                    className="mt-2 w-full accent-brand-500" />
                </div>
                <div>
                  <label className="text-sm text-white/60">Meals?</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {([["room_only", "Just the room"], ["breakfast", "Breakfast"], ["half_board", "Half board"], ["all_inclusive", "All-inclusive"]] as [Board, string][]).map(
                      ([b, label]) => <Chip key={b} active={board === b} onClick={() => setBoard(b)}>{label}</Chip>,
                    )}
                  </div>
                </div>
              </div>
            )}

            {current.id === "constraints" && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm text-white/60">Longest flight you'll sit through?</label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {([["", "Any"], [2, "2h"], [3, "3h"], [5, "5h"]] as [number | "", string][]).map(
                      ([h, label]) => <Chip key={label} active={maxFlightHours === h} onClick={() => setMaxFlightHours(h)}>
                        <Plane size={15} /> {label}
                      </Chip>,
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white/60">How much do you want to know?</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Chip active={intensity === "full"} onClick={() => setIntensity("full")}><Lock size={16} /> Total mystery</Chip>
                    <Chip active={intensity === "region"} onClick={() => setIntensity("region")}><Globe size={16} /> Tell me the region</Chip>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button onClick={back} disabled={step === 0}
            className="rounded-full px-4 py-2 text-sm text-white/55 transition hover:text-white disabled:opacity-30">
            ← Back
          </button>
          <button onClick={next} className="btn-primary">
            {isLast ? <>Find my surprises <Sparkles size={18} /></> : <>Continue <ArrowRight size={18} /></>}
          </button>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-white/40">
        <Check size={13} className="mr-1 inline text-mint-400" />
        Nothing's booked yet — you'll see prices before you commit.
      </p>
    </div>
  );
}

type Step = { id: string; title: string; subtitle?: string };
const EXPRESS_STEPS: Step[] = [
  { id: "budget", title: "What can you spend?" },
  { id: "dates", title: "When are you free?" },
  { id: "travelers", title: "Who's coming along?" },
];
const FULL_STEPS: Step[] = [
  { id: "budget", title: "What can you spend?" },
  { id: "dates", title: "When are you free?" },
  { id: "travelers", title: "Who's coming along?" },
  { id: "vibe", title: "Pick a vibe", subtitle: "Skip it all and we'll surprise you harder." },
  { id: "hotel", title: "Hotel wishes", subtitle: "Optional." },
  { id: "constraints", title: "The fine print", subtitle: "Optional." },
];

function ModePill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 transition ${active ? "bg-white/15 text-white" : "text-white/55 hover:text-white"}`}>
      {children}
    </button>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-sm capitalize transition-all duration-150 active:scale-[0.97] ${
        active ? "border-brand-400 bg-brand-500/20 text-white shadow-lg shadow-brand-500/10" : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"
      }`}>
      {children}
    </button>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} role="switch" aria-checked={value}
      className="flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-left transition hover:border-white/25">
      <span className="text-sm text-white/80">{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-brand-500" : "bg-white/20"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${value ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function Stepper({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
      <span className="text-sm text-white/80">{label}</span>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Fewer ${label}`}
          className="grid h-9 w-9 place-items-center rounded-full border border-white/20 transition hover:bg-white/10 active:scale-90"><Minus size={16} /></button>
        <span className="tabnum w-6 text-center text-lg font-semibold">{value}</span>
        <button onClick={() => onChange(value + 1)} aria-label={`More ${label}`}
          className="grid h-9 w-9 place-items-center rounded-full border border-white/20 transition hover:bg-white/10 active:scale-90"><Plus size={16} /></button>
      </div>
    </div>
  );
}
