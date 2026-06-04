import type { Providers } from "../types.ts";
import { mockProviders } from "./mock.ts";

// Provider mode selector. The pipeline talks to one `Providers` interface; the
// concrete source is swapped here. Real flight/hotel adapters (Duffel, Hotelbeds,
// transfer partners) drop in behind `sandbox`/`live` without touching the engine.
export type ProviderMode = "mock" | "sandbox" | "live";

let warnedFallback = false;

export function resolveMode(explicit?: ProviderMode): ProviderMode {
  if (explicit) return explicit;
  const env = typeof process !== "undefined" ? process.env?.PROVIDER_MODE : undefined;
  if (env === "sandbox" || env === "live") return env;
  return "mock";
}

/**
 * Return the provider set for a mode. `sandbox`/`live` are wired for real
 * adapters; until their API keys are configured they transparently fall back to
 * the deterministic mock set so the product keeps working with no credentials.
 */
export function getProviders(mode?: ProviderMode): Providers {
  const resolved = resolveMode(mode);
  if (resolved === "mock") return mockProviders;

  if (!hasLiveCredentials()) {
    if (!warnedFallback && typeof console !== "undefined") {
      warnedFallback = true;
      console.warn(`[providers] mode="${resolved}" requested but no API keys set — using mock providers.`);
    }
    return mockProviders;
  }
  // Real adapters land here (Duffel flights, Hotelbeds hotels, transfer partners).
  return mockProviders;
}

function hasLiveCredentials(): boolean {
  if (typeof process === "undefined") return false;
  return Boolean(process.env?.DUFFEL_API_KEY || process.env?.HOTELBEDS_API_KEY);
}

export { mockProviders };
