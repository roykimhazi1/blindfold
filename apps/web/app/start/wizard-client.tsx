"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type {
  TripParams, Currency, PartyType, VibeType, Temperature, Pace, Board, SurpriseIntensity,
  Occasion, Priority,
} from "@sv/engine";
import { encodeParams, CURRENCY_SYMBOL } from "@/lib/trip";
import {
  Sparkles, Wallet, Calendar, Users, Umbrella, Building, Mountain, Wine, Landmark,
  Sun, Snow, Globe, Lock, Plane, Plus, Minus, ArrowRight, Check, Compass, Heart,
  Gift, Star,
} from "@/components/icons";

// ── The agile path ───────────────────────────────────────────────────
// The user's FIRST choice is how much they want to be surprised. That one
// tap decides how many questions follow: more surprise → fewer questions.
type Phase = "level" | "questions";
type Level = "blackout" | "hint" | "steer";
type StepId = "occasion" | "budget" | "dates" | "travelers" | "mood" | "hotel" | "limits";

const LEVELS: {
  id: Level; title: string; blurb: string; meta: string; Icon: typeof Lock; intensity: SurpriseIntensity;
}[] = [
  {
    id: "blackout", title: "Total blackout", Icon: Lock, intensity: "full",
    blurb: "Pack a bag and trust us. Everything's a secret until you're nearly there.",
    meta: "4 quick questions",
  },
  {
    id: "hint", title: "Drop me a hint", Icon: Sparkles, intensity: "full",
    blurb: "Tell us the mood you're after. The where stays sealed till the airport.",
    meta: "5 light questions",
  },
  {
    id: "steer", title: "Let me steer", Icon: Compass, intensity: "region",
    blurb: "Shape the stay and the flight — we'll even tell you the region.",
    meta: "7 questions · region revealed",
  },
];

const STEPS_BY_LEVEL: Record<Level, StepId[]> = {
  blackout: ["occasion", "budget", "dates", "travelers"],
  hint: ["occasion", "budget", "dates", "travelers", "mood"],
  steer: ["occasion", "budget", "dates", "travelers", "mood", "hotel", "limits"],
};

const STEP_DEF: Record<StepId, {
  Icon: typeof Wallet; eyebrow: string; title: string; subtitle?: string; optional?: boolean;
}> = {
  occasion: {
    Icon: Gift, eyebrow: "First — the why", title: "What's the occasion?",
    subtitle: "Tap what fits and we'll build the whole surprise around it. Or skip — we'll still nail it.",
    optional: true,
  },
  budget: { Icon: Wallet, eyebrow: "The only number that matters", title: "What can you spend?" },
  dates: { Icon: Calendar, eyebrow: "When can you slip away?", title: "Pick your window" },
  travelers: { Icon: Users, eyebrow: "Who's in?", title: "Who's coming along?" },
  mood: {
    Icon: Sun, eyebrow: "Set the tone — optional", title: "What kind of trip?",
    subtitle: "Tap whatever fits, or skip and we'll surprise you harder.", optional: true,
  },
  hotel: { Icon: Building, eyebrow: "Where you'll crash — optional", title: "Any hotel wishes?", optional: true },
  limits: { Icon: Plane, eyebrow: "Ground rules — optional", title: "Anything to avoid?", optional: true },
};

const VIBES: { v: VibeType; label: string; Icon: typeof Umbrella }[] = [
  { v: "beach", label: "Beach", Icon: Umbrella },
  { v: "city", label: "City", Icon: Building },
  { v: "nature", label: "Nature", Icon: Mountain },
  { v: "nightlife", label: "Nightlife", Icon: Wine },
  { v: "culture", label: "Culture", Icon: Landmark },
];

const OCCASIONS: { o: Occasion; label: string; Icon: typeof Heart }[] = [
  { o: "anniversary", label: "Anniversary", Icon: Heart },
  { o: "honeymoon", label: "Honeymoon", Icon: Sparkles },
  { o: "birthday", label: "Birthday", Icon: Gift },
  { o: "celebration", label: "Celebration", Icon: Wine },
  { o: "treat", label: "Treat myself", Icon: Star },
  { o: "getaway", label: "Just getting away", Icon: Compass },
];

// "If we nail one thing…" — each maps to a vibe tag the engine scores on.
const PRIORITIES: { p: Priority; label: string; Icon: typeof Heart }[] = [
  { p: "view", label: "The view", Icon: Mountain },
  { p: "food", label: "The food", Icon: Wine },
  { p: "switchoff", label: "Total switch-off", Icon: Umbrella },
  { p: "nightlife", label: "Going out", Icon: Sparkles },
  { p: "walkable", label: "Walkable & central", Icon: Building },
];

// Must match the catalog's `region` strings — the engine filters on region/country.
const AVOID_REGIONS = [
  "Eastern Mediterranean", "Southern Europe", "Greek Islands",
  "Western Mediterranean", "Central Europe", "Caucasus",
];

// A one-line affirmation shown on the NEXT step, reacting to the last answer —
// keeps the surprise feeling like it's forming behind the curtain.
const AFFIRMATION: Partial<Record<StepId, string>> = {
  occasion: "Lovely. Now the essentials.",
  budget: "Good — somewhere already fits this.",
  dates: "Those dates open up something special.",
  travelers: "Perfect. We know who we're delighting.",
  mood: "Noted — this is taking shape.",
  hotel: "Nice. We've got your kind of stay.",
};

// One-tap presets keep answering light — fine-tune underneath if you like.
const BUDGET_PRESETS: Record<Currency, number[]> = {
  ILS: [5000, 8000, 12000],
  EUR: [1200, 2000, 3200],
  USD: [1300, 2200, 3500],
};
const BUDGET_RANGE: Record<Currency, { min: number; max: number; step: number }> = {
  ILS: { min: 2000, max: 25000, step: 100 },
  EUR: { min: 500, max: 7000, step: 50 },
  USD: { min: 500, max: 7500, step: 50 },
};
const PARTY_PRESETS: { label: string; adults: number; childAges: number[]; partyType: PartyType }[] = [
  { label: "Just me", adults: 1, childAges: [], partyType: "solo" },
  { label: "Couple", adults: 2, childAges: [], partyType: "couple" },
  { label: "Family of 4", adults: 2, childAges: [8, 10], partyType: "family" },
  { label: "Friends", adults: 4, childAges: [], partyType: "friends" },
];

const TODAY = "2026-06-04"; // matches the product's "now"; keeps SSR/hydration stable

function fmtDate(d: string): string {
  const t = Date.parse(d);
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}
function addDays(d: string, days: number): string {
  const t = Date.parse(d);
  if (!Number.isFinite(t)) return d;
  return new Date(t + days * 86400000).toISOString().slice(0, 10);
}

export function WizardClient({ defaultNationality = "IL" }: { defaultNationality?: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("level");
  const [level, setLevel] = useState<Level>("blackout");
  const [step, setStep] = useState(0);

  // Required
  const [amount, setAmount] = useState(8000);
  const [currency, setCurrency] = useState<Currency>("ILS");
  const [perPerson, setPerPerson] = useState(false);
  const [startDate, setStartDate] = useState("2026-07-10");
  const [endDate, setEndDate] = useState("2026-07-14");
  const [flexible, setFlexible] = useState(true);
  const [adults, setAdults] = useState(2);
  const [childAges, setChildAges] = useState<number[]>([]);
  const [partyType, setPartyType] = useState<PartyType>("couple");

  // Optional
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [vibes, setVibes] = useState<VibeType[]>([]);
  const [temperature, setTemperature] = useState<Temperature>("any");
  const [pace, setPace] = useState<Pace>("any");
  const [mustNail, setMustNail] = useState<Priority | null>(null);
  const [minStars, setMinStars] = useState(3);
  const [board, setBoard] = useState<Board>("breakfast");
  const [maxFlightHours, setMaxFlightHours] = useState<number | "">("");
  const [avoidRegions, setAvoidRegions] = useState<string[]>([]);
  const [directOnly, setDirectOnly] = useState(false);
  const [avoidRedeye, setAvoidRedeye] = useState(false);
  const [checkedLuggage, setCheckedLuggage] = useState(false);
  const [avoidDestinations, setAvoidDestinations] = useState("");

  const activeLevel = LEVELS.find((l) => l.id === level)!;
  const steps = STEPS_BY_LEVEL[level];
  const currentId = steps[step]!;
  const def = STEP_DEF[currentId];
  const isLast = step === steps.length - 1;
  const progress = Math.round(((step + 1) / steps.length) * 100);

  const nights = useMemo(() => {
    const a = Date.parse(startDate), b = Date.parse(endDate);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
    return Math.round((b - a) / 86400000);
  }, [startDate, endDate]);

  const datesValid = nights >= 1;
  const budgetValid = amount >= BUDGET_RANGE[currency].min;

  function stepValid(id: StepId): boolean {
    if (id === "budget") return budgetValid;
    if (id === "dates") return datesValid;
    if (id === "travelers") return adults >= 1;
    return true; // optional steps are always satisfiable
  }

  function pickLevel(l: Level) {
    setLevel(l);
    setStep(0);
    setPhase("questions");
  }
  function pickCurrency(c: Currency) {
    setCurrency(c);
    // Re-seat the amount into the new currency's sensible middle so the
    // slider/number never reads as nonsense after a switch.
    setAmount(BUDGET_PRESETS[c][1]!);
  }
  function setStart(d: string) {
    setStartDate(d);
    // Keep the window valid: if the return is now on/before departure, nudge it.
    if (Date.parse(endDate) <= Date.parse(d)) setEndDate(addDays(d, Math.max(1, nights || 4)));
  }
  function setChildCount(n: number) {
    setChildAges((prev) => {
      const next = prev.slice(0, Math.max(0, n));
      while (next.length < n) next.push(8); // sensible default age, adjustable below
      return next;
    });
  }
  function setChildAge(i: number, age: number) {
    setChildAges((prev) => prev.map((a, idx) => (idx === i ? age : a)));
  }

  function buildParams(): TripParams {
    const wantsMood = level !== "blackout";
    const wantsDetail = level === "steer";
    return {
      budget: { amount, currency, perPerson },
      dates: { mode: flexible ? "flexible" : "exact", start: startDate, nights, flexDays: flexible ? 3 : undefined },
      travelers: { adults, childrenAges: childAges, partyType },
      departureAirport: "TLV",
      vibe: wantsMood && (vibes.length || temperature !== "any" || pace !== "any")
        ? { types: vibes, temperature, pace } : undefined,
      hotel: wantsDetail ? { minStars, board, roomType: "double" } : undefined,
      constraints: wantsDetail
        ? {
            nationality: defaultNationality,
            maxFlightHours: maxFlightHours === "" ? undefined : Number(maxFlightHours),
            avoidRegions: avoidRegions.length ? avoidRegions : undefined,
            avoidDestinations: avoidDestinations.trim()
              ? avoidDestinations.split(",").map((s) => s.trim()).filter(Boolean)
              : undefined,
            directOnly: directOnly || undefined,
            avoidRedeye: avoidRedeye || undefined,
            checkedLuggage: checkedLuggage || undefined,
          }
        : { nationality: defaultNationality },
      occasion: occasion ?? undefined,
      mustNail: wantsMood ? (mustNail ?? undefined) : undefined,
      surpriseIntensity: activeLevel.intensity,
    };
  }

  function next() {
    if (!stepValid(currentId)) return;
    if (isLast) router.push(`/results?p=${encodeParams(buildParams())}`);
    else setStep((s) => s + 1);
  }
  function skip() {
    if (!isLast) setStep((s) => s + 1);
  }
  function back() {
    if (step === 0) setPhase("level");
    else setStep((s) => s - 1);
  }

  // ── Opening: choose your level of surprise ─────────────────────────
  if (phase === "level") {
    return (
      <div className="animate-pop">
        <div className="mb-7 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-brand-200">
            <Sparkles size={13} /> Step one
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">
            How surprised do you<br className="hidden sm:block" /> want to be?
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/60">
            Pick a vibe and we'll keep the questions short. The braver you are, the less we ask.
          </p>
        </div>

        <div className="space-y-3">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => pickLevel(l.id)}
              className="group flex w-full items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-400/60 hover:bg-white/[0.07] hover:shadow-xl hover:shadow-brand-500/10 active:scale-[0.99]"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/30 to-violet-500/30 text-brand-200 ring-1 ring-white/10">
                <l.Icon size={24} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-display text-lg font-bold">{l.title}</span>
                </span>
                <span className="mt-0.5 block text-sm text-white/60">{l.blurb}</span>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-white/55">
                  {l.meta}
                </span>
              </span>
              <ArrowRight size={20} className="shrink-0 text-white/30 transition group-hover:translate-x-1 group-hover:text-brand-300" />
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          <Check size={13} className="mr-1 inline text-mint-400" />
          Change your mind anytime — nothing's booked until you see the price.
        </p>
      </div>
    );
  }

  // ── Questions ──────────────────────────────────────────────────────
  return (
    <div>
      {/* chosen level, editable */}
      <div className="mb-3 flex justify-center">
        <button
          onClick={() => setPhase("level")}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:border-white/25 hover:text-white"
        >
          <activeLevel.Icon size={14} className="text-brand-300" />
          {activeLevel.title}
          <span className="text-white/35">· change</span>
        </button>
      </div>

      {/* progress — framed as a sealing envelope, not a form to grind through */}
      <div className="mb-2 flex items-center justify-between text-xs text-white/45">
        <span>Your surprise is taking shape</span>
        <span className="tabnum">{progress}% sealed</span>
      </div>
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="card overflow-hidden p-7">
        <div key={`${level}-${step}`} className="animate-pop">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/30 to-violet-500/30 text-brand-200 ring-1 ring-white/10">
              <def.Icon size={22} />
            </span>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-brand-300">{def.eyebrow}</div>
              <h2 className="font-display text-2xl font-bold leading-tight">{def.title}</h2>
            </div>
          </div>
          {def.subtitle && <p className="mt-3 text-sm text-white/60">{def.subtitle}</p>}

          {step > 0 && AFFIRMATION[steps[step - 1]!] && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-mint-400/10 px-3 py-1 text-xs font-medium text-mint-400">
              <Sparkles size={12} /> {AFFIRMATION[steps[step - 1]!]}
            </p>
          )}

          <div className="mt-6">
            {currentId === "occasion" && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {OCCASIONS.map((o) => (
                  <Chip key={o.o} active={occasion === o.o}
                    onClick={() => setOccasion((c) => (c === o.o ? null : o.o))}>
                    <o.Icon size={16} /> {o.label}
                  </Chip>
                ))}
              </div>
            )}

            {currentId === "budget" && (
              <div className="space-y-5">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="text-sm text-white/60">All-in budget</label>
                    <div className="mt-1 flex items-center rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-2xl font-bold focus-within:border-brand-400">
                      <span className="mr-1 text-white/50">{CURRENCY_SYMBOL[currency]}</span>
                      <input type="number" value={amount} min={BUDGET_RANGE[currency].min} step={BUDGET_RANGE[currency].step}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="tabnum w-full bg-transparent outline-none" aria-label="Budget amount" />
                    </div>
                  </div>
                  <select value={currency} onChange={(e) => pickCurrency(e.target.value as Currency)}
                    className="rounded-2xl border border-white/15 bg-ink-800 px-3 py-3.5" aria-label="Currency">
                    <option value="ILS">ILS</option><option value="EUR">EUR</option><option value="USD">USD</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  {BUDGET_PRESETS[currency].map((p) => (
                    <Chip key={p} active={amount === p} onClick={() => setAmount(p)}>
                      {CURRENCY_SYMBOL[currency]}{p.toLocaleString()}
                    </Chip>
                  ))}
                </div>
                <input type="range" min={BUDGET_RANGE[currency].min} max={BUDGET_RANGE[currency].max} step={BUDGET_RANGE[currency].step}
                  value={Math.min(amount, BUDGET_RANGE[currency].max)} onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full accent-brand-500" aria-label="Budget slider" />
                <Toggle label="That's per person, not total" value={perPerson} onChange={setPerPerson} />
                {!budgetValid && (
                  <p className="text-xs text-brand-300">Pop in at least {CURRENCY_SYMBOL[currency]}{BUDGET_RANGE[currency].min.toLocaleString()} so we have something to work with.</p>
                )}
                <p className="text-xs text-white/45">Everything fits inside this — flights, hotel, the ride, the fun. No nasty extras at the end.</p>
              </div>
            )}

            {currentId === "dates" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-white/60">From</label>
                    <input type="date" value={startDate} min={TODAY} onChange={(e) => setStart(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-brand-400" aria-label="Departure date" />
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Until</label>
                    <input type="date" value={endDate} min={addDays(startDate, 1)} onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-brand-400" aria-label="Return date" />
                  </div>
                </div>
                {datesValid ? (
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/75">
                    <Calendar size={15} className="text-brand-300" />
                    <span className="tabnum font-semibold text-white">{nights}</span> {nights === 1 ? "night" : "nights"}
                    <span className="text-white/35">·</span>
                    {fmtDate(startDate)} → {fmtDate(endDate)}
                  </div>
                ) : (
                  <p className="text-center text-xs text-brand-300">Your return needs to land after you leave — give us at least one night.</p>
                )}
                <Toggle label="My dates can flex by a few days (often cheaper!)" value={flexible} onChange={setFlexible} />
              </div>
            )}

            {currentId === "travelers" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PARTY_PRESETS.map((p) => {
                    const active = adults === p.adults && childAges.length === p.childAges.length && partyType === p.partyType;
                    return (
                      <Chip key={p.label} active={active} onClick={() => { setAdults(p.adults); setChildAges([...p.childAges]); setPartyType(p.partyType); }}>
                        {p.label}
                      </Chip>
                    );
                  })}
                </div>
                <Stepper label="Adults" value={adults} min={1} onChange={setAdults} />
                <Stepper label="Children" value={childAges.length} min={0} onChange={setChildCount} />
                {childAges.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm text-white/60">How old will they be when you travel?</label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {childAges.map((age, i) => (
                        <label key={i} className="flex items-center justify-between gap-2 rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-sm">
                          <span className="text-white/60">Child {i + 1}</span>
                          <select value={age} onChange={(e) => setChildAge(i, Number(e.target.value))}
                            className="rounded-lg border border-white/15 bg-ink-800 px-2 py-1" aria-label={`Child ${i + 1} age`}>
                            {Array.from({ length: 18 }, (_, n) => (
                              <option key={n} value={n}>{n === 0 ? "<1 yr" : `${n} yr`}</option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-white/45">Ages help us match flights, visas, and the right kind of fun.</p>
                  </div>
                )}
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

            {currentId === "mood" && (
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
                    <Chip active={temperature === "any"} onClick={() => setTemperature("any")}><Globe size={16} /> Either</Chip>
                    <Chip active={temperature === "cold"} onClick={() => setTemperature("cold")}><Snow size={16} /> Cold</Chip>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white/60">If we nail one thing, what is it?</label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {PRIORITIES.map((pr) => (
                      <Chip key={pr.p} active={mustNail === pr.p}
                        onClick={() => setMustNail((c) => (c === pr.p ? null : pr.p))}>
                        <pr.Icon size={16} /> {pr.label}
                      </Chip>
                    ))}
                  </div>
                </div>
                {level === "steer" && (
                  <div>
                    <label className="text-sm text-white/60">What's the pace?</label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <Chip active={pace === "chill"} onClick={() => setPace("chill")}><Umbrella size={16} /> Chill</Chip>
                      <Chip active={pace === "any"} onClick={() => setPace("any")}><Globe size={16} /> Either</Chip>
                      <Chip active={pace === "active"} onClick={() => setPace("active")}><Mountain size={16} /> Active</Chip>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentId === "hotel" && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm text-white/60">At least how many stars? <span className="tabnum text-white">({minStars}★)</span></label>
                  <input type="range" min={1} max={5} value={minStars} onChange={(e) => setMinStars(Number(e.target.value))}
                    className="mt-2 w-full accent-brand-500" aria-label="Minimum hotel stars" />
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

            {currentId === "limits" && (
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
                <Toggle label="Direct flights only" value={directOnly} onChange={setDirectOnly} />
                <Toggle label="No harsh red-eyes (very early or late-night)" value={avoidRedeye} onChange={setAvoidRedeye} />
                <Toggle label="Travelling with a checked bag?" value={checkedLuggage} onChange={setCheckedLuggage} />
                <div>
                  <label className="text-sm text-white/60">Been there, or just not feeling it?</label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {AVOID_REGIONS.map((r) => (
                      <Chip key={r} active={avoidRegions.includes(r)}
                        onClick={() => setAvoidRegions((c) => c.includes(r) ? c.filter((x) => x !== r) : [...c, r])}>
                        {r}
                      </Chip>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-white/45">We'll steer your surprise away from anywhere you tap.</p>
                </div>
                <div>
                  <label htmlFor="avoid-dest" className="text-sm text-white/60">Anywhere specific you&apos;d rather skip? (optional)</label>
                  <input
                    id="avoid-dest"
                    value={avoidDestinations}
                    onChange={(e) => setAvoidDestinations(e.target.value)}
                    placeholder="e.g. Dubai, Paris"
                    className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-brand-400"
                  />
                  <p className="mt-2 text-xs text-white/45">Cities or countries, comma-separated — we&apos;ll never send you there.</p>
                </div>
                <p className="flex items-center gap-2 text-xs text-white/45">
                  <Heart size={13} className="text-brand-300" />
                  That's everything — hit the button and we'll go hunting.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button onClick={back}
            className="rounded-full px-4 py-2 text-sm text-white/55 transition hover:text-white">
            ← Back
          </button>
          <div className="flex items-center gap-2">
            {def.optional && !isLast && (
              <button onClick={skip} className="rounded-full px-4 py-2 text-sm text-white/55 transition hover:text-white">
                Skip
              </button>
            )}
            <button onClick={next} disabled={!stepValid(currentId)}
              className="btn-primary disabled:pointer-events-none disabled:opacity-40">
              {isLast ? <>Find my surprises <Sparkles size={18} /></> : <>Continue <ArrowRight size={18} /></>}
            </button>
          </div>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-white/40">
        <Check size={13} className="mr-1 inline text-mint-400" />
        Nothing's booked yet — you'll see prices before you commit.
      </p>
    </div>
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
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${value ? "bg-brand-500" : "bg-white/20"}`}>
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
