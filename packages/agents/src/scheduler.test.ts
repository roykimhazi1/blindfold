import { test } from "node:test";
import assert from "node:assert/strict";
import { exampleParams, runDealPipeline, findLeaks } from "@sv/engine";
import { scheduleTrip } from "./scheduler.ts";
import { allocateEnvelope } from "./specialists.ts";

test("scheduler master returns up to 3 surprise deals", async () => {
  const res = await scheduleTrip(exampleParams());
  assert.ok(res.deals.length > 0, "expected at least one deal");
  assert.ok(res.deals.length <= 3, "expected at most three deals");
});

test("scheduler master selects the same destinations as the deterministic pipeline", async () => {
  // Same providers + same settlement ⇒ same result. New architecture, identical output.
  const params = exampleParams({ budget: { amount: 6000, currency: "EUR", perPerson: false } });
  const viaPipeline = await runDealPipeline(params);
  const viaScheduler = await scheduleTrip(params);
  const a = viaPipeline.options.map((o) => o.destination.id).sort();
  const b = viaScheduler.options.map((o) => o.destination.id).sort();
  assert.deepEqual(b, a);
});

test("scheduler deals stay within budget", async () => {
  const params = exampleParams({ budget: { amount: 1100, currency: "EUR", perPerson: false } });
  const res = await scheduleTrip(params);
  for (const d of res.deals) {
    assert.ok(d.priceTotal <= 1100, `deal ${d.id} priced ${d.priceTotal} exceeds budget`);
  }
});

test("scheduler output never leaks the destination", async () => {
  const res = await scheduleTrip(
    exampleParams({ budget: { amount: 6000, currency: "EUR", perPerson: false } }),
  );
  for (const o of res.options) {
    assert.deepEqual(findLeaks(o.destination, o.hints.teaser), []);
  }
});

test("scheduler emits a trace for the master and all 3 specialists", async () => {
  const res = await scheduleTrip(exampleParams());
  const agents = new Set(res.traces.map((t) => t.agent));
  for (const a of ["orchestrator", "flight-agent", "hotel-agent", "attraction-curator"] as const) {
    assert.ok(agents.has(a), `missing trace for ${a}`);
  }
});

test("budget envelope splits 55/35/10 of the all-in ceiling", () => {
  const env = allocateEnvelope(1000);
  assert.equal(Math.round(env.flightsEur), 550);
  assert.equal(Math.round(env.hotelEur), 350);
  assert.equal(Math.round(env.extrasEur), 100);
});
