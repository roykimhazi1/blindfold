import { CURRENCY_SYMBOL } from "@/lib/trip";

// Mock notifications "outbox". With no email provider configured, we record the
// messages we *would* send (booking confirmation now, packing teaser at T-7) so
// they're inspectable in /admin/outbox. A real Resend/Postmark adapter swaps in
// behind enqueue() later. Every body here is leak-safe — never names the place.

export type EmailKind = "confirmation" | "teaser" | "refund";

export interface OutboxEntry {
  id: string;
  to: string;
  kind: EmailKind;
  subject: string;
  body: string;
  status: "sent" | "queued";
  scheduledForIso: string;
  createdAtIso: string;
}

type Outbox = OutboxEntry[];
const g = globalThis as unknown as { __outbox?: Outbox };
const outbox: Outbox = (g.__outbox ??= []);

export interface BookingEmailInput {
  bookingId: string;
  to: string;
  name: string;
  packingTip: string;
  climateBand: string;
  departureIso: string;
  nights: number;
  travelers: number;
  priceTotal: number;
  currency: string;
  teaserAtMs: number;
}

export function enqueueBookingEmails(i: BookingEmailInput): void {
  const sym = CURRENCY_SYMBOL[i.currency] ?? "";
  const first = i.name.split(" ")[0] || "there";
  const now = new Date().toISOString();

  push({
    to: i.to,
    kind: "confirmation",
    status: "sent",
    scheduledForIso: now,
    createdAtIso: now,
    subject: "You're booked — somewhere good is waiting 🎁",
    body:
      `Hi ${first},\n\n` +
      `It's official: you're going on a surprise trip. ${i.nights} nights for ${i.travelers}, ` +
      `all in for ${sym}${Math.round(i.priceTotal).toLocaleString()}.\n\n` +
      `We're keeping the destination a secret for now. Here's how it unfolds:\n` +
      `• A week before — a packing nudge (so you bring the right shoes)\n` +
      `• At the airport — the big reveal\n` +
      `• When you land — your driver shows you to your hotel\n\n` +
      `Sit back. We've got the rest.\n— Blindfold`,
  });

  push({
    to: i.to,
    kind: "teaser",
    status: "queued",
    scheduledForIso: new Date(i.teaserAtMs).toISOString(),
    createdAtIso: now,
    subject: "One week to go — here's how to pack 🧳",
    body:
      `Hi ${first},\n\n` +
      `Your surprise is almost here. We still won't say where — but we'll say this:\n\n` +
      `${i.packingTip}\n\n` +
      `(It's going to be ${i.climateBand}.)\n\n` +
      `See you soon-ish, somewhere nice.\n— Blindfold`,
  });
}

export function enqueueRefundEmail(i: { to: string; name: string; amount: number; currency: string }): void {
  const sym = CURRENCY_SYMBOL[i.currency] ?? "";
  const first = i.name.split(" ")[0] || "there";
  const now = new Date().toISOString();
  push({
    to: i.to,
    kind: "refund",
    status: "sent",
    scheduledForIso: now,
    createdAtIso: now,
    subject: "Refund on its way — no hard feelings 💛",
    body:
      `Hi ${first},\n\n` +
      `Your surprise trip is cancelled and we've refunded ${sym}${Math.round(i.amount).toLocaleString()} ` +
      `in full — every last bit.\n\n` +
      `The unknown will still be here when you're ready. Whenever that is.\n— Blindfold`,
  });
}

function push(e: Omit<OutboxEntry, "id">): void {
  outbox.unshift({ id: "em_" + Math.random().toString(36).slice(2, 9), ...e });
}

export function listOutbox(): OutboxEntry[] {
  return outbox;
}
