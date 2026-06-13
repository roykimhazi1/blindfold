import { test } from "node:test";
import assert from "node:assert/strict";
import type { ScoredOption } from "@sv/engine";
import { exampleParams, selectDiverse } from "@sv/engine";
import { planSelection } from "./planner.ts";
import type { LlmClient, LlmRequest } from "./llm.ts";

const params = exampleParams({ budget: { amount: 6000, currency: "EUR", perPerson: false } });

// A lightweight ScoredOption carrying only the fields the planner +
// selectDiverse actually read (destination id/region/vibes, score, hints,
// breakdown total). Avoids depending on the pipeline's internal priced list.
function opt(
  id: string,
  region: string,
  vibes: string[],
  score: number,
  total: number,
): ScoredOption {
  return {
    destination: { id, region, vibeTags: vibes } as ScoredOption["destination"],
    components: {} as ScoredOption["components"],
    breakdown: { total } as ScoredOption["breakdown"],
    score,
    hints: {
      climateBand: "warm",
      flightBand: "short",
      vibeTags: vibes,
      packingTip: "",
      starBand: 4,
      attractionCount: 3,
      teaser: "",
    } as ScoredOption["hints"],
  };
}

function shortlistFixture(): ScoredOption[] {
  return [
    opt("a", "Greek Islands", ["beach"], 0.91, 1800),
    opt("b", "Central Europe", ["city"], 0.88, 2100),
    opt("c", "Iberia", ["culture"], 0.85, 2400),
    opt("d", "Caucasus", ["nature"], 0.82, 1600),
    opt("e", "Balkans", ["nightlife"], 0.80, 1500),
    opt("f", "Adriatic", ["beach"], 0.78, 2000),
    opt("g", "North Africa", ["culture"], 0.75, 1900),
  ];
}

const mock: LlmClient = { mode: "mock", async complete() { return ""; } };

test("mock mode matches the deterministic diversity pick exactly", async () => {
  const priced = shortlistFixture();
  const plan = await planSelection(priced, params, mock, 3);
  const expected = selectDiverse(priced, 3).map((o) => o.destination.id);
  assert.deepEqual(plan.selected.map((o) => o.destination.id), expected);
  assert.equal(plan.trace.mode, "mock");
});

test("an anthropic planner's picks are honoured (among the priced shortlist)", async () => {
  const priced = shortlistFixture();
  let sawSummaries = "";
  const picky: LlmClient = {
    mode: "anthropic",
    async complete(req: LlmRequest) {
      sawSummaries = req.messages[0]!.content as string;
      return 'sure! {"picks":[{"i":2,"why":"slow and warm"},{"i":0,"why":"big-city buzz"},{"i":1,"why":"quiet coast"}]}';
    },
  };
  const plan = await planSelection(priced, params, picky, 3);

  // Shortlist is the top-12 by score; here all 7 qualify, score-sorted.
  const shortlist = [...priced].sort((a, b) => b.score - a.score);
  assert.equal(plan.selected.length, 3);
  assert.equal(plan.selected[0]!.destination.id, shortlist[2]!.destination.id);
  assert.equal(plan.selected[1]!.destination.id, shortlist[0]!.destination.id);
  assert.equal(plan.rationales[0], "slow and warm");
  assert.equal(plan.trace.status, "ok");
  // The model only ever saw abstract summaries — no destination ids leaked in.
  assert.ok(!sawSummaries.includes("Greek Islands") && !/\b[a-g]\b/.test(sawSummaries.replace(/[0-9]/g, "")));
});

test("garbage / leaky model output falls back to deterministic, never crashes", async () => {
  const priced = shortlistFixture();
  for (const bad of ["totally not json", "", '{"picks":[]}', '{"picks":[{"i":999}]}']) {
    const client: LlmClient = { mode: "anthropic", async complete() { return bad; } };
    const plan = await planSelection(priced, params, client, 3);
    assert.equal(plan.selected.length, 3, `fallback should still return 3 for ${JSON.stringify(bad)}`);
    assert.equal(plan.trace.status, "fallback");
  }
});

test("a model that throws is caught and falls back", async () => {
  const priced = shortlistFixture();
  const boom: LlmClient = { mode: "anthropic", async complete() { throw new Error("rate limited"); } };
  const plan = await planSelection(priced, params, boom, 3);
  assert.equal(plan.selected.length, 3);
  assert.equal(plan.trace.status, "fallback");
});

test("too few picks are topped up from the diverse order to reach count", async () => {
  const priced = shortlistFixture();
  const one: LlmClient = {
    mode: "anthropic",
    async complete() { return '{"picks":[{"i":0,"why":"the standout"}]}'; },
  };
  const plan = await planSelection(priced, params, one, 3);
  assert.equal(plan.selected.length, 3, "topped up to count");
  const ids = plan.selected.map((o) => o.destination.id);
  assert.equal(new Set(ids).size, ids.length, "no duplicate destinations after top-up");
});

test("when candidates ≤ count, the planner keeps them all without calling the model", async () => {
  const priced = shortlistFixture().slice(0, 2);
  let called = false;
  const client: LlmClient = { mode: "anthropic", async complete() { called = true; return ""; } };
  const plan = await planSelection(priced, params, client, 3);
  assert.equal(plan.selected.length, 2);
  assert.equal(called, false, "no point asking the model to pick from ≤ count");
});
