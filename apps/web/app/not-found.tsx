import Link from "next/link";
import { Compass } from "@/components/icons";

export const metadata = { title: "Not found — Blindfold" };

export default function NotFound() {
  return (
    <div className="aurora relative min-h-[calc(100dvh-65px)]">
      <span className="blob left-[10%] top-24 h-56 w-56 bg-brand-500/30" />
      <span className="blob right-[12%] bottom-24 h-64 w-64 bg-violet-500/30" style={{ animationDelay: "-6s" }} />
      <div className="mx-auto max-w-md px-5 py-28 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-brand-300">
          <Compass size={32} />
        </div>
        <p className="mt-6 font-display text-6xl font-extrabold tracking-tight">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold">This page wandered off</h1>
        <p className="mt-2 text-white/60">The link may be old, or the trip never existed. Let&apos;s get you somewhere good.</p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <Link href="/" className="btn-ghost px-5 py-2.5">Home</Link>
          <Link href="/start" className="btn-primary px-5 py-2.5">Plan a surprise</Link>
        </div>
      </div>
    </div>
  );
}
