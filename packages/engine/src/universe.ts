import type { Destination, AttractionPackage } from "./types.ts";
import { seededRange } from "./util.ts";

// ── Airport universe (discovery, Phase A) ────────────────────────────
// The discovery layer roams every TLV-reachable airport, not just the curated
// catalog. These entries are the "long tail": real cities with real airports,
// lighter metadata, and *generic* attraction packages (no curated partners
// yet). They join the curated catalog in `CATALOG`, so candidate filtering,
// pricing, and the catalog-wide leak-check span the whole universe for free.
//
// Generic package items deliberately start with words from the leak-check's
// GENERIC_LANDMARK_WORDS allowlist (hints.ts) — they describe the *kind* of
// experience, never a named place, so they can't become landmark leak terms.

type Vibe = AttractionPackage["vibeTags"][number];

const VIBE_ITEM: Record<string, string> = {
  beach: "Beach day with loungers reserved",
  city: "Guided old-town discovery walk",
  nature: "Day trip to a scenic viewpoint",
  nightlife: "Evening food & stories crawl",
  culture: "Museum pass for the standout collections",
};

/** Two leak-safe generic packages for a city without curated activities. */
export function genericAttractionPackages(id: string, vibeTags: Vibe[]): AttractionPackage[] {
  const price = Math.round(seededRange(`gx:${id}`, 70, 105));
  const lead = VIBE_ITEM[vibeTags[0] ?? "culture"]!;
  const second = VIBE_ITEM[vibeTags[1] ?? "city"]!;
  return [
    {
      id: `${id}-signature`,
      title: "Hand-picked local experiences",
      pricePerPerson: price,
      vibeTags: vibeTags.slice(0, 2),
      items: [
        lead,
        "Food-market grazing tour with a local",
        second !== lead ? second : "Wine & local-flavours tasting",
      ],
    },
    {
      id: `${id}-unwind`,
      title: "Slow-afternoons set",
      pricePerPerson: Math.round(price * 0.85),
      vibeTags: vibeTags.slice(0, 2),
      items: [
        "River or harbour cruise at golden hour",
        "Park picnic & hidden-corners stroll",
        "Wine & local-flavours tasting",
      ],
    },
  ];
}

interface UniverseRow {
  id: string;
  city: string;
  country: string;
  region: string;
  airport: string;
  /** Average °C per month, Jan..Dec. */
  climateByMonth: number[];
  vibeTags: Vibe[];
  hoursFromTlv: number;
}

// v1 breadth: mainstream TLV routes, visa-free for IL passports, ≤ ~6h.
// (Grows toward ~150 as discovery matures; coordinates live in
// providers/stay-locations.ts, keyed by these ids.)
const ROWS: UniverseRow[] = [
  { id: "istanbul-tr", city: "Istanbul", country: "Türkiye", region: "Bosphorus", airport: "IST", climateByMonth: [6, 7, 9, 13, 18, 23, 26, 26, 22, 17, 12, 8], vibeTags: ["city", "culture", "nightlife"], hoursFromTlv: 2.1 },
  { id: "thessaloniki-gr", city: "Thessaloniki", country: "Greece", region: "Southern Europe", airport: "SKG", climateByMonth: [6, 8, 11, 15, 20, 25, 28, 28, 23, 18, 12, 8], vibeTags: ["city", "culture", "nightlife"], hoursFromTlv: 1.9 },
  { id: "rhodes-gr", city: "Rhodes", country: "Greece", region: "Greek Islands", airport: "RHO", climateByMonth: [12, 13, 14, 17, 21, 25, 28, 28, 25, 21, 17, 14], vibeTags: ["beach", "culture"], hoursFromTlv: 1.3 },
  { id: "corfu-gr", city: "Corfu", country: "Greece", region: "Greek Islands", airport: "CFU", climateByMonth: [10, 10, 12, 15, 19, 24, 27, 27, 23, 19, 15, 11], vibeTags: ["beach", "nature"], hoursFromTlv: 2.3 },
  { id: "bucharest-ro", city: "Bucharest", country: "Romania", region: "Eastern Europe", airport: "OTP", climateByMonth: [0, 2, 7, 12, 17, 21, 23, 23, 18, 12, 6, 1], vibeTags: ["city", "culture", "nightlife"], hoursFromTlv: 2.5 },
  { id: "sofia-bg", city: "Sofia", country: "Bulgaria", region: "Balkans", airport: "SOF", climateByMonth: [0, 2, 6, 11, 15, 19, 21, 21, 17, 11, 6, 1], vibeTags: ["city", "culture", "nature"], hoursFromTlv: 2.4 },
  { id: "varna-bg", city: "Varna", country: "Bulgaria", region: "Black Sea", airport: "VAR", climateByMonth: [2, 3, 6, 11, 16, 21, 24, 24, 20, 15, 10, 4], vibeTags: ["beach", "city"], hoursFromTlv: 2.2 },
  { id: "belgrade-rs", city: "Belgrade", country: "Serbia", region: "Balkans", airport: "BEG", climateByMonth: [2, 4, 8, 13, 18, 21, 23, 23, 19, 13, 8, 3], vibeTags: ["city", "nightlife", "culture"], hoursFromTlv: 2.8 },
  { id: "tivat-me", city: "Tivat", country: "Montenegro", region: "Adriatic", airport: "TIV", climateByMonth: [7, 8, 10, 13, 18, 22, 25, 25, 21, 17, 12, 9], vibeTags: ["beach", "nature"], hoursFromTlv: 2.9 },
  { id: "tirana-al", city: "Tirana", country: "Albania", region: "Balkans", airport: "TIA", climateByMonth: [7, 8, 10, 14, 18, 22, 25, 25, 21, 17, 12, 8], vibeTags: ["city", "nature", "culture"], hoursFromTlv: 2.7 },
  { id: "batumi-ge", city: "Batumi", country: "Georgia", region: "Caucasus", airport: "BUS", climateByMonth: [7, 7, 9, 12, 16, 20, 23, 23, 20, 16, 12, 9], vibeTags: ["beach", "nature", "nightlife"], hoursFromTlv: 2.3 },
  { id: "zagreb-hr", city: "Zagreb", country: "Croatia", region: "Central Europe", airport: "ZAG", climateByMonth: [1, 3, 8, 13, 17, 21, 23, 23, 18, 13, 7, 2], vibeTags: ["city", "culture"], hoursFromTlv: 3.2 },
  { id: "warsaw-pl", city: "Warsaw", country: "Poland", region: "Central Europe", airport: "WAW", climateByMonth: [-1, 0, 4, 9, 14, 17, 19, 19, 14, 9, 4, 0], vibeTags: ["city", "culture"], hoursFromTlv: 3.5 },
  { id: "milan-it", city: "Milan", country: "Italy", region: "Northern Italy", airport: "MXP", climateByMonth: [3, 5, 10, 14, 19, 23, 25, 25, 21, 15, 8, 4], vibeTags: ["city", "culture", "nightlife"], hoursFromTlv: 3.9 },
  { id: "venice-it", city: "Venice", country: "Italy", region: "Northern Italy", airport: "VCE", climateByMonth: [4, 5, 9, 13, 18, 22, 24, 24, 20, 15, 9, 5], vibeTags: ["city", "culture"], hoursFromTlv: 3.6 },
  { id: "naples-it", city: "Naples", country: "Italy", region: "Southern Europe", airport: "NAP", climateByMonth: [9, 9, 11, 14, 18, 22, 25, 25, 22, 18, 13, 10], vibeTags: ["city", "culture", "beach"], hoursFromTlv: 3.3 },
  { id: "catania-it", city: "Catania", country: "Italy", region: "Central Mediterranean", airport: "CTA", climateByMonth: [11, 11, 13, 15, 19, 24, 27, 27, 24, 20, 16, 12], vibeTags: ["beach", "culture", "nature"], hoursFromTlv: 3.0 },
  { id: "madrid-es", city: "Madrid", country: "Spain", region: "Iberia", airport: "MAD", climateByMonth: [6, 8, 11, 13, 17, 23, 26, 26, 21, 15, 10, 7], vibeTags: ["city", "culture", "nightlife"], hoursFromTlv: 4.9 },
  { id: "valencia-es", city: "Valencia", country: "Spain", region: "Western Mediterranean", airport: "VLC", climateByMonth: [12, 13, 15, 17, 20, 24, 26, 27, 24, 20, 15, 12], vibeTags: ["beach", "city", "nightlife"], hoursFromTlv: 4.6 },
  { id: "paris-fr", city: "Paris", country: "France", region: "Western Europe", airport: "CDG", climateByMonth: [5, 6, 9, 12, 16, 19, 21, 21, 17, 13, 8, 5], vibeTags: ["city", "culture"], hoursFromTlv: 4.8 },
  { id: "london-gb", city: "London", country: "United Kingdom", region: "Western Europe", airport: "LTN", climateByMonth: [5, 5, 8, 10, 14, 17, 19, 19, 16, 12, 8, 6], vibeTags: ["city", "culture", "nightlife"], hoursFromTlv: 5.2 },
  { id: "berlin-de", city: "Berlin", country: "Germany", region: "Central Europe", airport: "BER", climateByMonth: [0, 1, 5, 10, 15, 18, 20, 20, 15, 10, 5, 2], vibeTags: ["city", "nightlife", "culture"], hoursFromTlv: 4.1 },
  { id: "zurich-ch", city: "Zurich", country: "Switzerland", region: "Alps", airport: "ZRH", climateByMonth: [1, 2, 6, 10, 15, 18, 20, 20, 16, 11, 5, 2], vibeTags: ["city", "nature"], hoursFromTlv: 4.0 },
  { id: "marrakech-ma", city: "Marrakech", country: "Morocco", region: "North Africa", airport: "RAK", climateByMonth: [12, 14, 17, 19, 23, 27, 32, 32, 27, 22, 17, 13], vibeTags: ["culture", "city", "nature"], hoursFromTlv: 5.8 },
];

/** The long-tail universe entries (curated catalog entries live in catalog.ts). */
export const UNIVERSE: Destination[] = ROWS.map((r) => ({
  id: r.id,
  city: r.city,
  country: r.country,
  region: r.region,
  airport: r.airport,
  climateByMonth: r.climateByMonth,
  vibeTags: r.vibeTags,
  flightHoursFrom: { TLV: r.hoursFromTlv },
  visaFreeFor: ["IL", "*"],
  transferPartnerId: `tp-${r.airport.toLowerCase()}-local`,
  attractionPackages: genericAttractionPackages(r.id, r.vibeTags),
  active: true,
}));
