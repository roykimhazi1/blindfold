// City-centre coordinates for Duffel Stays searches, keyed by destination id.
// Stays search is geo-based (lat/long + radius), while our catalog is keyed by
// airport — this map bridges the two. When the airport-universe dataset lands
// (discovery phases), coordinates move onto the destination records themselves.
export interface StayLocation {
  latitude: number;
  longitude: number;
}

export const STAY_COORDS: Record<string, StayLocation> = {
  "larnaca-cy": { latitude: 34.9167, longitude: 33.6233 },
  "paphos-cy": { latitude: 34.7754, longitude: 32.4218 },
  "athens-gr": { latitude: 37.9838, longitude: 23.7275 },
  "heraklion-gr": { latitude: 35.3387, longitude: 25.1442 },
  "santorini-gr": { latitude: 36.3932, longitude: 25.4615 },
  "rome-it": { latitude: 41.9028, longitude: 12.4964 },
  "barcelona-es": { latitude: 41.3874, longitude: 2.1686 },
  "prague-cz": { latitude: 50.0755, longitude: 14.4378 },
  "tbilisi-ge": { latitude: 41.7151, longitude: 44.8271 },
  "vienna-at": { latitude: 48.2082, longitude: 16.3738 },
  "lisbon-pt": { latitude: 38.7223, longitude: -9.1393 },
  "amsterdam-nl": { latitude: 52.3676, longitude: 4.9041 },
  "budapest-hu": { latitude: 47.4979, longitude: 19.0402 },
  "malta-mt": { latitude: 35.8989, longitude: 14.5146 },
  "dubrovnik-hr": { latitude: 42.6507, longitude: 18.0944 },
  "nice-fr": { latitude: 43.7102, longitude: 7.262 },
  "dubai-ae": { latitude: 25.2048, longitude: 55.2708 },
  "hurghada-eg": { latitude: 27.2579, longitude: 33.8116 },
  "yerevan-am": { latitude: 40.1792, longitude: 44.4991 },
  "munich-de": { latitude: 48.1351, longitude: 11.582 },
  "krakow-pl": { latitude: 50.0647, longitude: 19.945 },
  // ── Airport universe (universe.ts) ─────────────────────────────────
  "istanbul-tr": { latitude: 41.0082, longitude: 28.9784 },
  "thessaloniki-gr": { latitude: 40.6401, longitude: 22.9444 },
  "rhodes-gr": { latitude: 36.4341, longitude: 28.2176 },
  "corfu-gr": { latitude: 39.6243, longitude: 19.9217 },
  "bucharest-ro": { latitude: 44.4268, longitude: 26.1025 },
  "sofia-bg": { latitude: 42.6977, longitude: 23.3219 },
  "varna-bg": { latitude: 43.2141, longitude: 27.9147 },
  "belgrade-rs": { latitude: 44.7866, longitude: 20.4489 },
  "tivat-me": { latitude: 42.4304, longitude: 18.6963 },
  "tirana-al": { latitude: 41.3275, longitude: 19.8187 },
  "batumi-ge": { latitude: 41.6168, longitude: 41.6367 },
  "zagreb-hr": { latitude: 45.815, longitude: 15.9819 },
  "warsaw-pl": { latitude: 52.2297, longitude: 21.0122 },
  "milan-it": { latitude: 45.4642, longitude: 9.19 },
  "venice-it": { latitude: 45.4408, longitude: 12.3155 },
  "naples-it": { latitude: 40.8518, longitude: 14.2681 },
  "catania-it": { latitude: 37.5079, longitude: 15.083 },
  "madrid-es": { latitude: 40.4168, longitude: -3.7038 },
  "valencia-es": { latitude: 39.4699, longitude: -0.3763 },
  "paris-fr": { latitude: 48.8566, longitude: 2.3522 },
  "london-gb": { latitude: 51.5074, longitude: -0.1278 },
  "berlin-de": { latitude: 52.52, longitude: 13.405 },
  "zurich-ch": { latitude: 47.3769, longitude: 8.5417 },
  "marrakech-ma": { latitude: 31.6295, longitude: -7.9811 },
};
