import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { Photo } from "@/components/photo";
import { PHOTOS } from "@/lib/photos";
import {
  Sparkles, Wallet, Gift, Suitcase, Sun, Mail, Unlock, Car,
  Umbrella, Landmark, Building, Star, Check, ArrowRight, Shield,
  Clock, Heart, Mountain, Wine, Compass, Users, Globe,
} from "@/components/icons";

// ── Vibe strip data ───────────────────────────────────────────────
const VIBES = [
  {
    label: "Sun & Sea",
    sub: "White-sand beaches, warm water, endless horizon",
    photo: PHOTOS.beachUmbrellas,
    from: "from-sky-900/80",
    accent: "text-sky-300",
    Icon: Umbrella,
  },
  {
    label: "Snow & Ski",
    sub: "Alpine runs, cosy mountain lodges, aprés-ski",
    photo: PHOTOS.skiing,
    from: "from-indigo-900/80",
    accent: "text-violet-300",
    Icon: Mountain,
  },
  {
    label: "City Nights",
    sub: "Rooftop bars, neon streets, dancing till dawn",
    photo: PHOTOS.nightParty,
    from: "from-rose-950/80",
    accent: "text-brand-300",
    Icon: Building,
  },
  {
    label: "Eat & Explore",
    sub: "Markets, wine trails, legendary chef tables",
    photo: PHOTOS.fineDining,
    from: "from-amber-950/80",
    accent: "text-sun-400",
    Icon: Wine,
  },
  {
    label: "Off the Map",
    sub: "Gorge hikes, hidden coves, proper wilderness",
    photo: PHOTOS.adventure,
    from: "from-emerald-950/80",
    accent: "text-mint-400",
    Icon: Compass,
  },
];

// ── Homepage steps ────────────────────────────────────────────────
const STEPS = [
  {
    Icon: Wallet,
    title: "Tell us a little",
    body: "Your budget, your dates, who's coming. Fussy types can add a few wishes — 5-star only, somewhere warm — but you really don't have to.",
  },
  {
    Icon: Gift,
    title: "We hand you three",
    body: "Three complete trips, each to a place we're not telling you yet. You'll see the weather, the vibe, and the price. Where? That's the whole point.",
  },
  {
    Icon: Suitcase,
    title: "Just pack a bag",
    body: "Flights booked. Room sorted. Transfer waiting. Stuff to do lined up. Show up at the airport and let go.",
  },
];

// ── Reveal timeline ───────────────────────────────────────────────
const TIMELINE = [
  {
    Icon: Gift,
    when: "The moment you book",
    text: "You choose one of three. All you know is the mood, the climate, and what it costs. The name stays under wraps.",
  },
  {
    Icon: Mail,
    when: "A week before",
    text: "A little note lands: \"Hope you like the cold — bring a proper coat.\" Enough to pack right, not enough to spoil it.",
  },
  {
    Icon: Unlock,
    when: "At the gate",
    text: "Your boarding pass would blow the secret, so we beat it to it — the app flips over and shows you where you're off to.",
  },
  {
    Icon: Car,
    when: "When you land",
    text: "A driver's waiting with your name on a sign. On the way in, they tell you where you're staying. Drop the bag, you're on holiday.",
  },
];

// ── Sample mystery teasers ────────────────────────────────────────
const TEASERS = [
  { Icon: Umbrella, climate: "Warm", flight: "Short hop", vibe: "Sun & sea", price: "4,940", stars: 4, photo: PHOTOS.beachPeople },
  { Icon: Landmark, climate: "Mild", flight: "Medium",   vibe: "Old streets & history", price: "5,080", stars: 4, photo: PHOTOS.mistyHills },
  { Icon: Building, climate: "Cool", flight: "Medium",   vibe: "Big-city buzz", price: "5,060", stars: 5, photo: PHOTOS.cityNight },
];

// ── Stats ─────────────────────────────────────────────────────────
const STATS = [
  { Icon: Globe, value: "20", label: "destinations" },
  { Icon: Users, value: "TLV", label: "departures" },
  { Icon: Shield, value: "100%", label: "refundable" },
  { Icon: Clock, value: "~60s", label: "to book" },
];

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="aurora relative">
        <span className="blob left-[8%] top-24 h-72 w-72 bg-brand-500/50" />
        <span className="blob right-[6%] top-10 h-80 w-80 bg-violet-500/40" style={{ animationDelay: "-6s" }} />
        <span className="blob bottom-0 left-1/3 h-72 w-72 bg-sun-400/30" style={{ animationDelay: "-11s" }} />

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-14 md:grid-cols-2 md:pb-20 md:pt-20">
          {/* Left — copy */}
          <div>
            <Reveal as="span" className="chip-light">
              <Sparkles size={14} className="text-sun-500" />
              Surprise trips out of Tel Aviv
            </Reveal>
            <Reveal as="h1" delay={60} className="mt-5 font-display text-4xl font-extrabold leading-[1.05] md:text-6xl">
              Don&apos;t plan a holiday.
              <span className="mt-1 block text-gradient">Just go on one.</span>
            </Reveal>
            <Reveal as="p" delay={120} className="mt-5 max-w-md text-lg leading-relaxed text-white/70">
              Give us a budget and a few free days. We&apos;ll book the whole thing —
              flights, hotel, the ride from the airport, the good stuff to do —
              to a place we won&apos;t tell you about until you&apos;re nearly there.
            </Reveal>
            <Reveal delay={180} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/start" className="btn-primary">
                Plan my surprise <ArrowRight size={18} />
              </Link>
              <Link href="/how-it-works" className="btn-ghost-light">See how it works</Link>
            </Reveal>
            <Reveal delay={240} className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/55">
              <span className="inline-flex items-center gap-1.5"><Shield size={14} className="text-mint-400" /> Full refund till we lock it</span>
              <span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-mint-400" /> Takes about a minute</span>
              <span className="inline-flex items-center gap-1.5"><Heart size={14} className="text-brand-300" /> No spam, ever</span>
            </Reveal>
          </div>

          {/* Right — 3-photo mosaic */}
          <Reveal delay={100} className="relative hidden md:block">
            <div className="grid h-[500px] grid-cols-2 grid-rows-2 gap-3">
              {/* Beach people — spans full left column */}
              <div className="mosaic-photo relative row-span-2 overflow-hidden rounded-[2rem]">
                <div className="photo-bg absolute inset-0">
                  <Photo src={PHOTOS.beachUmbrellas} alt="People relaxing on a sunny beach" className="h-full w-full" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                    <Umbrella size={13} className="text-sky-300" /> Sun &amp; Sea
                  </span>
                </div>
                {/* floating card */}
                <div className="animate-float absolute -left-5 top-8 w-40 rounded-2xl glass p-3 shadow-xl shadow-black/40">
                  <div className="flex items-center gap-1.5 text-xs text-white/60"><Gift size={14} className="text-brand-300" /> Your mystery</div>
                  <div className="mt-0.5 font-display text-base font-bold">Somewhere warm</div>
                  <div className="text-xs text-white/50">4 nights · 4★</div>
                </div>
              </div>

              {/* Skiing */}
              <div className="mosaic-photo relative overflow-hidden rounded-[2rem]">
                <div className="photo-bg absolute inset-0">
                  <Photo src={PHOTOS.skiing} alt="Skiers on a mountain slope" className="h-full w-full" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                    <Mountain size={13} className="text-violet-300" /> Snow &amp; Ski
                  </span>
                </div>
              </div>

              {/* Party / nightlife */}
              <div className="mosaic-photo relative overflow-hidden rounded-[2rem]">
                <div className="photo-bg absolute inset-0">
                  <Photo src={PHOTOS.nightParty} alt="People dancing at a night party" className="h-full w-full" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                    <Sparkles size={13} className="text-brand-300" /> City Nights
                  </span>
                </div>
                {/* floating boarding pass */}
                <div className="animate-float-slow absolute -right-5 -top-4 w-36 rounded-2xl glass p-3 shadow-xl shadow-black/40" style={{ animationDelay: "-3s" }}>
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>TLV</span><Sparkles size={12} className="text-sun-400" /><span>???</span>
                  </div>
                  <div className="mt-1.5 border-t border-dashed border-white/15 pt-1.5 tabnum text-lg font-bold">07:40</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────── */}
      <Reveal>
        <div className="border-y border-white/8 bg-white/[0.02]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-around gap-4 px-5 py-5">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-brand-300">
                  <s.Icon size={18} />
                </span>
                <div>
                  <div className="font-display text-xl font-extrabold tabnum leading-none">{s.value}</div>
                  <div className="text-xs text-white/45">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ── Vibe strip ───────────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <Reveal className="mx-auto max-w-6xl px-5 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Every kind of escape</h2>
          <p className="mx-auto mt-3 max-w-md text-white/60">
            Beach days, powder runs, late nights, long dinners — we have all of them in the catalog.
          </p>
        </Reveal>

        {/* Scrollable strip */}
        <div className="mt-10 flex gap-4 overflow-x-auto scroll-smooth px-5 pb-3 scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-5 md:overflow-visible md:px-[max(1.25rem,calc((100vw-72rem)/2))]">
          {VIBES.map((v, i) => (
            <Reveal key={v.label} delay={i * 70}>
              <div className="vibe-card relative h-[360px] w-64 shrink-0 snap-start overflow-hidden rounded-3xl md:w-auto">
                <Photo src={v.photo} alt={v.label} className="absolute inset-0 h-full w-full" />
                <div className={`absolute inset-0 bg-gradient-to-t ${v.from} via-black/20 to-transparent`} />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className={`inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs font-medium backdrop-blur-sm ${v.accent}`}>
                    <v.Icon size={13} /> {v.label}
                  </span>
                  <p className="mt-2 text-sm font-medium leading-snug text-white/90">{v.sub}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Steps ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Three taps and you&apos;re off</h2>
          <p className="mx-auto mt-3 max-w-md text-white/60">Honestly, planning is the worst part of any trip. So we did it for you.</p>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <div className="card-light group h-full p-7 transition-transform duration-300 hover:-translate-y-1">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 text-brand-600 ring-1 ring-plum/10">
                  <s.Icon size={24} />
                </div>
                <div className="mt-5 text-xs font-semibold uppercase tracking-wide text-brand-400">Step {i + 1}</div>
                <h3 className="mt-1 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Sample mystery deals ──────────────────────────────────── */}
      <section className="relative bg-white/[0.015] py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal className="text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">This is what you&apos;d see</h2>
            <p className="mx-auto mt-3 max-w-md text-white/60">
              Hints, a price, and a big friendly question mark. The where is the whole point.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TEASERS.map((t, i) => (
              <Reveal key={i} delay={i * 90}>
                <article className="card group h-full overflow-hidden transition-transform duration-300 hover:-translate-y-1.5">
                  {/* Photo with blur + "?" overlay */}
                  <div className="relative h-52 overflow-hidden">
                    <Photo src={t.photo} alt="A mystery destination, kept secret" className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105" blur />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent" />
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="select-none font-display text-[88px] font-extrabold leading-none text-white/80 drop-shadow-2xl">?</span>
                    </div>
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-xs backdrop-blur-sm">
                      <t.Icon size={13} /> {t.vibe}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs">
                        <Sun size={14} className="text-sun-400" /> {t.climate} · {t.flight}
                      </span>
                      <span className="inline-flex text-sun-400">
                        {Array.from({ length: t.stars }).map((_, k) => <Star key={k} size={14} filled />)}
                      </span>
                    </div>
                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <div className="text-xs text-white/45">all-in, for two</div>
                        <div className="tabnum font-display text-3xl font-extrabold">₪{t.price}</div>
                      </div>
                      <span className="text-white/30 transition-transform duration-300 group-hover:translate-x-1">
                        <ArrowRight size={22} />
                      </span>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof photo strip ──────────────────────────────── */}
      <section className="py-16 md:py-20">
        <Reveal className="mx-auto max-w-6xl px-5 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">A trip for every kind of traveller</h2>
          <p className="mx-auto mt-3 max-w-md text-white/60">
            Solo, couple, group of friends, family — someone&apos;s always right for a surprise.
          </p>
        </Reveal>
        <div className="mt-10 flex gap-4 overflow-x-auto px-5 pb-3 scrollbar-hide snap-x snap-mandatory">
          {[
            { photo: PHOTOS.beachPeople,   cap: "Beach getaway",      sub: "Cyprus · 3 nights" },
            { photo: PHOTOS.skiing,        cap: "Alpine adventure",   sub: "4 nights · powder" },
            { photo: PHOTOS.concertCrowd,  cap: "Festival weekend",   sub: "City · 4 nights" },
            { photo: PHOTOS.poolLuxury,    cap: "Luxury resort",      sub: "5★ · all-inclusive" },
            { photo: PHOTOS.friendsTrip,   cap: "Friends escape",     sub: "6 travellers" },
            { photo: PHOTOS.fineDining,    cap: "Food lover's trip",  sub: "Culture · 5 nights" },
          ].map((item, i) => (
            <Reveal key={i} delay={i * 60} className="shrink-0 snap-start">
              <div className="vibe-card relative h-60 w-48 overflow-hidden rounded-2xl">
                <Photo src={item.photo} alt={item.cap} className="absolute inset-0 h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="text-sm font-semibold leading-tight">{item.cap}</div>
                  <div className="text-xs text-white/60">{item.sub}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Reveal timeline ───────────────────────────────────────── */}
      <section className="bg-white/[0.015] py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-5">
          <Reveal className="text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">How the secret comes out</h2>
            <p className="mx-auto mt-3 max-w-md text-white/60">We let it slip a little at a time — that&apos;s half the fun.</p>
          </Reveal>
          <div className="relative mt-12 space-y-4 before:absolute before:bottom-4 before:left-[27px] before:top-4 before:w-px before:bg-gradient-to-b before:from-brand-400/60 before:via-violet-400/40 before:to-transparent">
            {TIMELINE.map((t, i) => (
              <Reveal key={t.when} delay={i * 80}>
                <div className="relative flex items-start gap-5">
                  <div className="z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ink-800 text-brand-200 ring-1 ring-white/10">
                    <t.Icon size={24} />
                  </div>
                  <div className="card flex-1 p-5">
                    <div className="text-sm font-semibold text-brand-300">{t.when}</div>
                    <p className="mt-1 leading-relaxed text-white/75">{t.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section className="px-5 py-20 md:py-24">
        <Reveal className="aurora relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 px-6 py-16 text-center">
          <span className="blob left-10 top-0 h-48 w-48 bg-brand-500/40" />
          <span className="blob right-10 bottom-0 h-56 w-56 bg-violet-500/40" style={{ animationDelay: "-7s" }} />
          <h2 className="font-display text-3xl font-extrabold md:text-4xl">
            Go on. Let someone else decide.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/70">
            Tell us what you can spend and when you&apos;re free. We&apos;ll do the rest,
            and you&apos;ll have a story to tell.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/start"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-plum shadow-lg shadow-plum/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
            >
              Plan my surprise <ArrowRight size={18} />
            </Link>
          </div>
          <p className="mt-4 inline-flex items-center justify-center gap-1.5 text-xs text-white/80">
            <Check size={14} className="text-white" /> Free to change your mind right up until we book it
          </p>
        </Reveal>
      </section>
    </div>
  );
}
