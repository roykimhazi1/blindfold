// Fare precompute fan-out (Phase B): for every active destination × rolling
// date window, fetch the cheapest direct round-trip from Duffel and upsert it
// into the `destination_fares` cache. The wizard's discovery pipeline reads
// this cache — it never fans out to suppliers live.
//
// Run:    npm run fares:refresh         (node --experimental-strip-types)
// Env:    DUFFEL_API_KEY (duffel_test_… probes the sandbox)
//         NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (writes)
//         FARE_WEEKS=8 FARE_NIGHTS=3,4,5,7 FARE_ORIGIN=TLV (optional knobs)
// Notes:  prices are the 2-adult probe total; discovery scales per party.
//         Sequential with a small gap + one backoff retry — rate-limit aware.
//         Without DUFFEL_API_KEY this is a no-op (exit 0), so cron is safe
//         to schedule before credentials exist.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { activeDestinations } from "../packages/engine/src/catalog.ts";
import { toEur } from "../packages/engine/src/providers/live.ts";

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    for (const line of readFileSync("apps/web/.env.local", "utf8").split(/\r?\n/)) {
      const i = line.indexOf("=");
      if (i > 0 && !line.startsWith("#")) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  } catch {
    /* no .env.local — rely on process.env (CI) */
  }
  for (const [k, v] of Object.entries(process.env)) if (v) env[k] = v;
  return env;
}

const env = loadEnv();
const DUFFEL_KEY = env.DUFFEL_API_KEY;
const ORIGIN = env.FARE_ORIGIN ?? "TLV";
const WEEKS = Number(env.FARE_WEEKS ?? 8);
const NIGHTS = (env.FARE_NIGHTS ?? "3,4,5,7").split(",").map((n) => parseInt(n.trim(), 10));
const FARE_TTL_HOURS = 36;
const GAP_MS = 300;

if (!DUFFEL_KEY) {
  console.log("[fares] DUFFEL_API_KEY not set — nothing to refresh (exit 0).");
  process.exit(0);
}
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[fares] Supabase URL/service-role key missing — cannot write the cache.");
  process.exit(1);
}

const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function duffel(path: string, init?: { method?: string; body?: unknown }, attempt = 0): Promise<unknown> {
  const res = await fetch(`https://api.duffel.com${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${DUFFEL_KEY}`,
      "Duffel-Version": "v2",
      "Content-Type": "application/json",
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if ((res.status === 429 || res.status >= 500) && attempt === 0) {
    await sleep(2000);
    return duffel(path, init, 1);
  }
  if (!res.ok) throw new Error(`Duffel ${path} → ${res.status}`);
  return res.json();
}

function fridaysFromNow(weeks: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + ((5 - d.getUTCDay() + 7) % 7 || 7)); // next Friday
  for (let i = 0; i < weeks; i++) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return out;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

interface ProbeResult {
  totalEur: number;
  carrier?: string;
  durationHours?: number;
  sample: unknown;
}

async function probeCheapestDirect(airport: string, departDate: string, nights: number): Promise<ProbeResult | null> {
  const or = await duffel("/air/offer_requests?return_offers=false", {
    method: "POST",
    body: {
      data: {
        slices: [
          { origin: ORIGIN, destination: airport, departure_date: departDate },
          { origin: airport, destination: ORIGIN, departure_date: addDays(departDate, nights) },
        ],
        passengers: [{ type: "adult" }, { type: "adult" }],
        cabin_class: "economy",
      },
    },
  }) as { data: { id: string } };

  const offers = await duffel(
    `/air/offers?offer_request_id=${or.data.id}&sort=total_amount&limit=1&max_connections=0`,
  ) as { data?: Array<{ total_amount: string; total_currency: string; slices: Array<{ segments: Array<{ marketing_carrier?: { iata_code?: string }; departing_at: string; arriving_at: string }> }> }> };

  const best = offers.data?.[0];
  if (!best) return null;
  const seg0 = best.slices[0]?.segments[0];
  const segN = best.slices[0]?.segments[best.slices[0].segments.length - 1];
  const durationHours = seg0 && segN
    ? Math.round(((Date.parse(segN.arriving_at) - Date.parse(seg0.departing_at)) / 3_600_000) * 100) / 100
    : undefined;
  return {
    totalEur: toEur(parseFloat(best.total_amount), best.total_currency),
    carrier: seg0?.marketing_carrier?.iata_code,
    durationHours,
    sample: { total_amount: best.total_amount, total_currency: best.total_currency },
  };
}

async function main() {
  const dests = activeDestinations().filter((d) => d.flightHoursFrom[ORIGIN] != null);
  const dates = fridaysFromNow(WEEKS);
  const expiresAt = new Date(Date.now() + FARE_TTL_HOURS * 3_600_000).toISOString();
  let written = 0;
  let misses = 0;
  let failures = 0;

  console.log(`[fares] ${dests.length} destinations × ${dates.length} dates × {${NIGHTS.join(",")}} nights from ${ORIGIN}`);

  for (const dest of dests) {
    for (const departDate of dates) {
      for (const nights of NIGHTS) {
        try {
          const probe = await probeCheapestDirect(dest.airport, departDate, nights);
          if (!probe) {
            misses++;
          } else {
            const { error } = await supa.from("destination_fares").upsert(
              {
                origin: ORIGIN,
                destination_airport: dest.airport,
                destination_city: dest.city,
                depart_date: departDate,
                nights,
                cheapest_total_eur: probe.totalEur,
                currency: "EUR",
                carrier: probe.carrier ?? null,
                direct: true,
                duration_hours: probe.durationHours ?? null,
                offer_sample: probe.sample,
                refreshed_at: new Date().toISOString(),
                expires_at: expiresAt,
              },
              { onConflict: "origin,destination_airport,depart_date,nights" },
            );
            if (error) throw new Error(error.message);
            written++;
          }
        } catch (err) {
          failures++;
          console.error(`[fares] ${dest.airport} ${departDate} ${nights}n → ${err instanceof Error ? err.message : err}`);
        }
        await sleep(GAP_MS);
      }
    }
  }

  console.log(`[fares] done: ${written} upserted, ${misses} no-offer, ${failures} failed.`);
  if (written === 0 && failures > 0) process.exit(1);
}

main();
