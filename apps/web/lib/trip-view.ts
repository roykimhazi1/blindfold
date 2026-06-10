import type { RevealStage, SurpriseHints } from "@sv/engine";
import { stageAtLeast } from "@sv/engine";
import { type Booking, effectiveStage, msToNext } from "@/lib/bookings";

// The client-safe projection of a booking. Crucially, destination/hotel fields
// are only populated once the reveal stage earns them — the server never ships
// the secret early, even though it holds it.
export interface TripView {
  id: string;
  stage: RevealStage;
  departureIso: string;
  nights: number;
  travelers: number;
  priceTotal: number;
  currency: string;
  includes: string[];
  hints: SurpriseHints;
  contactName: string;
  /** Who's travelling — names only (the owner's own data; no passport PII). */
  passengers?: { givenName: string; familyName: string }[];
  status: "confirmed" | "cancelled";
  refunded?: number;
  msToNext: number | null;
  schedule: { teaserAt: number; gateAt: number; arrivalAt: number; completeAt: number };
  // Revealed at "gate" and later:
  destination?: { city: string; country: string; region: string; airport: string; carrier: string; flightHours: number };
  // Revealed at "arrival" and later:
  hotel?: { name: string; stars: number; board: string };
  driver?: { etaMinutes: number; partnerId: string };
  attractions?: string[];
}

export function toTripView(b: Booking, nowMs = Date.now()): TripView {
  const stage = effectiveStage(b, nowMs);
  const view: TripView = {
    id: b.id,
    stage,
    departureIso: b.departureIso,
    nights: b.nights,
    travelers: b.travelers,
    priceTotal: b.priceTotal,
    currency: b.currency,
    includes: b.includes,
    hints: b.hints,
    contactName: b.contact.name,
    status: b.status,
    refunded: b.refunded,
    msToNext: msToNext(b, nowMs),
    schedule: {
      teaserAt: b.schedule.teaserAt,
      gateAt: b.schedule.gateAt,
      arrivalAt: b.schedule.arrivalAt,
      completeAt: b.schedule.completeAt,
    },
  };

  // Passenger names aren't a destination secret and belong to the owner, so
  // they're shown from the start (not stage-gated).
  if (b.passengers?.length) {
    view.passengers = b.passengers.map((p) => ({ givenName: p.givenName, familyName: p.familyName }));
  }

  if (stageAtLeast(stage, "gate")) {
    view.destination = {
      city: b.secret.city,
      country: b.secret.country,
      region: b.secret.region,
      airport: b.secret.airport,
      carrier: b.secret.carrier,
      flightHours: b.secret.flightHours,
    };
  }
  if (stageAtLeast(stage, "arrival")) {
    view.hotel = { name: b.secret.hotelName, stars: b.secret.hotelStars, board: b.secret.board };
    view.driver = { etaMinutes: b.secret.transferEtaMinutes, partnerId: b.secret.transferPartnerId };
    view.attractions = b.secret.attractions;
  }
  return view;
}
