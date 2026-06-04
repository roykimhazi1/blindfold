import { test } from "node:test";
import assert from "node:assert/strict";
import { getProviders, resolveMode } from "./index.ts";
import { mockProviders } from "./mock.ts";

test("defaults to mock mode with no env", () => {
  delete process.env.PROVIDER_MODE;
  assert.equal(resolveMode(), "mock");
  assert.equal(getProviders(), mockProviders);
});

test("honors explicit mode and PROVIDER_MODE env", () => {
  assert.equal(resolveMode("sandbox"), "sandbox");
  process.env.PROVIDER_MODE = "live";
  assert.equal(resolveMode(), "live");
  delete process.env.PROVIDER_MODE;
});

test("sandbox/live fall back to mock when no API keys are set", () => {
  delete process.env.DUFFEL_API_KEY;
  delete process.env.HOTELBEDS_API_KEY;
  assert.equal(getProviders("sandbox"), mockProviders);
  assert.equal(getProviders("live"), mockProviders);
});

test("returns a complete provider set", () => {
  const p = getProviders("mock");
  assert.ok(p.flights && p.hotels && p.transfers && p.attractions);
});
