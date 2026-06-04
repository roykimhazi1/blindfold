import { activeDestinations } from "@sv/engine";

export const metadata = { title: "Destinations — Blindfold admin" };

export default function AdminDestinations() {
  const dests = activeDestinations();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Destinations</h1>
      <p className="mt-1 text-sm text-white/55">
        The operable catalog — only cities with a transfer partner and an experience bundle are eligible to surprise someone.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-white/55">
            <tr>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Airport</th>
              <th className="px-4 py-3 text-right">From TLV</th>
              <th className="px-4 py-3">Vibes</th>
              <th className="px-4 py-3">Transfer partner</th>
              <th className="px-4 py-3 text-right">Packages</th>
            </tr>
          </thead>
          <tbody>
            {dests.map((d) => (
              <tr key={d.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <div className="font-medium">{d.city}</div>
                  <div className="text-xs text-white/45">{d.country}</div>
                </td>
                <td className="px-4 py-3 text-white/70">{d.region}</td>
                <td className="px-4 py-3 text-white/60">{d.airport}</td>
                <td className="tabnum px-4 py-3 text-right text-white/70">{d.flightHoursFrom.TLV?.toFixed(1)}h</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {d.vibeTags.map((v) => (
                      <span key={v} className="rounded-full bg-white/10 px-2 py-0.5 text-xs capitalize text-white/75">{v}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-white/55">{d.transferPartnerId}</td>
                <td className="tabnum px-4 py-3 text-right text-white/70">{d.attractionPackages.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-white/40">
        Editing the catalog (CRUD) lands when we move off the seed file onto a database.
      </p>
    </div>
  );
}
