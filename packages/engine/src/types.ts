// Core domain types for the Surprise Vacation deal engine.
// Kept "type-strip friendly" (no enums/namespaces) so files run under
// Node's native TypeScript stripping for tests.

export type Currency = "USD" | "EUR" | "ILS";

export type PartyType = "solo" | "couple" | "friends" | "family";
export type VibeType = "beach" | "city" | "nature" | "nightlife" | "culture";
export type Temperature = "warm" | "cold" | "any";
export type Pace = "chill" | "active" | "any";
export type Board = "room_only" | "breakfast" | "half_board" | "all_inclusive";
export type RoomType = "standard" | "double" | "suite" | "family";
export type SurpriseIntensity = "full" | "region";

export interface Budget {
  amount: number;
  currency: Currency;
  /** If true, `amount` is per person; otherwise it's the total. */
  perPerson: boolean;
}

export interface DatePrefs {
  mode: "exact" | "flexible";
  /** ISO date (YYYY-MM-DD) the trip starts, or the center of the flexible window. */
  start: string;
  nights: number;
  /** +/- days of flexibility when mode === "flexible". */
  flexDays?: number;
}

export interface Travelers {
  adults: number;
  /** Ages of each child; empty when none. */
  childrenAges: number[];
  partyType: PartyType;
}

export interface VibePrefs {
  types: VibeType[];
  temperature: Temperature;
  pace: Pace;
}

export interface HotelPrefs {
  minStars: number; // 1..5
  board: Board;
  roomType: RoomType;
}

export interface Constraints {
  maxFlightHours?: number;
  avoidRegions?: string[];
  accessibility?: boolean;
  dietary?: string[];
  /** Traveler nationality (ISO-2) used for visa filtering. */
  nationality?: string;
}

/** Everything the user gives us. Only budget/dates/travelers/departure are required. */
export interface TripParams {
  budget: Budget;
  dates: DatePrefs;
  travelers: Travelers;
  departureAirport: string; // IATA, e.g. "TLV"
  vibe?: VibePrefs;
  hotel?: HotelPrefs;
  constraints?: Constraints;
  surpriseIntensity?: SurpriseIntensity;
}

// ── Catalog ──────────────────────────────────────────────────────────

export interface AttractionPackage {
  id: string;
  title: string;
  items: string[];
  /** Per-person price in EUR (base currency). */
  pricePerPerson: number;
  vibeTags: VibeType[];
}

export interface Destination {
  id: string;
  city: string;
  country: string;
  region: string; // e.g. "Southern Europe"
  airport: string; // IATA
  /** Average temperature (°C) by month index 0..11. */
  climateByMonth: number[];
  vibeTags: VibeType[];
  /** Flight hours from supported departure hubs, keyed by IATA. */
  flightHoursFrom: Record<string, number>;
  /** ISO-2 nationalities that may enter visa-free. "*" means all. */
  visaFreeFor: string[];
  transferPartnerId: string;
  attractionPackages: AttractionPackage[];
  active: boolean;
}

// ── Provider quotes ──────────────────────────────────────────────────

export interface FlightQuote {
  destinationId: string;
  carrier: string;
  outboundDepartIso: string;
  inboundDepartIso: string;
  durationHours: number;
  /** Round-trip total for the whole party, in EUR. */
  totalPrice: number;
}

export interface HotelQuote {
  destinationId: string;
  /** Real hotel name — kept server-side, never shown pre-reveal. */
  name: string;
  stars: number;
  board: Board;
  roomType: RoomType;
  nights: number;
  /** Total for the stay (all rooms), in EUR. */
  totalPrice: number;
}

export interface TransferQuote {
  destinationId: string;
  partnerId: string;
  etaMinutes: number;
  /** Round-trip airport<->hotel for the party, in EUR. */
  totalPrice: number;
}

export interface AttractionQuote {
  destinationId: string;
  packageId: string;
  items: string[];
  /** Total for the party, in EUR. */
  totalPrice: number;
}

export interface PricedComponents {
  flight: FlightQuote;
  hotel: HotelQuote;
  transfer: TransferQuote;
  attractions: AttractionQuote;
}

// ── Provider interfaces ──────────────────────────────────────────────

export interface FlightProvider {
  quote(dest: Destination, params: TripParams): Promise<FlightQuote | null>;
}
export interface HotelProvider {
  quote(dest: Destination, params: TripParams): Promise<HotelQuote | null>;
}
export interface TransferProvider {
  quote(dest: Destination, params: TripParams): Promise<TransferQuote | null>;
}
export interface AttractionProvider {
  quote(dest: Destination, params: TripParams): Promise<AttractionQuote | null>;
}

export interface Providers {
  flights: FlightProvider;
  hotels: HotelProvider;
  transfers: TransferProvider;
  attractions: AttractionProvider;
}

// ── Pricing / fees ───────────────────────────────────────────────────

export interface PricingConfig {
  /** Marketing margin added on top of net component cost, e.g. 0.18 = 18%. */
  marginRate: number;
  /** Flat per-booking curation fee in EUR. */
  serviceFee: number;
  /** Keep total this far under budget to absorb FX/price drift, e.g. 0.05. */
  budgetBuffer: number;
}

export interface PriceBreakdown {
  flights: number;
  hotel: number;
  transfer: number;
  attractions: number;
  netCost: number;
  margin: number;
  serviceFee: number;
  /** All-in price shown to the user (EUR base; converted for display). */
  total: number;
}

// ── Surprise output ──────────────────────────────────────────────────

export type ClimateBand = "cold" | "mild" | "warm" | "hot";
export type FlightBand = "short" | "medium" | "long";

export interface SurpriseHints {
  climateBand: ClimateBand;
  flightBand: FlightBand;
  vibeTags: VibeType[];
  packingTip: string;
  starBand: number;
  attractionCount: number;
  /** Region is only disclosed when surpriseIntensity === "region". */
  region?: string;
  teaser: string;
}

/** A complete surprise option as scored internally (full detail, server-side). */
export interface ScoredOption {
  destination: Destination;
  components: PricedComponents;
  breakdown: PriceBreakdown;
  score: number;
  hints: SurpriseHints;
}

/** The redacted shape safe to send to the client before booking. */
export interface SurpriseDeal {
  id: string;
  hints: SurpriseHints;
  priceTotal: number;
  currency: Currency;
  includes: string[];
}
