import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { Photo } from "@/components/photo";
import { PHOTOS } from "@/lib/photos";
import { Gift, Mail, Unlock, Car, Shield, ArrowRight } from "@/components/icons";

const PHASES = [
  {
    Icon: Gift, when: "The moment you book", title: "You pick from three",
    body: "You'll know the climate, the kind of trip it is, how long the flight is, the hotel's star rating, and the all-in price. The one thing you won't know? Where. Pick the one that feels right.",
  },
  {
    Icon: Mail, when: "A week before you fly", title: "A little nudge lands",
    body: "Just enough to pack properly — \"Hope you like the cold, bring a warm coat for a cosy one.\" We tell you how to dress, never where you're going.",
  },
  {
    Icon: Unlock, when: "Departure day, at the gate", title: "The big reveal",
    body: "Your boarding pass would spoil it, so the app gets there first — a proper drumroll moment when your destination finally flips into view.",
  },
  {
    Icon: Car, when: "The minute you land", title: "Your driver, and the last secret",
    body: "Someone's waiting with your name on a card. On the way into town they tell you which hotel is yours. You walk in, drop the bag, and you're officially on holiday.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="aurora relative">
      <span className="blob left-[8%] top-20 h-64 w-64 bg-brand-500/30" />
      <span className="blob right-[6%] top-40 h-72 w-72 bg-violet-500/30" style={{ animationDelay: "-7s" }} />

      <div className="mx-auto max-w-3xl px-5 py-20">
        <Reveal className="text-center">
          <h1 className="font-display text-4xl font-extrabold md:text-5xl">So, how does this actually work?</h1>
          <p className="mx-auto mt-4 max-w-xl text-white/65">
            Real flights, real hotels, real things to do — picked to fit your budget, then wrapped in a bit of mystery.
            Here's the whole ride, start to finish.
          </p>
        </Reveal>

        <Reveal delay={80} className="mt-10">
          <Photo src={PHOTOS.cloudsWing} alt="Clouds seen from an airplane window" className="h-56 w-full rounded-3xl border border-white/10" />
        </Reveal>

        <div className="mt-12 space-y-5">
          {PHASES.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <div className="card flex gap-5 p-6">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/30 to-violet-500/30 text-brand-200 ring-1 ring-white/10">
                  <p.Icon size={24} />
                </span>
                <div>
                  <div className="text-sm font-semibold text-brand-300">{p.when}</div>
                  <h2 className="mt-0.5 font-display text-xl font-bold">{p.title}</h2>
                  <p className="mt-1.5 leading-relaxed text-white/70">{p.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={60} className="card mt-8 flex items-start gap-4 p-6">
          <Shield size={26} className="mt-0.5 shrink-0 text-mint-400" />
          <div>
            <h3 className="font-display text-lg font-bold">Saying yes is risk-free</h3>
            <p className="mt-1.5 text-sm text-white/70">
              While we're getting started, every trip is fully refundable right up until we lock it in.
              Say yes to the unknown — back out anytime before we book.
            </p>
          </div>
        </Reveal>

        <Reveal delay={80} className="mt-12 text-center">
          <Link href="/start" className="btn-primary">Plan my surprise <ArrowRight size={18} /></Link>
        </Reveal>
      </div>
    </div>
  );
}
