import { Suspense } from "react";
import { CheckoutClient } from "./checkout-client";

export const metadata = { title: "Checkout — Blindfold" };

export default function CheckoutPage() {
  return (
    <div className="aurora relative min-h-[calc(100dvh-65px)]">
      <span className="blob left-[12%] top-24 h-56 w-56 bg-brand-500/30" />
      <span className="blob right-[10%] bottom-24 h-64 w-64 bg-violet-500/30" style={{ animationDelay: "-6s" }} />
      <Suspense fallback={<div className="p-12 text-center text-white/60">Loading…</div>}>
        <CheckoutClient />
      </Suspense>
    </div>
  );
}
