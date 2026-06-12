// Public surface of the deal engine.
export * from "./types.ts";
export { CATALOG, activeDestinations, findDestination } from "./catalog.ts";
export { filterCandidates } from "./filters.ts";
export { mockProviders } from "./providers/mock.ts";
export { getProviders, resolveMode, type ProviderMode } from "./providers/index.ts";
export {
  DEFAULT_PRICING,
  priceBundle,
  budgetCeilingEur,
  fitsBudget,
  convertFromEur,
} from "./pricing.ts";
export { scoreOption, selectDiverse } from "./scoring.ts";
export {
  buildHints,
  findLeaks,
  findCatalogLeaks,
  assertNoLeaks,
  climateBand,
  flightBand,
} from "./hints.ts";
export {
  runDealPipeline,
  toSurpriseDeal,
  dealId,
  type RunOptions,
  type RunResult,
} from "./pipeline.ts";
export {
  bookBundle,
  mockFulfillment,
  mockBooker,
  type Fulfillment,
  type DomainBooker,
  type SupplierOrder,
  type BookingResult,
  type BookingDomain,
  type BookInput,
} from "./fulfillment.ts";
export { getFulfillment, duffelFulfillment, toDuffelOrderPassenger } from "./fulfillment-duffel.ts";
export { requoteOption, type RequoteResult, type RequoteOptions } from "./requote.ts";
export {
  REVEAL_ORDER,
  stageRank,
  stageAtLeast,
  buildSchedule,
  stageAt,
  msToNextStage,
  type RevealStage,
  type RevealSchedule,
} from "./reveal.ts";

import type { TripParams } from "./types.ts";

/** Convenience: a sensible express-path TripParams for demos/tests. */
export function exampleParams(overrides: Partial<TripParams> = {}): TripParams {
  return {
    budget: { amount: 1700, currency: "EUR", perPerson: false },
    dates: { mode: "flexible", start: "2026-07-10", nights: 4, flexDays: 3 },
    travelers: { adults: 2, childrenAges: [], partyType: "couple" },
    departureAirport: "TLV",
    ...overrides,
  };
}
