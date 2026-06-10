"use client";

import { useState } from "react";
import type { SavedTraveller } from "@/lib/travellers";
import { AccountClient } from "./account-client";
import { ProfileForm } from "./profile-form";

type Tab = "profile" | "travellers";

export function AccountTabs({
  profile,
  initialTravellers,
}: {
  profile: { id: string; email: string; fullName: string; citizenId: string };
  initialTravellers: SavedTraveller[];
}) {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="mt-6">
      <div className="inline-flex gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
        <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>Profile</TabButton>
        <TabButton active={tab === "travellers"} onClick={() => setTab("travellers")}>Travellers</TabButton>
      </div>

      <div className="mt-4">
        {tab === "profile"
          ? <ProfileForm profile={profile} />
          : <AccountClient initialTravellers={initialTravellers} />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        active ? "bg-brand-500/20 text-white shadow-lg shadow-brand-500/10" : "text-white/55 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
