// The progressive-reveal state machine. Pure date math: given when someone
// flies, work out how much of the secret they're allowed to see right now.
//
//   booked  → just paid; hints only, destination hidden
//   teaser  → 7 days out; packing nudge, still no name
//   gate    → departure day; destination revealed
//   arrival → landed; hotel + driver revealed
//   complete→ trip over

export type RevealStage = "booked" | "teaser" | "gate" | "arrival" | "complete";

export const REVEAL_ORDER: RevealStage[] = ["booked", "teaser", "gate", "arrival", "complete"];

export function stageRank(stage: RevealStage): number {
  return REVEAL_ORDER.indexOf(stage);
}

/** True if `stage` is at least `min` along the reveal. */
export function stageAtLeast(stage: RevealStage, min: RevealStage): boolean {
  return stageRank(stage) >= stageRank(min);
}

export interface RevealSchedule {
  bookedAt: number;
  teaserAt: number;
  gateAt: number;
  arrivalAt: number;
  completeAt: number;
}

const DAY = 86_400_000;
const HOUR = 3_600_000;

/** Resolve a date-or-datetime ISO string to the outbound departure instant. */
function departureInstant(departureIso: string): number {
  const iso = departureIso.includes("T") ? departureIso : `${departureIso}T06:40:00`;
  return new Date(iso).getTime();
}

export function buildSchedule(input: {
  departureIso: string;
  flightHours: number;
  nights: number;
  bookedAtMs?: number;
}): RevealSchedule {
  const gateAt = departureInstant(input.departureIso);
  return {
    bookedAt: input.bookedAtMs ?? Date.now(),
    teaserAt: gateAt - 7 * DAY,
    gateAt,
    // Wheels-down plus a little time to reach the car.
    arrivalAt: gateAt + input.flightHours * HOUR + HOUR,
    completeAt: gateAt + input.nights * DAY + 18 * HOUR,
  };
}

export function stageAt(schedule: RevealSchedule, nowMs: number): RevealStage {
  if (nowMs >= schedule.completeAt) return "complete";
  if (nowMs >= schedule.arrivalAt) return "arrival";
  if (nowMs >= schedule.gateAt) return "gate";
  if (nowMs >= schedule.teaserAt) return "teaser";
  return "booked";
}

/** Milliseconds until the next stage unlocks, or null if fully revealed. */
export function msToNextStage(schedule: RevealSchedule, nowMs: number): number | null {
  const upcoming = [schedule.teaserAt, schedule.gateAt, schedule.arrivalAt, schedule.completeAt]
    .filter((t) => t > nowMs)
    .sort((a, b) => a - b);
  return upcoming.length ? upcoming[0]! - nowMs : null;
}
