import type {
  Destination,
  TripParams,
  Providers,
  FlightQuote,
  HotelQuote,
  AttractionQuote,
} from "@sv/engine";
import type { LlmClient, ToolDef } from "./llm.ts";
import { runAgent, type AgentSpec } from "./agent-runtime.ts";

// ── Specialist agents ────────────────────────────────────────────────
// Three domain specialists sit under the Scheduler Master: Flight, Hotel,
// Attractions. Each has the SAME shape — a Claude tool-use loop that searches
// its domain's inventory and picks the best fit within its budget envelope,
// finishing with a typed `submit_choice`. The model only ever *picks an
// offerId*; code owns the real quote and the price (pricing.ts). With no
// tool-capable model it falls back to a deterministic policy, so mock mode is
// reproducible and output-identical to the engine pipeline.

/**
 * The slice of the all-in budget (EUR) a specialist may spend in its domain.
 * Advisory in mock mode; a real constraint once specialists choose among live
 * offers.
 */
export interface BudgetEnvelope {
  flightsEur: number;
  hotelEur: number;
  extrasEur: number;
}

export interface FlightChoice {
  quote: FlightQuote;
  rationale: string;
}
export interface HotelChoice {
  quote: HotelQuote;
  rationale: string;
}
export interface AttractionChoice {
  quote: AttractionQuote;
  rationale: string;
}

const SUBMIT_TOOL = "submit_choice";

function submitTool(): ToolDef {
  return {
    name: SUBMIT_TOOL,
    description: "Submit the chosen option by its offerId.",
    inputSchema: {
      type: "object",
      properties: {
        offerId: { type: "string", description: "The offerId of the chosen option." },
        rationale: { type: "string", description: "One short, place-agnostic sentence on why." },
      },
      required: ["offerId"],
    },
  };
}

function searchTool(name: string, domain: string): ToolDef {
  return {
    name,
    description: `List the available ${domain} options (each has an offerId).`,
    inputSchema: { type: "object", properties: {} },
  };
}

/**
 * Shared specialist loop: given candidate quotes, let the model pick one (or use
 * the deterministic mock pick). Returns the chosen quote + a rationale. The
 * model never sees or authors the price-bearing quote object — only leak-safe
 * summaries keyed by offerId.
 */
async function runSpecialist<Q>(
  llm: LlmClient | undefined,
  cfg: {
    domain: string;
    searchToolName: string;
    system: string;
    task: string;
    quotes: Q[];
    idPrefix: string;
    summarize: (q: Q, offerId: string) => Record<string, unknown>;
    mockPick: (quotes: Q[]) => Q | null;
    rationaleFor: (q: Q) => string;
  },
): Promise<{ quote: Q; rationale: string } | null> {
  if (cfg.quotes.length === 0) return null;
  const offers = cfg.quotes.map((q, i) => ({ id: `${cfg.idPrefix}_${i}`, q }));
  const byId = new Map(offers.map((o) => [o.id, o.q] as const));

  const mock = async (): Promise<{ quote: Q; rationale: string } | null> => {
    const q = cfg.mockPick(cfg.quotes);
    return q ? { quote: q, rationale: cfg.rationaleFor(q) } : null;
  };

  const spec: AgentSpec<{ quote: Q; rationale: string }> = {
    system: cfg.system,
    task: cfg.task,
    tools: [searchTool(cfg.searchToolName, cfg.domain), submitTool()],
    executors: {
      [cfg.searchToolName]: async () =>
        JSON.stringify(offers.map((o) => cfg.summarize(o.q, o.id))),
    },
    submitToolName: SUBMIT_TOOL,
    parseSubmit: (input) => {
      const inp = (input ?? {}) as { offerId?: string; rationale?: string };
      const q = inp.offerId ? byId.get(inp.offerId) : undefined;
      if (!q) return null;
      return { quote: q, rationale: inp.rationale?.trim() || cfg.rationaleFor(q) };
    },
    mock,
  };

  return runAgent(llm ?? mockLess(), spec);
}

// A stand-in "no model" client so callers can omit llm and still get the
// deterministic policy without a null check sprawl.
function mockLess(): LlmClient {
  return { mode: "mock", async complete() { return ""; } };
}

/**
 * The offers a specialist may choose among: a provider's ranked `search` list
 * when available, otherwise its single `quote` wrapped in an array. Keeps mock
 * mode and not-yet-`search`-capable live providers working unchanged.
 */
async function offersFor<Q>(
  provider: {
    search?: (dest: Destination, params: TripParams) => Promise<Q[]>;
    quote: (dest: Destination, params: TripParams) => Promise<Q | null>;
  },
  dest: Destination,
  params: TripParams,
): Promise<Q[]> {
  if (provider.search) return provider.search(dest, params);
  const q = await provider.quote(dest, params);
  return q ? [q] : [];
}

// ── Flight ───────────────────────────────────────────────────────────
export async function chooseFlight(
  dest: Destination,
  params: TripParams,
  env: BudgetEnvelope,
  providers: Providers,
  llm?: LlmClient,
): Promise<FlightChoice | null> {
  const quotes = await offersFor(providers.flights, dest, params);
  return runSpecialist<FlightQuote>(llm, {
    domain: "flight",
    searchToolName: "search_flights",
    idPrefix: "fl",
    quotes,
    system:
      "You are the Flight specialist for a surprise-travel service. Choose the single best " +
      "round-trip within the budget envelope: prefer non-stop, civilised departure times, and " +
      "best value. Use the tools; never invent options; finish with submit_choice.",
    task:
      `Pick the best round-trip flight within €${Math.round(env.flightsEur)}. ` +
      "Call search_flights, then submit_choice with the chosen offerId.",
    summarize: (q, offerId) => ({
      offerId,
      carrier: q.carrier,
      priceEur: Math.round(q.totalPrice),
      durationHours: q.durationHours,
      outboundDepart: q.outboundDepartIso.slice(11, 16),
      inboundDepart: q.inboundDepartIso.slice(11, 16),
    }),
    mockPick: (qs) => qs.reduce((a, b) => (b.totalPrice < a.totalPrice ? b : a), qs[0]!),
    rationaleFor: (q) =>
      `Best ${q.carrier} round-trip (${q.durationHours}h each way) within the €${Math.round(env.flightsEur)} flight envelope.`,
  });
}

// ── Hotel ────────────────────────────────────────────────────────────
export async function chooseHotel(
  dest: Destination,
  params: TripParams,
  env: BudgetEnvelope,
  providers: Providers,
  llm?: LlmClient,
): Promise<HotelChoice | null> {
  const quotes = await offersFor(providers.hotels, dest, params);
  return runSpecialist<HotelQuote>(llm, {
    domain: "hotel",
    searchToolName: "search_hotels",
    idPrefix: "ho",
    quotes,
    system:
      "You are the Hotel specialist for a surprise-travel service. Choose the best-value stay that " +
      "meets the star/board floor within the budget envelope. Use the tools; finish with submit_choice.",
    task:
      `Pick the best stay within €${Math.round(env.hotelEur)}. ` +
      "Call search_hotels, then submit_choice with the chosen offerId.",
    summarize: (q, offerId) => ({
      offerId,
      stars: q.stars,
      board: q.board,
      nights: q.nights,
      priceEur: Math.round(q.totalPrice),
    }),
    mockPick: (qs) => qs.reduce((a, b) => (b.totalPrice < a.totalPrice ? b : a), qs[0]!),
    rationaleFor: (q) =>
      `${q.stars}★ ${q.board.replace("_", " ")} stay for ${q.nights} nights within the €${Math.round(env.hotelEur)} hotel envelope.`,
  });
}

// ── Attractions ──────────────────────────────────────────────────────
export async function chooseAttractions(
  dest: Destination,
  params: TripParams,
  env: BudgetEnvelope,
  providers: Providers,
  llm?: LlmClient,
): Promise<AttractionChoice | null> {
  const quotes = await offersFor(providers.attractions, dest, params);
  return runSpecialist<AttractionQuote>(llm, {
    domain: "attractions",
    searchToolName: "search_activities",
    idPrefix: "at",
    quotes,
    system:
      "You are the Attractions specialist for a surprise-travel service. Curate the experience set " +
      "that best matches the requested vibe within the budget envelope. Use the tools; finish with " +
      "submit_choice. Never reveal place names.",
    task:
      `Curate experiences within €${Math.round(env.extrasEur)}. ` +
      "Call search_activities, then submit_choice with the chosen offerId.",
    // Leak-safe: expose only the count + price, never the item names (landmarks).
    summarize: (q, offerId) => ({
      offerId,
      experiences: q.items.length,
      priceEur: Math.round(q.totalPrice),
    }),
    mockPick: (qs) => qs[0] ?? null,
    rationaleFor: (q) =>
      `${q.items.length} experiences matched to the requested vibe within the €${Math.round(env.extrasEur)} extras envelope.`,
  });
}

// Deterministic split of the all-in EUR ceiling across the three domains. The
// Scheduler Master hands each specialist its slice; tighten these in the
// negotiation loop when a bundle overshoots the budget.
export const ENVELOPE_SPLIT = { flights: 0.55, hotel: 0.35, extras: 0.1 } as const;

export function allocateEnvelope(ceilingEur: number): BudgetEnvelope {
  return {
    flightsEur: ceilingEur * ENVELOPE_SPLIT.flights,
    hotelEur: ceilingEur * ENVELOPE_SPLIT.hotel,
    extrasEur: ceilingEur * ENVELOPE_SPLIT.extras,
  };
}
