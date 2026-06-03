import type { TripParams } from "@sv/engine";

// Encode/decode TripParams for passing between the wizard and the results page
// without a backend session (base64'd JSON in the URL).
export function encodeParams(params: TripParams): string {
  const json = JSON.stringify(params);
  if (typeof window === "undefined") return Buffer.from(json).toString("base64url");
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodeParams(encoded: string): TripParams | null {
  try {
    const json =
      typeof window === "undefined"
        ? Buffer.from(encoded, "base64url").toString("utf8")
        : decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json) as TripParams;
  } catch {
    return null;
  }
}

export const CURRENCY_SYMBOL: Record<string, string> = {
  USD: "$",
  EUR: "€",
  ILS: "₪",
};
