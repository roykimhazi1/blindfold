import "server-only";
import { Resend } from "resend";
import { CURRENCY_SYMBOL } from "@/lib/trip";
import { supabaseAdmin } from "@/lib/supabase/admin";

function getResend(): Resend | null {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
}

const FROM_ADDRESS = "Blindfold <trips@blindfold.travel>";

// Notifications "outbox", persisted in Supabase. With no email provider wired,
// we record the messages we *would* send (booking confirmation now, packing
// teaser at T-7, refund on cancel) so they're inspectable in /admin/outbox. When
// Resend IS configured, "sent" messages also go out immediately; "queued" ones
// (the T-7 teaser) are picked up later by the scheduled edge function. Every body
// here is leak-safe — never names the place.

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
  userId: string;
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

interface PushInput {
  bookingId?: string;
  userId?: string;
  to: string;
  kind: EmailKind;
  subject: string;
  body: string;
  status: "sent" | "queued";
  scheduledForIso: string;
  createdAtIso: string;
}

async function push(rows: PushInput[]): Promise<void> {
  const supa = supabaseAdmin();
  const { error } = await supa.from("outbox").insert(
    rows.map((e) => ({
      id: "em_" + Math.random().toString(36).slice(2, 9),
      booking_id: e.bookingId ?? null,
      user_id: e.userId ?? null,
      to: e.to,
      kind: e.kind,
      subject: e.subject,
      body: e.body,
      status: e.status,
      scheduled_for_iso: e.scheduledForIso,
      created_at_iso: e.createdAtIso,
    })),
  );
  if (error) throw new Error("Failed to enqueue outbox email: " + error.message);

  // Deliver "sent" messages immediately when Resend is configured. "queued"
  // messages are left for the scheduled edge function to pick up at send time.
  const resend = getResend();
  if (resend) {
    for (const e of rows) {
      if (e.status === "sent") {
        await resend.emails.send({
          from: FROM_ADDRESS,
          to: e.to,
          subject: e.subject,
          text: e.body,
        });
      }
    }
  }
}

export async function enqueueBookingEmails(i: BookingEmailInput): Promise<void> {
  const sym = CURRENCY_SYMBOL[i.currency] ?? "";
  const first = i.name.split(" ")[0] || "there";
  const now = new Date().toISOString();

  await push([
    {
      bookingId: i.bookingId,
      userId: i.userId,
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
    },
    {
      bookingId: i.bookingId,
      userId: i.userId,
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
    },
  ]);
}

export async function enqueueRefundEmail(
  i: { to: string; name: string; amount: number; currency: string; bookingId?: string; userId?: string },
): Promise<void> {
  const sym = CURRENCY_SYMBOL[i.currency] ?? "";
  const first = i.name.split(" ")[0] || "there";
  const now = new Date().toISOString();
  await push([
    {
      bookingId: i.bookingId,
      userId: i.userId,
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
    },
  ]);
}

export async function listOutbox(): Promise<OutboxEntry[]> {
  const supa = supabaseAdmin();
  const { data } = await supa
    .from("outbox")
    .select("*")
    .order("created_at_iso", { ascending: false });
  return (data ?? []).map((e) => ({
    id: e.id,
    to: e.to,
    kind: e.kind as EmailKind,
    subject: e.subject,
    body: e.body,
    status: e.status as "sent" | "queued",
    scheduledForIso: e.scheduled_for_iso,
    createdAtIso: e.created_at_iso,
  }));
}
