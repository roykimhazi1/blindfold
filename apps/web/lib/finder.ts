// ── Discovery agents (dev preview) ───────────────────────────────────
// A flight-finder + hotel-finder + master, built to consume the live
// flight/hotel search MCP. At dev time we drive the MCP and feed the
// normalized results in via `finder-fixture.ts`; in production the same
// shapes come from a server-side supplier call. The agents only *rank and
// pair* — pricing/curation logic lives here, in code.

export interface UserPrefs {
  origin: string; // IATA, e.g. "TLV"
  adults: number;
  departDate: string; // YYYY-MM-DD
  returnDate: string;
  nights: number;
  budgetUsd: number; // all-in for the whole party
  vibe: string[]; // ["beach","city"]
  carryOnOnly: boolean; // the "need luggage?" answer — true = no checked bag
  avoidDestinations: string[]; // cities/countries the user does NOT want
  currency: string;
}

/** A normalized round-trip option (party total), as the flight agent sees it. */
export interface FlightOption {
  destCity: string;
  destCode: string; // IATA
  destCountry: string;
  carrier: string;
  stops: number; // worst of the two slices
  outboundDepart: string; // "7:55 PM"
  outboundArrive: string;
  returnDepart: string;
  durationLabel: string; // "2h 10m" or "1 stop · 5h 25m"
  carryOnIncluded: boolean; // from the fare's baggage policy
  totalPriceUsd: number; // round trip, whole party
  refundable: boolean;
  redEye: boolean;
}

export interface FlightDeal extends FlightOption {
  fitScore: number;
  fitReasons: string[];
}

export interface HotelOption {
  name: string;
  starRating: number;
  guestRating: number; // 0..10
  reviews: number;
  nightlyUsd: number;
  totalUsd: number; // whole stay
}

export interface Bundle {
  destCity: string;
  destCountry: string;
  flight: FlightDeal;
  hotels: HotelOption[];
  estFromUsd: number; // flight + cheapest matched hotel
}

// ── Flight agent ─────────────────────────────────────────────────────

/**
 * Rank flight options against the user's preferences and return the N best,
 * spread across destinations (≤2 per city). The carry-on answer is decisive
 * for a carry-on-only traveller; stops, timing and price round it out.
 */
export function rankFlightDeals(prefs: UserPrefs, options: FlightOption[], n = 10): FlightDeal[] {
  const avoid = new Set(prefs.avoidDestinations.map((a) => a.toLowerCase()));
  const eligible = options.filter(
    (o) => !avoid.has(o.destCity.toLowerCase()) && !avoid.has(o.destCountry.toLowerCase()),
  );
  const scored = eligible.map((o) => scoreFlight(prefs, o)).sort((a, b) => b.fitScore - a.fitScore);

  const perCity = new Map<string, number>();
  const out: FlightDeal[] = [];
  for (const d of scored) {
    const taken = perCity.get(d.destCode) ?? 0;
    if (taken >= 2) continue;
    perCity.set(d.destCode, taken + 1);
    out.push(d);
    if (out.length >= n) break;
  }
  return out;
}

function scoreFlight(prefs: UserPrefs, o: FlightOption): FlightDeal {
  const reasons: string[] = [];
  let score = 100;

  // Price: a flight that eats most of the budget leaves no room for the hotel.
  const flightCeil = prefs.budgetUsd * 0.5;
  score -= (o.totalPriceUsd / flightCeil) * 35;
  if (o.totalPriceUsd <= flightCeil * 0.6) reasons.push("great price");

  // Luggage: the decisive factor when the traveller is carry-on only.
  if (prefs.carryOnOnly) {
    if (o.carryOnIncluded) {
      score += 18;
      reasons.push("carry-on included");
    } else {
      score -= 22;
      reasons.push("carry-on not included — adds a bag fee");
    }
  }

  if (o.stops === 0) {
    score += 14;
    reasons.push("nonstop");
  } else {
    score -= 8 * o.stops;
    reasons.push(`${o.stops} stop${o.stops > 1 ? "s" : ""}`);
  }

  if (o.redEye) {
    score -= 10;
    reasons.push("red-eye timing");
  } else {
    reasons.push("civilised times");
  }

  if (!o.refundable) reasons.push("non-refundable");

  return { ...o, fitScore: Math.round(score), fitReasons: reasons };
}

// ── Hotel agent ──────────────────────────────────────────────────────

/** Pick the best-matched hotels for a destination within the leftover budget. */
export function matchHotels(
  prefs: UserPrefs,
  flightPriceUsd: number,
  hotels: HotelOption[],
  count = 3,
): HotelOption[] {
  const remaining = Math.max(0, prefs.budgetUsd - flightPriceUsd);
  return [...hotels]
    .map((h) => ({
      h,
      score: h.guestRating * 10 - (h.totalUsd > remaining ? 30 : 0) - h.totalUsd / 100,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((x) => x.h);
}

// ── Master ───────────────────────────────────────────────────────────

/**
 * From the ranked flight deals + hotels per destination, assemble a basic
 * bundle (best flight + 2–3 matched hotels) for each of the top distinct
 * destinations — the back-and-forth between master and the two finders.
 */
export function buildBundles(
  prefs: UserPrefs,
  deals: FlightDeal[],
  hotelsByDest: Record<string, HotelOption[]>,
  maxBundles = 3,
): Bundle[] {
  const bundles: Bundle[] = [];
  const seen = new Set<string>();
  for (const deal of deals) {
    if (seen.has(deal.destCode)) continue;
    const hotels = hotelsByDest[deal.destCode];
    if (!hotels || hotels.length === 0) continue;
    seen.add(deal.destCode);
    const matched = matchHotels(prefs, deal.totalPriceUsd, hotels);
    const cheapest = Math.min(...matched.map((h) => h.totalUsd));
    bundles.push({
      destCity: deal.destCity,
      destCountry: deal.destCountry,
      flight: deal,
      hotels: matched,
      estFromUsd: Math.round(deal.totalPriceUsd + cheapest),
    });
    if (bundles.length >= maxBundles) break;
  }
  return bundles;
}
