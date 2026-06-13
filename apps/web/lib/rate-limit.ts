import "server-only";

// Minimal per-instance sliding-window rate limiter for the public APIs.
// In-memory by design: good against casual abuse and runaway loops on a
// single instance. At real scale (multi-instance serverless) swap the Map
// for a shared store (e.g. Upstash Redis) behind this same function.

const hits = new Map<string, number[]>();
let lastSweep = Date.now();

/** True when this key is allowed another request in the window. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  // Occasional sweep so abandoned keys don't accumulate forever.
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, times] of hits) {
      if (times.every((t) => now - t > windowMs)) hits.delete(k);
    }
  }

  const times = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (times.length >= limit) {
    hits.set(key, times);
    return false;
  }
  times.push(now);
  hits.set(key, times);
  return true;
}

/** Best-effort client identity for rate-limit keys. */
export function clientKey(req: Request, scope: string): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0]!.trim() : "local";
  return `${scope}:${ip}`;
}
