// Small deterministic helpers so mock pricing is stable & reproducible
// (same params → same quotes → testable pipeline).

export function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG — deterministic stream from a numeric seed. */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic float in [min, max) seeded by an arbitrary key. */
export function seededRange(key: string, min: number, max: number): number {
  const r = seededRng(hashString(key))();
  return min + r * (max - min);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function monthIndexFromIso(iso: string): number {
  const m = Number(iso.slice(5, 7));
  return Number.isFinite(m) && m >= 1 && m <= 12 ? m - 1 : 0;
}

/** Total travelers, counting children. */
export function partySize(adults: number, childrenAges: number[]): number {
  return adults + childrenAges.length;
}

/** Hour-of-day (0..23) from an ISO datetime like "2026-07-10T06:40:00". */
export function hourFromIso(iso: string): number {
  const h = Number(iso.slice(11, 13));
  return Number.isFinite(h) ? h : 12;
}

/**
 * A flight is a "red-eye" if it leaves very early (before 06:00) or the return
 * lands you home late at night (departs 23:00 or later). Used to honor the
 * traveler's "no harsh red-eyes" preference.
 */
export function isRedeye(outboundDepartIso: string, inboundDepartIso: string): boolean {
  return hourFromIso(outboundDepartIso) < 6 || hourFromIso(inboundDepartIso) >= 23;
}
