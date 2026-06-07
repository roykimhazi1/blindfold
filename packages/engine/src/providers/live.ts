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
import { round2 } from "../util.ts";

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
        total_amount: string;
        total_currency: string;
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
      };
    } catch {
      return mockProviders.flights.quote(dest, params);
    }
  },
};

// ── Hotelbeds hotels ─────────────────────────────────────────────────
// Hotelbeds requires both an API key and a secret for HMAC authentication,
// plus a destination code mapping (Hotelbeds uses its own codes, not IATA).
// The real implementation is ready to plug in once HOTELBEDS_API_KEY and
// HOTELBEDS_SECRET are set and the destination → Hotelbeds code map is added
// to the catalog. Until then, falls back to the deterministic mock.

const hotelbedsHotels: HotelProvider = {
  async quote(dest: Destination, params: TripParams): Promise<HotelQuote | null> {
    const apiKey = env("HOTELBEDS_API_KEY");
    const secret = env("HOTELBEDS_SECRET");
    if (!apiKey || !secret) return mockProviders.hotels.quote(dest, params);
    try {
      const ts = Math.floor(Date.now() / 1000).toString();
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey + secret + ts);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const signature = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const checkIn = params.dates.start;
      const checkOut = addDays(checkIn, params.dates.nights);
      const adults = params.travelers.adults;
      const rooms = Math.ceil(adults / 2);

      const url = new URL("https://api.hotelbeds.com/hotel-api/1.0/hotels");
      url.searchParams.set("checkIn", checkIn);
      url.searchParams.set("checkOut", checkOut);
      url.searchParams.set("destinationCode", dest.airport); // approximate — real impl needs Hotelbeds dest code
      url.searchParams.set("occupancies[0].rooms", String(rooms));
      url.searchParams.set("occupancies[0].adults", String(adults));

      const res = await fetch(url.toString(), {
        headers: {
          "Api-key": apiKey,
          "X-Signature": signature,
          Accept: "application/json",
        },
      });
      if (!res.ok) return mockProviders.hotels.quote(dest, params);

      const json = await res.json() as { hotels?: { hotels?: unknown[] } };
      const hotels: unknown[] = json.hotels?.hotels ?? [];
      if (!hotels.length) return mockProviders.hotels.quote(dest, params);

      const best = hotels[0] as {
        minRate: string;
        currency: string;
        categoryCode: string;
        name: string;
      };
      const stars = parseInt(best.categoryCode) || (params.hotel?.minStars ?? 4);
      const totalEur = toEur(parseFloat(best.minRate), best.currency);

      return {
        destinationId: dest.id,
        name: best.name,
        stars,
        board: params.hotel?.board ?? "breakfast",
        roomType: params.hotel?.roomType ?? "double",
        nights: params.dates.nights,
        totalPrice: totalEur,
      };
    } catch {
      return mockProviders.hotels.quote(dest, params);
    }
  },
};

/**
 * The live provider set. Flights use real Duffel (with mock fallback);
 * hotels use real Hotelbeds when both API key + secret are set (with mock
 * fallback); transfers and attractions stay on the mock providers until their
 * supplier adapters are wired the same way.
 */
export const liveProviders: Providers = {
  flights: duffelFlights,
  hotels: hotelbedsHotels,
  transfers: mockProviders.transfers,
  attractions: mockProviders.attractions,
};
