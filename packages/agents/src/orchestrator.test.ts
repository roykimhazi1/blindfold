import { test } from "node:test";
import assert from "node:assert/strict";
import { exampleParams, CATALOG } from "@sv/engine";
import { orchestrateDeals } from "./index.ts";
import type { LlmClient } from "./llm.ts";

test("orchestrator returns deals plus a trace per agent (mock mode)", async () => {
  const res = await orchestrateDeals(exampleParams());
  assert.ok(res.deals.length > 0);
  const agents = new Set(res.traces.map((t) => t.agent));
  assert.ok(agents.has("orchestrator"));
  assert.ok(agents.has("destination-scout"));
  assert.ok(agents.has("surprise-copywriter"));
});

test("a leaky LLM teaser is blocked and the safe fallback is kept", async () => {
  // Adversarial client that returns the destination city name.
  const leaky: LlmClient = {
    mode: "anthropic",
    async complete() {
      return `Pack for ${CATALOG[0]!.city}! Best trip ever.`;
    },
  };
  const res = await orchestrateDeals(exampleParams(), { llm: leaky });
  // No deal may contain any catalog city, despite the leaky model.
  const cities = CATALOG.map((d) => d.city.toLowerCase());
  for (const deal of res.deals) {
    const blob = JSON.stringify(deal).toLowerCase();
    for (const city of cities) {
      assert.ok(!blob.includes(city), `leaked city "${city}"`);
    }
  }
  const copy = res.traces.filter((t) => t.agent === "surprise-copywriter");
  assert.ok(copy.some((t) => t.leakBlocked), "expected a leak to be blocked");
});

test("a creative non-leaky LLM teaser is used", async () => {
  const creative: LlmClient = {
    mode: "anthropic",
    async complete() {
      return "Somewhere warm is calling — sun, salt air, and zero planning required.";
    },
  };
  const res = await orchestrateDeals(exampleParams(), { llm: creative });
  assert.ok(
    res.deals.some((d) => d.hints.teaser.includes("zero planning required")),
    "expected the creative teaser to be used",
  );
});

const bigBudget = exampleParams({ budget: { amount: 6000, currency: "EUR", perPerson: false } });

test("a clean planner rationale surfaces as a leak-safe pitch", async () => {
  // One client serves both calls: planner JSON for the master, a teaser otherwise.
  const planner: LlmClient = {
    mode: "anthropic",
    async complete(req) {
      if (req.system.includes("trip-planning master")) {
        return '{"picks":[{"i":0,"why":"made for a slow, sunny week"},{"i":1,"why":"big-city energy and food"},{"i":2,"why":"quiet and off the beaten path"}]}';
      }
      return "Somewhere good is waiting for you.";
    },
  };
  const res = await orchestrateDeals(bigBudget, { llm: planner });
  assert.ok(res.deals.some((d) => d.pitch && d.pitch.length > 0), "expected at least one pitch");
  const cities = CATALOG.map((d) => d.city.toLowerCase());
  for (const d of res.deals) {
    if (!d.pitch) continue;
    const blob = d.pitch.toLowerCase();
    for (const c of cities) assert.ok(!blob.includes(c), `pitch leaked "${c}"`);
  }
});

test("a leaky planner rationale is dropped, never shown as a pitch", async () => {
  const leakyPlanner: LlmClient = {
    mode: "anthropic",
    async complete(req) {
      if (req.system.includes("trip-planning master")) {
        return `{"picks":[{"i":0,"why":"the beaches near ${CATALOG[0]!.city} are unreal"}]}`;
      }
      return "A lovely escape awaits.";
    },
  };
  const res = await orchestrateDeals(bigBudget, { llm: leakyPlanner });
  const city = CATALOG[0]!.city.toLowerCase();
  for (const d of res.deals) {
    assert.ok(!(d.pitch ?? "").toLowerCase().includes(city), "a city-naming pitch must be dropped");
  }
});
