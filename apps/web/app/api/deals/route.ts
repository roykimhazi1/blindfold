import { NextResponse } from "next/server";
import type { TripParams } from "@sv/engine";
import { orchestrateDeals } from "@sv/agents";

export const runtime = "nodejs";

/**
 * POST /api/deals — runs the AI-agent orchestrator over the deal pipeline and
 * returns client-safe surprise deals (destination redacted) plus agent traces.
 * Uses mock providers + mock LLM unless ANTHROPIC_API_KEY / live keys are set.
 */
export async function POST(req: Request) {
  let params: TripParams;
  try {
    params = (await req.json()) as TripParams;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!params?.budget || !params?.dates || !params?.travelers || !params?.departureAirport) {
    return NextResponse.json(
      { error: "Missing required params: budget, dates, travelers, departureAirport" },
      { status: 422 },
    );
  }

  try {
    const { deals, traces, diagnostics } = await orchestrateDeals(params);
    return NextResponse.json({ deals, traces, diagnostics });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
