import type { PassengerIdentity, PassengerType, Gender } from "@sv/engine";
import type { Database } from "@/lib/supabase/database.types";

// Shared shapes + mappers for the saved-travellers "address book". The DB row is
// snake_case; the client and forms speak camelCase. A saved traveller is a
// person (passport identity) without a trip-specific passenger `type` — that's
// assigned per booking when the person fills a slot in the party.

export type TravellerRow = Database["public"]["Tables"]["travellers"]["Row"];

export interface SavedTraveller {
  id: string;
  isSelf: boolean;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  gender: Gender;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
  passportIssuingCountry: string;
}

export function rowToTraveller(r: TravellerRow): SavedTraveller {
  return {
    id: r.id,
    isSelf: r.is_self,
    givenName: r.given_name,
    familyName: r.family_name,
    dateOfBirth: r.date_of_birth,
    gender: r.gender as Gender,
    nationality: r.nationality,
    passportNumber: r.passport_number,
    passportExpiry: r.passport_expiry,
    passportIssuingCountry: r.passport_issuing_country,
  };
}

/** Project a saved traveller onto a booking passenger, assigning its party slot. */
export function savedToPassenger(t: SavedTraveller, type: PassengerType): PassengerIdentity {
  return {
    type,
    givenName: t.givenName,
    familyName: t.familyName,
    dateOfBirth: t.dateOfBirth,
    gender: t.gender,
    nationality: t.nationality,
    passportNumber: t.passportNumber,
    passportExpiry: t.passportExpiry,
    passportIssuingCountry: t.passportIssuingCountry,
  };
}
