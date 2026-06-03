import Link from "next/link";
import { Lock, Mail, Unlock, Car, ArrowRight } from "@/components/icons";

export const metadata = { title: "Checkout — Blindfold" };

// Placeholder for the payments + reveal phase. Keeps the click-path coherent.
export default function CheckoutPage() {
  return (
    <div className="aurora relative min-h-[calc(100dvh-65px)]">
      <span className="blob left-[12%] top-24 h-56 w-56 bg-brand-500/30" />
      <span className="blob right-[10%] bottom-24 h-64 w-64 bg-violet-500/30" style={{ animationDelay: "-6s" }} />

      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-xl shadow-brand-500/30">
          <Lock size={30} />
        </span>
        <h1 className="mt-6 font-display text-3xl font-extrabold">Almost there — checkout's next</h1>
        <p className="mt-3 text-white/70">
          This is where you'd pop in who's travelling and pay securely. One all-in price, fully refundable
          while we're getting started. The second you're booked, the reveal begins:
        </p>

        <div className="mt-6 space-y-2 text-left text-sm text-white/75">
          <Row Icon={Mail} text="A week before — a little packing nudge by email" />
          <Row Icon={Unlock} text="At the gate — your destination flips into view" />
          <Row Icon={Car} text="On arrival — your driver reveals the hotel" />
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <Link href="/start" className="btn-ghost">Plan another</Link>
          <Link href="/" className="btn-primary">Back home <ArrowRight size={18} /></Link>
        </div>
      </div>
    </div>
  );
}

function Row({ Icon, text }: { Icon: typeof Mail; text: string }) {
  return (
    <div className="card flex items-center gap-3 p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-brand-200"><Icon size={18} /></span>
      {text}
    </div>
  );
}
