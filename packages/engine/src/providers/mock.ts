import type {
  Providers,
  Destination,
  TripParams,
  FlightQuote,
  HotelQuote,
  TransferQuote,
  AttractionQuote,
} from "../types.ts";
import {
  seededRange,
  round2,
  monthIndexFromIso,
  partySize,
} from "../util.ts";

// Deterministic mock providers. Prices in EUR (base currency). Every quote is
// a pure function of (destination, params), so the same search always yields
// the same numbers — which keeps the pipeline reproducible and unit-testable.
// These mirror the shape of the real Duffel/Hotelbeds/transfer adapters that
// replace them in Phase 5.

const STAR_NIGHTLY_EUR: Record<number, number> = {
  1: 45,
  2: 65,
  3: 95,
  4: 150,
  5: 260,
};

function chooseStars(dest: Destination, params: TripParams): number {
  const min = params.hotel?.minStars ?? 3;
  // Nudge a little by destination so options differ, but never below the floor.
  const bump = seededRange(`stars:${dest.id}`, 0, 1) > 0.6 ? 1 : 0;
  return Math.min(5, Math.max(min, min + bump));
}

// Plausible departure hours, varied per destination so flight times differ
// (and some land in the red-eye window — see `isRedeye`). 03:00/05:00 outbound
// and a 23:00 return are the "harsh" ones the avoid-redeye preference drops.
const OUTBOUND_HOURS = [3, 5, 7, 9, 11, 14];
const INBOUND_HOURS = [16, 18, 20, 21, 23];
const hh = (n: number) => String(n).padStart(2, "0");

const mockFlights = {
  async quote(dest: Destination, params: TripParams): Promise<FlightQuote | null> {
    const hours = dest.flightHoursFrom[params.departureAirport];
    if (hours == null) return null; // not reachable from this hub

    const pax = partySize(params.travelers.adults, params.travelers.childrenAges);
    const month = monthIndexFromIso(params.dates.start);
    const seasonal = 1 + 0.25 * Math.sin(((month - 5) / 12) * Math.PI * 2); // peak ~summer
    const perPax = 45 + hours * 38 * seasonal + seededRange(`fl:${dest.id}`, -15, 25);
    const carriers = ["Aegean", "Wizz Air", "ITA Airways", "Israir", "Austrian"];
    const carrier = carriers[Math.floor(seededRange(`car:${dest.id}`, 0, carriers.length))]!;
    const outH = OUTBOUND_HOURS[Math.floor(seededRange(`dep:${dest.id}`, 0, OUTBOUND_HOURS.length))]!;
    const inH = INBOUND_HOURS[Math.floor(seededRange(`ret:${dest.id}`, 0, INBOUND_HOURS.length))]!;

    return {
      destinationId: dest.id,
      carrier,
      outboundDepartIso: `${params.dates.start}T${hh(outH)}:40:00`,
      inboundDepartIso: `${params.dates.start}T${hh(inH)}:10:00`,
      durationHours: round2(hours),
      totalPrice: round2(perPax * pax),
    };
  },
};

const mockHotels = {
  async quote(dest: Destination, params: TripParams): Promise<HotelQuote | null> {
    const stars = chooseStars(dest, params);
    const nights = params.dates.nights;
    const board = params.hotel?.board ?? "breakfast";
    const roomType = params.hotel?.roomType ?? "double";
    const pax = partySize(params.travelers.adults, params.travelers.childrenAges);
    const rooms = Math.max(1, Math.ceil(pax / 2));

    const boardMult: Record<string, number> = {
      room_only: 1,
      breakfast: 1.12,
      half_board: 1.3,
      all_inclusive: 1.6,
    };
    const nightly =
      STAR_NIGHTLY_EUR[stars]! *
      (boardMult[board] ?? 1.12) *
      (1 + seededRange(`ho:${dest.id}`, -0.1, 0.15));

    return {
      destinationId: dest.id,
      name: `${dest.city} ${stars}★ (hidden until reveal)`,
      stars,
      board: board as HotelQuote["board"],
      roomType: roomType as HotelQuote["roomType"],
      nights,
      totalPrice: round2(nightly * nights * rooms),
    };
  },
};

const mockTransfers = {
  async quote(dest: Destination, params: TripParams): Promise<TransferQuote | null> {
    const pax = partySize(params.travelers.adults, params.travelers.childrenAges);
    const vehicles = Math.max(1, Math.ceil(pax / 3));
    const base = 38 + seededRange(`tr:${dest.id}`, 0, 22);
    return {
      destinationId: dest.id,
      partnerId: dest.transferPartnerId,
      etaMinutes: Math.round(20 + seededRange(`eta:${dest.id}`, 0, 30)),
      totalPrice: round2(base * vehicles * 2), // round trip
    };
  },
};

const mockAttractions = {
  async quote(dest: Destination, params: TripParams): Promise<AttractionQuote | null> {
    // Pick the package best matching requested vibe, else the first.
    const wanted = new Set(params.vibe?.types ?? []);
    const ranked = [...dest.attractionPackages].sort(
      (a, b) =>
        b.vibeTags.filter((t) => wanted.has(t)).length -
        a.vibeTags.filter((t) => wanted.has(t)).length,
    );
    const chosen = ranked[0];
    if (!chosen) return null;
    const pax = partySize(params.travelers.adults, params.travelers.childrenAges);
    return {
      destinationId: dest.id,
      packageId: chosen.id,
      items: chosen.items,
      totalPrice: round2(chosen.pricePerPerson * pax),
    };
  },
};

export const mockProviders: Providers = {
  flights: mockFlights,
  hotels: mockHotels,
  transfers: mockTransfers,
  attractions: mockAttractions,
};
