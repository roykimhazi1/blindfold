import { NextResponse } from "next/server";
import type { TripParams } from "@sv/engine";
import { sourceDeals } from "@/lib/deal-source";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/deals — runs the AI-agent orchestrator over the deal pipeline and
 * returns client-safe surprise deals (destination redacted) plus agent traces.
 * Uses mock providers + mock LLM unless ANTHROPIC_API_KEY / live keys are set.
 */
export async function POST(req: Request) {
  if (!rateLimit(clientKey(req, "deals"), 20, 60_000)) {
    return NextResponse.json({ error: "Easy there — give it a few seconds and try again." }, { status: 429 });
  }

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
    // Wizard deals are estimates: flight-led discovery over the fare cache
    // when it covers the window, the deterministic catalog pipeline otherwise.
    // Never live supplier fan-out here — the chosen finalist gets a real
    // re-quote in /api/book (see requoteOption) before any money moves.
    const { deals, traces, diagnostics, source } = await sourceDeals(params);
    return NextResponse.json({ deals, traces, diagnostics: { ...diagnostics, source } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
