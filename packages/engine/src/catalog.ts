import type { Destination, AttractionPackage } from "./types.ts";

// Seed catalog of "operable" cities — each has a transfer partner and at
// least one attraction package. Departure hub for the MVP is TLV (Tel Aviv).
// Climate is average °C per month (Jan..Dec). Flight hours are from TLV.
// All destinations here are visa-free for Israeli (IL) passports.

function pkg(
  id: string,
  title: string,
  pricePerPerson: number,
  vibeTags: AttractionPackage["vibeTags"],
  items: string[],
): AttractionPackage {
  return { id, title, items, pricePerPerson, vibeTags };
}

export const CATALOG: Destination[] = [
  {
    id: "larnaca-cy",
    city: "Larnaca",
    country: "Cyprus",
    region: "Eastern Mediterranean",
    airport: "LCA",
    climateByMonth: [12, 12, 14, 18, 22, 26, 29, 29, 26, 22, 17, 14],
    vibeTags: ["beach", "culture"],
    flightHoursFrom: { TLV: 0.75 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-lca-coast",
    attractionPackages: [
      pkg("lca-sea", "Salt-lake & seaside", 90, ["beach", "nature"], [
        "Finikoudes promenade walk",
        "Hala Sultan Tekke & salt lake",
        "Sunset catamaran cruise",
      ]),
    ],
    active: true,
  },
  {
    id: "athens-gr",
    city: "Athens",
    country: "Greece",
    region: "Southern Europe",
    airport: "ATH",
    climateByMonth: [10, 11, 13, 17, 22, 27, 30, 30, 26, 20, 15, 11],
    vibeTags: ["city", "culture", "nightlife"],
    flightHoursFrom: { TLV: 1.9 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-ath-acropolis",
    attractionPackages: [
      pkg("ath-antiquity", "Ancient Athens", 120, ["culture", "city"], [
        "Acropolis & Parthenon skip-the-line",
        "Plaka food walk",
        "Cape Sounion day trip",
      ]),
    ],
    active: true,
  },
  {
    id: "heraklion-gr",
    city: "Heraklion",
    country: "Greece",
    region: "Greek Islands",
    airport: "HER",
    climateByMonth: [12, 12, 14, 17, 21, 25, 28, 28, 25, 21, 17, 14],
    vibeTags: ["beach", "nature", "culture"],
    flightHoursFrom: { TLV: 2.1 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-her-crete",
    attractionPackages: [
      pkg("her-crete", "Crete escape", 110, ["beach", "nature"], [
        "Knossos Palace tour",
        "Elafonissi pink-sand beach",
        "Cretan winery tasting",
      ]),
    ],
    active: true,
  },
  {
    id: "rome-it",
    city: "Rome",
    country: "Italy",
    region: "Southern Europe",
    airport: "FCO",
    climateByMonth: [8, 9, 12, 15, 20, 24, 27, 27, 23, 18, 13, 9],
    vibeTags: ["city", "culture"],
    flightHoursFrom: { TLV: 3.2 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-fco-eternal",
    attractionPackages: [
      pkg("rome-classic", "Eternal City", 150, ["culture", "city"], [
        "Colosseum & Roman Forum",
        "Vatican Museums & Sistine Chapel",
        "Trastevere evening food tour",
      ]),
    ],
    active: true,
  },
  {
    id: "barcelona-es",
    city: "Barcelona",
    country: "Spain",
    region: "Western Mediterranean",
    airport: "BCN",
    climateByMonth: [10, 11, 13, 15, 19, 23, 26, 26, 23, 19, 14, 11],
    vibeTags: ["city", "beach", "nightlife", "culture"],
    flightHoursFrom: { TLV: 4.6 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-bcn-gaudi",
    attractionPackages: [
      pkg("bcn-gaudi", "Gaudí & the sea", 140, ["culture", "city", "beach"], [
        "Sagrada Família guided visit",
        "Park Güell",
        "Barceloneta beach & tapas crawl",
      ]),
    ],
    active: true,
  },
  {
    id: "prague-cz",
    city: "Prague",
    country: "Czechia",
    region: "Central Europe",
    airport: "PRG",
    climateByMonth: [0, 1, 5, 10, 15, 18, 20, 20, 15, 10, 4, 1],
    vibeTags: ["city", "culture", "nightlife"],
    flightHoursFrom: { TLV: 3.8 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-prg-bohemia",
    attractionPackages: [
      pkg("prg-old", "Bohemian Prague", 100, ["culture", "city"], [
        "Prague Castle & St. Vitus",
        "Charles Bridge & Old Town",
        "Vltava river cruise with dinner",
      ]),
    ],
    active: true,
  },
  {
    id: "tbilisi-ge",
    city: "Tbilisi",
    country: "Georgia",
    region: "Caucasus",
    airport: "TBS",
    climateByMonth: [3, 5, 9, 14, 19, 23, 26, 26, 21, 15, 9, 5],
    vibeTags: ["culture", "nature", "nightlife"],
    flightHoursFrom: { TLV: 2.8 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-tbs-caucasus",
    attractionPackages: [
      pkg("tbs-old", "Caucasus charm", 80, ["culture", "nature"], [
        "Old Tbilisi & sulphur baths",
        "Mtskheta UNESCO day trip",
        "Kakheti wine region tasting",
      ]),
    ],
    active: true,
  },
  {
    id: "vienna-at",
    city: "Vienna",
    country: "Austria",
    region: "Central Europe",
    airport: "VIE",
    climateByMonth: [1, 3, 7, 12, 17, 20, 23, 22, 17, 11, 5, 2],
    vibeTags: ["city", "culture"],
    flightHoursFrom: { TLV: 3.6 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-vie-imperial",
    attractionPackages: [
      pkg("vie-imperial", "Imperial Vienna", 130, ["culture", "city"], [
        "Schönbrunn Palace & gardens",
        "Belvedere (The Kiss)",
        "Classical concert evening",
      ]),
    ],
    active: true,
  },
];

export function activeDestinations(): Destination[] {
  return CATALOG.filter((d) => d.active);
}

export function findDestination(id: string): Destination | undefined {
  return CATALOG.find((d) => d.id === id);
}
