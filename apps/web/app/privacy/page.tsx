export const metadata = { title: "Privacy — Blindfold" };

// Plain-language draft. ⚠️ Have a lawyer review before charging real money.

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "What we collect, and why",
    body: [
      "Your account (Google sign-in: name and email) — so your trips live somewhere and reveals reach you.",
      "Trip preferences (budget, dates, vibe) — to build your surprises. These describe the trip, not you.",
      "Passport details for each traveller — because airlines won't issue a ticket without them. Collected once at checkout, used only to book your travel.",
      "Payment — handled entirely by Stripe. Your card number never touches our servers.",
    ],
  },
  {
    title: "Where it lives",
    body: [
      "Everything is stored with Supabase (Postgres) with row-level security: you can only ever read your own data. Passport details and the trip's secret destination live in tables that even your own browser session can't read directly — only our booking server can.",
    ],
  },
  {
    title: "Who we share it with",
    body: [
      "Airlines and hotels get exactly what they need to confirm your booking: traveller names, passport details, and a contact. In \"Full surprise\" mode that contact is our concierge desk, not you — that's the point.",
      "We don't sell data. We don't run third-party ad trackers on the booking flow.",
    ],
  },
  {
    title: "How long we keep it",
    body: [
      "Bookings and their passenger snapshots are kept for as long as legal and accounting rules require. Saved travellers live in your address book until you delete them — which you can do any time from your account page.",
    ],
  },
  {
    title: "Your controls",
    body: [
      "Edit or delete saved travellers in Account → Travellers. Want your whole account gone? Email us and we'll erase everything that isn't legally required to stay (and tell you exactly what stayed and why).",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <h1 className="font-display text-3xl font-extrabold">Privacy</h1>
      <p className="mt-2 text-sm text-white/50">
        We keep one secret from you — the destination. Here's everything we know about you, and what
        we do with it.
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
        Draft for the demo build — not yet reviewed by a lawyer. Last updated June 2026.
      </p>
    </div>
  );
}
