import { Plane, Check, Clock } from "@/components/icons";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata = { title: "Fare cache — Blindfold admin" };
export const dynamic = "force-dynamic";

interface FareRow {
  destination_airport: string;
  destination_city: string;
  depart_date: string;
  nights: number;
  cheapest_total_eur: number;
  carrier: string | null;
  duration_hours: number | null;
  refreshed_at: string;
  expires_at: string;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function AdminFares() {
  let rows: FareRow[] = [];
  let total = 0;
  try {
    const supa = supabaseAdmin();
    const { count } = await supa.from("destination_fares").select("*", { count: "exact", head: true });
    total = count ?? 0;
    const { data } = await supa
      .from("destination_fares")
      .select("destination_airport, destination_city, depart_date, nights, cheapest_total_eur, carrier, duration_hours, refreshed_at, expires_at")
      .order("refreshed_at", { ascending: false })
      .limit(60);
    rows = (data ?? []) as FareRow[];
  } catch {
    // Table missing or DB unreachable — render the empty state below.
  }

  const now = Date.now();
  const fresh = rows.filter((r) => Date.parse(r.expires_at) > now).length;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Fare cache</h1>
      <p className="mt-1 text-sm text-white/55">
        What the nightly Duffel fan-out wrote to <code className="text-white/70">destination_fares</code>.
        Discovery serves the wizard from these rows; when the window isn&apos;t covered, it falls back to
        catalog estimates. Refresh manually with <code className="text-white/70">npm run fares:refresh</code>.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Stat label="Rows in cache" value={String(total)} />
        <Stat label="Fresh (of latest 60)" value={String(fresh)} />
        <Stat label="Last refresh" value={rows[0] ? fmt(rows[0].refreshed_at) : "—"} />
      </div>

      {rows.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-sm text-white/55">
          The cache is empty. Set <code className="text-white/70">DUFFEL_API_KEY</code> and run{" "}
          <code className="text-white/70">npm run fares:refresh</code> — or wait for the nightly job.
          The wizard keeps working on catalog estimates meanwhile.
        </div>
      ) : (
        <div className="card mt-6 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Departure</th>
                <th className="px-4 py-3">Nights</th>
                <th className="px-4 py-3">Cheapest (2 adults)</th>
                <th className="px-4 py-3">Carrier</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const live = Date.parse(r.expires_at) > now;
                return (
                  <tr key={i} className="border-b border-white/5">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Plane size={14} className="text-brand-300" /> TLV → {r.destination_airport}
                      </span>
                      <span className="ml-2 text-white/45">{r.destination_city}</span>
                    </td>
                    <td className="px-4 py-3 text-white/70">{r.depart_date}</td>
                    <td className="px-4 py-3 text-white/70">{r.nights}</td>
                    <td className="tabnum px-4 py-3">€{Math.round(Number(r.cheapest_total_eur)).toLocaleString()}</td>
                    <td className="px-4 py-3 text-white/70">{r.carrier ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${live ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                        {live ? <Check size={12} /> : <Clock size={12} />}
                        {live ? `fresh until ${fmt(r.expires_at)}` : "expired"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="font-display text-xl font-extrabold">{value}</div>
      <div className="mt-0.5 text-xs text-white/45">{label}</div>
    </div>
  );
}
