import type { UserPrefs, FlightOption, HotelOption } from "@/lib/finder";

// Captured from the live flight/hotel search MCP on a dev run (TLV, 15–19 Jul,
// 2 adults). Prices are the whole-party round trip / whole stay, in USD. In
// production these come from a server-side supplier call, not this fixture.

export const SAMPLE_PREFS: UserPrefs = {
  origin: "TLV",
  adults: 2,
  departDate: "2026-07-15",
  returnDate: "2026-07-19",
  nights: 4,
  budgetUsd: 2500,
  vibe: ["beach", "city"],
  carryOnOnly: true, // "carry-on only, no checked bag"
  avoidDestinations: ["Dubai"],
  currency: "USD",
};

// Flight agent input: real round-trips the master's candidate cities returned.
export const FLIGHT_OPTIONS: FlightOption[] = [
  // Athens
  { destCity: "Athens", destCode: "ATH", destCountry: "Greece", carrier: "Aegean", stops: 0, outboundDepart: "7:55 PM", outboundArrive: "10:05 PM", returnDepart: "10:50 AM", durationLabel: "2h 10m", carryOnIncluded: true, totalPriceUsd: 718.74, refundable: false, redEye: false },
  { destCity: "Athens", destCode: "ATH", destCountry: "Greece", carrier: "SKY express", stops: 0, outboundDepart: "11:30 PM", outboundArrive: "1:45 AM", returnDepart: "3:30 AM", durationLabel: "2h 15m", carryOnIncluded: true, totalPriceUsd: 697.90, refundable: false, redEye: true },
  { destCity: "Athens", destCode: "ATH", destCountry: "Greece", carrier: "Israir", stops: 0, outboundDepart: "6:00 PM", outboundArrive: "8:15 PM", returnDepart: "10:50 AM", durationLabel: "2h 15m", carryOnIncluded: false, totalPriceUsd: 719.74, refundable: false, redEye: false },
  { destCity: "Athens", destCode: "ATH", destCountry: "Greece", carrier: "Aegean", stops: 1, outboundDepart: "5:20 PM", outboundArrive: "10:45 PM", returnDepart: "10:50 AM", durationLabel: "1 stop · 5h 25m", carryOnIncluded: true, totalPriceUsd: 751.14, refundable: false, redEye: false },
  // Larnaca
  { destCity: "Larnaca", destCode: "LCA", destCountry: "Cyprus", carrier: "TUS Airways", stops: 0, outboundDepart: "6:50 PM", outboundArrive: "7:55 PM", returnDepart: "6:15 AM", durationLabel: "1h 5m", carryOnIncluded: false, totalPriceUsd: 458.40, refundable: false, redEye: false },
  { destCity: "Larnaca", destCode: "LCA", destCountry: "Cyprus", carrier: "TUS Airways", stops: 0, outboundDepart: "12:55 PM", outboundArrive: "2:00 PM", returnDepart: "6:15 AM", durationLabel: "1h 5m", carryOnIncluded: false, totalPriceUsd: 538.40, refundable: false, redEye: false },
  // Heraklion (Crete)
  { destCity: "Heraklion", destCode: "HER", destCountry: "Greece", carrier: "Aegean", stops: 1, outboundDepart: "7:55 PM", outboundArrive: "12:35 AM", returnDepart: "12:10 AM", durationLabel: "1 stop · 4h 40m", carryOnIncluded: true, totalPriceUsd: 800.34, refundable: false, redEye: true },
  // Rome
  { destCity: "Rome", destCode: "FCO", destCountry: "Italy", carrier: "Wizz Air", stops: 0, outboundDepart: "10:55 AM", outboundArrive: "1:45 PM", returnDepart: "5:30 AM", durationLabel: "3h 50m", carryOnIncluded: false, totalPriceUsd: 737.99, refundable: false, redEye: false },
  { destCity: "Rome", destCode: "FCO", destCountry: "Italy", carrier: "Aegean", stops: 1, outboundDepart: "7:55 PM", outboundArrive: "8:35 AM", returnDepart: "10:25 PM", durationLabel: "1 stop · 13h 40m", carryOnIncluded: true, totalPriceUsd: 911.34, refundable: false, redEye: true },
  // Barcelona
  { destCity: "Barcelona", destCode: "BCN", destCountry: "Spain", carrier: "Aegean", stops: 1, outboundDepart: "7:55 PM", outboundArrive: "11:15 AM", returnDepart: "1:55 AM", durationLabel: "1 stop · 16h 20m", carryOnIncluded: true, totalPriceUsd: 1033.74, refundable: false, redEye: true },
  // Malta
  { destCity: "Valletta", destCode: "MLA", destCountry: "Malta", carrier: "Aegean", stops: 1, outboundDepart: "7:55 PM", outboundArrive: "7:55 PM", returnDepart: "9:05 AM", durationLabel: "1 stop · 25h", carryOnIncluded: true, totalPriceUsd: 1015.74, refundable: false, redEye: true },
];

// Hotel agent input: real 4★ stays per bundle destination.
export const HOTELS_BY_DEST: Record<string, HotelOption[]> = {
  ATH: [
    { name: "Breeze Boutique Hotel", starRating: 4, guestRating: 8.6, reviews: 471, nightlyUsd: 57, totalUsd: 304 },
    { name: "Tins Athens", starRating: 4, guestRating: 8.2, reviews: 231, nightlyUsd: 68, totalUsd: 357 },
    { name: "International Atene Hotel", starRating: 4, guestRating: 8.8, reviews: 163, nightlyUsd: 69, totalUsd: 359 },
  ],
  FCO: [
    { name: "c-hotels Club House Roma", starRating: 4, guestRating: 8.6, reviews: 253, nightlyUsd: 90, totalUsd: 464 },
    { name: "Hotel Zone", starRating: 4, guestRating: 8.0, reviews: 648, nightlyUsd: 97, totalUsd: 496 },
    { name: "Appia Park Hotel", starRating: 4, guestRating: 8.2, reviews: 203, nightlyUsd: 98, totalUsd: 498 },
  ],
  LCA: [
    { name: "Best Western Plus Larco Hotel", starRating: 4, guestRating: 8.8, reviews: 195, nightlyUsd: 188, totalUsd: 821 },
    { name: "Sun Hall Hotel", starRating: 4, guestRating: 9.0, reviews: 646, nightlyUsd: 205, totalUsd: 895 },
  ],
};
