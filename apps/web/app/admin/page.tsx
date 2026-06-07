import Link from "next/link";
import { listBookings } from "@/lib/bookings";
import { activeDestinations } from "@sv/engine";
import { stageAtLeast } from "@sv/engine";
import { Gift, Wallet, Building, Heart } from "@/components/icons";

export const metadata = { title: "Dashboard — Blindfold admin" };
export const dynamic = "force-dynamic";

const eur = (n: number) => "€" + Math.round(n).toLocaleString();

export default async function AdminDashboard() {
  const bookings = await listBookings();
  const active = bookings.filter((b) => b.status === "confirmed");
  const gross = active.reduce((s, b) => s + b.breakdownEur.total, 0);
  const profit = active.reduce((s, b) => s + b.breakdownEur.margin + b.breakdownEur.serviceFee, 0);
  const avgMarginPct = gross > 0 ? Math.round((profit / gross) * 100) : 0;
  const revealed = bookings.filter((b) => stageAtLeast(b.demoStage, "gate")).length;

  const KPIS = [
    { label: "Bookings", value: String(bookings.length), Icon: Gift },
    { label: "Gross revenue", value: eur(gross), Icon: Wallet },
    { label: "Our margin", value: eur(profit), sub: `${avgMarginPct}% blended`, Icon: Heart },
    { label: "Live destinations", value: String(activeDestinations().length), Icon: Building },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-white/55">A live snapshot — bookings are persisted in Supabase.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.label} className="card p-5">
            <div className="flex items-center justify-between text-white/45">
              <span className="text-xs uppercase tracking-wide">{k.label}</span>
              <k.Icon size={18} className="text-brand-300" />
            </div>
            <div className="tabnum mt-2 font-display text-3xl font-extrabold">{k.value}</div>
            {k.sub && <div className="mt-0.5 text-xs text-mint-300">{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Recent bookings</h2>
        <Link href="/admin/bookings" className="text-sm text-brand-300 hover:text-brand-200">View all →</Link>
      </div>

      {bookings.length === 0 ? (
        <div className="card mt-3 p-8 text-center text-sm text-white/55">
          No bookings yet this session. <Link href="/start" className="text-brand-300">Make one</Link> to see it here.
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/55">
              <tr>
                <th className="px-4 py-3">Traveler</th>
                <th className="px-4 py-3">Hidden destination</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Margin</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 8).map((b) => (
                <tr key={b.id} className="border-t border-white/5">
                  <td className="px-4 py-3">{b.contact.name}</td>
                  <td className="px-4 py-3 text-white/70">{b.secret.city}, {b.secret.country}</td>
                  <td className="px-4 py-3">{b.status === "cancelled" ? <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300">cancelled</span> : <StageBadge stage={b.demoStage} />}</td>
                  <td className="tabnum px-4 py-3 text-right">{eur(b.breakdownEur.total)}</td>
                  <td className="tabnum px-4 py-3 text-right text-mint-300">{eur(b.breakdownEur.margin + b.breakdownEur.serviceFee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const tone = stage === "booked" ? "bg-white/10 text-white/70" : "bg-emerald-500/20 text-emerald-300";
  return <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${tone}`}>{stage}</span>;
}
