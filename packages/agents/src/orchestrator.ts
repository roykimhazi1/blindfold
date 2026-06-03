import type { TripParams, RunOptions } from "@sv/engine";
import { runDealPipeline, toSurpriseDeal, assertNoLeaks } from "@sv/engine";
import { createLlmClient, type LlmClient } from "./llm.ts";
import { runCopywriter } from "./copywriter.ts";
import type { AgentTrace, OrchestratorResult } from "./types.ts";

export interface OrchestrateOptions extends RunOptions {
  llm?: LlmClient;
}

/**
 * Orchestrator agent. Runs the deterministic deal pipeline (which embeds the
 * Destination Scout / Flight / Hotel / Transfer / Attraction / Budget-Optimizer
 * specialists as pipeline stages), then delegates user-facing copy to the
 * Surprise Copywriter agent — re-checking every output for destination leaks.
 *
 * Returns client-safe deals plus per-agent traces for the admin dashboard.
 */
export async function orchestrateDeals(
  params: TripParams,
  opts: OrchestrateOptions = {},
): Promise<OrchestratorResult> {
  const started = Date.now();
  const llm = opts.llm ?? createLlmClient();
  const traces: AgentTrace[] = [];

  // [1-6] Deterministic spine: candidates → price → budget → score → select.
  const pipelineStart = Date.now();
  const run = await runDealPipeline(params, opts);
  traces.push(
    pipelineTrace("destination-scout", `Generated ${run.diagnostics.candidates} candidate cities`, pipelineStart),
    pipelineTrace("flight-agent", `Priced flights for ${run.diagnostics.candidates} cities`, pipelineStart),
    pipelineTrace("hotel-agent", `Priced hotels (star/board constraints applied)`, pipelineStart),
    pipelineTrace("transfer-agent", `Quoted airport transfers from partner rate cards`, pipelineStart),
    pipelineTrace("attraction-curator", `Matched experience bundles to vibe`, pipelineStart),
    pipelineTrace(
      "budget-optimizer",
      `${run.diagnostics.inBudget}/${run.diagnostics.candidates} fit budget; selected ${run.deals.length}`,
      pipelineStart,
    ),
  );

  // [Copywriter] Enrich each selected option's teaser via the LLM (leak-guarded).
  const deals = await Promise.all(
    run.options.map(async (option, i) => {
      const { teaser, trace } = await runCopywriter(llm, option, params);
      traces.push(trace);
      const enriched = { ...option, hints: { ...option.hints, teaser } };
      assertNoLeaks(enriched.hints, option.destination); // belt-and-suspenders
      const deal = toSurpriseDeal(enriched, params);
      // Preserve the engine's opaque id from the original redaction.
      return { ...deal, id: run.deals[i]?.id ?? deal.id };
    }),
  );

  traces.unshift({
    agent: "orchestrator",
    status: "ok",
    mode: llm.mode,
    durationMs: Date.now() - started,
    summary: `Ran ${run.diagnostics.candidates} candidates → ${deals.length} surprise deals`,
  });

  return {
    deals,
    options: run.options,
    traces,
    diagnostics: { ...run.diagnostics, totalMs: Date.now() - started },
  };
}

function pipelineTrace(
  agent: AgentTrace["agent"],
  summary: string,
  start: number,
): AgentTrace {
  return {
    agent,
    status: "ok",
    mode: "mock",
    durationMs: Date.now() - start,
    summary,
  };
}
