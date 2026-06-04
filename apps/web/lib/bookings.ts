import type { ScoredOption, TripParams, SurpriseHints, RevealStage, RevealSchedule, PriceBreakdown } from "@sv/engine";
import { buildSchedule, stageAt, stageRank, msToNextStage } from "@sv/engine";
import { enqueueBookingEmails, enqueueRefundEmail } from "@/lib/notify";

// In-memory booking store. No database in the MVP — bookings live in a Map kept
// on globalThis so they survive Next.js hot-reloads in dev. The secret (real
// destination + hotel) is held here server-side and only handed to the client
// stage by stage, never before the reveal earns it.

export interface BookingSecret {
  city: string;
  country: string;
  region: string;
  airport: string;
  carrier: string;
  flightHours: number;
  outboundDepartIso: string;
  hotelName: string;
  hotelStars: number;
  board: string;
  transferPartnerId: string;
  transferEtaMinutes: number;
  attractions: string[];
}

export interface Booking {
  id: string;
  createdAtIso: string;
  departureIso: string;
  nights: number;
  travelers: number;
  priceTotal: number;
  currency: string;
  includes: string[];
  hints: SurpriseHints;
  secret: BookingSecret;
  contact: { name: string; email: string };
  schedule: RevealSchedule;
  /** Cost/margin breakdown in EUR base — for admin revenue reporting. */
  breakdownEur: PriceBreakdown;
  /** Furthest stage the user has fast-forwarded to in the demo clock. */
  demoStage: RevealStage;
  status: "confirmed" | "cancelled";
  /** Amount refunded (display currency) when cancelled. */
  refunded?: number;
  cancelledAtIso?: string;
}

type Store = Map<string, Booking>;
const g = globalThis as unknown as { __bookings?: Store };
const store: Store = (g.__bookings ??= new Map());

function bookingIdFromDeal(dealId: string): string {
  return "bk_" + dealId.replace(/^sd_/, "") + Math.random().toString(36).slice(2, 6);
}

export function createBooking(
  option: ScoredOption,
  params: TripParams,
  deal: { id: string; priceTotal: number; currency: string; includes: string[] },
  contact: { name: string; email: string },
): Booking {
  const { destination: d, components: c } = option;
  const schedule = buildSchedule({
    departureIso: params.dates.start,
    flightHours: c.flight.durationHours,
    nights: c.hotel.nights,
  });
  const booking: Booking = {
    id: bookingIdFromDeal(deal.id),
    createdAtIso: new Date().toISOString(),
    departureIso: params.dates.start,
    nights: c.hotel.nights,
    travelers: params.travelers.adults + params.travelers.childrenAges.length,
    priceTotal: deal.priceTotal,
    currency: deal.currency,
    includes: deal.includes,
    hints: option.hints,
    secret: {
      city: d.city,
      country: d.country,
      region: d.region,
      airport: d.airport,
      carrier: c.flight.carrier,
      flightHours: c.flight.durationHours,
      outboundDepartIso: c.flight.outboundDepartIso,
      hotelName: realHotelName(d.city, c.hotel.stars),
      hotelStars: c.hotel.stars,
      board: c.hotel.board.replace("_", " "),
      transferPartnerId: c.transfer.partnerId,
      transferEtaMinutes: c.transfer.etaMinutes,
      attractions: c.attractions.items,
    },
    contact,
    schedule,
    breakdownEur: option.breakdown,
    demoStage: "booked",
    status: "confirmed",
  };
  store.set(booking.id, booking);

  enqueueBookingEmails({
    bookingId: booking.id,
    to: contact.email,
    name: contact.name,
    packingTip: option.hints.packingTip,
    climateBand: option.hints.climateBand,
    departureIso: booking.departureIso,
    nights: booking.nights,
    travelers: booking.travelers,
    priceTotal: booking.priceTotal,
    currency: booking.currency,
    teaserAtMs: schedule.teaserAt,
  });

  return booking;
}

export function getBooking(id: string): Booking | undefined {
  return store.get(id);
}

/** All bookings, newest first — for the admin console. */
export function listBookings(): Booking[] {
  return [...store.values()].sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
}

/**
 * Cancel a booking and refund it in full — the MVP policy ("change your mind
 * anytime before we lock it in"). Idempotent: re-cancelling is a no-op.
 */
export function cancelBooking(id: string): Booking | undefined {
  const b = store.get(id);
  if (!b) return undefined;
  if (b.status === "cancelled") return b;
  b.status = "cancelled";
  b.refunded = b.priceTotal; // full refund
  b.cancelledAtIso = new Date().toISOString();
  enqueueRefundEmail({
    to: b.contact.email,
    name: b.contact.name,
    amount: b.priceTotal,
    currency: b.currency,
  });
  return b;
}

/** Advance the demo clock to (at least) `stage`. Real bookings unlock by time. */
export function advanceBooking(id: string, stage: RevealStage): Booking | undefined {
  const b = store.get(id);
  if (!b) return undefined;
  if (stageRank(stage) > stageRank(b.demoStage)) b.demoStage = stage;
  return b;
}

/** Effective stage = the later of real-time progress and the demo fast-forward. */
export function effectiveStage(b: Booking, nowMs = Date.now()): RevealStage {
  const real = stageAt(b.schedule, nowMs);
  return stageRank(real) >= stageRank(b.demoStage) ? real : b.demoStage;
}

export function msToNext(b: Booking, nowMs = Date.now()): number | null {
  return msToNextStage(b.schedule, nowMs);
}

// The mock hotel name carried a "(hidden until reveal)" suffix for safety in the
// deal list; give the booking a believable name to unveil at arrival.
function realHotelName(city: string, stars: number): string {
  const names = ["The Marlowe", "Casa Lumière", "Hotel Verano", "The Wanderer", "Maison Aurora", "The Tideline"];
  const pick = names[(city.length + stars) % names.length]!;
  return `${pick} · ${stars}★`;
}
