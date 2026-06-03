import Link from "next/link";
import { Logo } from "@/components/brand";
import { Shield } from "@/components/icons";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-ink-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            Surprise getaways out of Tel Aviv. Real flights, real hotels, real experiences —
            we just keep the where to ourselves until the big moment.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/70">
            <Shield size={14} className="text-mint-400" />
            Change your mind anytime before we lock it in
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
          <div className="flex flex-col gap-2">
            <span className="mb-1 text-xs uppercase tracking-wide text-white/35">Explore</span>
            <Link href="/how-it-works" className="text-white/60 hover:text-white">How it works</Link>
            <Link href="/pricing" className="text-white/60 hover:text-white">Pricing</Link>
            <Link href="/faq" className="text-white/60 hover:text-white">FAQ</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="mb-1 text-xs uppercase tracking-wide text-white/35">Company</span>
            <Link href="/start" className="text-white/60 hover:text-white">Plan a trip</Link>
            <Link href="/admin/agent-runs" className="text-white/60 hover:text-white">Agent runs</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-white/30">
        © {new Date().getFullYear()} Blindfold · Demo build · Prices are illustrative (mock data)
      </div>
    </footer>
  );
}
