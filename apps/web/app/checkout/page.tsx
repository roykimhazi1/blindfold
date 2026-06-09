import { Suspense } from "react";
import { CheckoutClient } from "./checkout-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Checkout — Blindfold" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  // Account-first: middleware already guarantees a signed-in user here. Prefill
  // the contact from their Google profile (still editable).
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const defaultName = (user?.user_metadata?.full_name as string | undefined)
    ?? (user?.user_metadata?.name as string | undefined) ?? "";
  const defaultEmail = user?.email ?? "";

  return (
    <div className="aurora relative min-h-[calc(100dvh-65px)]">
      <span className="blob left-[12%] top-24 h-56 w-56 bg-brand-500/30" />
      <span className="blob right-[10%] bottom-24 h-64 w-64 bg-violet-500/30" style={{ animationDelay: "-6s" }} />
      <Suspense fallback={<div className="p-12 text-center text-white/60">Loading…</div>}>
        <CheckoutClient defaultName={defaultName} defaultEmail={defaultEmail} />
      </Suspense>
    </div>
  );
}
