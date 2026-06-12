import { WizardClient } from "./wizard-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Plan my surprise — Blindfold" };
export const dynamic = "force-dynamic";

export default async function StartPage() {
  // If signed in, default the visa-filter nationality to the traveller the user
  // marked as themselves (falls back to IL — the TLV hub default).
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  let defaultNationality = "IL";
  if (user) {
    const { data } = await supabase
      .from("travellers")
      .select("nationality")
      .eq("is_self", true)
      .limit(1)
      .maybeSingle();
    if (data?.nationality) defaultNationality = data.nationality;
  }

  // Computed server-side and passed down so SSR and hydration agree on "now"
  // (the page is force-dynamic, so this is fresh per request).
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="aurora relative min-h-[calc(100dvh-65px)]">
      <span className="blob left-[6%] top-24 h-64 w-64 bg-brand-500/40" />
      <span className="blob right-[8%] bottom-20 h-72 w-72 bg-violet-500/40" style={{ animationDelay: "-8s" }} />
      <div className="mx-auto max-w-xl px-5 py-12">
        <WizardClient defaultNationality={defaultNationality} today={today} />
      </div>
    </div>
  );
}
