import { Suspense } from "react";
import { ResultsClient } from "./results-client";

export const metadata = { title: "Your surprises — Blindfold" };

export default function ResultsPage() {
  return (
    <div className="aurora relative min-h-[calc(100dvh-65px)]">
      <span className="blob left-[5%] top-32 h-64 w-64 bg-brand-500/30" />
      <span className="blob right-[7%] bottom-24 h-72 w-72 bg-violet-500/30" style={{ animationDelay: "-9s" }} />
      <Suspense fallback={<div className="p-12 text-center text-white/60">Loading…</div>}>
        <ResultsClient />
      </Suspense>
    </div>
  );
}
