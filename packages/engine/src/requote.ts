import type { TripParams, ScoredOption, SurpriseDeal, PricedComponents, PricingConfig, Providers } from "./types.ts";
import { getProviders, resolveMode, type ProviderMode } from "./providers/index.ts";
import { priceBundle, DEFAULT_PRICING } from "./pricing.ts";
import { toSurpriseDeal } from "./pipeline.ts";

export interface RequoteResult {
  option: ScoredOption;
  deal: SurpriseDeal;
  /** True when a live supplier answered (vs. the deterministic mock). */
  live: boolean;
}

export interface RequoteOptions {
  providers?: Providers;
  mode?: ProviderMode;
  pricing?: PricingConfig;
}

/**
 * Re-quote a single chosen finalist against the live suppliers — fresh Duffel
 * flight offer first (flights lead), then the Stays rate — and re-settle the
 * price with the same code-owned math the pipeline uses. The wizard's deals
 * stay cheap deterministic estimates; only the option the user is about to pay
 * for hits the suppliers. In mock mode this returns the option unchanged, so
 * the price-delta confirm in /api/book stays a no-op for demos and tests.
 */
export async function requoteOption(
  option: ScoredOption,
  params: TripParams,
  opts: RequoteOptions = {},
): Promise<RequoteResult> {
  const mode = opts.mode ?? resolveMode();
  if (mode === "mock" && !opts.providers) {
    return { option, deal: toSurpriseDeal(option, params), live: false };
  }
  const providers = opts.providers ?? getProviders(mode);
  const pricing = opts.pricing ?? DEFAULT_PRICING;

  // Flights lead: the flight is re-quoted first; the stay hangs off it.
  const flight = (await providers.flights.quote(option.destination, params)) ?? option.components.flight;
  const hotel = (await providers.hotels.quote(option.destination, params)) ?? option.components.hotel;

  const components: PricedComponents = {
    ...option.components,
    flight,
    hotel,
  };
  const breakdown = priceBundle(components, pricing);
  const requoted: ScoredOption = { ...option, components, breakdown };
  const live = flight !== option.components.flight || hotel !== option.components.hotel;
  return { option: requoted, deal: toSurpriseDeal(requoted, params), live };
}
