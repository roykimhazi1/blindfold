"use client";

import type { Gender } from "@sv/engine";
import { COUNTRIES } from "@/lib/countries";
import type { PassengerErrors } from "@/lib/passenger";

// One traveller's passport-grade fields. Pure presentation: the parent owns the
// value + errors and decides when to validate. Shared by the checkout "Who's
// travelling" step and the /account personal-info zone so the two never drift.

export interface IdentityFields {
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  gender: Gender | "";
  nationality: string;
  citizenId: string;
  passportNumber: string;
  passportExpiry: string;
  passportIssuingCountry: string;
}

export function emptyIdentity(): IdentityFields {
  return {
    givenName: "",
    familyName: "",
    dateOfBirth: "",
    gender: "",
    nationality: "IL",
    citizenId: "",
    passportNumber: "",
    passportExpiry: "",
    passportIssuingCountry: "IL",
  };
}

const inputClass =
  "mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-400";

export function PassengerFields({
  value,
  onChange,
  errors = {},
  idPrefix,
  showCitizenId = false,
}: {
  value: IdentityFields;
  onChange: (patch: Partial<IdentityFields>) => void;
  errors?: PassengerErrors;
  idPrefix: string;
  /** Show the optional national-ID (citizen ID) field. Off at checkout. */
  showCitizenId?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="First name (as in passport)" error={errors.givenName} htmlFor={`${idPrefix}-given`}>
        <input
          id={`${idPrefix}-given`}
          value={value.givenName}
          onChange={(e) => onChange({ givenName: e.target.value })}
          autoComplete="given-name"
          placeholder="Maya"
          className={inputClass}
        />
      </Field>

      <Field label="Last name (as in passport)" error={errors.familyName} htmlFor={`${idPrefix}-family`}>
        <input
          id={`${idPrefix}-family`}
          value={value.familyName}
          onChange={(e) => onChange({ familyName: e.target.value })}
          autoComplete="family-name"
          placeholder="Levi"
          className={inputClass}
        />
      </Field>

      <Field label="Date of birth" error={errors.dateOfBirth} htmlFor={`${idPrefix}-dob`}>
        <input
          id={`${idPrefix}-dob`}
          type="date"
          value={value.dateOfBirth}
          onChange={(e) => onChange({ dateOfBirth: e.target.value })}
          className={`${inputClass} [color-scheme:dark]`}
        />
      </Field>

      <Field label="Gender (as in passport)" error={errors.gender} htmlFor={`${idPrefix}-gender`}>
        <select
          id={`${idPrefix}-gender`}
          value={value.gender}
          onChange={(e) => onChange({ gender: e.target.value as Gender | "" })}
          className={inputClass}
        >
          <option value="" disabled className="bg-ink-900 text-white/60">Select…</option>
          <option value="f" className="bg-ink-900 text-white">Female</option>
          <option value="m" className="bg-ink-900 text-white">Male</option>
        </select>
      </Field>

      <Field label="Nationality" error={errors.nationality} htmlFor={`${idPrefix}-nat`}>
        <CountrySelect
          id={`${idPrefix}-nat`}
          value={value.nationality}
          onChange={(code) => onChange({ nationality: code })}
        />
      </Field>

      {showCitizenId && (
        <Field label="Citizen ID (national ID)" htmlFor={`${idPrefix}-citizen`}>
          <input
            id={`${idPrefix}-citizen`}
            value={value.citizenId}
            onChange={(e) => onChange({ citizenId: e.target.value })}
            autoComplete="off"
            spellCheck={false}
            placeholder="National ID number"
            className={inputClass}
          />
        </Field>
      )}

      <Field label="Passport number" error={errors.passportNumber} htmlFor={`${idPrefix}-pp`}>
        <input
          id={`${idPrefix}-pp`}
          value={value.passportNumber}
          onChange={(e) => onChange({ passportNumber: e.target.value })}
          autoComplete="off"
          spellCheck={false}
          placeholder="A12345678"
          className={`${inputClass} uppercase`}
        />
      </Field>

      <Field label="Passport expiry" error={errors.passportExpiry} htmlFor={`${idPrefix}-exp`}>
        <input
          id={`${idPrefix}-exp`}
          type="date"
          value={value.passportExpiry}
          onChange={(e) => onChange({ passportExpiry: e.target.value })}
          className={`${inputClass} [color-scheme:dark]`}
        />
      </Field>

      <Field label="Passport issuing country" error={errors.passportIssuingCountry} htmlFor={`${idPrefix}-iss`}>
        <CountrySelect
          id={`${idPrefix}-iss`}
          value={value.passportIssuingCountry}
          onChange={(code) => onChange({ passportIssuingCountry: code })}
        />
      </Field>
    </div>
  );
}

function CountrySelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (code: string) => void;
}) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
      {COUNTRIES.map((c) => (
        <option key={c.code} value={c.code} className="bg-ink-900 text-white">{c.name}</option>
      ))}
    </select>
  );
}

function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="text-sm text-white/60">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-300">{error}</span>}
    </label>
  );
}
