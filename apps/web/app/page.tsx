import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { Photo } from "@/components/photo";
import { PHOTOS } from "@/lib/photos";
import {
  Sparkles, Wallet, Gift, Suitcase, Sun, Mail, Unlock, Car,
  Umbrella, Landmark, Building, Star, Check, ArrowRight, Shield, Clock, Heart,
} from "@/components/icons";

const STEPS = [
  { Icon: Wallet, title: "Tell us a little", body: "Your budget, your dates, who's tagging along. That's genuinely it. Fussy types can add a few wishes — 5-star only, somewhere warm — but you don't have to." },
  { Icon: Gift, title: "We hand you three", body: "Three complete trips, each to a place we're not telling you yet. You'll know the weather, the vibe, and the price. The rest? You'll find out." },
  { Icon: Suitcase, title: "You pack a bag", body: "No tabs, no spreadsheets, no 2am hotel comparisons. We've booked the flights, the room, the ride, the fun. Show up at the airport and go." },
];

const TIMELINE = [
  { Icon: Gift, when: "The moment you book", text: "You choose one of three. All you know is the mood, the climate, and what it costs. The name stays under wraps." },
  { Icon: Mail, when: "A week before", text: "A little note lands in your inbox: \"Hope you like the cold — bring a proper coat.\" Enough to pack right, not enough to spoil it." },
  { Icon: Unlock, when: "At the gate", text: "Your boarding pass would blow the secret, so we beat it to it — the app flips over and shows you where you're off to." },
  { Icon: Car, when: "When you land", text: "A driver's waiting with your name on a sign. On the way in, they tell you where you're staying. Walk in, drop the bag, you're on holiday." },
];

const TEASERS = [
  { Icon: Umbrella, climate: "Warm", flight: "Short hop", vibe: "Sun & sea", price: "4,940", stars: 4, photo: PHOTOS.beach },
  { Icon: Landmark, climate: "Mild", flight: "Medium", vibe: "Old streets & history", price: "5,080", stars: 4, photo: PHOTOS.mistyHills },
  { Icon: Building, climate: "Cool", flight: "Medium", vibe: "Big-city buzz", price: "5,060", stars: 5, photo: PHOTOS.mountainLake },
];

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="aurora relative">
        <span className="blob left-[8%] top-24 h-72 w-72 bg-brand-500/50" />
        <span className="blob right-[6%] top-10 h-80 w-80 bg-violet-500/40" style={{ animationDelay: "-6s" }} />
        <span className="blob bottom-0 left-1/3 h-72 w-72 bg-sun-400/30" style={{ animationDelay: "-11s" }} />

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-20 pt-16 md:grid-cols-2 md:pb-28 md:pt-24">
          <div>
            <Reveal as="span" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-white/75">
              <Sparkles size={14} className="text-sun-400" />
              Surprise trips out of Tel Aviv
            </Reveal>
            <Reveal as="h1" delay={60} className="mt-5 font-display text-4xl font-extrabold leading-[1.05] md:text-6xl">
              Don't plan a holiday.
              <span className="mt-1 block text-gradient">Just go on one.</span>
            </Reveal>
            <Reveal as="p" delay={120} className="mt-5 max-w-md text-lg leading-relaxed text-white/70">
              Give us a budget and a few free days. We'll book the whole thing —
              flights, hotel, the ride from the airport, the good stuff to do —
              to a place we won't tell you about until you're nearly there.
            </Reveal>
            <Reveal delay={180} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/start" className="btn-primary">
                Plan my surprise <ArrowRight size={18} />
              </Link>
              <Link href="/how-it-works" className="btn-ghost">See how it works</Link>
            </Reveal>
            <Reveal delay={240} className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/45">
              <span className="inline-flex items-center gap-1.5"><Shield size={14} className="text-mint-400" /> Full refund till we lock it</span>
              <span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-mint-400" /> Takes about a minute</span>
              <span className="inline-flex items-center gap-1.5"><Heart size={14} className="text-brand-300" /> No spam, ever</span>
            </Reveal>
          </div>

          {/* Hero collage */}
          <Reveal delay={120} className="relative hidden md:block">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm">
              <Photo src={PHOTOS.cloudsWing} alt="View of clouds from an airplane window" className="absolute inset-0 rounded-[2rem] border border-white/10 shadow-2xl shadow-black/40" />
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
              {/* floating ticket card */}
              <div className="animate-float absolute -left-6 top-10 w-44 rounded-2xl glass p-3 shadow-xl">
                <div className="flex items-center gap-2 text-xs text-white/60"><Gift size={16} className="text-brand-300" /> Your mystery</div>
                <div className="mt-1 font-display text-lg font-bold">Somewhere warm</div>
                <div className="text-xs text-white/50">4 nights · 4★ · all-in</div>
              </div>
              {/* floating boarding pass */}
              <div className="animate-float-slow absolute -right-5 bottom-8 w-40 rounded-2xl glass p-3 shadow-xl" style={{ animationDelay: "-3s" }}>
                <div className="flex items-center justify-between text-xs text-white/60"><span>TLV</span><Sparkles size={14} className="text-sun-400" /><span>???</span></div>
                <div className="mt-2 border-t border-dashed border-white/15 pt-2 tabnum text-lg font-bold">07:40</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Steps ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-24">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Three taps and you're off</h2>
          <p className="mx-auto mt-3 max-w-md text-white/60">Honestly, planning is the worst part of a trip. So we did it for you.</p>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <div className="card group h-full p-7 transition-transform duration-300 hover:-translate-y-1">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/30 to-violet-500/30 text-brand-200 ring-1 ring-white/10">
                  <s.Icon size={24} />
                </div>
                <div className="mt-5 text-xs font-medium uppercase tracking-wide text-brand-300">Step {i + 1}</div>
                <h3 className="mt-1 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Sample mystery deals ───────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-5 pb-8">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">This is what you'd see</h2>
          <p className="mx-auto mt-3 max-w-md text-white/60">Hints, a price, and a big friendly question mark. The where is the whole point.</p>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TEASERS.map((t, i) => (
            <Reveal key={i} delay={i * 90}>
              <article className="card group h-full overflow-hidden transition-transform duration-300 hover:-translate-y-1.5">
                <div className="relative h-40">
                  <Photo src={t.photo} alt="A mystery destination, kept secret" className="absolute inset-0 h-full w-full" blur />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/30 to-transparent" />
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="font-display text-6xl font-extrabold text-white/85 drop-shadow-lg">?</span>
                  </div>
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs backdrop-blur">
                    <t.Icon size={14} /> {t.vibe}
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
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <div className="text-xs text-white/45">all-in, for two</div>
                      <div className="tabnum font-display text-3xl font-extrabold">₪{t.price}</div>
                    </div>
                    <span className="text-white/30 transition-transform duration-300 group-hover:translate-x-1"><ArrowRight size={22} /></span>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Reveal timeline ────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 py-20 md:py-24">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">How the secret comes out</h2>
          <p className="mx-auto mt-3 max-w-md text-white/60">We let it slip a little at a time — that's half the fun.</p>
        </Reveal>
        <div className="relative mt-12 space-y-4 before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-px before:bg-gradient-to-b before:from-brand-400/60 before:via-violet-400/40 before:to-transparent">
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
      </section>

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section className="px-5 pb-24">
        <Reveal className="aurora relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 px-6 py-16 text-center">
          <span className="blob left-10 top-0 h-48 w-48 bg-brand-500/40" />
          <span className="blob right-10 bottom-0 h-56 w-56 bg-violet-500/40" style={{ animationDelay: "-7s" }} />
          <h2 className="font-display text-3xl font-extrabold md:text-4xl">Go on. Let someone else decide.</h2>
          <p className="mx-auto mt-3 max-w-md text-white/70">
            Tell us what you can spend and when you're free. We'll do the rest, and you'll have a story to tell.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/start" className="btn-primary text-base">
              Plan my surprise <ArrowRight size={18} />
            </Link>
          </div>
          <p className="mt-4 inline-flex items-center justify-center gap-1.5 text-xs text-white/45">
            <Check size={14} className="text-mint-400" /> Free to change your mind right up until we book it
          </p>
        </Reveal>
      </section>
    </div>
  );
}
