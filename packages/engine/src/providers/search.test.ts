import { test } from "node:test";
import assert from "node:assert/strict";
import { mockProviders } from "./mock.ts";
import { activeDestinations } from "../catalog.ts";
import { exampleParams } from "../index.ts";

// Specialist agents need real options to choose among. The mock providers expose
// a ranked `search` list whose cheapest offer equals the single `quote`, so the
// deterministic pipeline (which uses `quote`) and the agent path stay identical
// in mock mode — only a real model would diverge by choosing a pricier offer.
test("mock providers expose multiple offers, cheapest matching the single quote", async () => {
  const params = exampleParams({ budget: { amount: 6000, currency: "EUR", perPerson: false } });
  const dest = activeDestinations()[0]!;

  const flightQuote = await mockProviders.flights.quote(dest, params);
  const flightOffers = await mockProviders.flights.search!(dest, params);
  assert.ok(flightOffers.length >= 3, "expected >= 3 flight offers");
  const cheapestFlight = flightOffers.reduce((a, b) => (b.totalPrice < a.totalPrice ? b : a));
  assert.equal(cheapestFlight.totalPrice, flightQuote!.totalPrice);

  const hotelQuote = await mockProviders.hotels.quote(dest, params);
  const hotelOffers = await mockProviders.hotels.search!(dest, params);
  assert.ok(hotelOffers.length >= 2, "expected >= 2 hotel offers");
  const cheapestHotel = hotelOffers.reduce((a, b) => (b.totalPrice < a.totalPrice ? b : a));
  assert.equal(cheapestHotel.totalPrice, hotelQuote!.totalPrice);

  const attractionQuote = await mockProviders.attractions.quote(dest, params);
  const attractionOffers = await mockProviders.attractions.search!(dest, params);
  assert.ok(attractionOffers.length >= 1, "expected >= 1 attraction offer");
  assert.equal(attractionOffers[0]!.packageId, attractionQuote!.packageId);
});
