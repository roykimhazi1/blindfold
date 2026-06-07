import type { ScoredOption, TripParams, SurpriseHints, RevealStage, RevealSchedule, PriceBreakdown } from "@sv/engine";
import { buildSchedule, stageAt, stageRank, msToNextStage } from "@sv/engine";
import { enqueueBookingEmails, enqueueRefundEmail } from "@/lib/notify";
import { supabaseAdmin } from "@/lib/supabase-server";

// Booking store backed by Supabase. The secret (real destination + hotel) is
// stored in `booking_secrets` and only handed to the client stage by stage.

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
  /** Supplier order refs from the booking saga (flight/hotel/attractions). */
  supplierRefs?: string[];
  /** Stripe PaymentIntent ID — set when checkout used real Stripe. */
  stripePaymentIntentId?: string;
}

// ── Row → domain ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToBooking(row: any): Booking {
  const s = row.booking_secrets;
  return {
    id: row.id,
    createdAtIso: row.created_at_iso,
    departureIso: row.departure_iso,
    nights: row.nights,
    travelers: row.travelers,
    priceTotal: Number(row.price_total),
    currency: row.currency,
    includes: row.includes ?? [],
    hints: row.hints as SurpriseHints,
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
      attractions: s.attractions ?? [],
    },
    contact: { name: row.contact_name, email: row.contact_email },
    schedule: row.schedule as RevealSchedule,
    breakdownEur: row.breakdown_eur as PriceBreakdown,
    demoStage: row.demo_stage as RevealStage,
    status: row.status as "confirmed" | "cancelled",
    refunded: row.refunded != null ? Number(row.refunded) : undefined,
    cancelledAtIso: row.cancelled_at_iso ?? undefined,
    supplierRefs: row.supplier_refs ?? undefined,
    stripePaymentIntentId: row.stripe_payment_intent_id ?? undefined,
  };
}

function bookingIdFromDeal(dealId: string): string {
  return "bk_" + dealId.replace(/^sd_/, "") + Math.random().toString(36).slice(2, 6);
}

// ── Write operations ─────────────────────────────────────────────────

export async function createBooking(
  option: ScoredOption,
  params: TripParams,
  deal: { id: string; priceTotal: number; currency: string; includes: string[] },
  contact: { name: string; email: string },
  supplierRefs?: string[],
  stripePaymentIntentId?: string,
): Promise<Booking> {
  // Idempotency: if we already have a booking for this payment intent, return it.
  if (stripePaymentIntentId) {
    const { data: existing } = await supabaseAdmin
      .from("bookings")
      .select("*, booking_secrets(*)")
      .eq("stripe_payment_intent_id", stripePaymentIntentId)
      .maybeSingle();
    if (existing) return rowToBooking(existing);
  }
  const { destination: d, components: c } = option;
  const schedule = buildSchedule({
    departureIso: params.dates.start,
    flightHours: c.flight.durationHours,
    nights: c.hotel.nights,
  });
  const id = bookingIdFromDeal(deal.id);
  const now = new Date().toISOString();
  const hotelName = realHotelName(d.city, c.hotel.stars);

  const { error: bErr } = await supabaseAdmin.from("bookings").insert({
    id,
    created_at_iso: now,
    departure_iso: params.dates.start,
    nights: c.hotel.nights,
    travelers: params.travelers.adults + params.travelers.childrenAges.length,
    price_total: deal.priceTotal,
    currency: deal.currency,
    includes: deal.includes,
    hints: option.hints,
    contact_name: contact.name,
    contact_email: contact.email,
    schedule,
    breakdown_eur: option.breakdown,
    demo_stage: "booked",
    status: "confirmed",
    supplier_refs: supplierRefs ?? null,
    stripe_payment_intent_id: stripePaymentIntentId ?? null,
  });
  if (bErr) throw new Error(`Booking insert failed: ${bErr.message}`);

  const { error: sErr } = await supabaseAdmin.from("booking_secrets").insert({
    booking_id: id,
    city: d.city,
    country: d.country,
    region: d.region,
    airport: d.airport,
    carrier: c.flight.carrier,
    flight_hours: c.flight.durationHours,
    outbound_depart_iso: c.flight.outboundDepartIso,
    hotel_name: hotelName,
    hotel_stars: c.hotel.stars,
    board: c.hotel.board.replace("_", " "),
    transfer_partner_id: c.transfer.partnerId,
    transfer_eta_minutes: c.transfer.etaMinutes,
    attractions: c.attractions.items,
  });
  if (sErr) throw new Error(`Booking secret insert failed: ${sErr.message}`);

  const booking: Booking = {
    id,
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

  await enqueueBookingEmails({
    bookingId: id,
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
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*, booking_secrets(*)")
    .eq("id", id)
    .single();
  if (error || !data) return undefined;
  return rowToBooking(data);
}

/** All bookings, newest first — for the admin console. */
export async function listBookings(): Promise<Booking[]> {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*, booking_secrets(*)")
    .order("inserted_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToBooking);
}

/**
 * Cancel a booking and refund it in full — the MVP policy ("change your mind
 * anytime before we lock it in"). Idempotent: re-cancelling is a no-op.
 */
export async function cancelBooking(id: string): Promise<Booking | undefined> {
  const existing = await getBooking(id);
  if (!existing) return undefined;
  if (existing.status === "cancelled") return existing;

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("bookings")
    .update({ status: "cancelled", refunded: existing.priceTotal, cancelled_at_iso: now })
    .eq("id", id);
  if (error) throw new Error(`Cancel failed: ${error.message}`);

  await enqueueRefundEmail({
    to: existing.contact.email,
    name: existing.contact.name,
    amount: existing.priceTotal,
    currency: existing.currency,
  });

  return { ...existing, status: "cancelled", refunded: existing.priceTotal, cancelledAtIso: now };
}

/** Advance the demo clock to (at least) `stage`. Real bookings unlock by time. */
export async function advanceBooking(id: string, stage: RevealStage): Promise<Booking | undefined> {
  const existing = await getBooking(id);
  if (!existing) return undefined;
  if (stageRank(stage) <= stageRank(existing.demoStage)) return existing;

  const { error } = await supabaseAdmin
    .from("bookings")
    .update({ demo_stage: stage })
    .eq("id", id);
  if (error) throw new Error(`Advance failed: ${error.message}`);

  return { ...existing, demoStage: stage };
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
