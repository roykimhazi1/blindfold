import Link from "next/link";
import { Logo } from "@/components/brand";
import { Sparkles, Gift } from "@/components/icons";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
];

export async function SiteNav() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const name = (user?.user_metadata?.full_name as string | undefined)
    ?? (user?.user_metadata?.name as string | undefined)
    ?? user?.email
    ?? null;
  const firstName = name ? name.split(" ")[0] : null;

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

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/trips" className="hidden items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white sm:inline-flex">
                <Gift size={16} className="text-brand-300" /> My trips
              </Link>
              <span className="hidden text-sm text-white/50 md:inline">{firstName}</span>
              <form action="/auth/signout" method="post">
                <button type="submit" className="btn-ghost px-4 py-2 text-sm">Sign out</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="text-sm text-white/70 transition-colors hover:text-white">
              Sign in
            </Link>
          )}
          <Link href="/start" className="btn-primary px-5 py-2.5 text-sm">
            <Sparkles size={16} />
            Surprise me
          </Link>
        </div>
      </nav>
    </header>
  );
}
