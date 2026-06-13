import { test } from "node:test";
import assert from "node:assert/strict";
import { runDealPipeline } from "./pipeline.ts";
import { requoteOption } from "./requote.ts";
import { mockProviders } from "./providers/mock.ts";
import { exampleParams } from "./index.ts";
import type { Providers } from "./types.ts";

test("mock mode returns the option unchanged — the delta confirm stays a no-op", async () => {
  const params = exampleParams();
  const res = await runDealPipeline(params);
  const option = res.options[0]!;

  const { option: requoted, deal, live } = await requoteOption(option, params, { mode: "mock" });
  assert.equal(live, false);
  assert.equal(requoted, option, "same reference — nothing recomputed");
  assert.equal(deal.priceTotal, res.deals[0]!.priceTotal);
});

test("a live price drift re-settles the breakdown but keeps the deal id stable", async () => {
  const params = exampleParams();
  const res = await runDealPipeline(params);
  const option = res.options[0]!;
  const shownDeal = res.deals[0]!;

  // Stub suppliers: the flight came back €100 pricier, the stay €50 cheaper.
  const drifted: Providers = {
    ...mockProviders,
    flights: {
      quote: async () => ({ ...option.components.flight, totalPrice: option.components.flight.totalPrice + 100 }),
    },
    hotels: {
      quote: async () => ({ ...option.components.hotel, totalPrice: option.components.hotel.totalPrice - 50 }),
    },
  };

  const { option: requoted, deal, live } = await requoteOption(option, params, { providers: drifted });
  assert.equal(live, true);
  assert.equal(deal.id, shownDeal.id, "deal id is destination+params seeded — must survive a re-quote");
  assert.notEqual(deal.priceTotal, shownDeal.priceTotal, "price reflects the drift");

  // Code owns the math: net drift is +50 EUR, margin applies on net.
  const expectedNet = option.breakdown.netCost + 50;
  assert.equal(requoted.breakdown.netCost, expectedNet);
  assert.ok(requoted.breakdown.total > option.breakdown.total);
  // Transfer + attractions were not re-quoted.
  assert.equal(requoted.components.transfer, option.components.transfer);
  assert.equal(requoted.components.attractions, option.components.attractions);
});

test("supplier miss during re-quote falls back to the shown component", async () => {
  const params = exampleParams();
  const res = await runDealPipeline(params);
  const option = res.options[0]!;

  const flaky: Providers = {
    ...mockProviders,
    flights: { quote: async () => null },
    hotels: { quote: async () => ({ ...option.components.hotel, totalPrice: option.components.hotel.totalPrice }) },
  };
  const { option: requoted } = await requoteOption(option, params, { providers: flaky });
  assert.equal(requoted.components.flight, option.components.flight, "kept the shown flight");
});
