import "server-only";
import type { ScoredOption, TripParams, SurpriseHints, RevealStage, RevealSchedule, PriceBreakdown } from "@sv/engine";
import { buildSchedule, stageAt, stageRank, msToNextStage } from "@sv/engine";
import { enqueueBookingEmails, enqueueRefundEmail } from "@/lib/notify";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";

// Supabase-backed booking store. The client-safe row lives in `bookings`; the
// **secret** (real destination + hotel) lives in `booking_secrets`, an
// RLS-locked table only the service-role client (used here) can read. The secret
// is never shipped to the client early — `toTripView` gates it by stage.

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
  /** Owner (auth.users.id) — used for ownership checks, never exposed client-side. */
  userId: string;
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
  /** Supplier order refs from the booking saga (flight/hotel/attractions). */
  supplierRefs?: string[];
  /** Stripe PaymentIntent ID — set when checkout used real Stripe. */
  stripePaymentIntentId?: string;
}

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type SecretRow = Database["public"]["Tables"]["booking_secrets"]["Row"];

function bookingIdFromDeal(dealId: string): string {
  return "bk_" + dealId.replace(/^sd_/, "") + Math.random().toString(36).slice(2, 6);
}

function rowToBooking(b: BookingRow, s: SecretRow): Booking {
  return {
    id: b.id,
    userId: b.user_id,
    createdAtIso: b.created_at_iso,
    departureIso: b.departure_iso,
    nights: b.nights,
    travelers: b.travelers,
    priceTotal: Number(b.price_total),
    currency: b.currency,
    includes: (b.includes as string[]) ?? [],
    hints: b.hints as unknown as SurpriseHints,
    secret: {
      city: s.city,
      country: s.country,
      region: s.region,
      airport: s.airport,
      carrier: s.carrier,
      flightHours: Number(s.flight_hours),
      outboundDepartIso: s.outbound_depart_iso,
      hotelName: s.hotel_name,
      hotelStars: s.hotel_stars,
      board: s.board,
      transferPartnerId: s.transfer_partner_id,
      transferEtaMinutes: s.transfer_eta_minutes,
      attractions: (s.attractions as string[]) ?? [],
    },
    contact: { name: b.contact_name, email: b.contact_email },
    schedule: b.schedule as unknown as RevealSchedule,
    breakdownEur: b.breakdown_eur as unknown as PriceBreakdown,
    demoStage: b.demo_stage as RevealStage,
    status: b.status as "confirmed" | "cancelled",
    refunded: b.refunded == null ? undefined : Number(b.refunded),
    cancelledAtIso: b.cancelled_at_iso ?? undefined,
    supplierRefs: (b.supplier_refs as string[] | null) ?? undefined,
  };
}

export async function createBooking(
  option: ScoredOption,
  params: TripParams,
  deal: { id: string; priceTotal: number; currency: string; includes: string[] },
  contact: { name: string; email: string },
  userId: string,
  supplierRefs?: string[],
  stripePaymentIntentId?: string,
): Promise<Booking> {
  const { destination: d, components: c } = option;
  const schedule = buildSchedule({
    departureIso: params.dates.start,
    flightHours: c.flight.durationHours,
    nights: c.hotel.nights,
  });
  const id = bookingIdFromDeal(deal.id);
  const now = new Date().toISOString();
  const hotelName = realHotelName(d.city, c.hotel.stars);

  const booking: Booking = {
    id,
    userId,
    createdAtIso: now,
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
      hotelName,
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
    supplierRefs,
    stripePaymentIntentId,
  };

  const supa = supabaseAdmin();
  const { error: bErr } = await supa.from("bookings").insert({
    id: booking.id,
    user_id: userId,
    created_at_iso: booking.createdAtIso,
    departure_iso: booking.departureIso,
    nights: booking.nights,
    travelers: booking.travelers,
    price_total: booking.priceTotal,
    currency: booking.currency,
    includes: booking.includes as unknown as Json,
    hints: booking.hints as unknown as Json,
    contact_name: contact.name,
    contact_email: contact.email,
    schedule: booking.schedule as unknown as Json,
    breakdown_eur: booking.breakdownEur as unknown as Json,
    demo_stage: booking.demoStage,
    status: booking.status,
    supplier_refs: (supplierRefs ?? null) as unknown as Json,
  });
  if (bErr) throw new Error("Failed to persist booking: " + bErr.message);

  const { error: sErr } = await supa.from("booking_secrets").insert({
    booking_id: booking.id,
    city: booking.secret.city,
    country: booking.secret.country,
    region: booking.secret.region,
    airport: booking.secret.airport,
    carrier: booking.secret.carrier,
    flight_hours: booking.secret.flightHours,
    outbound_depart_iso: booking.secret.outboundDepartIso,
    hotel_name: booking.secret.hotelName,
    hotel_stars: booking.secret.hotelStars,
    board: booking.secret.board,
    transfer_partner_id: booking.secret.transferPartnerId,
    transfer_eta_minutes: booking.secret.transferEtaMinutes,
    attractions: booking.secret.attractions as unknown as Json,
  });
  if (sErr) {
    // Roll back the booking row so we never leave a secret-less booking behind.
    await supa.from("bookings").delete().eq("id", booking.id);
    throw new Error("Failed to persist booking secret: " + sErr.message);
  }

  await enqueueBookingEmails({
    bookingId: booking.id,
    userId,
    to: contact.email,
    name: contact.name,
    packingTip: option.hints.packingTip,
    climateBand: option.hints.climateBand,
    departureIso: params.dates.start,
    nights: c.hotel.nights,
    travelers: params.travelers.adults + params.travelers.childrenAges.length,
    priceTotal: deal.priceTotal,
    currency: deal.currency,
    teaserAtMs: schedule.teaserAt,
  });

  return booking;
}

export async function getBooking(id: string): Promise<Booking | undefined> {
  const supa = supabaseAdmin();
  const { data: b } = await supa.from("bookings").select("*").eq("id", id).maybeSingle();
  if (!b) return undefined;
  const { data: s } = await supa.from("booking_secrets").select("*").eq("booking_id", id).maybeSingle();
  if (!s) return undefined;
  return rowToBooking(b, s);
}

/** All bookings, newest first — for the admin console. */
export async function listBookings(): Promise<Booking[]> {
  const supa = supabaseAdmin();
  const { data: bs } = await supa.from("bookings").select("*").order("created_at_iso", { ascending: false });
  if (!bs || bs.length === 0) return [];
  const { data: secrets } = await supa
    .from("booking_secrets")
    .select("*")
    .in("booking_id", bs.map((b) => b.id));
  const sMap = new Map((secrets ?? []).map((s) => [s.booking_id, s]));
  return bs.filter((b) => sMap.has(b.id)).map((b) => rowToBooking(b, sMap.get(b.id)!));
}

/**
 * Cancel a booking and refund it in full — the MVP policy ("change your mind
 * anytime before we lock it in"). Idempotent: re-cancelling is a no-op.
 */
export async function cancelBooking(id: string): Promise<Booking | undefined> {
  const booking = await getBooking(id);
  if (!booking) return undefined;
  if (booking.status === "cancelled") return booking;

  const refunded = booking.priceTotal; // full refund
  const cancelledAtIso = new Date().toISOString();
  const supa = supabaseAdmin();
  const { error } = await supa
    .from("bookings")
    .update({ status: "cancelled", refunded, cancelled_at_iso: cancelledAtIso })
    .eq("id", id);
  if (error) throw new Error("Failed to cancel booking: " + error.message);

  booking.status = "cancelled";
  booking.refunded = refunded;
  booking.cancelledAtIso = cancelledAtIso;

  await enqueueRefundEmail({
    to: booking.contact.email,
    name: booking.contact.name,
    amount: refunded,
    currency: booking.currency,
    bookingId: booking.id,
    userId: booking.userId,
  });
  return booking;
}

/** Advance the demo clock to (at least) `stage`. Real bookings unlock by time. */
export async function advanceBooking(id: string, stage: RevealStage): Promise<Booking | undefined> {
  const booking = await getBooking(id);
  if (!booking) return undefined;
  if (stageRank(stage) > stageRank(booking.demoStage)) {
    const supa = supabaseAdmin();
    const { error } = await supa.from("bookings").update({ demo_stage: stage }).eq("id", id);
    if (error) throw new Error("Failed to advance booking: " + error.message);
    booking.demoStage = stage;
  }
  return booking;
}

/** Effective stage = the later of real-time progress and the demo fast-forward. */
export function effectiveStage(b: Booking, nowMs = Date.now()): RevealStage {
  const real = stageAt(b.schedule, nowMs);
  return stageRank(real) >= stageRank(b.demoStage) ? real : b.demoStage;
}

export function msToNext(b: Booking, nowMs = Date.now()): number | null {
  return msToNextStage(b.schedule, nowMs);
}

// ── Hotel name pools ─────────────────────────────────────────────────

const HOTEL_POOLS: Record<string, string[]> = {
  Larnaca:    ["Radisson Beach Resort", "Palm Beach Hotel", "Lordos Beach Hotel", "Golden Bay Beach Hotel"],
  Paphos:     ["Almyra Hotel", "Elysium Resort", "Annabelle Hotel", "Azia Resort & Spa"],
  Athens:     ["Hotel Grande Bretagne", "King George Athens", "The Dolli at Acropolis", "New Hotel"],
  Heraklion:  ["Galaxy Hotel", "GDM Megaron", "Capsis Astoria", "Lato Boutique Hotel"],
  Santorini:  ["Katikies Hotel", "Canaves Oia", "Grace Santorini", "Mystique Resort"],
  Rome:       ["Hotel Eden", "Palazzo Manfredi", "Forty Seven Hotel", "Hotel de Russie"],
  Barcelona:  ["Hotel Arts Barcelona", "W Barcelona", "Mandarin Oriental", "El Palace Barcelona"],
  Prague:     ["Hotel Savoy Prague", "The Mark Hotel", "Aria Hotel Prague", "Hotel Josef"],
  Tbilisi:    ["Rooms Hotel Tbilisi", "Stamba Hotel", "Biltmore Tbilisi", "The Biltmore"],
  Vienna:     ["Hotel Sacher Wien", "The Ritz-Carlton Vienna", "Grand Hotel Wien", "Hotel Imperial"],
  Lisbon:     ["Bairro Alto Hotel", "Torel Palace Lisbon", "Memmo Alfama", "Palácio do Governador"],
  Amsterdam:  ["Hotel V Nesplein", "Pulitzer Amsterdam", "The Dylan Amsterdam", "Hotel Brouwer"],
  Budapest:   ["Boscolo Budapest", "Four Seasons Gresham Palace", "Aria Hotel Budapest", "Párisi Udvar Hotel"],
  Valletta:   ["The Phoenicia Malta", "Iniala Harbour House", "Osborne Hotel", "Palazzo Consiglia"],
  Dubrovnik:  ["Hotel Excelsior Dubrovnik", "Hilton Imperial Dubrovnik", "Hotel Bellevue", "Rixos Libertas"],
  Nice:       ["Le Negresco", "Hotel Beau Rivage Nice", "Hyatt Regency Nice", "Villa Massena"],
  Dubai:      ["Atlantis The Palm", "Burj Al Arab", "One&Only Royal Mirage", "Jumeirah Beach Hotel"],
  Hurghada:   ["Steigenberger Al Dau Beach", "Oberoi Beach Resort", "Sheraton Soma Bay", "Baron Palace"],
  Yerevan:    ["Marriott Armenia Hotel", "The Alexander Yerevan", "Moxy Yerevan", "Ani Plaza Hotel"],
  Munich:     ["Bayerischer Hof", "Hotel Vier Jahreszeiten Kempinski", "Charles Hotel", "The Mandarin Oriental"],
  "Kraków":   ["Hotel Stary Kraków", "Copernicus Hotel", "Hotel Wentzl", "Kanonicza 22"],
};

const GENERIC_POOL = ["The Marlowe", "Casa Lumière", "Hotel Verano", "The Wanderer", "Maison Aurora", "The Tideline"];

function realHotelName(city: string, stars: number): string {
  const pool = HOTEL_POOLS[city] ?? GENERIC_POOL;
  const pick = pool[(city.length + stars) % pool.length]!;
  return `${pick} · ${stars}★`;
}
