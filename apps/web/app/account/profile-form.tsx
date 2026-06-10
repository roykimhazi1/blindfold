"use client";

import { useState } from "react";
import { Check, Mail } from "@/components/icons";

export function ProfileForm({
  profile,
}: {
  profile: { id: string; email: string; fullName: string; citizenId: string };
}) {
  const [baseName, setBaseName] = useState(profile.fullName);
  const [baseCitizen, setBaseCitizen] = useState(profile.citizenId);
  const [fullName, setFullName] = useState(profile.fullName);
  const [citizenId, setCitizenId] = useState(profile.citizenId);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const valid = fullName.trim().length >= 2;
  const dirty = fullName.trim() !== baseName.trim() || citizenId.trim() !== baseCitizen.trim();

  async function save() {
    if (!valid || !dirty || busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), citizenId: citizenId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      setBaseName(fullName.trim());
      setBaseCitizen(citizenId.trim());
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function copyId() {
    try {
      await navigator.clipboard.writeText(profile.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <div className="card space-y-5 p-6">
      <div>
        <label htmlFor="full-name" className="text-sm text-white/60">Full name</label>
        <input
          id="full-name"
          value={fullName}
          onChange={(e) => { setFullName(e.target.value); setSaved(false); }}
          autoComplete="name"
          placeholder="Your name"
          className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-brand-400"
        />
      </div>

      <div>
        <label htmlFor="citizen-id" className="text-sm text-white/60">Citizen ID (national ID)</label>
        <input
          id="citizen-id"
          value={citizenId}
          onChange={(e) => { setCitizenId(e.target.value); setSaved(false); }}
          autoComplete="off"
          spellCheck={false}
          placeholder="National ID number"
          className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-brand-400"
        />
        <p className="mt-1 text-xs text-white/40">Your government identity number — optional, kept private.</p>
      </div>

      <div>
        <span className="text-sm text-white/60">Email</span>
        <div className="mt-1 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white/70">
          <Mail size={16} className="text-white/40" />
          <span className="truncate">{profile.email}</span>
        </div>
        <p className="mt-1 text-xs text-white/40">Managed by your Google sign-in.</p>
      </div>

      <div>
        <span className="text-sm text-white/60">User ID</span>
        <div className="mt-1 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <code className="flex-1 truncate font-mono text-xs text-white/70">{profile.id}</code>
          <button
            type="button"
            onClick={copyId}
            className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-brand-200 transition hover:bg-white/5"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-1 text-xs text-white/40">Your unique account identifier — quote it if you contact support.</p>
      </div>

      {error && (
        <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p>
      )}

      <button onClick={save} disabled={!valid || !dirty || busy} className="btn-primary w-full disabled:opacity-50">
        {busy ? "Saving…" : saved && !dirty ? <>Saved <Check size={18} /></> : <>Save changes <Check size={18} /></>}
      </button>
    </div>
  );
}
