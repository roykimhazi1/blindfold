import "server-only";
import type { CachedFare, TripParams } from "@sv/engine";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Load cached fares covering the trip's window: exact nights, departure within
 * the flex window (±flexDays for flexible trips), not expired. Returns [] when
 * the cache is empty, stale, or the table doesn't exist yet — callers fall
 * back to the catalog pipeline, so discovery degrades silently.
 */
export async function loadFaresForWindow(params: TripParams): Promise<CachedFare[]> {
  const flex = params.dates.mode === "flexible" ? (params.dates.flexDays ?? 3) : 0;
  const from = addDays(params.dates.start, -flex);
  const to = addDays(params.dates.start, flex);

  try {
    const supa = supabaseAdmin();
    const { data, error } = await supa
      .from("destination_fares")
      .select("destination_airport, depart_date, nights, cheapest_total_eur, carrier, direct, duration_hours, expires_at")
      .eq("origin", params.departureAirport)
      .eq("nights", params.dates.nights)
      .gte("depart_date", from)
      .lte("depart_date", to)
      .gt("expires_at", new Date().toISOString())
      .order("cheapest_total_eur", { ascending: true })
      .limit(400);
    if (error || !data) return [];

    return data.map((r) => ({
      airport: r.destination_airport,
      departDate: r.depart_date,
      nights: r.nights,
      totalEur: Number(r.cheapest_total_eur),
      carrier: r.carrier ?? undefined,
      direct: r.direct,
      durationHours: r.duration_hours == null ? undefined : Number(r.duration_hours),
      expiresAt: r.expires_at,
    }));
  } catch {
    return []; // cache unavailable (e.g. table not migrated yet) — fall back
  }
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
