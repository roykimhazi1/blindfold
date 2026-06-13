import type { ScoredOption, TripParams } from "@sv/engine";
import { selectDiverse } from "@sv/engine";
import type { LlmClient } from "./llm.ts";
import type { AgentTrace } from "./types.ts";

// ── Master planner (C3) ──────────────────────────────────────────────
// The Scheduler Master's *judgment* step. The engine has already priced every
// candidate, kept only the in-budget ones, and leak-checked the hints — so the
// planner only ever CHOOSES AMONG safe, valid options. It can never produce an
// over-budget or leaky result; it just brings taste the numeric score can't:
// which three feel like the best surprise for *this* trip (occasion, vibe,
// genuine variety, delight), and why.
//
// Degrades cleanly: in mock mode (no API key) or on any model hiccup it falls
// back to the deterministic `selectDiverse`, so the product — and the tests —
// behave exactly as before without a key.

export interface PlanResult {
  selected: ScoredOption[];
  /** Per-pick one-liner ("why this one"), index-aligned with `selected`. */
  rationales: string[];
  trace: AgentTrace;
}

const SYSTEM = `You are the trip-planning master for a surprise-vacation app.
You'll get a numbered list of fully-priced, in-budget candidate trips, described
ONLY in the abstract (climate, vibe, hotel stars, flight length, price) — never
a place name. Pick the {COUNT} that make the best SET of surprises for this
traveller: lean into their occasion and vibe, and make the three feel genuinely
different from each other (don't pick three near-identical trips). Prefer
variety in feel over rock-bottom price.

Reply with ONLY a JSON object, no prose:
{"picks":[{"i":<index>,"why":"<≤8 words, no place names>"}]}
Exactly {COUNT} picks, each "i" from the list, no repeats.`;

interface Pick {
  i: number;
  why: string;
}

/** Leak-safe one-line summary of an option for the planner (no place names). */
function summarize(o: ScoredOption, i: number): string {
  const h = o.hints;
  const price = Math.round(o.breakdown.total);
  return (
    `${i}: ${h.climateBand}, ${h.vibeTags.slice(0, 3).join("/")}, ` +
    `${h.starBand}★, ${h.flightBand} flight, ~€${price}` +
    (h.region ? `, region ${h.region}` : "")
  );
}

function parsePicks(raw: string, count: number, max: number): Pick[] | null {
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    const parsed = JSON.parse(raw.slice(start, end + 1)) as { picks?: Pick[] };
    const picks = parsed.picks;
    if (!Array.isArray(picks) || picks.length === 0) return null;

    const seen = new Set<number>();
    const clean: Pick[] = [];
    for (const p of picks) {
      const i = Number(p?.i);
      if (!Number.isInteger(i) || i < 0 || i >= max || seen.has(i)) continue;
      seen.add(i);
      clean.push({ i, why: typeof p.why === "string" ? p.why.trim().slice(0, 60) : "" });
      if (clean.length >= count) break;
    }
    return clean.length > 0 ? clean : null;
  } catch {
    return null;
  }
}

function fallbackTrace(started: number, mode: LlmClient["mode"], note: string): AgentTrace {
  return {
    agent: "orchestrator",
    status: "fallback",
    mode,
    durationMs: Date.now() - started,
    summary: `Master planner: ${note} — used deterministic diversity pick`,
  };
}

/**
 * Pick the final `count` options. Uses the LLM master when available, then
 * tops up from the deterministic diverse order if the model returned too few,
 * so the result is always exactly `min(count, priced.length)` options.
 */
export async function planSelection(
  priced: ScoredOption[],
  params: TripParams,
  llm: LlmClient,
  count: number,
): Promise<PlanResult> {
  const started = Date.now();
  const diverse = selectDiverse(priced, count);

  // No model, or nothing meaningful to choose between → deterministic.
  if (llm.mode !== "anthropic" || priced.length <= count) {
    return {
      selected: diverse,
      rationales: diverse.map(() => ""),
      trace: {
        agent: "orchestrator",
        status: "ok",
        mode: llm.mode,
        durationMs: Date.now() - started,
        summary:
          llm.mode === "anthropic"
            ? `Master planner: ${priced.length} candidates ≤ ${count} — kept them all`
            : `Master planner: deterministic diversity pick of ${diverse.length}`,
      },
    };
  }

  // Bound the prompt: the model chooses among the strongest ~12 by score.
  const shortlist = [...priced].sort((a, b) => b.score - a.score).slice(0, 12);
  const occasion = params.occasion ? `Occasion: ${params.occasion}. ` : "";
  const vibe = params.vibe?.types?.length ? `Wants: ${params.vibe.types.join(", ")}. ` : "";
  const system = SYSTEM.replaceAll("{COUNT}", String(count));

  let picks: Pick[] | null = null;
  try {
    const raw = await llm.complete({
      system,
      messages: [
        {
          role: "user",
          content: `${occasion}${vibe}\nCandidates:\n${shortlist.map((o, i) => summarize(o, i)).join("\n")}`,
        },
      ],
      maxTokens: 300,
      mockHint: "",
    });
    picks = parsePicks(raw, count, shortlist.length);
  } catch {
    picks = null;
  }

  if (!picks) {
    return { selected: diverse, rationales: diverse.map(() => ""), trace: fallbackTrace(started, llm.mode, "no usable pick") };
  }

  // Map picks → options, then top up from the diverse order if short.
  const selected: ScoredOption[] = [];
  const rationales: string[] = [];
  const used = new Set<ScoredOption>();
  for (const p of picks) {
    const o = shortlist[p.i]!;
    if (used.has(o)) continue;
    used.add(o);
    selected.push(o);
    rationales.push(p.why);
  }
  for (const o of diverse) {
    if (selected.length >= count) break;
    if (!used.has(o)) {
      used.add(o);
      selected.push(o);
      rationales.push("");
    }
  }

  return {
    selected: selected.slice(0, count),
    rationales: rationales.slice(0, count),
    trace: {
      agent: "orchestrator",
      status: "ok",
      mode: llm.mode,
      durationMs: Date.now() - started,
      summary: `Master planner chose ${selected.length} of ${shortlist.length} by taste (occasion/vibe/variety)`,
    },
  };
}
