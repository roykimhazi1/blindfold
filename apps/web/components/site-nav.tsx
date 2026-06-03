import Link from "next/link";
import { Logo } from "@/components/brand";
import { Sparkles } from "@/components/icons";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Logo />
        <div className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="relative transition-colors hover:text-white after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-brand-400 after:transition-all hover:after:w-full"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <Link href="/start" className="btn-primary px-5 py-2.5 text-sm">
          <Sparkles size={16} />
          Surprise me
        </Link>
      </nav>
    </header>
  );
}
