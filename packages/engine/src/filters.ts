import type { Destination, TripParams } from "./types.ts";
import { monthIndexFromIso } from "./util.ts";

/**
 * Candidate generation — the "Destination Scout" rules. Keep only cities that
 * are reachable from the departure hub and satisfy the user's hard constraints
 * (visa, max flight time, avoided regions, temperature). Soft preferences
 * (vibe match) are handled later in scoring, not here.
 */
export function filterCandidates(
  destinations: Destination[],
  params: TripParams,
): Destination[] {
  const month = monthIndexFromIso(params.dates.start);
  const nationality = params.constraints?.nationality;
  const maxHours = params.constraints?.maxFlightHours;
  const avoid = new Set((params.constraints?.avoidRegions ?? []).map((r) => r.toLowerCase()));

  return destinations.filter((d) => {
    if (!d.active) return false;

    const hours = d.flightHoursFrom[params.departureAirport];
    if (hours == null) return false;
    if (maxHours != null && hours > maxHours) return false;

    if (nationality && !d.visaFreeFor.includes(nationality) && !d.visaFreeFor.includes("*")) {
      return false;
    }

    if (avoid.has(d.region.toLowerCase()) || avoid.has(d.country.toLowerCase())) {
      return false;
    }

    // Temperature preference is a hard-ish gate (keeps the surprise on-theme).
    const temp = d.climateByMonth[month] ?? 18;
    if (params.vibe?.temperature === "warm" && temp < 18) return false;
    if (params.vibe?.temperature === "cold" && temp > 16) return false;

    return true;
  });
}
