"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Lock, Sparkles } from "@/components/icons";

function safeNext(raw: string | null): string {
  // Only allow same-origin relative paths (avoid open-redirects).
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

function LoginInner() {
  const sp = useSearchParams();
  const next = safeNext(sp.get("next"));
  const authError = sp.get("error");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(authError ? "Sign-in didn't complete. Please try again." : null);

  async function signIn() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
    // On success the browser navigates to Google — no further work here.
  }

  return (
    <div className="aurora relative min-h-[calc(100dvh-65px)]">
      <span className="blob left-[12%] top-24 h-56 w-56 bg-brand-500/30" />
      <span className="blob right-[10%] bottom-24 h-64 w-64 bg-violet-500/30" style={{ animationDelay: "-6s" }} />
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-xl shadow-brand-500/30">
          <Lock size={26} />
        </span>
        <h1 className="mt-5 font-display text-3xl font-extrabold">Sign in to Blindfold</h1>
        <p className="mx-auto mt-2 max-w-sm text-white/65">
          Your surprise trips live in your account — so you can pick up the reveal from any device.
        </p>

        {error && <p className="mx-auto mt-6 max-w-sm rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p>}

        <button onClick={signIn} disabled={busy} className="btn-primary mt-8 w-full disabled:opacity-50">
          {busy ? "Redirecting…" : <><Sparkles size={18} /> Continue with Google</>}
        </button>

        <p className="mt-4 text-xs text-white/40">We only use this to keep your trips with you. No spam.</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-white/60">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
