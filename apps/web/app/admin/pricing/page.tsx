import { DEFAULT_PRICING, convertFromEur } from "@sv/engine";

export const metadata = { title: "Pricing & fees — Blindfold admin" };

export default function AdminPricing() {
  const p = DEFAULT_PRICING;
  const sample = 1200; // EUR net cost example

  const KNOBS = [
    { label: "Marketing margin", value: `${Math.round(p.marginRate * 100)}%`, note: "added on top of net component cost — our core spread" },
    { label: "Service fee", value: `€${p.serviceFee}`, note: "flat per-booking curation fee" },
    { label: "Budget buffer", value: `${Math.round(p.budgetBuffer * 100)}%`, note: "kept under budget to absorb FX / price drift" },
  ];

  const FX: { code: string; sample: number }[] = [
    { code: "EUR", sample: convertFromEur(1000, "EUR") },
    { code: "USD", sample: convertFromEur(1000, "USD") },
    { code: "ILS", sample: convertFromEur(1000, "ILS") },
  ];

  const margin = sample * p.marginRate;
  const total = sample + margin + p.serviceFee;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Pricing &amp; fees</h1>
      <p className="mt-1 text-sm text-white/55">How the all-in price is built. These are code-owned — an LLM never computes what a customer pays.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {KNOBS.map((k) => (
          <div key={k.label} className="card p-5">
            <div className="text-xs uppercase tracking-wide text-white/45">{k.label}</div>
            <div className="tabnum mt-1 font-display text-3xl font-extrabold">{k.value}</div>
            <div className="mt-1 text-xs text-white/55">{k.note}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold">Worked example</h2>
          <p className="mt-1 text-xs text-white/45">Net component cost of €{sample.toLocaleString()}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Net cost (flights + hotel + transfer + experiences)" value={`€${sample.toLocaleString()}`} />
            <Row label={`+ Margin (${Math.round(p.marginRate * 100)}%)`} value={`€${Math.round(margin).toLocaleString()}`} accent />
            <Row label="+ Service fee" value={`€${p.serviceFee}`} accent />
            <div className="border-t border-white/10 pt-2">
              <Row label="All-in price" value={`€${Math.round(total).toLocaleString()}`} bold />
            </div>
          </dl>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-lg font-bold">Display FX (from EUR base)</h2>
          <p className="mt-1 text-xs text-white/45">€1,000 shown in each currency</p>
          <table className="mt-4 w-full text-left text-sm">
            <tbody>
              {FX.map((f) => (
                <tr key={f.code} className="border-b border-white/5 last:border-0">
                  <td className="py-2 text-white/60">{f.code}</td>
                  <td className="tabnum py-2 text-right font-medium">{f.sample.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-white/40">Live rates replace this stub in a later phase.</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent, bold }: { label: string; value: string; accent?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={accent ? "text-mint-300" : "text-white/70"}>{label}</dt>
      <dd className={`tabnum ${bold ? "font-display text-lg font-extrabold" : ""}`}>{value}</dd>
    </div>
  );
}
