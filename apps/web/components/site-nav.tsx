import Link from "next/link";
import { Logo } from "@/components/brand";
import { Sparkles, Gift, Users, ChevronDown } from "@/components/icons";
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
  const initial = (firstName ?? user?.email ?? "?").slice(0, 1).toUpperCase();

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
            // Hover (and keyboard-focus) reveals the account menu.
            <div className="group relative">
              <button
                type="button"
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-2.5 text-sm text-white/80 transition hover:border-white/25 hover:text-white"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-xs font-bold text-white">
                  {initial}
                </span>
                {firstName && <span className="hidden sm:inline">{firstName}</span>}
                <ChevronDown size={14} className="text-white/40 transition-transform group-hover:rotate-180" />
              </button>

              <div className="invisible absolute right-0 top-full z-50 w-60 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-950/95 shadow-xl shadow-black/40 backdrop-blur-xl">
                  <div className="px-4 py-3">
                    <p className="truncate text-sm font-semibold text-white">{name}</p>
                    {user.email && <p className="truncate text-xs text-white/45">{user.email}</p>}
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="p-1.5">
                    <MenuLink href="/account" Icon={Users} label="Personal info" />
                    <MenuLink href="/trips" Icon={Gift} label="Booked surprises" />
                  </div>
                  <div className="h-px bg-white/10" />
                  <form action="/auth/signout" method="post" className="p-1.5">
                    <button
                      type="submit"
                      className="w-full rounded-xl px-3 py-2 text-left text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            </div>
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

function MenuLink({ href, Icon, label }: { href: string; Icon: typeof Gift; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/75 transition hover:bg-white/5 hover:text-white"
    >
      <Icon size={16} className="text-brand-300" />
      {label}
    </Link>
  );
}
