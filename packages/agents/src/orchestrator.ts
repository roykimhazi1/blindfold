import type { TripParams, RunOptions } from "@sv/engine";
import { toSurpriseDeal, assertNoLeaks } from "@sv/engine";
import { createLlmClient, type LlmClient } from "./llm.ts";
import { runCopywriter } from "./copywriter.ts";
import { scheduleTrip } from "./scheduler.ts";
import type { AgentTrace, OrchestratorResult } from "./types.ts";

export interface OrchestrateOptions extends RunOptions {
  llm?: LlmClient;
}

/**
 * Orchestrate a surprise search end-to-end:
 *  1. The **Scheduler Master** (`scheduleTrip`) runs the 3 specialist agents
 *     (Flight/Hotel/Attractions) over the deterministic settlement → client-safe
 *     deals + per-agent traces.
 *  2. The **Surprise Copywriter** agent rewrites each teaser via the LLM,
 *     re-checked for destination leaks (the safe engine teaser is kept if the
 *     model leaks).
 *
 * Returns client-safe deals plus per-agent traces for the admin dashboard.
 */
export async function orchestrateDeals(
  params: TripParams,
  opts: OrchestrateOptions = {},
): Promise<OrchestratorResult> {
  const started = Date.now();
  const llm = opts.llm ?? createLlmClient();

  // [1] Scheduler Master + specialists + deterministic settlement.
  // Pass the resolved client down so the specialists reason with the same model.
  const run = await scheduleTrip(params, { ...opts, llm });
  const traces: AgentTrace[] = [...run.traces];

  // [2] Copywriter enriches each selected option's teaser (leak-guarded).
  const deals = await Promise.all(
    run.options.map(async (option, i) => {
      const { teaser, trace } = await runCopywriter(llm, option, params);
      traces.push(trace);
      const enriched = { ...option, hints: { ...option.hints, teaser } };
      assertNoLeaks(enriched.hints, option.destination); // belt-and-suspenders
      const deal = toSurpriseDeal(enriched, params);
      // Preserve the Scheduler Master's opaque id from the original redaction.
      return { ...deal, id: run.deals[i]?.id ?? deal.id };
    }),
  );

  return {
    deals,
    options: run.options,
    traces,
    diagnostics: { ...run.diagnostics, totalMs: Date.now() - started },
  };
}
