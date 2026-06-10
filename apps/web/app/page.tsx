import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { Photo } from "@/components/photo";
import { PHOTOS } from "@/lib/photos";
import {
  Sparkles, Wallet, Gift, Suitcase, Sun, Mail, Unlock, Car,
  Umbrella, Landmark, Building, Star, Check, ArrowRight, Shield, Clock, Heart, Wine, Plane,
} from "@/components/icons";

const STEPS = [
  { Icon: Wallet, title: "Tell us a little", body: "Your budget, your dates, who's tagging along. That's genuinely it. Fussy types can add a few wishes — 5-star only, somewhere warm — but you don't have to." },
  { Icon: Gift, title: "We hand you three", body: "Three complete trips, each to a place we're not telling you yet. You'll know the weather, the vibe, and the price. The rest? You'll find out." },
  { Icon: Suitcase, title: "You pack a bag", body: "No tabs, no spreadsheets, no 2am hotel comparisons. We've booked the flights, the room, the ride, the fun. Show up at the airport and go." },
];

// The "this could be you" gallery — real joy, never a destination giveaway.
const VIBES = [
  { Icon: Plane, label: "Bags packed", line: "Passport in hand, somewhere new on the way.", photo: PHOTOS.passport, alt: "Hands holding a passport and boarding pass, ready to travel" },
  { Icon: Umbrella, label: "Sun & sea", line: "Toes in the sand, nothing on the calendar.", photo: PHOTOS.beachFriends, alt: "Friends running into the sea on a sunny beach" },
  { Icon: Wine, label: "Nights out", line: "Somewhere the music doesn't stop early.", photo: PHOTOS.party, alt: "A crowd of people celebrating under confetti and lights" },
  { Icon: Landmark, label: "Culture & colour", line: "Old streets, new flavours, a good wander.", photo: PHOTOS.culture, alt: "People exploring a vibrant lantern-lined street" },
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
    <div className="bg-cream text-plum">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="aurora-light relative">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-20 pt-16 md:grid-cols-2 md:pb-28 md:pt-24">
          <div>
            <Reveal as="span" className="chip-light">
              <Sparkles size={14} className="text-sun-500" />
              Surprise trips out of Tel Aviv
            </Reveal>
            <Reveal as="h1" delay={60} className="mt-5 font-display text-4xl font-extrabold leading-[1.05] text-plum md:text-6xl">
              Don't plan a holiday.
              <span className="mt-1 block text-gradient-bright">Just go on one.</span>
            </Reveal>
            <Reveal as="p" delay={120} className="mt-5 max-w-md text-lg leading-relaxed text-plum/70">
              Give us a budget and a few free days. We'll book the whole thing —
              flights, hotel, the ride from the airport, the good stuff to do —
              to a place we won't tell you about until you're nearly there.
            </Reveal>
            <Reveal delay={180} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/start" className="btn-primary">
                Plan my surprise <ArrowRight size={18} />
              </Link>
              <Link href="/how-it-works" className="btn-ghost-light">See how it works</Link>
            </Reveal>
            <Reveal delay={240} className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-plum/55">
              <span className="inline-flex items-center gap-1.5"><Shield size={14} className="text-mint-600" /> Full refund till we lock it</span>
              <span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-mint-600" /> Takes about a minute</span>
              <span className="inline-flex items-center gap-1.5"><Heart size={14} className="text-brand-500" /> No spam, ever</span>
            </Reveal>
          </div>

          {/* Hero collage — the moment before take-off */}
          <Reveal delay={120} className="relative hidden md:block">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm">
              <Photo src={PHOTOS.passport} alt="Hands holding a passport and boarding pass, ready to travel" className="photo-warm absolute inset-0 h-full w-full rounded-[2rem] border border-plum/10 shadow-2xl shadow-plum/25" />
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-t from-cream/30 via-transparent to-transparent" />
              {/* floating ticket card */}
              <div className="animate-float absolute -left-6 top-10 w-44 rounded-2xl glass-light p-3">
                <div className="flex items-center gap-2 text-xs text-plum/60"><Gift size={16} className="text-brand-500" /> Your mystery</div>
                <div className="mt-1 font-display text-lg font-bold text-plum">Somewhere warm</div>
                <div className="text-xs text-plum/50">4 nights · 4★ · all-in</div>
              </div>
              {/* floating boarding pass */}
              <div className="animate-float-slow absolute -right-5 bottom-8 w-40 rounded-2xl glass-light p-3" style={{ animationDelay: "-3s" }}>
                <div className="flex items-center justify-between text-xs text-plum/60"><span>TLV</span><Sparkles size={14} className="text-sun-500" /><span>???</span></div>
                <div className="mt-2 border-t border-dashed border-plum/20 pt-2 tabnum text-lg font-bold text-plum">07:40</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Vibes gallery (this could be you) ───────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-bold text-plum md:text-4xl">This is the fun part</h2>
          <p className="mx-auto mt-3 max-w-md text-plum/60">Packing, sun, late nights, getting happily lost — we'll handle everything else.</p>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VIBES.map((v, i) => (
            <Reveal key={v.label} delay={i * 90}>
              <article className="group relative aspect-[4/5] overflow-hidden rounded-3xl border border-plum/10 shadow-[0_18px_50px_-24px_rgba(42,33,64,0.45)]">
                <Photo src={v.photo} alt={v.alt} className="photo-warm absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-plum/85 via-plum/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                    <v.Icon size={14} /> {v.label}
                  </div>
                  <p className="mt-3 font-display text-lg font-semibold leading-snug drop-shadow">{v.line}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Steps ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-4 md:pb-8">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-bold text-plum md:text-4xl">Three taps and you're off</h2>
          <p className="mx-auto mt-3 max-w-md text-plum/60">Honestly, planning is the worst part of a trip. So we did it for you.</p>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <div className="card-light group h-full p-7 transition-transform duration-300 hover:-translate-y-1">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 text-brand-600 ring-1 ring-plum/10">
                  <s.Icon size={24} />
                </div>
                <div className="mt-5 text-xs font-medium uppercase tracking-wide text-brand-600">Step {i + 1}</div>
                <h3 className="mt-1 font-display text-xl font-bold text-plum">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-plum/65">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Sample mystery deals ───────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-5 py-20 md:py-24">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-bold text-plum md:text-4xl">This is what you'd see</h2>
          <p className="mx-auto mt-3 max-w-md text-plum/60">Hints, a price, and a big friendly question mark. The where is the whole point.</p>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TEASERS.map((t, i) => (
            <Reveal key={i} delay={i * 90}>
              <article className="card-light group h-full overflow-hidden transition-transform duration-300 hover:-translate-y-1.5">
                <div className="relative h-40">
                  <Photo src={t.photo} alt="A mystery destination, kept secret" className="absolute inset-0 h-full w-full" blur />
                  <div className="absolute inset-0 bg-gradient-to-t from-plum/80 via-plum/25 to-plum/5" />
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="font-display text-6xl font-extrabold text-white/90 drop-shadow-lg">?</span>
                  </div>
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-plum/40 px-3 py-1 text-xs text-white backdrop-blur">
                    <t.Icon size={14} /> {t.vibe}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-plum/[0.06] px-3 py-1 text-xs text-plum/75">
                      <Sun size={14} className="text-sun-500" /> {t.climate} · {t.flight}
                    </span>
                    <span className="inline-flex text-sun-500">
                      {Array.from({ length: t.stars }).map((_, k) => <Star key={k} size={14} filled />)}
                    </span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <div className="text-xs text-plum/45">all-in, for two</div>
                      <div className="tabnum font-display text-3xl font-extrabold text-plum">₪{t.price}</div>
                    </div>
                    <span className="text-plum/30 transition-transform duration-300 group-hover:translate-x-1"><ArrowRight size={22} /></span>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Reveal timeline ────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 pb-20 md:pb-24">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-bold text-plum md:text-4xl">How the secret comes out</h2>
          <p className="mx-auto mt-3 max-w-md text-plum/60">We let it slip a little at a time — that's half the fun.</p>
        </Reveal>
        <div className="relative mt-12 space-y-4 before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-px before:bg-gradient-to-b before:from-brand-500/50 before:via-violet-500/40 before:to-transparent">
          {TIMELINE.map((t, i) => (
            <Reveal key={t.when} delay={i * 80}>
              <div className="relative flex items-start gap-5">
                <div className="z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-brand-600 ring-1 ring-plum/10 shadow-[0_10px_30px_-12px_rgba(42,33,64,0.45)]">
                  <t.Icon size={24} />
                </div>
                <div className="card-light flex-1 p-5">
                  <div className="text-sm font-semibold text-brand-600">{t.when}</div>
                  <p className="mt-1 leading-relaxed text-plum/75">{t.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section className="px-5 pb-24">
        <Reveal className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-500 via-coral-500 to-violet-500 bg-[length:200%_200%] px-6 py-16 text-center shadow-[0_30px_80px_-30px_rgba(244,63,94,0.55)] animate-gradient-pan">
          <span className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
          <span className="pointer-events-none absolute -bottom-12 right-0 h-56 w-56 rounded-full bg-sun-400/30 blur-3xl" />
          <h2 className="font-display text-3xl font-extrabold text-white md:text-4xl">Go on. Let someone else decide.</h2>
          <p className="mx-auto mt-3 max-w-md text-white/85">
            Tell us what you can spend and when you're free. We'll do the rest, and you'll have a story to tell.
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
