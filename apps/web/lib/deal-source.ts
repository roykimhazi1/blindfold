import "server-only";
import type { TripParams, SurpriseDeal, ScoredOption } from "@sv/engine";
import { runDiscoveryPipeline, mockProviders } from "@sv/engine";
import { orchestrateDeals, type AgentTrace } from "@sv/agents";
import { loadFaresForWindow } from "@/lib/fares";

// ── Deal source router ───────────────────────────────────────────────
// One place decides where deals come from, so generation (/api/deals) and
// booking recovery (/api/book, the Stripe webhook) always agree on deal ids:
//
//   discovery-cache  — flight-led discovery over the destination_fares cache,
//                      when it covers the requested window well enough;
//   catalog-agents   — the deterministic catalog pipeline + agent layer
//                      (mock estimates), the always-available fallback.

const MIN_DISCOVERY_AIRPORTS = 6;

export type DealSource = "discovery-cache" | "catalog-agents";

export interface SourcedDeals {
  deals: SurpriseDeal[];
  options: ScoredOption[];
  traces: AgentTrace[];
  diagnostics: Record<string, number>;
  source: DealSource;
}

export async function sourceDeals(params: TripParams): Promise<SourcedDeals> {
  const fares = await loadFaresForWindow(params);
  const airports = new Set(fares.map((f) => f.airport)).size;

  if (airports >= MIN_DISCOVERY_AIRPORTS) {
    const res = await runDiscoveryPipeline(params, fares);
    if (res.deals.length > 0) {
      const trace: AgentTrace = {
        agent: "destination-scout",
        status: "ok",
        mode: "mock",
        durationMs: 0,
        summary: `Discovery served ${res.deals.length} of ${res.diagnostics.candidates} cached-fare candidates (${airports} airports in window)`,
      };
      return {
        deals: res.deals,
        options: res.options,
        traces: [trace],
        diagnostics: { ...res.diagnostics, airportsInWindow: airports },
        source: "discovery-cache",
      };
    }
  }

  // Fallback: deterministic catalog estimates through the agent layer.
  const run = await orchestrateDeals(params, { providers: mockProviders });
  return {
    deals: run.deals,
    options: run.options,
    traces: run.traces,
    diagnostics: { ...run.diagnostics },
    source: "catalog-agents",
  };
}

/**
 * Find the option behind a deal id the user was shown. Tries the current
 * primary source first; if the cache shifted under the user (their deal came
 * from the other source), tries the catalog path too before giving up.
 */
export async function recoverDeal(
  params: TripParams,
  dealId: string,
): Promise<{ deal: SurpriseDeal; option: ScoredOption; source: DealSource } | null> {
  const primary = await sourceDeals(params);
  const idx = primary.deals.findIndex((d) => d.id === dealId);
  if (idx >= 0 && primary.options[idx]) {
    return { deal: primary.deals[idx]!, option: primary.options[idx]!, source: primary.source };
  }

  if (primary.source === "discovery-cache") {
    const fallback = await orchestrateDeals(params, { providers: mockProviders });
    const j = fallback.deals.findIndex((d) => d.id === dealId);
    if (j >= 0 && fallback.options[j]) {
      return { deal: fallback.deals[j]!, option: fallback.options[j]!, source: "catalog-agents" };
    }
  }
  return null;
}
