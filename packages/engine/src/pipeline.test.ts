import { test } from "node:test";
import assert from "node:assert/strict";
import { runDealPipeline, exampleParams } from "./index.ts";
import { findLeaks } from "./hints.ts";
import { CATALOG } from "./catalog.ts";

test("returns up to 3 surprise deals for the express path", async () => {
  const res = await runDealPipeline(exampleParams());
  assert.ok(res.deals.length > 0, "expected at least one deal");
  assert.ok(res.deals.length <= 3, "expected at most three deals");
});

test("all returned deals are within budget", async () => {
  const params = exampleParams({
    budget: { amount: 1100, currency: "EUR", perPerson: false },
  });
  const res = await runDealPipeline(params);
  for (const deal of res.deals) {
    assert.ok(
      deal.priceTotal <= 1100,
      `deal ${deal.id} priced ${deal.priceTotal} exceeds budget`,
    );
  }
});

test("hints never leak the destination (city/country/landmarks)", async () => {
  const res = await runDealPipeline(exampleParams());
  for (const opt of res.options) {
    const leaks = findLeaks(opt.destination, opt.hints.teaser + " " + opt.hints.packingTip);
    assert.deepEqual(leaks, [], `leaked: ${leaks.join(", ")}`);
  }
  // Client-facing deals must not contain any city name from the catalog.
  const cities = CATALOG.map((d) => d.city.toLowerCase());
  for (const deal of res.deals) {
    const blob = JSON.stringify(deal).toLowerCase();
    for (const city of cities) {
      assert.ok(!blob.includes(city), `deal exposed city "${city}"`);
    }
  }
});

test("selected deals are diverse (distinct regions where possible)", async () => {
  const res = await runDealPipeline(exampleParams());
  const regions = res.options.map((o) => o.destination.region);
  assert.equal(new Set(regions).size, regions.length, "regions should be distinct");
});

test("max flight time constraint excludes far destinations", async () => {
  const params = exampleParams({
    constraints: { maxFlightHours: 2, nationality: "IL" },
  });
  const res = await runDealPipeline(params);
  for (const opt of res.options) {
    assert.ok(
      opt.components.flight.durationHours <= 2,
      `${opt.destination.id} flight ${opt.components.flight.durationHours}h > 2h`,
    );
  }
});

test("cold preference excludes hot destinations", async () => {
  const params = exampleParams({
    dates: { mode: "exact", start: "2026-07-10", nights: 4 },
    vibe: { types: ["city"], temperature: "cold", pace: "any" },
  });
  const res = await runDealPipeline(params);
  // In July, warm-climate beach cities should be filtered out.
  for (const opt of res.options) {
    const temp = opt.destination.climateByMonth[6] ?? 0;
    assert.ok(temp <= 16, `${opt.destination.id} too warm (${temp}°C) for cold pref`);
  }
});

test("leak-check matches whole words, not substrings (e.g. 'Cape' vs 'escape')", async () => {
  const athens = CATALOG.find((d) => d.id === "athens-gr")!;
  // "escape" contains "cape" (from 'Cape Sounion') — must NOT be flagged.
  assert.deepEqual(findLeaks(athens, "A warm escape by the sea."), []);
  // The actual landmark word as a standalone token MUST be flagged.
  assert.ok(findLeaks(athens, "Visit Cape Sounion at sunset.").length > 0);
});

test("every catalog destination produces a leak-safe teaser", async () => {
  const res = await runDealPipeline(
    exampleParams({ budget: { amount: 6000, currency: "EUR", perPerson: false } }),
  );
  for (const opt of res.options) {
    assert.deepEqual(findLeaks(opt.destination, opt.hints.teaser), []);
  }
});

test("impossible budget yields zero deals (no crash)", async () => {
  const params = exampleParams({
    budget: { amount: 50, currency: "EUR", perPerson: false },
  });
  const res = await runDealPipeline(params);
  assert.equal(res.deals.length, 0);
});
