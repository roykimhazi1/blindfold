import type {
  PricedComponents,
  PriceBreakdown,
  PricingConfig,
  Budget,
  Currency,
} from "./types.ts";
import { round2 } from "./util.ts";

export const DEFAULT_PRICING: PricingConfig = {
  marginRate: 0.18,
  serviceFee: 39,
  budgetBuffer: 0.05,
};

// Display FX from EUR base. Real app pulls live rates; this is a stable stub.
const FX_FROM_EUR: Record<Currency, number> = {
  EUR: 1,
  USD: 1.08,
  ILS: 4.05,
};

export function convertFromEur(amountEur: number, to: Currency): number {
  return round2(amountEur * FX_FROM_EUR[to]);
}

/**
 * Deterministic, code-owned math: agents *find* components, this function
 * *prices* them. Never let an LLM compute the number the user pays.
 */
export function priceBundle(
  c: PricedComponents,
  cfg: PricingConfig = DEFAULT_PRICING,
): PriceBreakdown {
  const flights = c.flight.totalPrice;
  const hotel = c.hotel.totalPrice;
  const transfer = c.transfer.totalPrice;
  const attractions = c.attractions.totalPrice;
  const netCost = round2(flights + hotel + transfer + attractions);
  const margin = round2(netCost * cfg.marginRate);
  const total = round2(netCost + margin + cfg.serviceFee);
  return {
    flights,
    hotel,
    transfer,
    attractions,
    netCost,
    margin,
    serviceFee: cfg.serviceFee,
    total,
  };
}

/** The user's budget expressed as a total in EUR base currency. */
export function budgetCeilingEur(budget: Budget, partySize: number): number {
  const totalInCurrency = budget.perPerson ? budget.amount * partySize : budget.amount;
  return round2(totalInCurrency / FX_FROM_EUR[budget.currency]);
}

export function fitsBudget(
  total: number,
  ceilingEur: number,
  cfg: PricingConfig = DEFAULT_PRICING,
): boolean {
  return total <= ceilingEur * (1 - cfg.budgetBuffer);
}
