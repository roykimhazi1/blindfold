import { notFound } from "next/navigation";
import { rankFlightDeals, buildBundles, sealBundle, findBundleLeaks, type FlightDeal, type Bundle } from "@/lib/finder";
import { SAMPLE_PREFS, FLIGHT_OPTIONS, HOTELS_BY_DEST } from "@/lib/finder-fixture";
import { Plane, Building, Star, Suitcase, Shield, Check, MapPin, Users, Wallet, Lock } from "@/components/icons";

export const metadata = { title: "DEV · Bundles — Blindfold" };

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;

export default function DevBundlesPage() {
  // Dev-only surface: in production the destination stays sealed until reveal.
  if (process.env.NODE_ENV === "production") notFound();

  const prefs = SAMPLE_PREFS;
  const deals = rankFlightDeals(prefs, FLIGHT_OPTIONS, 10);
  const bundles = buildBundles(prefs, deals, HOTELS_BY_DEST, 3);
  const sealed = bundles.map((b) => sealBundle(prefs, b));
  const leakSafe = bundles.every((b, i) => findBundleLeaks(sealed[i]!, b).length === 0);

  return (
    <div className="aurora relative min-h-[calc(100dvh-65px)]">
      <span className="blob left-[8%] top-24 h-56 w-56 bg-brand-500/25" />
      <span className="blob right-[10%] bottom-24 h-64 w-64 bg-violet-500/25" style={{ animationDelay: "-6s" }} />
      <div className="mx-auto max-w-3xl px-5 py-12">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
          <Shield size={13} /> DEV preview — sealed in production
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold">Flight agent → master bundles</h1>
        <p className="mt-2 text-white/60">
          Live flight + hotel data (via MCP), ranked to the user&apos;s preferences. The master picks
          destinations; the flight &amp; hotel agents fill them in.
        </p>

        {/* User request */}
        <div className="card mt-6 p-5">
          <p className="text-xs uppercase tracking-wide text-white/40">The request</p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <Chip Icon={Plane}>{prefs.origin} · {prefs.departDate} → {prefs.returnDate}</Chip>
            <Chip Icon={Users}>{prefs.adults} adults</Chip>
            <Chip Icon={Wallet}>{usd(prefs.budgetUsd)} all-in</Chip>
            <Chip Icon={Suitcase}>{prefs.carryOnOnly ? "Carry-on only" : "Checked luggage"}</Chip>
            <Chip Icon={MapPin}>vibe: {prefs.vibe.join(" / ")}</Chip>
            {prefs.avoidDestinations.length > 0 && <Chip Icon={MapPin}>avoid: {prefs.avoidDestinations.join(", ")}</Chip>}
          </div>
        </div>

        {/* Flight agent output */}
        <h2 className="mt-9 flex items-center gap-2 font-display text-xl font-bold">
          <Plane size={20} className="text-brand-300" /> Flight agent — 10 best deals
        </h2>
        <p className="mt-1 text-sm text-white/50">Ranked across {new Set(FLIGHT_OPTIONS.map((o) => o.destCode)).size} candidate destinations. Carry-on fit is decisive here.</p>
        <ol className="mt-4 space-y-2.5">
          {deals.map((d, i) => <DealRow key={`${d.destCode}-${i}`} rank={i + 1} d={d} />)}
        </ol>

        {/* Customer view — sealed */}
        <h2 className="mt-10 flex items-center gap-2 font-display text-xl font-bold">
          <Lock size={20} className="text-brand-300" /> What the customer sees (sealed)
        </h2>
        <p className="mt-1 text-sm text-white/50">
          The shape of the trip — never the place.{" "}
          {leakSafe
            ? <span className="text-mint-300">✓ leak-check passed</span>
            : <span className="text-rose-300">⚠ leak detected</span>}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {sealed.map((s, i) => (
            <div key={i} className="card p-5">
              <Lock size={18} className="text-brand-300" />
              <p className="mt-2 text-sm text-white/80">{s.teaser}</p>
              <p className="mt-3 tabnum font-display text-xl font-extrabold text-gradient">from {usd(s.priceFromUsd)}</p>
            </div>
          ))}
        </div>

        {/* Ops view — revealed */}
        <h2 className="mt-10 flex items-center gap-2 font-display text-xl font-bold">
          <Check size={20} className="text-mint-400" /> Ops view — revealed bundles
        </h2>
        <p className="mt-1 text-sm text-white/50">Full trip: flight + hotels + transfer + experiences.</p>
        <div className="mt-4 space-y-4">
          {bundles.map((b) => <BundleCard key={b.flight.destCode} b={b} />)}
        </div>
      </div>
    </div>
  );
}

function DealRow({ rank, d }: { rank: number; d: FlightDeal }) {
  return (
    <li className="card flex items-center gap-3 p-4">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 font-display text-sm font-bold text-white/70">{rank}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {d.destCity} <span className="text-white/45">· {d.destCountry}</span>
        </p>
        <p className="mt-0.5 text-xs text-white/55">
          {d.carrier} · {d.durationLabel} · out {d.outboundDepart}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {d.fitReasons.map((r) => (
            <span key={r} className={`rounded-full px-2 py-0.5 text-[11px] ${
              r.includes("not included") || r.includes("red-eye") || r.includes("non-refundable")
                ? "bg-rose-500/12 text-rose-200"
                : "bg-mint-400/12 text-mint-300"
            }`}>{r}</span>
          ))}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="tabnum font-display text-lg font-extrabold">{usd(d.totalPriceUsd)}</p>
        <p className="text-[11px] text-white/40">fit {d.fitScore}</p>
      </div>
    </li>
  );
}

function BundleCard({ b }: { b: Bundle }) {
  return (
    <div className="card p-5 ring-1 ring-brand-400/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-lg font-bold">{b.destCity} <span className="text-white/45">· {b.destCountry}</span></p>
          <p className="text-xs text-white/55">{b.flight.carrier} · {b.flight.durationLabel} · {b.flight.carryOnIncluded ? "carry-on incl" : "carry-on extra"}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-white/40">all-in from</p>
          <p className="tabnum font-display text-xl font-extrabold text-gradient">{usd(b.estFromUsd)}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm">
        <Plane size={15} className="text-brand-300" /> Round-trip {usd(b.flight.totalPriceUsd)}
      </div>
      <div className="mt-2 space-y-1.5">
        {b.hotels.map((h) => (
          <div key={h.name} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm">
            <Building size={15} className="text-brand-200" />
            <span className="flex-1 truncate">{h.name}</span>
            <span className="inline-flex items-center gap-0.5 text-xs text-sun-400">
              <Star size={11} filled /> {h.guestRating}
            </span>
            <span className="tabnum text-white/70">{usd(h.totalUsd)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-white/55">
        <span className="rounded-xl border border-white/10 bg-white/5 p-2.5">Private transfer ≈ {usd(b.transferEstUsd)}</span>
        <span className="rounded-xl border border-white/10 bg-white/5 p-2.5">Experiences ≈ {usd(b.activitiesEstUsd)}</span>
      </div>
    </div>
  );
}

function Chip({ Icon, children }: { Icon: typeof Plane; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/75">
      <Icon size={13} className="text-brand-300" /> {children}
    </span>
  );
}
