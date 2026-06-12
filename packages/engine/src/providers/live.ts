import type {
  Providers,
  FlightProvider,
  HotelProvider,
  Destination,
  TripParams,
  FlightQuote,
  HotelQuote,
} from "../types.ts";
import { mockProviders } from "./mock.ts";
import { round2, partySize } from "../util.ts";
import { STAY_COORDS } from "./stay-locations.ts";

// ── Live supplier adapters ───────────────────────────────────────────
// Real flight/hotel adapters behind the same `Providers` interface the engine
// already talks to. Each method tries the live API when its key is set, and
// falls back to the deterministic mock on any miss — so `sandbox`/`live` mode
// never breaks the product before credentials (or the SDKs) are in place.

function env(name: string): string | undefined {
  return typeof process !== "undefined" ? process.env?.[name] : undefined;
}

// Approximate EUR conversion for supplier-returned currencies.
const TO_EUR: Record<string, number> = {
  EUR: 1, USD: 0.926, GBP: 1.17, ILS: 0.247, AED: 0.252, EGP: 0.018,
};

function toEur(amount: number, currency: string): number {
  return round2(amount * (TO_EUR[currency] ?? 1));
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── Duffel flights ───────────────────────────────────────────────────

async function duffelPost(path: string, apiKey: string, body: unknown) {
  const res = await fetch(`https://api.duffel.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Duffel-Version": "v2",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Duffel ${path} → ${res.status}`);
  return res.json();
}

async function duffelGet(path: string, apiKey: string) {
  const res = await fetch(`https://api.duffel.com${path}`, {
    headers: { Authorization: `Bearer ${apiKey}`, "Duffel-Version": "v2" },
  });
  if (!res.ok) throw new Error(`Duffel GET ${path} → ${res.status}`);
  return res.json();
}

const duffelFlights: FlightProvider = {
  async quote(dest: Destination, params: TripParams): Promise<FlightQuote | null> {
    const apiKey = env("DUFFEL_API_KEY");
    if (!apiKey) return mockProviders.flights.quote(dest, params);
    try {
      const departDate = params.dates.start;
      const returnDate = addDays(departDate, params.dates.nights);

      const passengers = [
        ...Array.from({ length: params.travelers.adults }, () => ({ type: "adult" })),
        ...params.travelers.childrenAges.map((age) => ({
          type: age < 2 ? "infant_without_seat" : "child",
          age,
        })),
      ];

      // Step 1: create an offer request
      const orBody = {
        data: {
          slices: [
            { origin: params.departureAirport, destination: dest.airport, departure_date: departDate },
            { origin: dest.airport, destination: params.departureAirport, departure_date: returnDate },
          ],
          passengers,
          cabin_class: "economy",
        },
      };
      const orResp = await duffelPost("/air/offer_requests?return_offers=false", apiKey, orBody) as { data: { id: string } };
      const offerRequestId: string = orResp.data.id;

      // Step 2: list offers (cheapest first, direct only)
      const offersResp = await duffelGet(
        `/air/offers?offer_request_id=${offerRequestId}&sort=total_amount&limit=5&max_connections=0`,
        apiKey,
      ) as { data?: unknown[] };
      const offers: unknown[] = offersResp.data ?? [];
      if (!offers.length) return mockProviders.flights.quote(dest, params);

      const best = offers[0] as {
        id: string;
        total_amount: string;
        total_currency: string;
        passengers?: Array<{ id: string }>;
        slices: Array<{
          segments: Array<{
            marketing_carrier: { iata_code: string };
            departing_at: string;
            arriving_at: string;
          }>;
        }>;
      };

      const totalEur = toEur(parseFloat(best.total_amount), best.total_currency);
      const outSlice = best.slices[0];
      if (!outSlice) return mockProviders.flights.quote(dest, params);
      const outSeg = outSlice.segments[0];
      const lastSeg = outSlice.segments[outSlice.segments.length - 1];
      if (!outSeg || !lastSeg) return mockProviders.flights.quote(dest, params);

      const durationHours = round2(
        (new Date(lastSeg.arriving_at).getTime() - new Date(outSeg.departing_at).getTime()) / 3_600_000,
      );

      return {
        destinationId: dest.id,
        carrier: outSeg.marketing_carrier.iata_code,
        outboundDepartIso: outSeg.departing_at,
        inboundDepartIso: `${returnDate}T07:00:00`,
        durationHours: durationHours || (dest.flightHoursFrom[params.departureAirport] ?? 3),
        totalPrice: totalEur,
        supplier: {
          offerId: best.id,
          passengerIds: best.passengers?.map((p) => p.id),
          totalAmount: best.total_amount,
          currency: best.total_currency,
        },
      };
    } catch {
      return mockProviders.flights.quote(dest, params);
    }
  },
};

// ── Duffel Stays hotels ──────────────────────────────────────────────
// Same DUFFEL_API_KEY as flights (one supplier account, one passenger model).
// Search is geo-based: city-centre coordinates from STAY_COORDS + a small
// radius. Falls back to the deterministic mock when the key or coordinates
// are missing, or on any API miss.

/** Raw shape of one Stays search result (the fields we read). */
export interface StaysSearchResult {
  cheapest_rate_total_amount?: string;
  cheapest_rate_currency?: string;
  accommodation?: {
    name?: string;
    rating?: number;
    rooms?: Array<{
      rates?: Array<{ id?: string; total_amount?: string; total_currency?: string }>;
    }>;
  };
}

/** The cheapest bookable rate across an accommodation's rooms (rat_… id). */
function cheapestRate(r: StaysSearchResult): { id?: string; total_amount?: string; total_currency?: string } | undefined {
  const rates = (r.accommodation?.rooms ?? []).flatMap((room) => room.rates ?? []);
  return rates
    .filter((rate) => rate.id && rate.total_amount)
    .sort((a, b) => parseFloat(a.total_amount!) - parseFloat(b.total_amount!))[0];
}

/**
 * Map Duffel Stays search results to ranked HotelQuotes, cheapest first.
 * Results below the requested star floor are dropped when a rating is
 * present; if the floor would empty the list, the unfiltered list is used
 * (a cheap stay beats no stay). Pure — unit-tested without the network.
 */
export function mapStaysResults(
  dest: Destination,
  params: TripParams,
  results: StaysSearchResult[],
): HotelQuote[] {
  const minStars = params.hotel?.minStars;
  const usable = results.filter(
    (r) => r.cheapest_rate_total_amount && r.cheapest_rate_currency && r.accommodation?.name,
  );
  const starred = minStars
    ? usable.filter((r) => (r.accommodation?.rating ?? 0) >= minStars)
    : usable;
  const pool = starred.length > 0 ? starred : usable;

  return pool
    .map((r) => {
      const rate = cheapestRate(r);
      return {
        destinationId: dest.id,
        name: r.accommodation!.name!,
        stars: r.accommodation?.rating ?? minStars ?? 3,
        board: params.hotel?.board ?? "breakfast",
        roomType: params.hotel?.roomType ?? ("double" as HotelQuote["roomType"]),
        nights: params.dates.nights,
        totalPrice: toEur(parseFloat(r.cheapest_rate_total_amount!), r.cheapest_rate_currency!),
        supplier: rate?.id
          ? {
              rateId: rate.id,
              totalAmount: rate.total_amount,
              currency: rate.total_currency ?? r.cheapest_rate_currency,
            }
          : undefined,
      };
    })
    .sort((a, b) => a.totalPrice - b.totalPrice);
}

async function staysSearch(dest: Destination, params: TripParams): Promise<HotelQuote[] | null> {
  const apiKey = env("DUFFEL_API_KEY");
  const coords = STAY_COORDS[dest.id];
  if (!apiKey || !coords) return null;
  try {
    const checkIn = params.dates.start;
    const checkOut = addDays(checkIn, params.dates.nights);
    const pax = partySize(params.travelers.adults, params.travelers.childrenAges);
    const guests = [
      ...Array.from({ length: params.travelers.adults }, () => ({ type: "adult" })),
      ...params.travelers.childrenAges.map((age) => ({ type: "child", age })),
    ];

    const body = {
      data: {
        location: { radius: 5, geographic_coordinates: coords },
        check_in_date: checkIn,
        check_out_date: checkOut,
        guests,
        rooms: Math.max(1, Math.ceil(pax / 2)),
      },
    };
    const resp = await duffelPost("/stays/search", apiKey, body) as { data?: { results?: StaysSearchResult[] } };
    const quotes = mapStaysResults(dest, params, resp.data?.results ?? []);
    return quotes.length > 0 ? quotes : null;
  } catch {
    return null;
  }
}

const duffelStays: HotelProvider = {
  async quote(dest: Destination, params: TripParams): Promise<HotelQuote | null> {
    const quotes = await staysSearch(dest, params);
    return quotes?.[0] ?? mockProviders.hotels.quote(dest, params);
  },

  // Cheapest-first top offers so search()[0] equals quote() — the convention
  // the deterministic pipeline and the Hotel specialist both rely on.
  async search(dest: Destination, params: TripParams): Promise<HotelQuote[]> {
    const quotes = await staysSearch(dest, params);
    if (quotes) return quotes.slice(0, 4);
    return mockProviders.hotels.search?.(dest, params) ?? [];
  },
};

/**
 * The live provider set. Flights use real Duffel offers and hotels use real
 * Duffel Stays (both behind the same key, each with per-call mock fallback);
 * transfers and attractions stay on the mock providers until their supplier
 * adapters are wired the same way.
 */
export const liveProviders: Providers = {
  flights: duffelFlights,
  hotels: duffelStays,
  transfers: mockProviders.transfers,
  attractions: mockProviders.attractions,
};
