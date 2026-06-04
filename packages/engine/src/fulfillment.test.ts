import { test } from "node:test";
import assert from "node:assert/strict";
import { runDealPipeline, exampleParams } from "./index.ts";
import { bookBundle, type Fulfillment } from "./fulfillment.ts";

async function sampleComponents() {
  const res = await runDealPipeline(
    exampleParams({ budget: { amount: 6000, currency: "EUR", perPerson: false } }),
  );
  return res.options[0]!.components;
}

test("booking saga books all three legs, idempotently", async () => {
  const components = await sampleComponents();
  const a = await bookBundle(components, { bookingId: "bk_test" });
  assert.ok(a.ok, "expected the saga to succeed");
  if (a.ok) {
    assert.equal(a.orders.length, 3);
    assert.ok(a.orders.every((o) => o.status === "confirmed"));
  }
  // Same bookingId ⇒ same refs (no double-booking on retry).
  const b = await bookBundle(components, { bookingId: "bk_test" });
  if (a.ok && b.ok) {
    assert.deepEqual(b.orders.map((o) => o.ref), a.orders.map((o) => o.ref));
  }
});

test("booking saga compensates (cancels prior legs) when a later leg fails", async () => {
  const components = await sampleComponents();
  const cancels: string[] = [];
  const failing: Fulfillment = {
    flights: {
      async book(i) {
        return { ref: "FL1", domain: "flight", status: "confirmed", priceEur: i.priceEur };
      },
      async cancel(ref) {
        cancels.push(ref);
      },
    },
    hotels: {
      async book() {
        throw new Error("sold out");
      },
      async cancel() {},
    },
    attractions: {
      async book(i) {
        return { ref: "AT1", domain: "attractions", status: "confirmed", priceEur: i.priceEur };
      },
      async cancel(ref) {
        cancels.push(ref);
      },
    },
  };

  const r = await bookBundle(components, { bookingId: "bk_fail", fulfillment: failing });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.failedDomain, "hotel");
    assert.deepEqual(r.cancelled.map((o) => o.ref), ["FL1"], "flight leg should be rolled back");
  }
  assert.deepEqual(cancels, ["FL1"], "cancel must actually be called on the booked flight");
});
