// Secrecy-safe travel imagery. Two flavours, both chosen so a photo can never
// give the surprise away:
//   • landscapes/moods — open scenery, never identifiable cities/landmarks
//     (used as the blurred "mystery" deal covers).
//   • people/lifestyle — the *feeling* of travelling (anticipation, sun, a
//     night out, exploring a vibrant street). They show emotion, not a place,
//     so the destination stays hidden.
// Plain module (no "use client") so Server Components read the real string
// values, not a client reference proxy.
export const PHOTOS = {
  // ── Airplane / travel atmosphere ───────────────────────────────
  cloudsWing:     "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=75",

  // ── People enjoying vacations (homepage hero & vibe strip) ─────
  beachPeople:    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
  beachUmbrellas: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80",
  skiing:         "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=900&q=80",
  skiSlope:       "https://images.unsplash.com/photo-1548972827-ef7d9abfff6c?auto=format&fit=crop&w=900&q=80",
  nightParty:     "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80",
  concertCrowd:   "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=900&q=80",
  poolLuxury:     "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80",
  friendsTrip:    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
  cityNight:      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=900&q=80",
  fineDining:     "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
  adventure:      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80",
  rooftopBar:     "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=80",
  passport:       "https://images.unsplash.com/photo-1741795820235-a0e96e4ff6e4?auto=format&fit=crop&w=1200&q=70",
  beachFriends:   "https://images.unsplash.com/photo-1525162618450-db04e92d63d6?auto=format&fit=crop&w=1200&q=70",
  party:          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=70",
  culture:        "https://images.unsplash.com/photo-1760535560909-15b15c3be8b5?auto=format&fit=crop&w=1200&q=70",

  // ── Results page: climate-band backgrounds (blurred for mystery) ─
  beach:          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=70",
  mountainLake:   "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=70",
  mistyHills:     "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=70",
  desertRoad:     "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=1200&q=70",
  packing:        "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=70",
} as const;
