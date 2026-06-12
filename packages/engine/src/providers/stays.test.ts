import { test } from "node:test";
import assert from "node:assert/strict";
import { mapStaysResults, type StaysSearchResult } from "./live.ts";
import { activeDestinations } from "../catalog.ts";
import { STAY_COORDS } from "./stay-locations.ts";
import { exampleParams } from "../index.ts";

// A trimmed Duffel Stays search response (the fields we read), as returned by
// POST /stays/search — amounts are strings, rating is the star band.
const RESULTS: StaysSearchResult[] = [
  {
    cheapest_rate_total_amount: "799.00",
    cheapest_rate_currency: "GBP",
    accommodation: { name: "Hotel Riverbank", rating: 4 },
  },
  {
    cheapest_rate_total_amount: "412.50",
    cheapest_rate_currency: "EUR",
    accommodation: { name: "Pension Old Town", rating: 3 },
  },
  {
    cheapest_rate_total_amount: "1299.00",
    cheapest_rate_currency: "EUR",
    accommodation: { name: "Grand Palace", rating: 5 },
  },
  // Unusable rows: missing price / missing name — must be dropped, not crash.
  { accommodation: { name: "No Price Inn", rating: 4 } },
  { cheapest_rate_total_amount: "500.00", cheapest_rate_currency: "EUR" },
];

test("stays results map to EUR HotelQuotes, cheapest first", () => {
  const dest = activeDestinations()[0]!;
  const params = exampleParams();
  const quotes = mapStaysResults(dest, params, RESULTS);

  assert.equal(quotes.length, 3, "unusable rows dropped");
  assert.equal(quotes[0]!.name, "Pension Old Town", "cheapest leads");
  assert.equal(quotes[0]!.totalPrice, 412.5, "EUR amount passes through 1:1");
  assert.ok(
    quotes.every((q, i) => i === 0 || q.totalPrice >= quotes[i - 1]!.totalPrice),
    "sorted ascending by price",
  );
  // GBP converts to EUR, so the 799 GBP stay must not still cost 799.
  const gbp = quotes.find((q) => q.name === "Hotel Riverbank")!;
  assert.notEqual(gbp.totalPrice, 799);
  for (const q of quotes) {
    assert.equal(q.destinationId, dest.id);
    assert.equal(q.nights, params.dates.nights);
  }
});

test("star floor filters when satisfiable, relaxes when it would empty the list", () => {
  const dest = activeDestinations()[0]!;
  const fourStar = exampleParams({ hotel: { minStars: 4, board: "breakfast", roomType: "double" } });
  const filtered = mapStaysResults(dest, fourStar, RESULTS);
  assert.ok(filtered.every((q) => q.stars >= 4), "3★ stay excluded by the floor");
  assert.equal(filtered.length, 2);

  // All results unrated + a star floor: the floor would empty the list, so it
  // relaxes to the usable pool instead of returning nothing.
  const unrated: StaysSearchResult[] = [
    { cheapest_rate_total_amount: "300.00", cheapest_rate_currency: "EUR", accommodation: { name: "Mystery Stay" } },
  ];
  const relaxed = mapStaysResults(dest, fourStar, unrated);
  assert.equal(relaxed.length, 1, "relaxed instead of empty");
  assert.equal(relaxed[0]!.stars, 4, "unrated stay assumes the requested floor");
});

test("every active destination has Stays coordinates", () => {
  for (const dest of activeDestinations()) {
    assert.ok(STAY_COORDS[dest.id], `missing STAY_COORDS for ${dest.id}`);
  }
});
