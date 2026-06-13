import type {
  TripParams,
  Providers,
  PricingConfig,
  Destination,
  ScoredOption,
  SurpriseDeal,
  PricedComponents,
} from "./types.ts";
import { activeDestinations } from "./catalog.ts";
import { filterCandidates } from "./filters.ts";
import { getProviders } from "./providers/index.ts";
import {
  DEFAULT_PRICING,
  priceBundle,
  budgetCeilingEur,
  fitsBudget,
  convertFromEur,
} from "./pricing.ts";
import { scoreOption, selectDiverse } from "./scoring.ts";
import { buildHints, assertNoLeaks } from "./hints.ts";
import { partySize, hashString, isRedeye } from "./util.ts";

export interface RunOptions {
  providers?: Providers;
  pricing?: PricingConfig;
  catalog?: Destination[];
  /** How many surprise options to return. */
  count?: number;
}

export interface RunResult {
  deals: SurpriseDeal[];
  /** Full server-side detail (never sent to the client pre-booking). */
  options: ScoredOption[];
  diagnostics: {
    candidates: number;
    priced: number;
    inBudget: number;
  };
}

/**
 * The deterministic spine of the deal suggester. The AI-agent layer wraps this
 * (agents *find* components & copy; this function does the filtering, the math,
 * the ranking, and the leak-safe redaction).
 *
 * Stages: candidates → price components → budget fit → score → pick N diverse
 * → build hints (+ leak-check) → redact to client-safe SurpriseDeal.
 */
export async function runDealPipeline(
  params: TripParams,
  opts: RunOptions = {},
): Promise<RunResult> {
  const providers = opts.providers ?? getProviders();
  const pricing = opts.pricing ?? DEFAULT_PRICING;
  const catalog = opts.catalog ?? activeDestinations();
  const count = opts.count ?? 3;

  const pax = partySize(params.travelers.adults, params.travelers.childrenAges);
  const ceilingEur = budgetCeilingEur(params.budget, pax);

  // [1] Candidates
  const candidates = filterCandidates(catalog, params);

  // [2] Price components (in parallel per candidate)
  const priced: ScoredOption[] = [];
  await Promise.all(
    candidates.map(async (dest) => {
      const [flight, hotel, transfer, attractions] = await Promise.all([
        providers.flights.quote(dest, params),
        providers.hotels.quote(dest, params),
        providers.transfers.quote(dest, params),
        providers.attractions.quote(dest, params),
      ]);
      if (!flight || !hotel || !transfer || !attractions) return;

      // Honor "no harsh red-eyes". (directOnly needs no work here — every mock
      // flight is a single non-stop leg, so it's already direct; the flag is
      // reserved for live, multi-leg providers.)
      if (params.constraints?.avoidRedeye &&
          isRedeye(flight.outboundDepartIso, flight.inboundDepartIso)) return;

      const components: PricedComponents = { flight, hotel, transfer, attractions };
      const breakdown = priceBundle(components, pricing);

      // [3] Budget fit
      if (!fitsBudget(breakdown.total, ceilingEur, pricing)) return;

      // [4] Score
      const score = scoreOption(dest, params, components, breakdown, ceilingEur);
      const hints = buildHints(dest, params, components);
      assertNoLeaks(hints, dest); // [6 guardrail] never leak the destination

      priced.push({ destination: dest, components, breakdown, score, hints });
    }),
  );

  // [5] Diversity selection → top N
  const selected = selectDiverse(priced, count);

  // [6] Redact to client-safe deals
  const deals: SurpriseDeal[] = selected.map((o) => toSurpriseDeal(o, params));

  return {
    deals,
    options: selected,
    diagnostics: {
      candidates: candidates.length,
      priced: priced.length,
      inBudget: priced.length,
    },
  };
}

/** Strip everything that could reveal the destination; convert price for display. */
export function toSurpriseDeal(o: ScoredOption, params: TripParams): SurpriseDeal {
  const currency = params.budget.currency;
  const board = o.components.hotel.board.replace("_", " ");
  return {
    id: dealId(o, params),
    hints: o.hints,
    priceTotal: convertFromEur(o.breakdown.total, currency),
    currency,
    includes: [
      `Flights there and back (about ${o.components.flight.durationHours.toFixed(1)}h each way)`,
      `${o.components.hotel.nights} nights · ${o.components.hotel.stars}★ · ${board}`,
      `A driver waiting when you land — they know the hotel, you don't yet`,
      `${o.components.attractions.items.length} things to do, picked for you`,
    ],
  };
}

/** Stable, opaque id for a deal that doesn't reveal the destination. */
export function dealId(o: ScoredOption, params: TripParams): string {
  const seed = `${o.destination.id}:${params.dates.start}:${params.budget.amount}`;
  return "sd_" + hashString(seed).toString(36);
}
