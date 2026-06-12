import type {
  TripParams,
  Providers,
  PricingConfig,
  ScoredOption,
  PricedComponents,
  FlightQuote,
  Destination,
} from "./types.ts";
import { findDestinationByAirport } from "./catalog.ts";
import { filterCandidates } from "./filters.ts";
import { mockProviders } from "./providers/mock.ts";
import { DEFAULT_PRICING, priceBundle, budgetCeilingEur, fitsBudget } from "./pricing.ts";
import { scoreOption, selectDiverse } from "./scoring.ts";
import { buildHints, assertNoLeaks } from "./hints.ts";
import { partySize, round2 } from "./util.ts";
import { toSurpriseDeal, type RunResult } from "./pipeline.ts";

// ── Discovery pipeline (flight-led, cache-served — Phase C) ──────────
// Flights lead everything: the candidate set is *whatever the fare cache says
// is actually cheap to fly to right now*, not the catalog order. Each cached
// fare names a destination; the rest of the bundle (hotel ESTIMATE, curated or
// generic activities, transfer) hangs off that flight, and the same code-owned
// settlement (pricing → budget fit → score → diversity → leak-check → redact)
// runs as in the catalog pipeline. Live rates arrive later, at the checkout
// re-quote — this path never calls a supplier.

/** One row of the `destination_fares` cache (engine-side shape, EUR). */
export interface CachedFare {
  airport: string;
  departDate: string; // YYYY-MM-DD
  nights: number;
  /** Cheapest round-trip total for the probe party (2 adults), in EUR. */
  totalEur: number;
  carrier?: string;
  direct?: boolean;
  durationHours?: number;
  expiresAt?: string; // ISO; expired rows are ignored
}

export interface DiscoveryOptions {
  providers?: Providers;
  pricing?: PricingConfig;
  count?: number;
  /** "now" for fare-expiry checks (tests inject a fixed clock). */
  nowMs?: number;
}

export type DiscoveryResult = RunResult & {
  diagnostics: RunResult["diagnostics"] & { fares: number };
};

/** Flights lead: a fare that eats more than this share of the all-in budget
 *  leaves no room for the stay (mirrors the 55% flight envelope + slack). */
const FLIGHT_BUDGET_SHARE = 0.6;

/** How well this flight fits, 0..1 — nonstop, short, and cheap win. The
 *  finder spike's ranking, distilled (stops/duration/price; carry-on joins
 *  when the cache learns baggage). */
function flightFit(fare: CachedFare, flightTotalEur: number, ceilingEur: number): number {
  const direct = fare.direct === false ? 0 : 0.5;
  const hours = fare.durationHours ?? 3;
  const duration = Math.max(0, 1 - hours / 8) * 0.2;
  const flightCeil = ceilingEur * FLIGHT_BUDGET_SHARE;
  const headroom = Math.max(0, (flightCeil - flightTotalEur) / flightCeil) * 0.3;
  return round2(direct + duration + headroom);
}

function fareToFlightQuote(dest: Destination, fare: CachedFare, params: TripParams, pax: number): FlightQuote {
  // The cache stores a 2-adult probe total; scale to the real party. Times are
  // synthesized on the user's dates — the checkout re-quote replaces this with
  // a real, bookable offer before any money moves.
  const perPax = fare.totalEur / 2;
  const returnDate = (() => {
    const d = new Date(params.dates.start + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + params.dates.nights);
    return d.toISOString().slice(0, 10);
  })();
  return {
    destinationId: dest.id,
    carrier: fare.carrier ?? "TBC",
    outboundDepartIso: `${params.dates.start}T08:30:00`,
    inboundDepartIso: `${returnDate}T18:30:00`,
    durationHours: fare.durationHours ?? dest.flightHoursFrom[params.departureAirport] ?? 3,
    totalPrice: round2(perPax * pax),
  };
}

/**
 * Run discovery over a set of cached fares. Pure of I/O: the caller loads the
 * fares (Supabase in the app, a fixture in tests). Returns the same shape as
 * `runDealPipeline`, so deal ids, redaction, and the booking recovery path all
 * behave identically — only the candidate source differs.
 */
export async function runDiscoveryPipeline(
  params: TripParams,
  fares: CachedFare[],
  opts: DiscoveryOptions = {},
): Promise<DiscoveryResult> {
  // Estimates by design: the wizard prices from the cache + heuristics. Live
  // supplier calls happen only for the chosen finalist (requoteOption).
  const providers = opts.providers ?? mockProviders;
  const pricing = opts.pricing ?? DEFAULT_PRICING;
  const count = opts.count ?? 3;
  const nowMs = opts.nowMs ?? Date.now();

  const pax = partySize(params.travelers.adults, params.travelers.childrenAges);
  const ceilingEur = budgetCeilingEur(params.budget, pax);

  // [1] Usable fares: right trip length, not expired, cheapest per airport.
  const byAirport = new Map<string, CachedFare>();
  for (const f of fares) {
    if (f.nights !== params.dates.nights) continue;
    if (f.expiresAt && Date.parse(f.expiresAt) < nowMs) continue;
    const seen = byAirport.get(f.airport);
    if (!seen || f.totalEur < seen.totalEur) byAirport.set(f.airport, f);
  }

  // [2] Flight-led candidates: a fare names a destination; the usual hard
  //     gates (visa, hours, avoided regions, temperature) still apply.
  const reachable: Destination[] = [];
  const fareByDestId = new Map<string, CachedFare>();
  for (const [airport, fare] of byAirport) {
    const dest = findDestinationByAirport(airport);
    if (!dest) continue;
    reachable.push(dest);
    fareByDestId.set(dest.id, fare);
  }
  const candidates = filterCandidates(reachable, params).filter((dest) => {
    if (params.constraints?.directOnly && fareByDestId.get(dest.id)?.direct === false) return false;
    return true;
  });

  // [3] Build bundles off each flight (hotel estimate + activities + transfer).
  const priced: ScoredOption[] = [];
  await Promise.all(
    candidates.map(async (dest) => {
      const fare = fareByDestId.get(dest.id)!;
      const flight = fareToFlightQuote(dest, fare, params, pax);

      // Flights lead: a fare that swallows the budget can't anchor a bundle.
      if (flight.totalPrice > ceilingEur * FLIGHT_BUDGET_SHARE) return;

      const [hotel, transfer, attractions] = await Promise.all([
        providers.hotels.quote(dest, params),
        providers.transfers.quote(dest, params),
        providers.attractions.quote(dest, params),
      ]);
      if (!hotel || !transfer || !attractions) return;

      const components: PricedComponents = { flight, hotel, transfer, attractions };
      const breakdown = priceBundle(components, pricing);
      if (!fitsBudget(breakdown.total, ceilingEur, pricing)) return;

      // [4] Score: the shared blended ranking, tilted by how good the flight is.
      const base = scoreOption(dest, params, components, breakdown, ceilingEur);
      const score = Number((0.9 * base + 0.1 * flightFit(fare, flight.totalPrice, ceilingEur)).toFixed(4));

      const hints = buildHints(dest, params, components);
      assertNoLeaks(hints, dest);
      priced.push({ destination: dest, components, breakdown, score, hints });
    }),
  );

  // [5] Diversity → [6] redact. Same as the catalog pipeline.
  const selected = selectDiverse(priced, count);
  return {
    deals: selected.map((o) => toSurpriseDeal(o, params)),
    options: selected,
    diagnostics: {
      fares: fares.length,
      candidates: candidates.length,
      priced: priced.length,
      inBudget: priced.length,
    },
  };
}
