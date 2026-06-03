import type {
  Destination,
  TripParams,
  PricedComponents,
  SurpriseHints,
  ClimateBand,
  FlightBand,
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
  cold: "Pack warm — coat, layers, and something cozy for the evenings.",
  mild: "Bring layers and a light jacket; days are pleasant, evenings cooler.",
  warm: "Light clothes, sunglasses, and a hat — you'll want the sunscreen.",
  hot: "Beat the heat: breathable clothes, swimwear, and plenty of sunscreen.",
};

const VIBE_WORD: Record<string, string> = {
  beach: "sun-and-sea",
  city: "buzzing-streets",
  nature: "wide-open-nature",
  nightlife: "after-dark",
  culture: "history-soaked",
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

  const vibeWords = dest.vibeTags.map((t) => VIBE_WORD[t] ?? t).slice(0, 2).join(" & ");
  const teaser =
    `A ${cBand}, ${vibeWords} escape — ${components.hotel.stars}★ stays, ` +
    `${dest.attractionPackages[0]?.items.length ?? 3} curated experiences, ` +
    `and a ${fBand} flight away. Where exactly? That's the surprise.`;

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
