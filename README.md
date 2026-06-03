# Surprise Vacation 🎁✈️

Book a complete trip — flights, hotel, airport transfer, and attractions — to a **hidden destination**. The user enters a few parameters (budget, dates, travelers) and gets **3 curated surprise bundles**. The destination stays secret until the airport; the hotel is revealed by the driver on the way there.

> Built as a TypeScript monorepo. The deal engine and AI-agent layer run on **mock data** out of the box (no API keys needed), so you can run the whole product locally today.

## Monorepo layout

```
apps/
  web/        Next.js (App Router) — marketing + booking wizard + reveal journey + admin
packages/
  engine/     Deterministic deal pipeline + mock providers + seed catalog (the heart)
  agents/     Orchestrator + specialist AI agents (Claude tool-use, mock fallback)
  types/      Shared TypeScript types / DTOs
```

## Quick start

```bash
npm install
npm run dev          # runs the web app (and watches packages) via Turborepo
```

Then open http://localhost:3000.

To run the engine tests:

```bash
npm test
```

## How it works (the pipeline)

`params → Destination Scout → price (flights/hotel/transfer/attractions) → budget fit → score & rank → pick 3 diverse → hint assembly (+ leak-check) → 3 Surprise Deals`

See [the plan](.claude/plans) and `packages/engine/src/pipeline.ts` for details.

## Environment

Copy `.env.example` to `.env.local`. Everything runs in **mock mode** with no keys. Add `ANTHROPIC_API_KEY` to enable real AI agents, and Supabase/Stripe keys for later phases.
