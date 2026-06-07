import { CURRENCY_SYMBOL } from "@/lib/trip";
import { supabaseAdmin } from "@/lib/supabase-server";

// Notification outbox backed by Supabase. With no email provider configured,
// messages are recorded in the `outbox` table so they're inspectable in
// /admin/outbox. A real Resend/Postmark adapter swaps in behind enqueue() later.
// Every body here is leak-safe — never names the place.

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

export async function enqueueBookingEmails(i: BookingEmailInput): Promise<void> {
  const sym = CURRENCY_SYMBOL[i.currency] ?? "";
  const first = i.name.split(" ")[0] || "there";
  const now = new Date().toISOString();

  await push({
    booking_id: i.bookingId,
    to: i.to,
    kind: "confirmation",
    status: "sent",
    scheduled_for_iso: now,
    created_at_iso: now,
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

  await push({
    booking_id: i.bookingId,
    to: i.to,
    kind: "teaser",
    status: "queued",
    scheduled_for_iso: new Date(i.teaserAtMs).toISOString(),
    created_at_iso: now,
    subject: "One week to go — here's how to pack 🧳",
    body:
      `Hi ${first},\n\n` +
      `Your surprise is almost here. We still won't say where — but we'll say this:\n\n` +
      `${i.packingTip}\n\n` +
      `(It's going to be ${i.climateBand}.)\n\n` +
      `See you soon-ish, somewhere nice.\n— Blindfold`,
  });
}

export async function enqueueRefundEmail(i: { to: string; name: string; amount: number; currency: string }): Promise<void> {
  const sym = CURRENCY_SYMBOL[i.currency] ?? "";
  const first = i.name.split(" ")[0] || "there";
  const now = new Date().toISOString();
  await push({
    to: i.to,
    kind: "refund",
    status: "sent",
    scheduled_for_iso: now,
    created_at_iso: now,
    subject: "Refund on its way — no hard feelings 💛",
    body:
      `Hi ${first},\n\n` +
      `Your surprise trip is cancelled and we've refunded ${sym}${Math.round(i.amount).toLocaleString()} ` +
      `in full — every last bit.\n\n` +
      `The unknown will still be here when you're ready. Whenever that is.\n— Blindfold`,
  });
}

async function push(e: Record<string, string | null>): Promise<void> {
  const id = "em_" + Math.random().toString(36).slice(2, 9);
  await supabaseAdmin.from("outbox").insert({ id, ...e });
}

export async function listOutbox(): Promise<OutboxEntry[]> {
  const { data } = await supabaseAdmin
    .from("outbox")
    .select("id, to, kind, subject, body, status, scheduled_for_iso, created_at_iso")
    .order("inserted_at", { ascending: false });
  if (!data) return [];
  return data.map((r) => ({
    id: r.id,
    to: r.to,
    kind: r.kind as EmailKind,
    subject: r.subject,
    body: r.body,
    status: r.status as "sent" | "queued",
    scheduledForIso: r.scheduled_for_iso,
    createdAtIso: r.created_at_iso,
  }));
}
