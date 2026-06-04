import Link from "next/link";
import { Compass, Wallet, Building, Gift, Sparkles, Mail } from "@/components/icons";

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: Compass },
  { href: "/admin/bookings", label: "Bookings", Icon: Gift },
  { href: "/admin/destinations", label: "Destinations", Icon: Building },
  { href: "/admin/pricing", label: "Pricing & fees", Icon: Wallet },
  { href: "/admin/outbox", label: "Outbox", Icon: Mail },
  { href: "/admin/agent-runs", label: "Agent runs", Icon: Sparkles },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 md:flex-row">
      <aside className="md:w-56 md:shrink-0">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/60">
          Internal · demo
        </div>
        <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              <n.Icon size={18} className="text-brand-300" />
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}
