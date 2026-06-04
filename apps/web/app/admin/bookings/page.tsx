import Link from "next/link";
import { listBookings } from "@/lib/bookings";

export const metadata = { title: "Bookings — Blindfold admin" };
export const dynamic = "force-dynamic";

const eur = (n: number) => "€" + Math.round(n).toLocaleString();
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function AdminBookings() {
  const bookings = listBookings();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Bookings</h1>
      <p className="mt-1 text-sm text-white/55">{bookings.length} booking{bookings.length === 1 ? "" : "s"} this session. The hidden destination/hotel is shown here for ops — never to the traveler before their reveal.</p>

      {bookings.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-sm text-white/55">
          Nothing booked yet. <Link href="/start" className="text-brand-300">Plan a trip</Link>.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/55">
              <tr>
                <th className="px-4 py-3">Traveler</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Hotel</th>
                <th className="px-4 py-3">Departs</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Margin</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <div className="font-medium">{b.contact.name}</div>
                    <div className="text-xs text-white/45">{b.contact.email}</div>
                  </td>
                  <td className="px-4 py-3 text-white/75">{b.secret.city}, {b.secret.country}</td>
                  <td className="px-4 py-3 text-white/60">{b.secret.hotelName}</td>
                  <td className="px-4 py-3 text-white/60">{fmtDate(b.departureIso)} · {b.nights}n</td>
                  <td className="px-4 py-3">
                    {b.status === "cancelled"
                      ? <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300">cancelled</span>
                      : <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${b.demoStage === "booked" ? "bg-white/10 text-white/70" : "bg-emerald-500/20 text-emerald-300"}`}>{b.demoStage}</span>}
                  </td>
                  <td className="tabnum px-4 py-3 text-right">{eur(b.breakdownEur.total)}</td>
                  <td className="tabnum px-4 py-3 text-right text-mint-300">{eur(b.breakdownEur.margin + b.breakdownEur.serviceFee)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/trip/${b.id}`} className="text-brand-300 hover:text-brand-200">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
