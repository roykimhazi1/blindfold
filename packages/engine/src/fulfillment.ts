import type { PricedComponents } from "./types.ts";
import { hashString } from "./util.ts";

// ── Fulfillment (the booking saga) ───────────────────────────────────
// "Code transacts." The specialist agents *choose*; this deterministic,
// idempotent layer *books*. Booking is sequenced across the three domains and
// **compensates** (cancels already-booked legs) if a later leg fails — so a
// half-booked trip never survives. Mock-backed today; real suppliers (Duffel /
// Hotelbeds / activities) drop in behind the same `Fulfillment` interface.

export type BookingDomain = "flight" | "hotel" | "attractions";

export interface SupplierOrder {
  ref: string;
  domain: BookingDomain;
  status: "confirmed" | "cancelled";
  priceEur: number;
}

export interface BookInput {
  destinationId: string;
  priceEur: number;
  /** Stable key so retries never double-book (idempotency). */
  idempotencyKey: string;
}

export interface DomainBooker {
  book(input: BookInput): Promise<SupplierOrder>;
  cancel(ref: string): Promise<void>;
}

export interface Fulfillment {
  flights: DomainBooker;
  hotels: DomainBooker;
  attractions: DomainBooker;
}

export type BookingResult =
  | { ok: true; orders: SupplierOrder[] }
  | { ok: false; failedDomain: BookingDomain; error: string; cancelled: SupplierOrder[] };

// Deterministic mock supplier: the ref is a pure function of the idempotency
// key, so re-running a booking returns the same ref instead of double-booking.
function mockBooker(domain: BookingDomain): DomainBooker {
  return {
    async book(input: BookInput): Promise<SupplierOrder> {
      return {
        ref: `${domain}_${hashString(input.idempotencyKey).toString(36)}`,
        domain,
        status: "confirmed",
        priceEur: input.priceEur,
      };
    },
    async cancel(): Promise<void> {
      /* mock supplier: nothing to undo */
    },
  };
}

export const mockFulfillment: Fulfillment = {
  flights: mockBooker("flight"),
  hotels: mockBooker("hotel"),
  attractions: mockBooker("attractions"),
};

function bookerFor(f: Fulfillment, domain: BookingDomain): DomainBooker {
  return domain === "flight" ? f.flights : domain === "hotel" ? f.hotels : f.attractions;
}

/**
 * Book a whole bundle as a saga: flight → hotel → attractions, in order. If any
 * leg fails, cancel the legs already placed (compensation) and report the
 * failure — never leave a partially-booked trip. Idempotent per `bookingId`.
 */
export async function bookBundle(
  components: PricedComponents,
  opts: { bookingId: string; fulfillment?: Fulfillment },
): Promise<BookingResult> {
  const f = opts.fulfillment ?? mockFulfillment;
  const legs: { domain: BookingDomain; destinationId: string; priceEur: number }[] = [
    { domain: "flight", destinationId: components.flight.destinationId, priceEur: components.flight.totalPrice },
    { domain: "hotel", destinationId: components.hotel.destinationId, priceEur: components.hotel.totalPrice },
    { domain: "attractions", destinationId: components.attractions.destinationId, priceEur: components.attractions.totalPrice },
  ];

  const placed: SupplierOrder[] = [];
  for (const leg of legs) {
    try {
      const order = await bookerFor(f, leg.domain).book({
        destinationId: leg.destinationId,
        priceEur: leg.priceEur,
        idempotencyKey: `${opts.bookingId}:${leg.domain}`,
      });
      if (order.status !== "confirmed") throw new Error(`${leg.domain} order not confirmed`);
      placed.push(order);
    } catch (err) {
      const cancelled = await compensate(f, placed);
      return {
        ok: false,
        failedDomain: leg.domain,
        error: err instanceof Error ? err.message : "booking failed",
        cancelled,
      };
    }
  }
  return { ok: true, orders: placed };
}

/** Cancel already-placed legs, newest first. Best-effort; never throws. */
async function compensate(f: Fulfillment, placed: SupplierOrder[]): Promise<SupplierOrder[]> {
  const cancelled: SupplierOrder[] = [];
  for (const order of [...placed].reverse()) {
    try {
      await bookerFor(f, order.domain).cancel(order.ref);
      cancelled.push({ ...order, status: "cancelled" });
    } catch {
      /* leave a record for ops to reconcile; don't block the rollback */
    }
  }
  return cancelled;
}
