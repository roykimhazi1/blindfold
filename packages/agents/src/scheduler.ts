import type {
  TripParams,
  RunOptions,
  ScoredOption,
  SurpriseDeal,
  PricedComponents,
} from "@sv/engine";
import {
  activeDestinations,
  filterCandidates,
  getProviders,
  DEFAULT_PRICING,
  priceBundle,
  budgetCeilingEur,
  fitsBudget,
  scoreOption,
  selectDiverse,
  buildHints,
  assertNoLeaks,
  toSurpriseDeal,
} from "@sv/engine";
import type { LlmClient } from "./llm.ts";
import type { AgentTrace, OrchestratorResult } from "./types.ts";
import {
  allocateEnvelope,
  chooseFlight,
  chooseHotel,
  chooseAttractions,
  type BudgetEnvelope,
} from "./specialists.ts";

export interface ScheduleOptions extends RunOptions {
  /** Reserved for the LLM tool-use path; unused in mock mode. */
  llm?: LlmClient;
}

/**
 * Scheduler Master — the orchestrator in the orchestrator–workers pattern.
 *
 * Deterministic coordinator (no LLM in the money or coordination path):
 *   shortlist destinations → allocate a per-domain budget envelope → dispatch
 *   the 3 specialist agents (Flight/Hotel/Attractions) in parallel per candidate
 *   → assemble the bundle → hand to the engine's deterministic settlement
 *   (price → budget fit → score → select diverse → hints + leak-check).
 *
 * In mock mode this is output-identical to `runDealPipeline` (the specialists
 * wrap the same providers); what changes is the architecture and the per-agent
 * traces. The LLM tool-use loop drops into the specialists later without
 * touching this master or the settlement it relies on.
 */
export async function scheduleTrip(
  params: TripParams,
  opts: ScheduleOptions = {},
): Promise<OrchestratorResult> {
  const started = Date.now();
  const providers = opts.providers ?? getProviders();
  const pricing = opts.pricing ?? DEFAULT_PRICING;
  const catalog = opts.catalog ?? activeDestinations();
  const count = opts.count ?? 3;

  const pax = params.travelers.adults + params.travelers.childrenAges.length;
  const ceilingEur = budgetCeilingEur(params.budget, pax);
  const envelope = allocateEnvelope(ceilingEur);

  // [destination-scout] shortlist reachable, on-constraint cities.
  const candidates = filterCandidates(catalog, params);

  // [specialists] dispatch the 3 domain agents per candidate, in parallel.
  // (Transfer stays a plain provider call — it isn't one of the 3 agents.)
  const priced: ScoredOption[] = [];
  await Promise.all(
    candidates.map(async (dest) => {
      const [flight, hotel, attractions, transfer] = await Promise.all([
        chooseFlight(dest, params, envelope, providers, opts.llm),
        chooseHotel(dest, params, envelope, providers, opts.llm),
        chooseAttractions(dest, params, envelope, providers, opts.llm),
        providers.transfers.quote(dest, params),
      ]);
      if (!flight || !hotel || !attractions || !transfer) return;

      const components: PricedComponents = {
        flight: flight.quote,
        hotel: hotel.quote,
        transfer,
        attractions: attractions.quote,
      };

      // [settlement] deterministic, code-owned — the source of truth for $$.
      const breakdown = priceBundle(components, pricing);
      if (!fitsBudget(breakdown.total, ceilingEur, pricing)) return; // [budget-optimizer]

      const score = scoreOption(dest, params, components, breakdown, ceilingEur);
      const hints = buildHints(dest, params, components);
      assertNoLeaks(hints, dest); // never leak the destination
      priced.push({ destination: dest, components, breakdown, score, hints });
    }),
  );

  // [select] top N diverse → redact to client-safe deals.
  const selected = selectDiverse(priced, count);
  const deals: SurpriseDeal[] = selected.map((o) => toSurpriseDeal(o, params));

  return {
    deals,
    options: selected,
    traces: buildTraces({
      candidates: candidates.length,
      priced: priced.length,
      selected: selected.length,
      envelope,
      started,
    }),
    diagnostics: {
      candidates: candidates.length,
      priced: priced.length,
      inBudget: priced.length,
      totalMs: Date.now() - started,
    },
  };
}

function buildTraces(x: {
  candidates: number;
  priced: number;
  selected: number;
  envelope: BudgetEnvelope;
  started: number;
}): AgentTrace[] {
  const ms = Date.now() - x.started;
  const fl = Math.round(x.envelope.flightsEur);
  const ho = Math.round(x.envelope.hotelEur);
  const ex = Math.round(x.envelope.extrasEur);
  const t = (
    agent: AgentTrace["agent"],
    summary: string,
  ): AgentTrace => ({ agent, status: "ok", mode: "mock", durationMs: ms, summary });

  return [
    t("orchestrator", `Scheduler Master ran ${x.candidates} candidates (envelope €${fl}/€${ho}/€${ex}) → selected ${x.selected}`),
    t("destination-scout", `Shortlisted ${x.candidates} reachable, on-constraint cities`),
    t("flight-agent", `Chose the best round-trip per city within €${fl}`),
    t("hotel-agent", `Chose stays within €${ho}`),
    t("attraction-curator", `Curated experiences within €${ex}`),
    t("budget-optimizer", `${x.priced}/${x.candidates} fit the all-in budget`),
  ];
}
