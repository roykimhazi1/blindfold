import { test } from "node:test";
import assert from "node:assert/strict";
import { toDuffelOrderPassenger, duffelFulfillment, getFulfillment } from "./fulfillment-duffel.ts";
import { mockFulfillment, bookBundle } from "./fulfillment.ts";
import { runDealPipeline } from "./pipeline.ts";
import { exampleParams } from "./index.ts";
import type { PassengerIdentity } from "./types.ts";

const NOA: PassengerIdentity = {
  type: "adult",
  givenName: "Noa",
  familyName: "Cohen",
  dateOfBirth: "1990-05-12",
  gender: "f",
  nationality: "IL",
  passportNumber: "12345678",
  passportExpiry: "2030-01-01",
  passportIssuingCountry: "IL",
};

test("passport snapshot maps 1:1 to a Duffel order passenger", () => {
  const mapped = toDuffelOrderPassenger(NOA, "pas_abc123", { email: "ops@blindfold.test", phone: "+97230000000" });
  assert.equal(mapped.id, "pas_abc123");
  assert.equal(mapped.title, "ms", "title derives from gender");
  assert.equal(mapped.gender, "f");
  assert.equal(mapped.given_name, "Noa");
  assert.equal(mapped.family_name, "Cohen");
  assert.equal(mapped.born_on, "1990-05-12");
  assert.equal(mapped.email, "ops@blindfold.test");
  assert.equal(mapped.phone_number, "+97230000000");
  const doc = mapped.identity_documents[0]!;
  assert.equal(doc.type, "passport");
  assert.equal(doc.unique_identifier, "12345678");
  assert.equal(doc.expires_on, "2030-01-01");
  assert.equal(doc.issuing_country_code, "IL");

  const male = toDuffelOrderPassenger({ ...NOA, gender: "m" }, "pas_x", {});
  assert.equal(male.title, "mr");
});

test("getFulfillment: mock mode and missing key both stay on the mock suppliers", () => {
  const prev = process.env.DUFFEL_API_KEY;
  delete process.env.DUFFEL_API_KEY;
  try {
    assert.equal(getFulfillment("mock"), mockFulfillment);
    assert.equal(getFulfillment("sandbox"), mockFulfillment, "no key → mock even in sandbox");
    process.env.DUFFEL_API_KEY = "duffel_test_dummy";
    assert.equal(getFulfillment("sandbox"), duffelFulfillment);
    assert.equal(getFulfillment("mock"), mockFulfillment, "explicit mock wins over a present key");
  } finally {
    if (prev === undefined) delete process.env.DUFFEL_API_KEY;
    else process.env.DUFFEL_API_KEY = prev;
  }
});

test("legs without supplier handles fall back to deterministic mock refs", async () => {
  // duffelFulfillment with no API key: every leg degrades to the mock booker,
  // so the saga still completes and refs are reproducible hash-style ids.
  const prev = process.env.DUFFEL_API_KEY;
  delete process.env.DUFFEL_API_KEY;
  try {
    const res = await runDealPipeline(exampleParams({ budget: { amount: 6000, currency: "EUR", perPerson: false } }));
    const components = res.options[0]!.components;
    const r = await bookBundle(components, {
      bookingId: "bk_duffel_fallback",
      fulfillment: duffelFulfillment,
      passengers: [NOA],
      contact: { email: "ops@blindfold.test" },
    });
    assert.ok(r.ok, "saga completes on fallback refs");
    if (r.ok) {
      assert.ok(r.orders.every((o) => /^(flight|hotel|attractions)_/.test(o.ref)), "mock-style refs, visibly not Duffel ids");
    }
  } finally {
    if (prev === undefined) delete process.env.DUFFEL_API_KEY;
    else process.env.DUFFEL_API_KEY = prev;
  }
});
