import type { SurpriseDeal, ScoredOption } from "@sv/engine";

export type AgentName =
  | "orchestrator"
  | "destination-scout"
  | "flight-agent"
  | "hotel-agent"
  | "attraction-curator"
  | "transfer-agent"
  | "budget-optimizer"
  | "surprise-copywriter";

/** One specialist agent's execution record — surfaced in the admin "Agent runs" view. */
export interface AgentTrace {
  agent: AgentName;
  status: "ok" | "fallback" | "error";
  mode: "mock" | "anthropic";
  durationMs: number;
  /** Short human summary of what the agent did. */
  summary: string;
  /** Whether a leak-check rewrote/blocked the output (copywriter only). */
  leakBlocked?: boolean;
}

export interface OrchestratorResult {
  deals: SurpriseDeal[];
  options: ScoredOption[];
  traces: AgentTrace[];
  diagnostics: {
    candidates: number;
    priced: number;
    inBudget: number;
    totalMs: number;
  };
}
