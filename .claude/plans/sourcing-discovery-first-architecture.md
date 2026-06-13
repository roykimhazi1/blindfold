# Sourcing architecture — discovery-first, Duffel-powered, cache-served

## Context

Today the engine is **catalog-first**: it enumerates ~24 hardcoded cities
([catalog.ts](../../claude%20projects/blindfold/packages/engine/src/catalog.ts)), filters them, and
prices each via one `Providers` quote. Flights have a real Duffel quote adapter
([live.ts](../../claude%20projects/blindfold/packages/engine/src/providers/live.ts)); hotels are a
non-functional Hotelbeds stub; activities are curated packages; transfers are mock; and **no real
booking** happens (`fulfillment.ts` is all mock, and `BookInput` carries no passenger data).

We're moving to **discovery-first**: the system should roam the whole space of places you can fly
from TLV under budget, instead of a small fixed list. This doc is the agreed architecture and the
phased roadmap to get there.

### Decisions locked (with the user)

| Question | Decision |
|---|---|
| Sourcing model | **Discovery-first** — roam the reachable universe, not a hardcoded shortlist |
| Discovery source | **Duffel fan-out + cache** — single-vendor; heavy fan-out runs offline |
| Hotels | **Duffel Stays** — same account/passenger model as flights |
| Activities | **Curated packages + generic fallback** for un-curated cities |
| MCP connectors | **Dev-time only** — build the universe + curate activities here; the live app calls Duffel |
| Performance | **Precompute + cache (cron)** — wizard reads the cache; live calls only for the finalists |

### Agent-layer decisions

| Question | Decision |
|---|---|
| Master agent | **LLM planner** — reasons about the trip and **picks the destination(s)**; code still prices |
| Specialist agents | **3 (Flight / Hotel / Attractions)**, each choosing among **3–5 real offers** per domain |
| Where agents run | **Both** — offline to pre-bake a deal library, **and** live for requests that don't match |
| Pre-baked deals | **Seeds for live personalization** — tailored + re-quoted, never served as identical canned surprises |
| Live trigger | **On weak match** — go live when params don't closely match a fresh pre-baked bucket |

This already exists in skeleton: `packages/agents` has the Scheduler Master + 3 specialist tool-use
agents (`scheduler.ts`, `specialists.ts`, `agent-runtime.ts`). Today the master is *deterministic* and
specialists see only one offer — those are the two things this evolution changes.

## The data flow

```
                      ┌─────────────── offline (nightly cron) ───────────────┐
  airport universe ──▶│ Duffel fan-out: TLV→each airport × date windows      │
  (static dataset)    │ → cheapest round-trip fare + availability            │
                      └───────────────┬──────────────────────────────────────┘
                                      ▼
                          destination_fares (DB cache)
                                      ▲
  wizard params ──▶ discovery pipeline (reads cache) ──▶ bundles:
                       cached flight fare
                     + hotel ESTIMATE (heuristic)        ──▶ score ──▶ pick 3 diverse ──▶ redact
                     + curated/generic activities
                     + transfer estimate
                                      │
                                      ▼ (user picks one, at checkout)
            live re-quote: real Duffel offer + real Duffel Stays rate ──▶ confirm price delta
                                      │
                                      ▼ (pay)
            book: Duffel flight order + Stays booking (uses passport data)
                   + activities/transfer fulfilled via partner/manual
```

**Key consequence:** the wizard price is *partly estimated* (real cached flight fare + **heuristic
hotel estimate**, because fanning Duffel Stays across the whole universe nightly is too heavy). The
real hotel rate arrives at the checkout **re-quote**, and the existing price-delta confirm flow in
[/api/book](../../claude%20projects/blindfold/apps/web/app/api/book/route.ts) absorbs the drift. This
is a deliberate trade for speed.

## Data model

- **Airport universe** — a static TS dataset (built at dev-time via the MCPs): `{ airport, city,
  country, region, climateByMonth, flightHoursFromTLV (approx, for pre-cache filtering), visaFreeFor }`.
  Replaces the small filtered `CATALOG`; can grow to ~150 entries. Lives in the engine.
- **Curated activities** — packages keyed by city (today's `attractionPackages`, extracted from the
  catalog), plus a **generic fallback generator** for cities without a curated set (e.g. "3 hand-picked
  local experiences," priced by a per-person heuristic).
- **`destination_fares`** (new Supabase table, refreshed by cron):
  ```sql
  create table public.destination_fares (
    id uuid primary key default gen_random_uuid(),
    origin text not null default 'TLV',
    destination_airport text not null,
    destination_city text not null,
    depart_date date not null,
    nights int not null,
    cheapest_total_eur numeric not null,
    currency text not null,
    carrier text,
    direct boolean not null default true,
    duration_hours numeric,
    offer_sample jsonb,           -- trimmed Duffel offer for debugging
    refreshed_at timestamptz not null default now(),
    expires_at timestamptz not null
  );
  -- read-mostly; service-role writes from cron. Index the query path:
  create index destination_fares_lookup_idx
    on public.destination_fares (depart_date, nights, cheapest_total_eur);
  create index destination_fares_airport_idx
    on public.destination_fares (destination_airport);
  ```
- **`deal_library`** (new table) — full curated surprise bundles pre-baked by the master agent across
  request buckets (party × budget band × season × vibe × trip-length): destination, components,
  narrative/teaser, a bucket key, and `refreshed_at`/`expires_at`. Served as **seeds** the live master
  personalizes; the price is always re-confirmed live at checkout.

## Per-domain plan

- **Flights — Duffel (real).** Quotes already work ([live.ts](../../claude%20projects/blindfold/packages/engine/src/providers/live.ts)).
  Add: (1) the **fan-out cron** writing `destination_fares`; (2) a cache-reading flight "provider" for
  the wizard; (3) **real order creation** in `fulfillment.ts` — map our `PassengerIdentity` →
  Duffel passenger + `identity_documents` (passport). This is the part the passport feature unblocks.
- **Hotels — Duffel Stays (real).** New adapter (same `DUFFEL_API_KEY`): Stays search by city/geo +
  check-in/out + guests → rate → booking. Used at **checkout re-quote** and booking. Wizard uses a
  **heuristic estimate** (star × nightly, like the current mock) to avoid nightly Stays fan-out.
- **Activities — curated + generic fallback.** Keep curated packages for headline cities (curate the
  top N via MCP at dev-time); generate a generic package for the long tail. Fulfilled via local
  partners / manual ops — no activities booking API.
- **Transfers — estimate now, partner later.** Keep the heuristic transfer price; a real partner
  (e.g. Welcome Pickups / Mozio, or the Uber estimates MCP at dev-time for calibration) is a later add.

## Agentic orchestration (master + 3 specialists)

The orchestrator–workers pattern, made real:

- **Master (LLM planner)** — given the user's params + a shortlist of in-budget destinations from the
  fare cache, it reasons about *where* to surprise them (vibe / occasion / season / surprise-quality),
  **picks ~3 diverse destinations**, dispatches the specialists per pick, then composes each bundle's
  narrative. It never authors a price.
- **3 specialists (Flight / Hotel / Attractions)** — each is a Claude tool-use loop
  (`packages/agents/src/agent-runtime.ts`): a `search_*` tool returns **3–5 leak-safe offer
  summaries**, the model picks one via `submit_choice` with a one-line rationale. No model /
  misbehaving / slow ⇒ deterministic fallback, so the path never blocks.
- **Code settles.** Every chosen bundle still runs `pricing.ts` → budget-fit → score → leak-check,
  exactly as today. The model decides *what*; code decides *how much*.

**Two run modes, one code path:**
- *Offline (deal-baking):* a job walks the common request buckets and runs the master to fill
  `deal_library` with fresh, high-quality surprises.
- *Live (weak match):* when a request doesn't match a fresh bucket, the master runs at request-time
  over the cache shortlist — bounded by a small shortlist (~5–8 cities), parallel specialists,
  per-agent step caps, and a latency ceiling that **degrades to the deterministic pipeline** so a slow
  model never stalls a search.

## Guardrails (carry forward)

- **Code owns the math.** `pricing.ts` still computes margin/fees on net component cost; Duffel only
  supplies net fares. Agents pick, code prices.
- **Leak-check must cover the whole universe.** `findCatalogLeaks` currently scans every catalog city;
  with a dynamic universe it must scan **every discoverable city name** (universe + any generic-fallback
  city). Update its source list when the universe replaces the catalog. `assertNoLeaks` stays on all
  hints/teasers.
- **Booking is a compensating saga + idempotent.** Keep the `bookBundle` saga shape; real Duffel
  orders use idempotency keys; partial failures roll back (cancel placed legs).
- **Passenger data is a prerequisite.** Real flight + Stays booking needs the passport snapshot from
  the passenger feature (Phase 0).

## Phased roadmap

- **Phase 0 — Finish the passenger feature** *(prerequisite; ~90% done in a branch)*. Apply the
  `travellers` + `booking_passengers` migration; verify checkout 3-step flow + `/account`; run
  build/tests. Without it there's no booking.
- **Phase A — Data model + universe.** Build the airport-universe dataset (via MCP at dev-time);
  extract curated activities + add the generic fallback; add the `destination_fares` table; extend the
  leak-check source list to the universe.
- **Phase B — Fare precompute cron.** A scheduled Duffel fan-out (Supabase scheduled Edge Function,
  mirroring `supabase/functions/send-scheduled-emails`) writing cheapest round-trip fares + availability
  for rolling date windows. Rate-limit-aware, incremental, with TTL/expiry.
- **Phase C — Discovery pipeline (deterministic).** Rewrite `filterCandidates` + `pipeline` to read
  the fare cache (under budget / dates / visa / hours), assemble bundles (cached flight + hotel
  estimate + curated/generic activities + transfer), score, pick 3 diverse. Keep redact + hints +
  leak-check. This is the always-available fallback the agent layer degrades to.
- **Phase C2 — Multi-offer providers.** Make each domain return a ranked list (3–5) instead of one
  quote, so the specialists genuinely choose.
- **Phase C3 — Agentic master + specialists.** Promote the master to an LLM planner that picks
  destinations + composes; wire the 3 specialists to the multi-offer search. Bounded + degradable to
  Phase C.
- **Phase C4 — Deal library (offline baking).** Add `deal_library`; a job runs the master across
  request buckets to pre-bake surprises. Wizard router: fresh-bucket match → personalize a seed; weak
  match → live.
- **Phase D — Live re-quote + real booking.** Live Duffel offer + Duffel Stays rate for the finalists
  at checkout; wire real order creation in `fulfillment.ts` (flights + Stays via passport data;
  activities/transfer via partner/manual); money + idempotency; price-delta confirm.

## Open knobs (proposed defaults — adjust later)

- **Universe v1:** ~40 airports (visa-free for IL, ≤ ~6h from TLV), growing to ~150.
- **Date windows:** rolling 6 months × {3,4,5,7}-night trips, weekly granularity; refresh nightly;
  fare TTL ~36h.
- **Duffel env:** **test** token first, then live.
- **Cron host:** Supabase scheduled Edge Function (consistent with the existing email scheduler).
- **Hotel in wizard:** heuristic estimate; real Stays rate only at re-quote/booking.

## Verification (per phase)

- **A:** universe dataset loads; leak-check unit test extended to flag a universe city name in copy;
  `destination_fares` migration applies; `npm test` green.
- **B:** run the cron against Duffel **test** for a handful of airports; assert rows written with sane
  fares + expiry; idempotent re-run; rate-limit backoff exercised.
- **C:** pipeline unit tests against a seeded `destination_fares` fixture → 3 diverse, in-budget,
  leak-free deals; wizard → results renders from cache with no live calls (observe network).
- **D:** end-to-end in Duffel test: pick a deal → live re-quote → pay (Stripe test) → real Duffel
  order + Stays booking created with the passenger passport data → `/trip` reveal. Confirm
  `booking_passengers` populated and no PII leaked into the client-safe row.
```
