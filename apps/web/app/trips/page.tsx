import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CURRENCY_SYMBOL } from "@/lib/trip";
import { Gift, ArrowRight, Compass } from "@/components/icons";

export const metadata = { title: "My trips — Blindfold" };
export const dynamic = "force-dynamic";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

const STAGE_LABEL: Record<string, string> = {
  booked: "Booked — secret sealed",
  teaser: "Packing nudge sent",
  gate: "Destination revealed",
  arrival: "Arrived",
  complete: "Trip complete",
};

export default async function MyTripsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/trips");

  // RLS scopes this to the user's own bookings — and the secret lives in a
  // separate, locked table, so nothing sensitive can come back here.
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at_iso", { ascending: false });

  return (
    <div className="aurora relative min-h-[calc(100dvh-65px)]">
      <span className="blob left-[8%] top-24 h-56 w-56 bg-brand-500/25" />
      <span className="blob right-[10%] bottom-24 h-64 w-64 bg-violet-500/25" style={{ animationDelay: "-7s" }} />
      <div className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="font-display text-3xl font-extrabold">My trips</h1>
        <p className="mt-2 text-white/60">Every surprise you've locked in. Tap one to pick up the reveal.</p>

        {!bookings || bookings.length === 0 ? (
          <div className="card mt-8 p-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-brand-300"><Compass size={28} /></div>
            <p className="mt-4 text-white/65">No surprises yet. Your next adventure is one click away.</p>
            <Link href="/start" className="btn-primary mt-6">Plan a trip <ArrowRight size={18} /></Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {bookings.map((b) => {
              const sym = CURRENCY_SYMBOL[b.currency] ?? "";
              const cancelled = b.status === "cancelled";
              return (
                <Link key={b.id} href={`/trip/${b.id}`}
                  className="card flex items-center gap-4 p-5 transition hover:border-white/25">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${cancelled ? "bg-white/5 text-white/40" : "bg-brand-500/20 text-brand-200"}`}>
                    <Gift size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold">
                      {cancelled ? "Cancelled trip" : "Surprise trip"} · {fmtDate(b.departure_iso)}
                    </div>
                    <div className="text-sm text-white/55">
                      {b.nights} nights · {b.travelers} traveller{b.travelers === 1 ? "" : "s"} ·{" "}
                      {cancelled ? "refunded in full" : STAGE_LABEL[b.demo_stage] ?? b.demo_stage}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="tabnum font-display text-lg font-bold">{sym}{Math.round(Number(b.price_total)).toLocaleString()}</div>
                    <ArrowRight size={16} className="ml-auto text-white/40" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
