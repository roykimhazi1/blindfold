import type {
  Destination,
  TripParams,
  PricedComponents,
  SurpriseHints,
  ClimateBand,
  FlightBand,
  Occasion,
} from "./types.ts";
import { monthIndexFromIso } from "./util.ts";

export function climateBand(tempC: number): ClimateBand {
  if (tempC < 12) return "cold";
  if (tempC < 20) return "mild";
  if (tempC < 27) return "warm";
  return "hot";
}

export function flightBand(hours: number): FlightBand {
  if (hours < 2) return "short";
  if (hours < 4) return "medium";
  return "long";
}

const PACKING_TIP: Record<ClimateBand, string> = {
  cold: "Bring the warm coat. Trust us on this one.",
  mild: "A light jacket for the evenings. The days take care of themselves.",
  warm: "Sunglasses, light layers, and the sunscreen you always forget.",
  hot: "Pack light, pack a swimsuit, and double up on the sunscreen.",
};

const VIBE_WORD: Record<string, string> = {
  beach: "salt-in-the-air",
  city: "big-city",
  nature: "wide-open",
  nightlife: "up-past-midnight",
  culture: "old-streets",
};

const FLIGHT_PHRASE: Record<FlightBand, string> = {
  short: "a quick hop",
  medium: "a short flight",
  long: "a few hours in the air",
};

const CLIMATE_WORD: Record<ClimateBand, string> = {
  cold: "crisp",
  mild: "mild",
  warm: "warm",
  hot: "hot",
};

// Occasion sets the teaser's opening note. Leak-safe by construction — these
// only color the tone, never name a place.
const OCCASION_LEAD: Record<Occasion, string> = {
  anniversary: "A romantic",
  honeymoon: "A dreamy",
  birthday: "A birthday-worthy",
  celebration: "A celebratory",
  treat: "A well-earned",
  getaway: "A",
};

export function buildHints(
  dest: Destination,
  params: TripParams,
  components: PricedComponents,
): SurpriseHints {
  const month = monthIndexFromIso(params.dates.start);
  const temp = dest.climateByMonth[month] ?? 18;
  const cBand = climateBand(temp);
  const fBand = flightBand(components.flight.durationHours);
  const reveal = params.surpriseIntensity === "region";

  const vibeWords = dest.vibeTags.map((t) => VIBE_WORD[t] ?? t).slice(0, 2).join(", ");
  // "A warm, big-city kind of trip" / "A dreamy, warm, big-city kind of trip".
  const lead = params.occasion ? `${OCCASION_LEAD[params.occasion]},` : "A";
  const teaser =
    `${lead} ${CLIMATE_WORD[cBand]}, ${vibeWords} kind of trip: ` +
    `a ${components.hotel.stars}★ bed, ` +
    `${dest.attractionPackages[0]?.items.length ?? 3} things already lined up for you, ` +
    `and ${FLIGHT_PHRASE[fBand]} to get there. The where stays our secret.`;

  return {
    climateBand: cBand,
    flightBand: fBand,
    vibeTags: dest.vibeTags,
    packingTip: PACKING_TIP[cBand],
    starBand: components.hotel.stars,
    attractionCount: components.attractions.items.length,
    region: reveal ? dest.region : undefined,
    teaser,
  };
}

// Common words that happen to be capitalized inside attraction items but are
// far too generic to count as a destination leak (avoids false positives).
const GENERIC_LANDMARK_WORDS = new Set([
  "palace", "castle", "tour", "town", "old", "city", "museum", "museums",
  "beach", "sea", "river", "cruise", "walk", "park", "day", "trip", "food",
  "evening", "dinner", "wine", "region", "tasting", "guided", "visit",
  "history", "square", "avenue", "market", "complex", "temple", "church",
  "gardens", "island", "canal", "bridge", "quarter", "district", "village",
]);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsWord(haystackLower: string, termLower: string): boolean {
  // Whole-word / phrase match so "cape" never matches inside "escape".
  return new RegExp(`\\b${escapeRegex(termLower)}\\b`).test(haystackLower);
}

/**
 * Leak-check: surprise hints must never disclose the destination. Returns the
 * list of offending terms found (empty = safe). Run on every user-facing hint
 * string before it leaves the server. Matches on whole words/phrases — a
 * landmark like "Cape" must not trip on the word "escape".
 */
export function findLeaks(dest: Destination, text: string): string[] {
  const haystack = text.toLowerCase();
  // Full-name phrases that must never appear. (Airport codes are excluded —
  // three-letter codes like "HER" would false-match common words like "her".)
  const phrases = [dest.city, dest.country];
  // Proper-noun landmark words from attraction items (skip short/generic ones).
  const landmarkWords = dest.attractionPackages
    .flatMap((p) => p.items.join(" ").split(/[^a-zA-Z]+/))
    .filter((w) => w.length > 3 && /^[A-Z]/.test(w))
    .filter((w) => !GENERIC_LANDMARK_WORDS.has(w.toLowerCase()));

  const offenders = new Set<string>();
  for (const term of [...phrases, ...landmarkWords]) {
    const t = term.toLowerCase().trim();
    if (t.length > 2 && containsWord(haystack, t)) offenders.add(term);
  }
  return [...offenders];
}

/**
 * Catalog-wide leak-check: copy must not name ANY real destination we operate,
 * not just the one being sold. Guards against a model mentioning a different
 * city by name. Pass the active catalog's destinations.
 */
export function findCatalogLeaks(text: string, catalog: Destination[]): string[] {
  const haystack = text.toLowerCase();
  const offenders = new Set<string>();
  for (const d of catalog) {
    for (const phrase of [d.city, d.country]) {
      const t = phrase.toLowerCase().trim();
      if (t.length > 2 && containsWord(haystack, t)) offenders.add(phrase);
    }
  }
  return [...offenders];
}

export function assertNoLeaks(hints: SurpriseHints, dest: Destination): void {
  const surfaces = [hints.teaser, hints.packingTip];
  for (const s of surfaces) {
    const leaks = findLeaks(dest, s);
    if (leaks.length) {
      throw new Error(
        `Surprise hint leaked destination info for ${dest.id}: ${leaks.join(", ")}`,
      );
    }
  }
}
