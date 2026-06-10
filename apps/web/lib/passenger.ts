import type { PassengerIdentity } from "@sv/engine";

// Authoritative passport-grade validation, shared by the checkout + account
// forms (to gate the submit button and surface per-field hints) and by the API
// routes (the trusted gate — never rely on the client). Keeping the rules in one
// place mirrors the engine guardrail: code does the checking, consistently.

const ISO2 = /^[A-Za-z]{2}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type PassengerErrors = Partial<Record<keyof PassengerIdentity, string>>;

/** Loose input the validator accepts — the forms carry an empty-string gender
 *  until one is chosen, and saved-traveller payloads omit the trip-time `type`. */
export type PassengerInput = { [K in keyof PassengerIdentity]?: PassengerIdentity[K] | "" };

/** Field → message map; an empty object means the passenger is valid. */
export function validatePassenger(p: PassengerInput): PassengerErrors {
  const e: PassengerErrors = {};

  if (!p.givenName || p.givenName.trim().length < 1) e.givenName = "Add a first name";
  if (!p.familyName || p.familyName.trim().length < 1) e.familyName = "Add a last name";

  if (!p.dateOfBirth || !ISO_DATE.test(p.dateOfBirth) || Number.isNaN(Date.parse(p.dateOfBirth))) {
    e.dateOfBirth = "Add a date of birth";
  }

  if (p.gender !== "m" && p.gender !== "f" && p.gender !== "x") e.gender = "Select a gender";

  if (!p.nationality || !ISO2.test(p.nationality)) e.nationality = "Select a nationality";

  if (!p.passportNumber || p.passportNumber.trim().length < 3) e.passportNumber = "Add the passport number";

  if (!p.passportExpiry || !ISO_DATE.test(p.passportExpiry) || Number.isNaN(Date.parse(p.passportExpiry))) {
    e.passportExpiry = "Add the passport expiry";
  }

  if (!p.passportIssuingCountry || !ISO2.test(p.passportIssuingCountry)) {
    e.passportIssuingCountry = "Select issuing country";
  }

  return e;
}

export function isPassengerValid(p: PassengerInput): boolean {
  return Object.keys(validatePassenger(p)).length === 0;
}

/**
 * Passport must still be valid on the return date (`returnIso`, any ISO string).
 * Returns true when unknown rather than blocking — the field-level validator
 * already requires a well-formed expiry; this only adds the "not expired by the
 * time you fly home" rule when we know the return date.
 */
export function passportValidThrough(expiry: string, returnIso: string): boolean {
  if (!ISO_DATE.test(expiry)) return true;
  return expiry >= returnIso.slice(0, 10);
}

/** Normalize a passenger before persisting: trim text, upper-case ISO codes. */
export function normalizePassenger(p: PassengerIdentity): PassengerIdentity {
  return {
    type: p.type,
    givenName: p.givenName.trim(),
    familyName: p.familyName.trim(),
    dateOfBirth: p.dateOfBirth,
    gender: p.gender,
    nationality: p.nationality.trim().toUpperCase(),
    passportNumber: p.passportNumber.trim().toUpperCase(),
    passportExpiry: p.passportExpiry,
    passportIssuingCountry: p.passportIssuingCountry.trim().toUpperCase(),
  };
}
