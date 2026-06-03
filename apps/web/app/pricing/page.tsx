import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { Plane, Building, Car, Ticket, Sparkles, Shield, Check, ArrowRight } from "@/components/icons";

const INCLUDED = [
  { Icon: Plane, text: "Round-trip flights from Tel Aviv" },
  { Icon: Building, text: "Your hotel, for the whole stay" },
  { Icon: Car, text: "Private airport pickup & drop-off" },
  { Icon: Ticket, text: "A handful of things to do, sorted" },
  { Icon: Sparkles, text: "All the planning — that's our job" },
  { Icon: Shield, text: "A full refund until we lock it in" },
];

const BANDS = [
  { label: "Quick escape", nights: "3–4 nights", from: "4,900", note: "close by, short flight" },
  { label: "The classic", nights: "4–6 nights", from: "6,500", note: "most people land here", featured: true },
  { label: "The big one", nights: "7+ nights", from: "9,800", note: "5★ and further afield" },
];

export default function PricingPage() {
  return (
    <div className="aurora relative">
      <span className="blob left-[10%] top-24 h-64 w-64 bg-brand-500/30" />
      <span className="blob right-[8%] bottom-20 h-72 w-72 bg-sun-400/20" style={{ animationDelay: "-6s" }} />

      <div className="mx-auto max-w-4xl px-5 py-20">
        <Reveal className="text-center">
          <h1 className="font-display text-4xl font-extrabold md:text-5xl">One price. The whole trip.</h1>
          <p className="mx-auto mt-4 max-w-xl text-white/65">
            You set the budget; we fit everything inside it. The number you see is the number you pay —
            no drip-fees, no "oh, that's extra" at checkout.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {BANDS.map((b, i) => (
            <Reveal key={b.label} delay={i * 90}>
              <div className={`card h-full p-6 text-center transition-transform duration-300 hover:-translate-y-1 ${b.featured ? "ring-2 ring-brand-400/60" : ""}`}>
                {b.featured && <div className="mb-3 inline-block rounded-full bg-brand-500/20 px-3 py-1 text-xs text-brand-200">Most popular</div>}
                <h2 className="font-display text-xl font-bold">{b.label}</h2>
                <p className="text-sm text-white/55">{b.nights}</p>
                <div className="mt-4 text-xs text-white/45">from</div>
                <div className="tabnum font-display text-4xl font-extrabold">₪{b.from}</div>
                <div className="mt-2 text-xs text-brand-300">{b.note}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={60} className="card mt-10 p-7">
          <h3 className="font-display text-lg font-bold">What's in the box, every time</h3>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {INCLUDED.map((i) => (
              <li key={i.text} className="flex items-center gap-3 text-sm text-white/80">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-brand-200 ring-1 ring-white/10">
                  <i.Icon size={18} />
                </span>
                {i.text}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={80} className="mt-12 text-center">
          <Link href="/start" className="btn-primary">See my price <ArrowRight size={18} /></Link>
          <p className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs text-white/45">
            <Check size={14} className="text-mint-400" /> Takes about a minute · nothing booked till you say so
          </p>
        </Reveal>
      </div>
    </div>
  );
}
