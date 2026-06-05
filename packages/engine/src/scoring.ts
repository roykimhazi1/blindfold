import type {
  Destination,
  TripParams,
  PricedComponents,
  PriceBreakdown,
  VibeType,
  Priority,
} from "./types.ts";
import { monthIndexFromIso } from "./util.ts";

// "If we nail one thing…" — each priority maps to the destination vibe tag that
// best delivers it, so the single must-nail answer can nudge the ranking.
const PRIORITY_VIBE: Record<Priority, VibeType> = {
  view: "nature",
  food: "culture",
  switchoff: "beach",
  nightlife: "nightlife",
  walkable: "city",
};

function priorityScore(dest: Destination, params: TripParams): number {
  if (!params.mustNail) return 0.5; // neutral — doesn't distort the base ranking
  return dest.vibeTags.includes(PRIORITY_VIBE[params.mustNail]) ? 1 : 0.3;
}

/**
 * Score a candidate 0..1. Higher is better. Blends value-for-money, how well
 * the destination matches the requested vibe/climate, and a "surprise delight"
 * novelty nudge. This is the deterministic ranking the agents feed into.
 */
export function scoreOption(
  dest: Destination,
  params: TripParams,
  components: PricedComponents,
  breakdown: PriceBreakdown,
  ceilingEur: number,
): number {
  // Value: how much budget headroom remains (cheaper-but-complete scores well),
  // gently — we don't want to always pick the rock-bottom option.
  const headroom = Math.max(0, Math.min(1, (ceilingEur - breakdown.total) / ceilingEur));
  const value = 0.5 + 0.5 * (1 - Math.abs(headroom - 0.15) / 0.85);

  // Vibe match: overlap between requested vibe types and destination tags.
  let vibe = 0.6;
  if (params.vibe?.types?.length) {
    const wanted = new Set(params.vibe.types);
    const overlap = dest.vibeTags.filter((t) => wanted.has(t)).length;
    vibe = Math.min(1, 0.3 + overlap / params.vibe.types.length);
  }

  // Climate match against requested temperature.
  const temp = dest.climateByMonth[monthIndexFromIso(params.dates.start)] ?? 18;
  let climate = 0.7;
  if (params.vibe?.temperature === "warm") climate = Math.min(1, temp / 28);
  else if (params.vibe?.temperature === "cold") climate = Math.min(1, (22 - temp) / 22);

  // Hotel quality bonus when it beats the requested floor.
  const starBonus = Math.min(1, components.hotel.stars / 5);

  // The one must-nail priority (neutral when the user didn't pick one).
  const priority = priorityScore(dest, params);

  return Number(
    (0.38 * value + 0.27 * vibe + 0.18 * climate + 0.09 * starBonus + 0.08 * priority).toFixed(4),
  );
}

/**
 * Diversity selection — pick the top `n` options that are meaningfully
 * different (distinct region and vibe where possible) so the 3 choices feel
 * like a real decision rather than three near-identical trips.
 */
export function selectDiverse<T extends { destination: Destination; score: number }>(
  ranked: T[],
  n: number,
): T[] {
  const sorted = [...ranked].sort((a, b) => b.score - a.score);
  const picked: T[] = [];
  const usedRegions = new Set<string>();
  const usedPrimaryVibe = new Set<string>();

  for (const opt of sorted) {
    if (picked.length >= n) break;
    const region = opt.destination.region;
    const primaryVibe = opt.destination.vibeTags[0] ?? "";
    if (usedRegions.has(region) && usedPrimaryVibe.has(primaryVibe)) continue;
    picked.push(opt);
    usedRegions.add(region);
    usedPrimaryVibe.add(primaryVibe);
  }

  // Backfill if diversity constraints left us short.
  if (picked.length < n) {
    for (const opt of sorted) {
      if (picked.length >= n) break;
      if (!picked.includes(opt)) picked.push(opt);
    }
  }
  return picked.slice(0, n);
}
