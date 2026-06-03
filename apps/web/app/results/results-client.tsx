"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { SurpriseDeal, TripParams, VibeType } from "@sv/engine";
import { decodeParams, CURRENCY_SYMBOL } from "@/lib/trip";
import { PHOTOS } from "@/lib/photos";
import { Photo } from "@/components/photo";
import {
  Gift, Sun, Snow, Plane, Star, Check, Suitcase, MapPin, ArrowRight, Sparkles,
  Umbrella, Building, Mountain, Wine, Landmark, Compass,
} from "@/components/icons";

const LOADING_LINES = [
  "Scanning real flights out of Tel Aviv…",
  "Sniffing out hotels worth their stars…",
  "Lining up your airport pickup…",
  "Picking things to do you'll actually enjoy…",
  "Hiding the destination so it stays a secret 🤫",
];

const CLIMATE = {
  cold: { Icon: Snow, label: "Cold", photo: PHOTOS.mountainLake },
  mild: { Icon: Sun, label: "Mild", photo: PHOTOS.mistyHills },
  warm: { Icon: Sun, label: "Warm", photo: PHOTOS.beach },
  hot: { Icon: Sun, label: "Hot", photo: PHOTOS.desertRoad },
} as const;

const VIBE_ICON: Record<VibeType, typeof Umbrella> = {
  beach: Umbrella, city: Building, nature: Mountain, nightlife: Wine, culture: Landmark,
};

export function ResultsClient() {
  const sp = useSearchParams();
  const [params, setParams] = useState<TripParams | null>(null);
  const [deals, setDeals] = useState<SurpriseDeal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [line, setLine] = useState(0);

  useEffect(() => {
    const p = sp.get("p");
    const decoded = p ? decodeParams(p) : null;
    if (!decoded) { setError("We lost the thread of your trip. Mind starting again?"); return; }
    setParams(decoded);

    const ticker = setInterval(() => setLine((l) => (l + 1) % LOADING_LINES.length), 1000);
    fetch("/api/deals", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(decoded),
    })
      .then(async (r) => { if (!r.ok) throw new Error((await r.json()).error ?? "Search failed"); return r.json(); })
      .then((data) => setDeals(data.deals as SurpriseDeal[]))
      .catch((e) => setError(e.message))
      .finally(() => clearInterval(ticker));
    return () => clearInterval(ticker);
  }, [sp]);

  if (error) {
    return (
      <Centered>
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-brand-300"><Compass size={30} /></div>
        <p className="mt-5 text-white/70">{error}</p>
        <Link href="/start" className="btn-primary mt-6">Start over</Link>
      </Centered>
    );
  }

  if (!deals) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <div className="relative mx-auto h-24 w-24">
          <span className="blob inset-0 h-24 w-24 bg-brand-500/60" />
          <span className="blob inset-0 h-24 w-24 bg-violet-500/50" style={{ animationDelay: "-6s" }} />
          <div className="animate-float relative grid h-24 w-24 place-items-center text-brand-200"><Gift size={56} /></div>
        </div>
        <h2 className="mt-6 font-display text-2xl font-bold">Wrapping up three surprises…</h2>
        <p key={line} className="animate-pop mt-3 h-6 text-brand-300">{LOADING_LINES[line]}</p>
        <div className="mx-auto mt-9 max-w-xs space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="card shimmer h-16" />)}
        </div>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <Centered>
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-sun-400"><Sparkles size={30} /></div>
        <h2 className="mt-5 font-display text-2xl font-bold">Hmm, nothing fit just yet</h2>
        <p className="mt-2 max-w-sm text-white/60">Nudge the budget up a touch, or loosen the dates — there's always somewhere good waiting.</p>
        <Link href="/start" className="btn-primary mt-6">Tweak my trip</Link>
      </Centered>
    );
  }

  const sym = params ? CURRENCY_SYMBOL[params.budget.currency] : "";
  const pax = params ? params.travelers.adults + params.travelers.childrenAges.length : 2;

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="animate-fade-up text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-white/75">
          <Gift size={14} className="text-brand-300" /> Three doors. One's yours.
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold md:text-4xl">Pick your mystery</h1>
        <p className="mx-auto mt-3 max-w-md text-white/60">
          Each one's a whole trip, ready to go. We're only showing you the feeling — the place is the surprise.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {deals.map((deal, i) => {
          const c = CLIMATE[deal.hints.climateBand];
          return (
            <article key={deal.id}
              className="card animate-fade-up flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1.5"
              style={{ animationDelay: `${i * 110}ms` }}>
              <div className="relative h-44">
                <Photo src={c.photo} alt="Your mystery destination, kept secret" className="absolute inset-0 h-full w-full" blur />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/30 to-transparent" />
                <div className="absolute inset-0 grid place-items-center">
                  <span className="font-display text-7xl font-extrabold text-white/85 drop-shadow-lg">?</span>
                </div>
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-xs backdrop-blur">
                  Mystery #{i + 1}
                </span>
                {deal.hints.region && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-xs backdrop-blur">
                    <MapPin size={13} /> {deal.hints.region}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag><c.Icon size={14} className="text-sun-400" /> {c.label}</Tag>
                  <Tag><Plane size={14} /> {deal.hints.flightBand} flight</Tag>
                  <span className="ml-auto inline-flex text-sun-400">
                    {Array.from({ length: deal.hints.starBand }).map((_, k) => <Star key={k} size={14} filled />)}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-white/80">{deal.hints.teaser}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {deal.hints.vibeTags.map((v) => {
                    const VI = VIBE_ICON[v];
                    return (
                      <span key={v} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs capitalize text-white/80">
                        <VI size={13} /> {v}
                      </span>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/75">
                  <Suitcase size={16} className="mt-0.5 shrink-0 text-brand-300" />
                  <span>{deal.hints.packingTip}</span>
                </div>

                <ul className="mt-4 space-y-2 text-sm text-white/70">
                  {deal.includes.map((inc) => (
                    <li key={inc} className="flex gap-2">
                      <Check size={16} className="mt-0.5 shrink-0 text-mint-400" /> {inc}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-5">
                  <div className="text-xs text-white/45">all-in for {pax} {pax === 1 ? "traveler" : "travelers"}</div>
                  <div className="tabnum font-display text-3xl font-extrabold">{sym}{Math.round(deal.priceTotal).toLocaleString()}</div>
                  <Link
                    href={`/checkout?deal=${deal.id}&p=${encodeURIComponent(sp.get("p") ?? "")}&price=${deal.priceTotal}&cur=${deal.currency}`}
                    className="btn-primary mt-3 w-full"
                  >
                    Choose this one <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <p className="mx-auto mt-10 max-w-xl text-center text-xs text-white/40">
        Change your mind anytime before we lock it in. You'll find out where at the airport — and which hotel on the drive there.
      </p>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs capitalize text-white/90">{children}</span>;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex max-w-md flex-col items-center px-5 py-24 text-center">{children}</div>;
}
