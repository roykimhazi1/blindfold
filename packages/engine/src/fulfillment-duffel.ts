import type { PassengerIdentity } from "./types.ts";
import {
  mockBooker,
  mockFulfillment,
  type BookInput,
  type DomainBooker,
  type Fulfillment,
  type SupplierOrder,
} from "./fulfillment.ts";
import { resolveMode, type ProviderMode } from "./providers/index.ts";

// ── Duffel fulfillment (real orders) ─────────────────────────────────
// Books the exact offer/rate captured at re-quote time (BookInput.supplier).
// Flights become Duffel orders paid from the Duffel balance; hotels become
// Stays bookings (quote → book). A leg without a key/supplier handle falls
// back to the deterministic mock booker — its hash-style ref (flight_…) is
// visibly different from a real Duffel ref (ord_… / bok_…), so ops can tell
// which legs were actually placed. Attractions stay mock (no supplier API).
//
// NOTE: Duffel order creation has no native idempotency key — the layers
// above (paymentIntentId in /api/book, refs persisted per booking) keep
// retries from double-booking. Full Phase D hardens this with order metadata
// reconciliation.

function env(name: string): string | undefined {
  return typeof process !== "undefined" ? process.env?.[name] : undefined;
}

async function duffel(path: string, apiKey: string, body?: unknown) {
  const res = await fetch(`https://api.duffel.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Duffel-Version": "v2",
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Duffel ${path} → ${res.status}${text ? `: ${text.slice(0, 300)}` : ""}`);
  }
  return res.json();
}

/**
 * Map our passport snapshot to a Duffel order passenger. Order matters: the
 * offer-request passengers were built adults-first then children, and the
 * checkout collects travellers in the same order, so index i pairs with
 * supplier passengerIds[i]. Exported for unit tests.
 */
export function toDuffelOrderPassenger(
  p: PassengerIdentity,
  duffelPassengerId: string,
  contact: { email?: string; phone?: string },
) {
  return {
    id: duffelPassengerId,
    title: p.gender === "f" ? "ms" : "mr",
    gender: p.gender,
    given_name: p.givenName,
    family_name: p.familyName,
    born_on: p.dateOfBirth,
    email: contact.email,
    phone_number: contact.phone,
    identity_documents: [
      {
        type: "passport",
        unique_identifier: p.passportNumber,
        expires_on: p.passportExpiry,
        issuing_country_code: p.passportIssuingCountry,
      },
    ],
  };
}

function contactFor(input: BookInput): { email?: string; phone?: string } {
  return {
    email: input.contactEmail,
    // Phone is deliberately not collected from travellers (PII minimalism);
    // suppliers require one, so orders carry the ops desk number.
    phone: input.contactPhone ?? env("OPS_CONTACT_PHONE") ?? "+972722220000",
  };
}

const duffelFlightBooker: DomainBooker = {
  async book(input: BookInput): Promise<SupplierOrder> {
    const apiKey = env("DUFFEL_API_KEY");
    const s = input.supplier;
    if (!apiKey || !s?.offerId || !s.passengerIds?.length || !input.passengers?.length) {
      return mockBooker("flight").book(input);
    }
    if (s.passengerIds.length !== input.passengers.length) {
      throw new Error("flight order: passenger count mismatch with the quoted offer");
    }
    const contact = contactFor(input);
    const body = {
      data: {
        type: "instant",
        selected_offers: [s.offerId],
        payments: [{ type: "balance", currency: s.currency, amount: s.totalAmount }],
        passengers: input.passengers.map((p, i) => toDuffelOrderPassenger(p, s.passengerIds![i]!, contact)),
        metadata: { booking_key: input.idempotencyKey },
      },
    };
    const resp = await duffel("/air/orders", apiKey, body) as { data: { id: string } };
    return { ref: resp.data.id, domain: "flight", status: "confirmed", priceEur: input.priceEur };
  },

  // Two-step cancel: quote the refund, then confirm. Compensation is
  // best-effort — bookBundle's rollback swallows a failure here and leaves
  // the ref for ops to reconcile.
  async cancel(ref: string): Promise<void> {
    const apiKey = env("DUFFEL_API_KEY");
    if (!apiKey || !ref.startsWith("ord_")) return;
    const created = await duffel("/air/order_cancellations", apiKey, { data: { order_id: ref } }) as { data: { id: string } };
    await duffel(`/air/order_cancellations/${created.data.id}/actions/confirm`, apiKey);
  },
};

const duffelStaysBooker: DomainBooker = {
  async book(input: BookInput): Promise<SupplierOrder> {
    const apiKey = env("DUFFEL_API_KEY");
    const s = input.supplier;
    if (!apiKey || !s?.rateId || !input.passengers?.length) {
      return mockBooker("hotel").book(input);
    }
    const contact = contactFor(input);
    // Stays books in two steps: re-validate the rate as a quote, then book it.
    const quote = await duffel("/stays/quotes", apiKey, { data: { rate_id: s.rateId } }) as { data: { id: string } };
    const body = {
      data: {
        quote_id: quote.data.id,
        guests: input.passengers.map((p) => ({ given_name: p.givenName, family_name: p.familyName })),
        email: contact.email,
        phone_number: contact.phone,
        metadata: { booking_key: input.idempotencyKey },
      },
    };
    const resp = await duffel("/stays/bookings", apiKey, body) as { data: { id: string } };
    return { ref: resp.data.id, domain: "hotel", status: "confirmed", priceEur: input.priceEur };
  },

  async cancel(ref: string): Promise<void> {
    const apiKey = env("DUFFEL_API_KEY");
    if (!apiKey || !ref.startsWith("bok_")) return;
    await duffel(`/stays/bookings/${ref}/actions/cancel`, apiKey);
  },
};

export const duffelFulfillment: Fulfillment = {
  flights: duffelFlightBooker,
  hotels: duffelStaysBooker,
  attractions: mockBooker("attractions"),
};

/**
 * Fulfillment selector, mirroring getProviders(): mock mode (or no key) books
 * against the deterministic mock suppliers; sandbox/live place real Duffel
 * orders, falling back per-leg when a supplier handle is missing.
 */
export function getFulfillment(mode?: ProviderMode): Fulfillment {
  const resolved = mode ?? resolveMode();
  if (resolved === "mock" || !env("DUFFEL_API_KEY")) return mockFulfillment;
  return duffelFulfillment;
}
