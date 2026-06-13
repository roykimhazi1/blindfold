import type { ScoredOption, TripParams } from "@sv/engine";
import { findLeaks, findCatalogLeaks, activeDestinations } from "@sv/engine";
import type { LlmClient } from "./llm.ts";
import type { AgentTrace } from "./types.ts";

const SYSTEM = `You are the Surprise Copywriter for a mystery-vacation app.
Write a 1-2 sentence teaser that makes someone excited to book a trip to a
HIDDEN destination. You will be given only abstract hints (climate, vibe, flight
length, hotel stars). If an occasion is given (anniversary, honeymoon, birthday,
celebration, treat, getaway), let it set the emotional tone. NEVER name or imply
the country, city, airport, or any landmark — the destination is a secret.
Sound like a friend who planned the whole thing and can barely keep the secret —
not a brochure. Plain words, short sentences, no marketing-speak, no em-dash
chains, at most one exclamation mark. Under 240 characters. Output only the
teaser text.`;

/**
 * Surprise Copywriter agent. Uses the LLM to write the teaser, then runs the
 * deterministic leak-check; if the model leaks the destination, we discard its
 * output and keep the safe engine-generated teaser. (Guardrail: copy can be
 * creative, but it can never reveal the secret.)
 */
export async function runCopywriter(
  llm: LlmClient,
  option: ScoredOption,
  params: TripParams,
): Promise<{ teaser: string; trace: AgentTrace }> {
  const started = Date.now();
  const safeFallback = option.hints.teaser; // engine-built, already leak-safe
  const h = option.hints;
  const occasion = params.occasion ? `, occasion=${params.occasion}` : "";
  const userPrompt =
    `Hints: climate=${h.climateBand}, flight=${h.flightBand}, ` +
    `vibe=${h.vibeTags.join("/")}, hotel=${h.starBand} stars, ` +
    `experiences=${h.attractionCount}${h.region ? `, region=${h.region}` : ""}${occasion}.`;

  let teaser = safeFallback;
  let status: AgentTrace["status"] = "fallback";
  let leakBlocked = false;

  try {
    const out = (
      await llm.complete({
        system: SYSTEM,
        messages: [{ role: "user", content: userPrompt }],
        maxTokens: 200,
        mockHint: safeFallback,
      })
    ).trim();

    if (out && out !== safeFallback) {
      // Screen against this option's destination AND every other city we sell.
      const leaks = [
        ...findLeaks(option.destination, out),
        ...findCatalogLeaks(out, activeDestinations()),
      ];
      if (leaks.length === 0 && out.length <= 280) {
        teaser = out;
        status = "ok";
      } else {
        leakBlocked = leaks.length > 0;
      }
    }
  } catch {
    status = "error";
  }

  return {
    teaser,
    trace: {
      agent: "surprise-copywriter",
      status,
      mode: llm.mode,
      durationMs: Date.now() - started,
      summary:
        status === "ok"
          ? "Wrote a fresh leak-safe teaser"
          : leakBlocked
            ? "Model output leaked destination — kept safe fallback"
            : "Used deterministic fallback teaser",
      leakBlocked,
    },
  };
}
