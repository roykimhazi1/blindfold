export const metadata = { title: "Terms of service — Blindfold" };

// Plain-language draft. ⚠️ Have a lawyer review before charging real money.

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "What you're buying",
    body: [
      "A complete surprise trip: round-trip flights, a hotel stay, an airport pickup, and a small set of experiences — to a destination we keep secret until departure day. You always see the trip's shape (dates, climate, hotel level, flight length) and the full price before you pay.",
    ],
  },
  {
    title: "The secret",
    body: [
      "The whole product is the surprise, so we reveal the destination on departure day and the hotel on arrival. Your travel documents will, by necessity, name the destination at the airport security and boarding stage — the reveal we control is the one in the app, at the gate.",
      "If you choose \"Keep me in control\" at checkout, booking confirmations from airlines and hotels go straight to your inbox and may name the destination at any time. That's on you — we warned you, lovingly.",
    ],
  },
  {
    title: "Changes & cancellation",
    body: [
      "You can cancel for a full refund any time before we lock in your bookings with the airline and hotel. After lock-in, airline and hotel cancellation rules apply, and we'll always pass back whatever they refund us.",
      "We'll tell you clearly in the app when your trip becomes locked.",
    ],
  },
  {
    title: "Your details",
    body: [
      "Airlines require passport details to issue tickets. We collect them once, at checkout, and store them encrypted-at-rest and access-restricted, only for the purpose of booking your travel. See the Privacy page for the full picture.",
    ],
  },
  {
    title: "Prices",
    body: [
      "The price you see at checkout is all-in: flights, hotel, transfer, experiences, and our service fee. If a supplier's price moves between browsing and paying, we show you the new total and you decide — we never charge a different amount than the one you confirmed.",
    ],
  },
  {
    title: "When things go sideways",
    body: [
      "Flights get delayed, hotels overbook, weather happens. We'll fix what's fixable, rebook what's rebookable, and refund what's neither. What we can't promise is the airline's punctuality — our liability is limited to what you paid us.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <h1 className="font-display text-3xl font-extrabold">Terms of service</h1>
      <p className="mt-2 text-sm text-white/50">
        The short, human version. A formal one is coming before launch — if anything here surprises
        you (the bad kind of surprise), tell us.
      </p>
      {SECTIONS.map((s) => (
        <section key={s.title} className="mt-8">
          <h2 className="font-display text-lg font-bold">{s.title}</h2>
          {s.body.map((p, i) => (
            <p key={i} className="mt-2 text-sm leading-relaxed text-white/70">{p}</p>
          ))}
        </section>
      ))}
      <p className="mt-10 text-xs text-white/35">
        Draft for the demo build — not yet reviewed by a lawyer, not yet binding. Last updated June 2026.
      </p>
    </div>
  );
}
