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
};
