import type { Destination, AttractionPackage } from "./types.ts";
import { UNIVERSE } from "./universe.ts";

// Seed catalog of "operable" cities — each has a transfer partner and at
// least one attraction package. Departure hub for the MVP is TLV (Tel Aviv).
// Climate is average °C per month (Jan..Dec). Flight hours are from TLV.
// All destinations here are visa-free for Israeli (IL) passports.
//
// The curated entries below are the agents' "reference book" — rich,
// hand-picked activities. The exported CATALOG also includes the airport
// UNIVERSE (universe.ts): the long tail of TLV-reachable cities with generic
// activity fallbacks, so discovery, pricing, and the leak-check span every
// operable city.

function pkg(
  id: string,
  title: string,
  pricePerPerson: number,
  vibeTags: AttractionPackage["vibeTags"],
  items: string[],
): AttractionPackage {
  return { id, title, items, pricePerPerson, vibeTags };
}

const CURATED: Destination[] = [
  // ── Eastern Mediterranean ─────────────────────────────────────────
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
      pkg("lca-heritage", "Medieval Cyprus", 80, ["culture"], [
        "Larnaca Medieval Castle",
        "Church of Saint Lazarus",
        "Choirokoitia Neolithic village",
      ]),
    ],
    active: true,
  },
  {
    id: "paphos-cy",
    city: "Paphos",
    country: "Cyprus",
    region: "Eastern Mediterranean",
    airport: "PFO",
    climateByMonth: [13, 13, 15, 19, 23, 27, 30, 30, 27, 23, 18, 14],
    vibeTags: ["beach", "culture", "nature"],
    flightHoursFrom: { TLV: 0.85 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-pfo-aphrodite",
    attractionPackages: [
      pkg("pfo-mythology", "Birthplace of Aphrodite", 95, ["culture", "nature"], [
        "Petra tou Romiou (Aphrodite's Rock)",
        "Paphos Archaeological Park & mosaics",
        "Akamas Peninsula jeep tour",
      ]),
      pkg("pfo-beach", "Paphos Riviera", 85, ["beach", "nature"], [
        "Coral Bay beach day",
        "Blue Lagoon boat trip",
        "Sunset at Latchi harbour",
      ]),
    ],
    active: true,
  },

  // ── Greece ────────────────────────────────────────────────────────
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
      pkg("ath-modern", "Athens After Dark", 100, ["nightlife", "city"], [
        "Monastiraki flea market & rooftop drinks",
        "Gazi neighbourhood bar crawl",
        "Street art tour in Exarcheia",
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
      pkg("her-gorge", "Samaria Gorge hike", 130, ["nature"], [
        "Samaria Gorge full-day trek",
        "Agia Roumeli beach swim",
        "Boat back to Hora Sfakion",
      ]),
    ],
    active: true,
  },
  {
    id: "santorini-gr",
    city: "Santorini",
    country: "Greece",
    region: "Greek Islands",
    airport: "JTR",
    climateByMonth: [12, 12, 14, 17, 21, 25, 27, 27, 24, 21, 17, 13],
    vibeTags: ["beach", "culture", "nightlife"],
    flightHoursFrom: { TLV: 2.3 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-jtr-caldera",
    attractionPackages: [
      pkg("jtr-caldera", "Caldera & sunset", 160, ["culture", "beach"], [
        "Oia village & famous sunset viewpoint",
        "Catamaran caldera cruise with snorkelling",
        "Akrotiri archaeological site",
      ]),
      pkg("jtr-wine", "Volcanic wine trail", 140, ["culture", "nature"], [
        "Santo Wines tasting with caldera view",
        "Pyrgos hilltop village walk",
        "Black-sand Perissa beach",
      ]),
    ],
    active: true,
  },

  // ── Italy ─────────────────────────────────────────────────────────
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
      pkg("rome-classic", "Eternal City classics", 150, ["culture", "city"], [
        "Colosseum & Roman Forum",
        "Vatican Museums & Sistine Chapel",
        "Trastevere evening food tour",
      ]),
      pkg("rome-food", "Roman table", 120, ["city"], [
        "Campo de' Fiori market morning",
        "Pasta-making class",
        "Gelato & espresso bar hopping in Pigneto",
      ]),
    ],
    active: true,
  },

  // ── Spain ─────────────────────────────────────────────────────────
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
      pkg("bcn-night", "Barcelona nights", 120, ["nightlife", "city"], [
        "El Born cocktail bar tour",
        "Flamenco show in the Gothic Quarter",
        "Brunch at La Boqueria the next morning",
      ]),
    ],
    active: true,
  },

  // ── Czech Republic ────────────────────────────────────────────────
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
      pkg("prg-beer", "Pub culture & craft beer", 80, ["nightlife", "city"], [
        "Old Town cellar beer tasting",
        "Žižkov neighbourhood bar crawl",
        "Traditional svíčková dinner",
      ]),
    ],
    active: true,
  },

  // ── Georgia ───────────────────────────────────────────────────────
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
      pkg("tbs-night", "Tbilisi underground", 70, ["nightlife", "culture"], [
        "Fabrika creative hub evening",
        "Georgian polyphonic choir concert",
        "Late-night techno at Bassiani (pre-booked)",
      ]),
    ],
    active: true,
  },

  // ── Austria ───────────────────────────────────────────────────────
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
      pkg("vie-cafe", "Coffee house culture", 100, ["culture", "city"], [
        "Breakfast at Café Central",
        "Vienna State Opera guided tour",
        "Naschmarkt food stroll",
      ]),
    ],
    active: true,
  },

  // ── Portugal ──────────────────────────────────────────────────────
  {
    id: "lisbon-pt",
    city: "Lisbon",
    country: "Portugal",
    region: "Western Europe",
    airport: "LIS",
    climateByMonth: [11, 12, 14, 16, 19, 23, 26, 26, 23, 19, 15, 12],
    vibeTags: ["city", "beach", "culture", "nightlife"],
    flightHoursFrom: { TLV: 5.5 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-lis-fado",
    attractionPackages: [
      pkg("lis-fado", "Fado & Alfama", 120, ["culture", "city"], [
        "Alfama & São Jorge Castle walk",
        "Belém Tower & pastéis de nata",
        "Fado dinner show in Mouraria",
      ]),
      pkg("lis-surf", "Cascais & Sintra coast", 140, ["beach", "nature"], [
        "Sintra palaces day trip",
        "Cascais promenade & beach",
        "Surf lesson at Guincho beach",
      ]),
    ],
    active: true,
  },

  // ── Netherlands ───────────────────────────────────────────────────
  {
    id: "amsterdam-nl",
    city: "Amsterdam",
    country: "Netherlands",
    region: "Western Europe",
    airport: "AMS",
    climateByMonth: [4, 4, 7, 10, 14, 17, 20, 20, 16, 12, 7, 5],
    vibeTags: ["city", "culture", "nightlife"],
    flightHoursFrom: { TLV: 4.5 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-ams-canals",
    attractionPackages: [
      pkg("ams-museums", "Golden Age & canals", 140, ["culture", "city"], [
        "Rijksmuseum (Rembrandt & Vermeer)",
        "Anne Frank House",
        "Evening canal boat with stroopwafels",
      ]),
      pkg("ams-bike", "Two-wheel Amsterdam", 110, ["city", "nature"], [
        "Bike rental & Vondelpark morning",
        "Keukenhof Gardens day trip (seasonal)",
        "Jordaan neighbourhood market",
      ]),
    ],
    active: true,
  },

  // ── Hungary ───────────────────────────────────────────────────────
  {
    id: "budapest-hu",
    city: "Budapest",
    country: "Hungary",
    region: "Central Europe",
    airport: "BUD",
    climateByMonth: [1, 3, 8, 14, 19, 22, 25, 25, 20, 13, 6, 2],
    vibeTags: ["city", "culture", "nightlife", "nature"],
    flightHoursFrom: { TLV: 3.0 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-bud-danube",
    attractionPackages: [
      pkg("bud-baths", "Thermal baths & baroque", 110, ["culture", "city"], [
        "Széchenyi thermal bath",
        "Buda Castle & Fisherman's Bastion",
        "Danube dinner cruise",
      ]),
      pkg("bud-ruin", "Ruin bars & nightlife", 100, ["nightlife", "city"], [
        "Szimpla Kert ruin pub evening",
        "Jewish Quarter heritage walk",
        "Hungarian wine & pálinka tasting",
      ]),
    ],
    active: true,
  },

  // ── Malta ─────────────────────────────────────────────────────────
  {
    id: "malta-mt",
    city: "Valletta",
    country: "Malta",
    region: "Central Mediterranean",
    airport: "MLA",
    climateByMonth: [13, 13, 14, 17, 20, 25, 28, 28, 26, 22, 18, 15],
    vibeTags: ["beach", "culture"],
    flightHoursFrom: { TLV: 2.8 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-mla-knights",
    attractionPackages: [
      pkg("mla-knights", "Knights & Baroque", 100, ["culture"], [
        "Valletta Baroque city walk (UNESCO)",
        "Mdina Silent City tour",
        "Hypogeum of Ħal Saflieni",
      ]),
      pkg("mla-blue", "Blue Lagoon & caves", 120, ["beach", "nature"], [
        "Comino Blue Lagoon boat trip",
        "Marsaxlokk fishing village market",
        "Sea kayaking around Gozo cliffs",
      ]),
    ],
    active: true,
  },

  // ── Croatia ───────────────────────────────────────────────────────
  {
    id: "dubrovnik-hr",
    city: "Dubrovnik",
    country: "Croatia",
    region: "Adriatic",
    airport: "DBV",
    climateByMonth: [9, 10, 13, 16, 20, 25, 28, 28, 24, 20, 15, 11],
    vibeTags: ["beach", "culture", "city"],
    flightHoursFrom: { TLV: 2.5 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-dbv-adriatic",
    attractionPackages: [
      pkg("dbv-walls", "Old city walls & Adriatic", 130, ["culture", "beach"], [
        "Dubrovnik Old Town walls walk",
        "Lokrum island boat trip",
        "Game of Thrones filming locations tour",
      ]),
      pkg("dbv-kayak", "Sea kayak & island hop", 150, ["nature", "beach"], [
        "Sea kayak around city walls",
        "Elafiti islands day sail",
        "Sunset cocktails at Buža cliff bar",
      ]),
    ],
    active: true,
  },

  // ── France ────────────────────────────────────────────────────────
  {
    id: "nice-fr",
    city: "Nice",
    country: "France",
    region: "French Riviera",
    airport: "NCE",
    climateByMonth: [9, 10, 12, 15, 18, 22, 26, 26, 23, 18, 13, 10],
    vibeTags: ["beach", "city", "culture"],
    flightHoursFrom: { TLV: 4.0 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-nce-riviera",
    attractionPackages: [
      pkg("nce-riviera", "Côte d'Azur classic", 150, ["beach", "culture"], [
        "Promenade des Anglais & Vieux-Nice",
        "Monaco & Monte-Carlo half-day",
        "Èze perched village & afternoon swim",
      ]),
      pkg("nce-markets", "Riviera food & markets", 130, ["culture", "city"], [
        "Cours Saleya flower & food market",
        "Provençal cooking class",
        "Antibes old town & Picasso museum",
      ]),
    ],
    active: true,
  },

  // ── UAE ───────────────────────────────────────────────────────────
  {
    id: "dubai-ae",
    city: "Dubai",
    country: "UAE",
    region: "Middle East",
    airport: "DXB",
    climateByMonth: [18, 19, 22, 26, 30, 33, 35, 36, 33, 29, 25, 20],
    vibeTags: ["city", "nightlife", "beach"],
    flightHoursFrom: { TLV: 3.5 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-dxb-skyline",
    attractionPackages: [
      pkg("dxb-skyline", "Skyline & desert", 180, ["city", "nightlife"], [
        "Burj Khalifa At The Top (124th floor)",
        "Desert safari with BBQ & stargazing",
        "Dubai Marina dinner cruise",
      ]),
      pkg("dxb-culture", "Old Dubai & modern wonders", 160, ["culture", "city"], [
        "Al Fahidi historical district & Dubai Creek",
        "Dubai Museum of the Future",
        "Gold & Spice Souk walk",
      ]),
    ],
    active: true,
  },

  // ── Egypt ─────────────────────────────────────────────────────────
  {
    id: "hurghada-eg",
    city: "Hurghada",
    country: "Egypt",
    region: "Red Sea",
    airport: "HRG",
    climateByMonth: [18, 19, 22, 26, 29, 32, 34, 34, 31, 27, 23, 19],
    vibeTags: ["beach", "nature"],
    flightHoursFrom: { TLV: 1.2 },
    visaFreeFor: ["IL"],
    transferPartnerId: "tp-hrg-redsea",
    attractionPackages: [
      pkg("hrg-reef", "Red Sea reef & snorkel", 100, ["nature", "beach"], [
        "Giftun Island snorkelling trip",
        "Glass-bottom boat coral tour",
        "Bedouin desert quad adventure",
      ]),
      pkg("hrg-dive", "Learn to dive — Red Sea", 140, ["nature"], [
        "PADI discover scuba intro dive",
        "Underwater photography session",
        "Dolphin House boat excursion",
      ]),
    ],
    active: true,
  },

  // ── Armenia ───────────────────────────────────────────────────────
  {
    id: "yerevan-am",
    city: "Yerevan",
    country: "Armenia",
    region: "Caucasus",
    airport: "EVN",
    climateByMonth: [0, 2, 7, 13, 18, 23, 27, 27, 22, 15, 8, 2],
    vibeTags: ["culture", "nature", "nightlife"],
    flightHoursFrom: { TLV: 2.0 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-evn-ararat",
    attractionPackages: [
      pkg("evn-ararat", "Ararat & ancient monasteries", 90, ["culture", "nature"], [
        "Geghard Monastery & Garni Temple",
        "Khor Virap with Mt Ararat panorama",
        "Cascade Complex & brandy tasting",
      ]),
      pkg("evn-modern", "Pink city & café culture", 75, ["city", "culture"], [
        "Republic Square & History Museum",
        "Northern Avenue street food",
        "Vernissage flea market",
      ]),
    ],
    active: true,
  },

  // ── Germany ───────────────────────────────────────────────────────
  {
    id: "munich-de",
    city: "Munich",
    country: "Germany",
    region: "Central Europe",
    airport: "MUC",
    climateByMonth: [0, 1, 5, 10, 14, 18, 20, 20, 16, 10, 4, 1],
    vibeTags: ["city", "culture", "nightlife"],
    flightHoursFrom: { TLV: 3.5 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-muc-bavaria",
    attractionPackages: [
      pkg("muc-bavaria", "Bavarian grandeur", 130, ["culture", "city"], [
        "Neuschwanstein Castle day trip",
        "Marienplatz & Viktualienmarkt",
        "BMW Welt & museum",
      ]),
      pkg("muc-beer", "Beer gardens & Englischer Garten", 100, ["nightlife", "nature"], [
        "Englischer Garten river surf & picnic",
        "Hofbräuhaus beer hall evening",
        "Dachau Memorial historical visit",
      ]),
    ],
    active: true,
  },

  // ── Poland ────────────────────────────────────────────────────────
  {
    id: "krakow-pl",
    city: "Kraków",
    country: "Poland",
    region: "Central Europe",
    airport: "KRK",
    climateByMonth: [-1, 0, 5, 10, 15, 18, 20, 20, 15, 10, 4, 0],
    vibeTags: ["city", "culture", "nightlife"],
    flightHoursFrom: { TLV: 4.0 },
    visaFreeFor: ["IL", "*"],
    transferPartnerId: "tp-krk-wieliczka",
    attractionPackages: [
      pkg("krk-rynek", "Royal route & Jewish heritage", 110, ["culture", "city"], [
        "Wawel Royal Castle & Cathedral",
        "Kazimierz Jewish Quarter walk",
        "Wieliczka Salt Mine tour",
      ]),
      pkg("krk-vodka", "Kraków nights & pierogi", 90, ["nightlife", "culture"], [
        "Pierogi cooking class",
        "Piwnica Pod Baranami jazz cellar",
        "Plac Nowy bar street tour",
      ]),
    ],
    active: true,
  },
];

/** Every operable destination: curated reference book + the airport universe. */
export const CATALOG: Destination[] = [...CURATED, ...UNIVERSE];

export function activeDestinations(): Destination[] {
  return CATALOG.filter((d) => d.active);
}

export function findDestination(id: string): Destination | undefined {
  return CATALOG.find((d) => d.id === id);
}

export function findDestinationByAirport(iata: string): Destination | undefined {
  return CATALOG.find((d) => d.airport === iata);
}
