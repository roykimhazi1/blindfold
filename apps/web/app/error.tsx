"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Shield } from "@/components/icons";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="aurora relative min-h-[calc(100dvh-65px)]">
      <span className="blob left-[10%] top-24 h-56 w-56 bg-rose-500/25" />
      <span className="blob right-[12%] bottom-24 h-64 w-64 bg-violet-500/25" style={{ animationDelay: "-6s" }} />
      <div className="mx-auto max-w-md px-5 py-28 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-rose-300">
          <Shield size={32} />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold">Something went sideways</h1>
        <p className="mt-2 text-white/60">A hiccup on our end — your trip and details are safe. Try again in a moment.</p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <button onClick={reset} className="btn-primary px-5 py-2.5">Try again</button>
          <Link href="/" className="btn-ghost px-5 py-2.5">Home</Link>
        </div>
      </div>
    </div>
  );
}
