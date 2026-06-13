import { test } from "node:test";
import assert from "node:assert/strict";
import { runDiscoveryPipeline, type CachedFare } from "./discovery.ts";
import { findLeaks, findCatalogLeaks } from "./hints.ts";
import { activeDestinations } from "./catalog.ts";
import { exampleParams } from "./index.ts";

// A seeded cache fixture: a mix of curated cities (ATH, PRG, BUD) and
// universe-only cities (IST, RHO, OTP, MAD, TIV). 2-adult round-trip EUR.
function fixtureFares(): CachedFare[] {
  const f = (airport: string, totalEur: number, extra: Partial<CachedFare> = {}): CachedFare => ({
    airport,
    departDate: "2026-07-10",
    nights: 4,
    totalEur,
    carrier: "XX",
    direct: true,
    durationHours: 3,
    expiresAt: "2026-07-01T00:00:00Z",
    ...extra,
  });
  return [
    f("ATH", 420, { carrier: "A3", durationHours: 2.1 }),
    f("PRG", 510, { carrier: "W6", durationHours: 3.8 }),
    f("BUD", 460, { carrier: "W6", durationHours: 3.4 }),
    f("IST", 300, { carrier: "TK", durationHours: 2.1 }),
    f("RHO", 280, { carrier: "A3", durationHours: 1.3 }),
    f("OTP", 350, { carrier: "RO", durationHours: 2.5 }),
    f("MAD", 740, { carrier: "IB", durationHours: 4.9, direct: false }),
    f("TIV", 480, { carrier: "YM", durationHours: 2.9 }),
  ];
}

const NOW = Date.parse("2026-06-12T00:00:00Z");

test("discovery serves 3 diverse, in-budget, leak-free deals from the fare cache", async () => {
  const params = exampleParams({ budget: { amount: 3000, currency: "EUR", perPerson: false } });
  const res = await runDiscoveryPipeline(params, fixtureFares(), { nowMs: NOW });

  assert.equal(res.deals.length, 3);
  const regions = new Set(res.options.map((o) => o.destination.region));
  assert.equal(regions.size, 3, "3 distinct regions");
  for (const [i, deal] of res.deals.entries()) {
    assert.ok(deal.priceTotal <= 3000, `deal ${deal.id} over budget`);
    const dest = res.options[i]!.destination;
    assert.deepEqual(findLeaks(dest, deal.hints.teaser + " " + deal.hints.packingTip), []);
    assert.deepEqual(findCatalogLeaks(JSON.stringify(deal), activeDestinations()), []);
  }
});

test("discovery is flight-led: a budget-swallowing fare can't anchor a bundle", async () => {
  // €2,500 ceiling → flight share cap is €1,500; make MAD cost €1,800 for two.
  const params = exampleParams({ budget: { amount: 2500, currency: "EUR", perPerson: false } });
  const fares = fixtureFares().map((f) => (f.airport === "MAD" ? { ...f, totalEur: 1800 } : f));
  const res = await runDiscoveryPipeline(params, fares, { nowMs: NOW });
  assert.ok(res.options.every((o) => o.destination.airport !== "MAD"), "MAD must be excluded");
});

test("expired and wrong-length fares are ignored; empty cache yields empty result", async () => {
  const params = exampleParams();
  const stale = fixtureFares().map((f) => ({ ...f, expiresAt: "2026-06-01T00:00:00Z" }));
  const resStale = await runDiscoveryPipeline(params, stale, { nowMs: NOW });
  assert.equal(resStale.deals.length, 0, "expired rows must not serve");

  const wrongNights = fixtureFares().map((f) => ({ ...f, nights: 9 }));
  const resWrong = await runDiscoveryPipeline(params, wrongNights, { nowMs: NOW });
  assert.equal(resWrong.deals.length, 0, "trip-length mismatch must not serve");

  const resEmpty = await runDiscoveryPipeline(params, [], { nowMs: NOW });
  assert.equal(resEmpty.deals.length, 0);
  assert.equal(resEmpty.diagnostics.fares, 0);
});

test("discovery deal ids are stable across runs (booking recovery relies on it)", async () => {
  const params = exampleParams();
  const a = await runDiscoveryPipeline(params, fixtureFares(), { nowMs: NOW });
  const b = await runDiscoveryPipeline(params, fixtureFares(), { nowMs: NOW });
  assert.deepEqual(a.deals.map((d) => d.id), b.deals.map((d) => d.id));
});
