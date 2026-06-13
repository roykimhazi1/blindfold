# Blindfold — Project Brief & Road to Production

> **Last updated:** 2026-06-13 · **Status:** working product in test mode, on branch `feature/real-booking-dlight`
> **How to use this doc:** it's the single source of truth for *what we're building, what exists, and what's next*.
> Every phase ends with a checklist — tick boxes as things land, edit freely.

---

## 1. What is Blindfold?

**One line:** Book a complete vacation to a destination you don't know — we reveal it at the airport.

**The pitch:** Planning is the worst part of a trip. Blindfold removes it entirely. You tell us your
budget, your dates, and who's coming. We hand you three complete, bookable surprise trips — flights,
hotel, airport pickup, things to do — each to a hidden destination. You pick one by its *feeling*
(warm, beachy, four-star, a short flight) and its price. The name of the city stays sealed until
you're at the gate. When you land, a driver meets you and reveals the hotel on the way there.

**Why people will pay for this:**
- The surprise itself is the product — anticipation is half the vacation.
- Zero planning effort: one short quiz instead of 40 browser tabs.
- It's a complete package — nothing to coordinate, nothing to forget.
- It's a gift that actually lands: anniversaries, birthdays, proposals, "we need a break".

**Who it's for (initial):** couples and friend-pairs, 25–45, flying out of Tel Aviv, comfortable
spending ₪4,000–₪12,000 on a short getaway, active on Instagram/TikTok where the *reveal moment*
is inherently shareable.

---

## 2. The product, as the customer sees it

1. **The quiz (~1 minute).** "How surprised do you want to be?" — three levels:
   *Total blackout* (4 questions) / *Drop me a hint* (5) / *Let me steer* (7, region revealed).
   Then budget, dates, travellers — and optionally mood, hotel level, and no-go list.
2. **Three sealed envelopes.** Three complete trips. Each shows the *shape* — climate, vibe,
   hotel stars, flight length, what's included, the all-in price — never the place.
3. **Checkout.** Contact details, a choice of how secret to keep it (see below), passport details
   for every traveller (airlines need them), payment.
4. **The reveal journey.** Booked → a packing nudge a week out → **destination revealed at the
   gate** → driver meets you, reveals the hotel en route → trip. A countdown page builds the
   anticipation the whole time (with a demo "time machine" for testing).
5. **Change of heart?** Full refund until we lock it in.

**The secrecy choice (at checkout):**
- **Full surprise** *(default)* — airline & hotel emails go to our concierge desk; the customer
  only ever gets our spoiler-free updates.
- **Keep me in control** — every receipt goes to their own inbox, spoiler warning included.

**Coming later:** an **open bundles** mode — same complete packages, destination visible, for
people who want the convenience without the mystery. (Decided, not yet scheduled.)

---

## 3. How it's built (plain language first)

**The flow under the hood:**

```
                    nightly job (cron)
  45-city universe ───────────────────► destination_fares (fare cache)
                                              │
  quiz answers ──► discovery: real cached flight prices pick the candidates,
                   hotel estimate + activities + driver hang off each flight
                   → price → 3 diverse picks → leak-check → sealed deals
                                              │  (user picks one)
                   live re-quote of that ONE trip (real Duffel flight + hotel rate)
                                              │  (user pays — Stripe)
                   real bookings: flight order + hotel booking, passports attached,
                   all-or-nothing (anything that fails rolls everything back)
```

**Key design principles (do not weaken):**
- **Flights lead everything.** What's actually cheap to fly to decides what we offer. The hotel,
  the activities, even the city knowledge hang off the chosen flight.
- **The catalog is a reference book, not a limiter.** 21 curated cities with hand-picked
  experiences + 24 more "universe" cities with sensible generic packages = 45 destinations today,
  designed to grow toward 150.
- **Agents find, code does the math.** AI picks and writes; deterministic code computes every
  price the customer sees. Always.
- **The leak-check is law.** No user-facing text may name any city we operate — enforced by code
  on every teaser, hint, and email, with whole-word matching ("Cape" never trips on "escape").
- **Passports stay locked.** Passenger identity lives only in service-role-locked tables —
  never in URLs, client payloads, or Stripe metadata.
- **Everything degrades gracefully.** No API keys → deterministic demo mode. Empty fare cache →
  catalog estimates. Slow/missing AI → deterministic pipeline. The product never blocks.

**Tech, in one paragraph:** TypeScript monorepo (npm workspaces + Turborepo). `packages/engine` is
the deterministic heart (catalog, universe, discovery + catalog pipelines, pricing, scoring,
leak-check, reveal state machine, booking saga, Duffel adapters). `packages/agents` wraps it with
Claude tool-use agents (scheduler master, flight/hotel/attractions specialists, leak-guarded
copywriter) that fall back to deterministic mode without an API key. `apps/web` is Next.js App
Router: marketing pages, quiz, results, checkout, reveal journey, admin console. Supabase holds
auth (Google), bookings, secrets, passenger PII (RLS-locked), the email outbox, and the fare
cache. Stripe handles payment; Duffel supplies flights *and* hotels; Resend sends email. CI on
GitHub Actions; 52 tests green.

---

## 4. Where we are today — honest status

### Working and verified (booked real test trips through it in a browser)
| Area | Status |
|---|---|
| Quiz → 3 sealed deals → checkout → booking → reveal journey | ✅ end-to-end, twice |
| Passport collection + saved travellers (address-book prefill) | ✅ verified incl. re-use |
| Secrecy choice persisted per booking (`comms_mode`) | ✅ verified in DB |
| Flight-led discovery from the fare cache (45 cities) | ✅ verified — booked a cache-sourced city (Valencia) |
| Leak-safety across deals, emails, DB rows | ✅ tested + spot-checked |
| Refund/cancel flow, admin console, PWA, CI | ✅ built (earlier phases) |

### Wired and waiting on keys (code done, runs in fallback until then)
| Area | Needs |
|---|---|
| Real Duffel flight offers + hotel rates + **real order creation** | `DUFFEL_API_KEY` (test) |
| Nightly fare fan-out filling the cache | same key (+ GitHub secrets for cron) |
| Real card payments + durable webhook booking | Stripe test keys |
| Real email sending (confirmation / packing / refund) | Resend key + domain verify |
| AI-written teasers & agent destination picks | `ANTHROPIC_API_KEY` |

### Not built yet
- **C3 — the AI master planner** (an LLM that *picks* the destinations and composes the story;
  today's master is deterministic).
- **C4 — the deal library** (pre-baked surprises refreshed offline, personalized live).
- **Open bundles** (non-surprise product mode).
- Real transfer & activities suppliers (estimates + manual ops for now).
- Passport-number encryption at rest (table is service-role-locked meanwhile).
- Production deployment (everything runs locally today).

---

## 5. The road to production

> Phases are ordered by dependency, not importance. Each has an owner column — fill it in.
> Rough sizing: ☕ = hours · 📅 = days · 🗓️ = week+

### Phase 1 — Turn the keys (make it real, in test mode) — 📅
*Goal: a real Duffel test order + Stripe test charge from a browser, fare cache filling nightly.*

- [ ] Get a **Duffel test key** (duffel.com → sign up → test token) → `apps/web/.env.local`, set `PROVIDER_MODE=sandbox` — **founder**
- [ ] Pick an **ops inbox** (e.g. `concierge@blindfold.travel`) → `OPS_CONTACT_EMAIL` + `OPS_CONTACT_PHONE` — **founder**
- [ ] **Stripe test keys** (3 values, see `.env.example`) — **founder**
- [ ] Run `npm run fares:refresh` once; confirm rows in `destination_fares` — ☕
- [ ] Add repo secrets (`DUFFEL_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) so the nightly cron runs — ☕
- [ ] **Step 5 E2E:** quiz → discovery deals → pay (Stripe test card) → real Duffel test order + hotel booking with passport data → verify refs/PII/reveal — 📅 (Claude, when keys land)
- [ ] Fix whatever the live wire shakes loose — 📅

### Phase 2 — The agentic brain (C3 + C4) — 🗓️
*Goal: the AI earns its keep — picks destinations with taste, writes copy people screenshot.*

- [ ] `ANTHROPIC_API_KEY` in env; verify copywriter rewrites teasers (leak-guard already live)
- [ ] **C3 master planner:** LLM reasons over the cache shortlist (vibe/occasion/season/surprise-quality), picks ~3 diverse destinations, dispatches specialists; bounded steps + hard latency ceiling; always degrades to the deterministic pipeline
- [ ] **C4 deal library:** pre-bake surprises across request buckets (party × budget × season × vibe) on a schedule; serve as seeds the live master personalizes; re-quote at checkout regardless
- [ ] Grow the universe toward ~80 airports; curate activities for the top ~15 sellers

### Phase 3 — Production hardening — 🗓️
*Goal: we'd let a stranger pay real money without holding our breath.*

**Security & privacy**
- [ ] Run a security review pass (`/security-review`) + fix findings
- [ ] Encrypt passport numbers at rest (pgcrypto or app-level), audit RLS policies once more
- [ ] Rate-limit `/api/deals` and `/api/book` (per-IP + per-user)
- [ ] Privacy policy + terms of service pages, cookie note, data-deletion path (GDPR-style even if not strictly required)
**Money & ops**
- [ ] Stripe live-mode review: statement descriptor, receipts, refunds runbook, dispute playbook
- [ ] Booking idempotency end-to-end audit (double-click, retry, webhook race)
- [ ] Define the refund/cancellation policy precisely (today: full refund until "locked" — define "locked")
- [ ] Ops runbook: what the concierge does per booking (airline emails, check-in handling, driver coordination, day-of issues), per secrecy mode
**Reliability**
- [ ] Error tracking (Sentry) + uptime monitor + log drain
- [ ] Supabase backups verified; restore drill once
- [ ] Load-test `/api/deals` (cache reads should fly; protect the fallback path)

### Phase 4 — Deployment — 📅
*Goal: blindfold.travel serves production traffic.*

- [ ] **Vercel** project for `apps/web` (it's a standard Next app; `transpilePackages` already set)
- [ ] **Two Supabase projects**: keep current one as *staging*, create *production* (run the 6 migrations, set RLS, regenerate types)
- [ ] Environment matrix: `.env` per environment — mock (local) / sandbox (staging) / live (prod)
- [ ] Domain: `blindfold.travel` → Vercel; `trips@blindfold.travel` verified in Resend
- [ ] Stripe webhook endpoint registered for prod URL (`/api/webhooks/stripe`)
- [ ] Google OAuth redirect URLs for prod domain (Supabase auth settings)
- [ ] Nightly fares cron pointed at prod DB; alert if it writes 0 rows
- [ ] **Duffel live application** — apply early, this has lead time: KYC, possibly card-on-file/IATA questions. Start the conversation in Phase 1. ⚠️
- [ ] CI gate: typecheck + tests + build must pass before deploy; preview deployments per PR
- [ ] Staging smoke test script (the Step-5 E2E, pointed at staging)

### Phase 5 — Launch & marketing — 🗓️ (overlaps everything above)
*Goal: 100 paying bookings without buying them all with ads.*

**Positioning**
- One-liner: *"Don't plan a holiday. Just go on one."*
- The hero content asset is the **reveal moment** — faces at the gate when the screen flips.
  Every piece of marketing funnels toward capturing and sharing that moment.

**Pre-launch (while Phases 1–4 run)**
- [ ] Landing page → waitlist (email capture lives on the existing homepage; add a form + Resend list)
- [ ] Instagram + TikTok handles; 2–3 posts/week: "guess where" teasers, packing-tip reels, behind-the-scenes of building the secrecy machine
- [ ] 5–10 **friends-and-family trips** at cost: every one produces a reveal video (with consent), a testimonial, and a bug list
- [ ] Press kit: the story ("an algorithm plans your surprise vacation; a human keeps the secret") for Israeli tech/lifestyle press (Geektime, Calcalist, Mako/Ynet lifestyle)

**Launch sequence**
1. **Soft launch:** waitlist gets first access + launch-week price (margin trimmed, not free — anchor the real price)
2. **Creator wave:** 3–5 mid-size Israeli travel/couple creators get a blindfold trip; deliverable = the reveal reel + a discount code (track per-creator conversion)
3. **Paid (only after organic signal):** Google Search on intent terms ("חופשה הפתעה", "surprise trip", "מתנה לחופשה"), Meta/TikTok retargeting on reveal-video viewers
4. **Referral loop:** "their reveal is your discount" — share your gate-reveal video, both sides get ₪X off

**Channels ranked by expected CAC (cheapest first):** referral/UGC → organic short-video → creators → search → paid social

**KPIs to watch weekly**
| Metric | Target to beat |
|---|---|
| Quiz starts → deals viewed | > 80% |
| Deals viewed → checkout started | > 12% |
| Checkout started → paid | > 40% |
| CAC vs. margin per booking | CAC < 50% of margin |
| Reveal-video share rate | > 25% of trips |
| NPS after the trip | > 60 |

### Phase 6 — Operate & iterate (post-launch, ongoing)
- [ ] Weekly metrics review against the table above
- [ ] Ops load check: minutes-of-human-work per booking (target: < 15 min; automate the worst offender each week)
- [ ] Open bundles mode when surprise volume is steady
- [ ] More origins (the engine is origin-parameterized; ATH or LCA could be origin #2)
- [ ] Seasonal catalog passes (curate what's selling, prune what isn't)

---

## 6. Risks & open questions — write answers in as we learn

| Risk | Why it matters | Current thinking |
|---|---|---|
| **Duffel live approval** takes longer than hoped | Blocks real money | Apply during Phase 1, not after |
| **Margins** (18% + ₪150ish fee) vs. CAC | Unit economics | Friends-and-family wave validates willingness-to-pay before ads spend |
| **The secret leaks anyway** (boarding pass at security, airline app) | Core promise | Ops playbook + "full surprise" mode handles email; physical boarding pass shows the city — manage expectations: the *reveal at the gate* is ours, security check is seconds before |
| **Ops doesn't scale** (concierge per booking) | Growth ceiling | Measure minutes/booking from trip one; automate or productize the top cost |
| **Refund policy abuse** (book, peek via airline, cancel) | Money leak | "Locked" definition + non-refundable window must precede paid marketing |
| **Seasonality** (TLV outbound is summer/holiday heavy) | Revenue lumps | Deal library (C4) lets us pre-bake shoulder-season value |
| **Visa/passport edge cases** (non-IL passports) | Bad trip = bad press | Nationality is already collected and visa-filtered; expand the visa matrix before marketing beyond IL passports |

---

## 7. Quick reference

```bash
npm install            # set up the monorepo
npm run dev            # web app on :3000 (mock mode works with zero keys)
npm test               # 52 tests: engine + agents
npm run fares:refresh  # fill the fare cache (needs DUFFEL_API_KEY)
npm run build          # production build + typecheck
```

| Thing | Where |
|---|---|
| Env template (every key explained) | `.env.example` |
| Architecture plan (discovery-first, Phase 0–D) | `.claude/plans/sourcing-discovery-first-architecture.md` |
| D-light milestone plan (real booking) | `.claude/plans/dlight-real-booking-plan.md` |
| Engine guardrails & conventions | `CLAUDE.md` |
| Supabase project (staging) | `xaeamdvhsemeynmmkexi` — 7 tables, RLS on |
| Admin console | `/admin` (dashboard, bookings, destinations, pricing, outbox, agent-runs, fares) |
| Dev sandbox (sealed-vs-revealed bundles) | `/dev/bundles` (404 in production) |
```
