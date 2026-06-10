"use client";

import { useState } from "react";
import type { SavedTraveller } from "@/lib/travellers";
import { validatePassenger, type PassengerErrors } from "@/lib/passenger";
import { countryName } from "@/lib/countries";
import { PassengerFields, emptyIdentity, type IdentityFields } from "@/components/passenger-fields";
import { Plus, Check, Shield, Users } from "@/components/icons";

type Draft = IdentityFields & { isSelf: boolean };

function toDraft(t: SavedTraveller): Draft {
  return {
    givenName: t.givenName,
    familyName: t.familyName,
    dateOfBirth: t.dateOfBirth,
    gender: t.gender,
    nationality: t.nationality,
    citizenId: t.citizenId,
    passportNumber: t.passportNumber,
    passportExpiry: t.passportExpiry,
    passportIssuingCountry: t.passportIssuingCountry,
    isSelf: t.isSelf,
  };
}

function maskPassport(n: string): string {
  const tail = n.slice(-4);
  return tail ? `Passport ···· ${tail}` : "Passport on file";
}

export function AccountClient({ initialTravellers }: { initialTravellers: SavedTraveller[] }) {
  const [travellers, setTravellers] = useState<SavedTraveller[]>(initialTravellers);
  // null = browsing; { id: null } = adding; { id } = editing that row.
  const [editing, setEditing] = useState<{ id: string | null } | null>(null);
  const [draft, setDraft] = useState<Draft>({ ...emptyIdentity(), isSelf: false });
  const [errors, setErrors] = useState<PassengerErrors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startAdd() {
    setDraft({ ...emptyIdentity(), isSelf: travellers.length === 0 });
    setErrors({});
    setError(null);
    setEditing({ id: null });
  }

  function startEdit(t: SavedTraveller) {
    setDraft(toDraft(t));
    setErrors({});
    setError(null);
    setEditing({ id: t.id });
  }

  function cancel() {
    setEditing(null);
    setErrors({});
    setError(null);
  }

  async function save() {
    const found = validatePassenger(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    setError(null);
    try {
      const isNew = editing?.id == null;
      const res = await fetch(isNew ? "/api/travellers" : `/api/travellers/${editing!.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      const saved = data.traveller as SavedTraveller;
      setTravellers((prev) =>
        isNew ? [...prev, saved] : prev.map((t) => (t.id === saved.id ? saved : t)),
      );
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/travellers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not remove");
      }
      setTravellers((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          <Users size={20} className="text-brand-300" /> Saved travellers
        </h2>
        {editing === null && (
          <button onClick={startAdd} className="btn-ghost px-4 py-2 text-sm">
            <Plus size={16} /> Add traveller
          </button>
        )}
      </div>

      <p className="mt-1 flex items-center gap-1.5 text-xs text-white/45">
        <Shield size={14} className="text-mint-400" />
        Stored securely and only used to book your trips.
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200" role="alert">
          {error}
        </p>
      )}

      {/* List */}
      {travellers.length === 0 && editing === null && (
        <div className="card mt-4 p-6 text-center text-white/60">
          No travellers saved yet. Add yourself and anyone you travel with — we&apos;ll have them ready
          at checkout.
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {travellers.map((t) => (
          <li key={t.id} className="card flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-medium">
                <span className="truncate">{t.givenName} {t.familyName}</span>
                {t.isSelf && (
                  <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-xs font-semibold text-brand-200">You</span>
                )}
              </p>
              <p className="mt-0.5 truncate text-sm text-white/55">
                {countryName(t.nationality)} · {maskPassport(t.passportNumber)}
              </p>
            </div>
            {editing === null && (
              <div className="flex shrink-0 items-center gap-2">
                <button onClick={() => startEdit(t)} className="btn-ghost px-3 py-1.5 text-sm">Edit</button>
                <button
                  onClick={() => remove(t.id)}
                  disabled={busy}
                  className="rounded-full px-3 py-1.5 text-sm text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Add / edit form */}
      {editing !== null && (
        <div className="card mt-4 space-y-4 p-6">
          <h3 className="font-display text-lg font-bold">
            {editing.id == null ? "Add a traveller" : "Edit traveller"}
          </h3>

          <PassengerFields
            value={draft}
            onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
            errors={errors}
            idPrefix={`acct-${editing.id ?? "new"}`}
            showCitizenId
          />

          <label className="flex items-center gap-2.5 text-sm text-white/70">
            <input
              type="checkbox"
              checked={draft.isSelf}
              onChange={(e) => setDraft((d) => ({ ...d, isSelf: e.target.checked }))}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-brand-500"
            />
            This is me (prefill me first at checkout)
          </label>

          <div className="flex gap-3">
            <button onClick={save} disabled={busy} className="btn-primary flex-1 disabled:opacity-50">
              {busy ? "Saving…" : <>{editing.id == null ? "Add traveller" : "Save changes"} <Check size={18} /></>}
            </button>
            <button onClick={cancel} disabled={busy} className="btn-ghost px-5">Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}
