import { test } from "node:test";
import assert from "node:assert/strict";
import { CATALOG, activeDestinations } from "./catalog.ts";
import { UNIVERSE } from "./universe.ts";
import { findCatalogLeaks, findLeaks } from "./hints.ts";

test("universe entries are well-formed and unique across the whole catalog", () => {
  assert.ok(UNIVERSE.length >= 20, "v1 universe breadth");
  const ids = new Set<string>();
  const airports = new Set<string>();
  for (const d of CATALOG) {
    assert.ok(!ids.has(d.id), `duplicate id ${d.id}`);
    ids.add(d.id);
    assert.ok(!airports.has(d.airport), `duplicate airport ${d.airport}`);
    airports.add(d.airport);
    assert.equal(d.climateByMonth.length, 12, `${d.id} needs 12 climate months`);
    assert.ok(d.flightHoursFrom.TLV && d.flightHoursFrom.TLV > 0, `${d.id} needs TLV hours`);
    assert.ok(d.attractionPackages.length >= 2, `${d.id} needs 2+ packages`);
  }
});

test("the catalog-wide leak-check covers universe cities, not just curated ones", () => {
  const dests = activeDestinations();
  assert.deepEqual(findCatalogLeaks("a weekend wandering Istanbul's bazaars", dests), ["Istanbul"]);
  assert.deepEqual(findCatalogLeaks("tapas crawls through Madrid", dests), ["Madrid"]);
  // Curated cities still covered after the merge.
  assert.deepEqual(findCatalogLeaks("three nights in Prague", dests), ["Prague"]);
  // And ordinary copy stays clean.
  assert.deepEqual(findCatalogLeaks("a warm, history-soaked escape with 4★ stays", dests), []);
});

test("generic packages contribute zero landmark leak terms", () => {
  for (const dest of UNIVERSE) {
    const itemsText = dest.attractionPackages.flatMap((p) => p.items).join(" ");
    // If any capitalized item word escaped the generic allowlist it would
    // match itself here; city/country names must not appear in items either.
    assert.deepEqual(findLeaks(dest, itemsText), [], `leaky generic items for ${dest.id}`);
  }
});
