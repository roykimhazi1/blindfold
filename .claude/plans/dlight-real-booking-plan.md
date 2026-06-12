# Blindfold — the finishing plan (reconciled roadmap, 2026-06-12)

## Context

The user asked to stop and finish planning before making more changes. A full macro review of the
codebase was done (engine, agents, web app, live Supabase DB) and reconciled against the previously
agreed architecture doc (`.claude/plans/sourcing-discovery-first-architecture.md`, Phase 0–D
roadmap). This plan records the decisions made on 2026-06-12, the corrected product vision, and the
scope of the next milestone.

### Where the project actually stands

- **Working today (mock mode):** wizard → 3 sealed deals → 3-step checkout with passport collection
  → Supabase-persisted booking → staged reveal journey. 36 tests green. Supabase live with 6 RLS
  tables; passport migration applied and verified.
- **Real integrations:** Duffel flight *quotes* work (live.ts, real HTTP, mock fallback). Stripe
  checkout + webhook fully wired (needs keys). Resend email outbox wired (needs key). Google OAuth
  via Supabase works.
- **Not real yet:** booking fulfillment is 100% mock (no Duffel orders); hotels have a dead
  Hotelbeds scaffold (decision was Duffel Stays); discovery phases (A/B/C) not started; the
  passport→checkout→reveal flow has never been run end-to-end in a browser.
- **The finder experiment** (`apps/web/lib/finder.ts` + `/dev/bundles`): a flight-led
  discovery prototype on a frozen fixture. It is the *seed of the product vision*, not a rival
  system. It stays as-is for now; its ideas get built into the engine in the discovery phases.

## The corrected product vision (user's words, confirmed)

1. **Flights lead everything.** The flight deal is the product's starting point. Real-time flight
   search decides where you can go; the hotel, attractions, and even the catalog enrichment hang
   off the chosen flight. (Engine phases A–C must be built flight-first, not destination-first.)
2. **The catalog is the agents' reference book**, not a limiter: what we know about each city
   (climate, vibes, visa, curated experiences). It guides agents and gives them a head start.
3. **Non-surprise product later:** catalog bundles double as an open "just show me the package"
   product for customers who don't want a surprise. Recorded in the roadmap, not in the next
   milestone.

## Decisions made today

| Question | Decision |
|---|---|
| Next milestone | **Real booking first ("D-light")** on the current 21-city engine path; discovery (A/B/C) after |
| Finder experiment | **Keep as-is** (dev-only, harmless); port its scoring ideas into the engine during discovery phases |
| Secrecy with real bookings | **Customer chooses at checkout**: "Full surprise" (Blindfold-managed contact email, airline mail goes to ops) vs "Keep me in control" (customer's email gets all receipts) |
| Open (non-surprise) bundles | **Later** — written into roadmap as a future product mode |

## Next milestone: D-light — real booking (Duffel test mode)

Goal: a customer can pay (Stripe test) and get a **real Duffel test order** created with their
passport data, then live the reveal journey. Mock mode must keep working unchanged (no keys = mock;
tests stay deterministic).

### Step 0 — Baseline E2E verification (before touching code)
Run the existing flow in the browser (preview tools): sign in → wizard → results → 3-step checkout
with passengers → demo-mode book → `/trip/[id]` reveal + time-machine advance. Fix whatever breaks.
This flow has never been exercised end-to-end.

### Step 1 — Duffel Stays adapter (replaces the Hotelbeds scaffold)
- `packages/engine/src/providers/live.ts`: remove `hotelbedsHotels`, add `duffelStays` (same
  `DUFFEL_API_KEY`): search by city/geo + dates + guests → cheapest suitable rate → `HotelQuote`.
  Mock fallback on any miss, same as flights. Drop `HOTELBEDS_*` from `.env.example`.
- Wizard keeps heuristic hotel estimates; real Stays rate arrives at checkout re-quote (agreed
  trade in the architecture doc).

### Step 2 — Live re-quote at checkout
- `apps/web/app/api/book/route.ts` already re-runs orchestration and has a price-delta confirm
  (>0.5%). Extend so that in `sandbox|live` provider mode the chosen finalist gets a **fresh live
  Duffel offer + Stays rate** (flight first — flights lead) before the delta check.

### Step 3 — Real order creation in the fulfillment saga
- `packages/engine/src/types.ts`: extend `BookInput` to carry the passenger snapshot
  (`PassengerIdentity[]`) — it currently carries none (gap named in the architecture doc).
- `packages/engine/src/fulfillment.ts`: real Duffel fulfillment behind the existing saga seam —
  map `PassengerIdentity` → Duffel passengers + `identity_documents` (passport), create the flight
  order, then the Stays booking; keep compensation (cancel placed legs on partial failure) and
  idempotency keys. Mock fulfillment remains the default.
- `apps/web/app/api/book/route.ts`: pass the validated passenger snapshot into `bookBundle()`.
- Keep packages type-strip-friendly (no enums; `.ts` import extensions).

### Step 4 — Secrecy choice at checkout (new product feature)
- `apps/web/app/checkout/checkout-client.tsx`: a choice on the contact step —
  **"Full surprise"** (default): bookings are placed with a Blindfold ops contact email
  (`OPS_CONTACT_EMAIL` env var), so airline/hotel receipts go to ops; customer gets only our
  leak-checked emails. **"Keep me in control"**: customer's own email goes on the bookings; they
  accept spoiler risk (clear copy).
- Persist the choice on the booking (new `comms_mode` column on `bookings` — small Supabase
  migration) and use it when creating Duffel orders.

### Step 5 — Full E2E in test mode + hardening
- With `DUFFEL_API_KEY` (test) + Stripe test keys: wizard → pay → real Duffel test order + Stays
  booking with passport data → confirm `booking_passengers` populated, `supplier_refs` stored, no
  PII or destination in the client-safe row, reveal stages gate correctly.
- New unit tests: passport→Duffel passenger mapping, Stays response parsing (fixtures),
  saga compensation with a failing second leg.

### Folded-in cleanups (small, do alongside)
- Wizard hardcoded `TODAY = "2026-06-04"` (already in the past) → compute from real date with an
  SSR-stable approach.
- CLAUDE.md points to a non-existent plan file; README mentions a non-existent `packages/types`
  and stale `.claude/plans` link → fix both; copy the sourcing-architecture doc into the repo at
  `.claude/plans/` so the referenced source of truth is versioned.
- Update memory files (`sourcing-architecture`, index) with today's decisions.

### What the user must provide (can't be done by Claude)
1. **Duffel test API key** (`duffel_test_…`) → `apps/web/.env.local` + `PROVIDER_MODE=sandbox`.
2. **Stripe test keys** (already wired, just keys) — optional; demo-pay path works without.
3. **An ops inbox address** for `OPS_CONTACT_EMAIL` (any inbox works in test mode).
4. (Later, for emails) Resend key + `blindfold.travel` domain verification.

## Roadmap after D-light (unchanged in substance, re-ordered)

1. **Phase A–C — flight-led discovery:** airport universe dataset (catalog grows into the
   reference book), `destination_fares` cache + nightly Duffel fan-out cron, pipeline reads the
   cache **flight-first**; port the finder's scoring (carry-on decisive, stops/timing) into engine
   scoring; extend leak-check to the whole universe; then delete `finder.ts`/fixture.
2. **Phase C3/C4 — agentic master + deal library:** LLM planner picks destinations, offline
   deal-baking, live on weak match.
3. **Open bundles product:** non-surprise mode — browse/book a visible bundle from the catalog.
4. **Transfers/attractions real suppliers; Resend scheduled emails in production.**

## Verification summary

- `npm test` green throughout; web `next build` clean.
- Step 0 and Step 5 are browser-verified E2E runs (preview tools), with screenshots.
- Leak guardrails asserted at every step: no destination in client rows, URLs, Stripe metadata, or
  pre-gate UI/emails; passport PII only in RLS-locked tables.
