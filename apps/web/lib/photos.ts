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
  cloudsWing: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=70",
  beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=70",
  mountainLake: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=70",
  mistyHills: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=70",
  desertRoad: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=1200&q=70",
  packing: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=70",
  // People & lifestyle — the joy of going, never a destination giveaway.
  passport: "https://images.unsplash.com/photo-1741795820235-a0e96e4ff6e4?auto=format&fit=crop&w=1200&q=70",
  beachFriends: "https://images.unsplash.com/photo-1525162618450-db04e92d63d6?auto=format&fit=crop&w=1200&q=70",
  party: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=70",
  culture: "https://images.unsplash.com/photo-1760535560909-15b15c3be8b5?auto=format&fit=crop&w=1200&q=70",
} as const;
