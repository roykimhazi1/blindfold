import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { ChevronDown, ArrowRight } from "@/components/icons";

const QA = [
  {
    q: "Will I really have no idea where I'm going?",
    a: "Pretty much, yeah — right up until the airport. You'll get hints along the way (the climate, the vibe, how long the flight is, the hotel's stars) and a packing nudge a week before. The actual place pops up in the app at the gate, and your hotel is revealed by the driver when you land.",
  },
  {
    q: "What if I can't stand the cold? Or the heat?",
    a: "Totally fair. There's a little 'warm or cold' toggle when you plan — flip it and we'll keep your surprise on the right side of the thermometer.",
  },
  {
    q: "Do I need a visa?",
    a: "For now we only surprise you with places that are visa-free for your passport. Tell us your nationality and we quietly handle the filtering — no awkward border surprises.",
  },
  {
    q: "Can I back out?",
    a: "While we're getting started, absolutely — full refund anytime before we lock your booking in. (Down the line we'll move to committed trips, with an optional 'protect my booking' add-on for the cautious.)",
  },
  {
    q: "Who actually picks the flights and hotels?",
    a: "Our deal engine does the legwork — it searches real flights, hotels, transfers and experiences, fits them under your budget, and hands you the three best surprises. A human-friendly robot, basically.",
  },
  {
    q: "Is the price honestly all-in?",
    a: "Honestly, yes. Flights, hotel, the airport ride, your experiences, and our fee for doing the planning — all baked into the one number. No surprise line-items. (The destination's the only surprise.)",
  },
];

export default function FaqPage() {
  return (
    <div className="aurora relative">
      <span className="blob left-[12%] top-24 h-64 w-64 bg-violet-500/30" />
      <span className="blob right-[10%] bottom-24 h-64 w-64 bg-brand-500/25" style={{ animationDelay: "-7s" }} />

      <div className="mx-auto max-w-2xl px-5 py-20">
        <Reveal className="text-center">
          <h1 className="font-display text-4xl font-extrabold md:text-5xl">The bits people ask about</h1>
          <p className="mx-auto mt-4 max-w-md text-white/60">No jargon. Just straight answers.</p>
        </Reveal>

        <div className="mt-12 space-y-3">
          {QA.map((item, i) => (
            <Reveal key={item.q} delay={i * 60}>
              <details className="card group p-5 transition-colors hover:bg-white/[0.06]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:hidden">
                  {item.q}
                  <span className="shrink-0 text-brand-300 transition-transform duration-300 group-open:rotate-180">
                    <ChevronDown size={20} />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>

        <Reveal delay={60} className="mt-12 text-center">
          <Link href="/start" className="btn-primary">Alright, surprise me <ArrowRight size={18} /></Link>
        </Reveal>
      </div>
    </div>
  );
}
