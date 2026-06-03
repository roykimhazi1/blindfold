import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSchedule, stageAt, stageAtLeast, msToNextStage } from "./reveal.ts";

const sched = buildSchedule({ departureIso: "2026-07-10", flightHours: 3, nights: 4, bookedAtMs: Date.parse("2026-06-01T00:00:00") });

test("stage progresses with time", () => {
  assert.equal(stageAt(sched, Date.parse("2026-06-01T00:00:00")), "booked");
  assert.equal(stageAt(sched, Date.parse("2026-07-05T00:00:00")), "teaser"); // within 7 days
  assert.equal(stageAt(sched, Date.parse("2026-07-10T07:00:00")), "gate"); // departure day
  assert.equal(stageAt(sched, Date.parse("2026-07-10T12:00:00")), "arrival"); // after landing
  assert.equal(stageAt(sched, Date.parse("2026-07-20T00:00:00")), "complete");
});

test("teaser unlocks exactly 7 days before departure", () => {
  assert.equal(stageAt(sched, sched.teaserAt - 1), "booked");
  assert.equal(stageAt(sched, sched.teaserAt), "teaser");
});

test("stageAtLeast orders correctly", () => {
  assert.ok(stageAtLeast("gate", "teaser"));
  assert.ok(!stageAtLeast("teaser", "gate"));
  assert.ok(stageAtLeast("gate", "gate"));
});

test("msToNextStage counts down then returns null when complete", () => {
  assert.ok((msToNextStage(sched, sched.bookedAt) ?? 0) > 0);
  assert.equal(msToNextStage(sched, sched.completeAt + 1), null);
});
