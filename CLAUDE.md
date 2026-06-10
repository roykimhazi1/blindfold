# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Blindfold** — a surprise-vacation product. A user enters a few parameters (budget, dates,
travelers; optional vibe/hotel/constraints) and gets **3 curated surprise bundles**, each a
complete trip (flights + hotel + airport transfer + attractions) to a **hidden destination**.
The destination is revealed at the airport; the hotel is revealed by the driver on arrival.

Full product/architecture plan: `.claude/plans/lets-build-together-a-distributed-garden.md`.

## Monorepo layout (npm workspaces + Turborepo)

```
apps/web/        Next.js (App Router) — marketing, wizard, results, checkout, reveal journey, /admin
packages/engine/ Deterministic deal pipeline + mock providers + seed catalog + leak-check (the heart)
packages/agents/ Orchestrator + specialist AI agents wrapping the engine (Claude tool-use, mock fallback)
```

> Shared domain types live in `packages/engine/src/types.ts` (no separate `types` package).
> Workspace packages are consumed as **TypeScript source** via Next's `transpilePackages`.

## Commands

```bash
npm install                 # install + link workspaces
npm run dev                 # turbo dev (web on :3000)
npm test                    # turbo test — runs engine + agents node:test suites
npm run build               # turbo build (includes next build / typecheck)
npm --workspace=@sv/web run build   # build just the web app
```

Engine/agent tests run on Node's native TypeScript stripping (`node --test --experimental-strip-types`),
so keep those packages **type-strip-friendly**: no `enum`/`namespace`/parameter-properties; use
union types + `const` objects. Import workspace files with explicit `.ts` extensions.

## The deal pipeline (engine)

`runDealPipeline()` in `packages/engine/src/pipeline.ts`:
candidates (`filters.ts`) → price components (`providers/mock.ts`) → budget fit (`pricing.ts`) →
score (`scoring.ts`) → select 3 diverse → build hints (`hints.ts`) → redact to client-safe `SurpriseDeal`.

The AI layer (`packages/agents`) wraps this: `orchestrateDeals()` runs the pipeline, then the
Surprise Copywriter agent rewrites teasers via the LLM **with a leak-guard**.

## Booking + reveal journey

After a user picks a deal, the **progressive reveal** kicks in (the product's signature):

- `packages/engine/src/reveal.ts` — pure state machine: `buildSchedule()` + `stageAt()` compute the
  stage (`booked → teaser → gate → arrival → complete`) from departure/return dates and `now`.
- `apps/web/lib/bookings.ts` — Supabase-backed booking store via the service-role client. The
  client-safe row lives in `bookings`; the **secret** (real city/hotel) lives in the RLS-locked
  `booking_secrets`; the **passenger passport snapshot** lives in the RLS-locked `booking_passengers`.
- `apps/web/lib/trip-view.ts` — `toTripView()` projects a booking to a client-safe shape that **only
  includes secret fields the current stage has earned** (destination at `gate`, hotel/driver at
  `arrival`). The server never ships the secret early.
- APIs: `POST /api/book` (recompute the chosen deal, **validate per-traveller passport details**, then
  persist booking + passenger snapshot), `POST /api/trip/[id]/advance` (the demo "time machine"
  fast-forwards the reveal). Trip UI: `app/trip/[id]` with a countdown, staged reveal cards, and the
  sealed-reveal overlay.

### Guardrails (do not weaken)
- **Agents find, code does the math.** Prices are computed deterministically in `pricing.ts`,
  never by an LLM.
- **Leak-check.** No user-facing copy may name the destination. `findLeaks` (own destination) +
  `findCatalogLeaks` (every operable city) run on all hints/teasers; matching is **whole-word**
  (so "Cape" never trips on "es**cape**"). `assertNoLeaks` throws if violated.
- **Passport PII stays locked.** Per-traveller passport data lives only in the RLS-locked
  `booking_passengers` / per-user `travellers` tables — never in the client-safe `bookings` row, the
  URL, or Stripe metadata.

## Conventions

- Money is computed in **EUR base**; `convertFromEur` handles display currency.
- Mock providers are **deterministic** (seeded by destination+params) so the pipeline is testable.
- Runs in **mock mode with no API keys**. `ANTHROPIC_API_KEY` enables real agents; Supabase/Stripe
  keys are for later phases (see `.env.example`). Provider adapters are structured `mock|sandbox|live`.
- Departure hub for the MVP is **TLV**; destinations are visa-filtered for the traveler's nationality.
