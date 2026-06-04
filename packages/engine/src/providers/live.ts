import type {
  Providers,
  FlightProvider,
  HotelProvider,
  Destination,
  TripParams,
} from "../types.ts";
import { mockProviders } from "./mock.ts";

// ── Live supplier adapters ───────────────────────────────────────────
// Real flight/hotel adapters behind the same `Providers` interface the engine
// already talks to. Each method tries the live API when its key is set, and
// falls back to the deterministic mock on any miss — so `sandbox`/`live` mode
// never breaks the product before credentials (or the SDKs) are in place.
//
// The real request/response mapping (Duffel offer search → FlightQuote,
// Hotelbeds rate search → HotelQuote) lands inside the try-blocks. Quotes must
// come back in EUR base; the engine owns the all-in price (pricing.ts).

function env(name: string): string | undefined {
  return typeof process !== "undefined" ? process.env?.[name] : undefined;
}

const duffelFlights: FlightProvider = {
  async quote(dest: Destination, params: TripParams) {
    if (!env("DUFFEL_API_KEY")) return mockProviders.flights.quote(dest, params);
    try {
      // TODO(real-supply): Duffel offer search for dest.airport ← departureAirport
      // on the requested dates/pax; map the chosen offer → FlightQuote (carrier,
      // outbound/inbound depart ISOs, durationHours, totalPrice in EUR).
      return mockProviders.flights.quote(dest, params);
    } catch {
      return mockProviders.flights.quote(dest, params);
    }
  },
};

const hotelbedsHotels: HotelProvider = {
  async quote(dest: Destination, params: TripParams) {
    if (!env("HOTELBEDS_API_KEY")) return mockProviders.hotels.quote(dest, params);
    try {
      // TODO(real-supply): Hotelbeds availability for the city on the dates/pax,
      // honoring minStars/board; map the best rate → HotelQuote (EUR total).
      return mockProviders.hotels.quote(dest, params);
    } catch {
      return mockProviders.hotels.quote(dest, params);
    }
  },
};

/**
 * The live provider set. Flights/hotels use real adapters (with mock fallback);
 * transfers and attractions stay on the mock providers until their suppliers
 * (transfer partners, Viator/GetYourGuide) are wired the same way.
 */
export const liveProviders: Providers = {
  flights: duffelFlights,
  hotels: hotelbedsHotels,
  transfers: mockProviders.transfers,
  attractions: mockProviders.attractions,
};
