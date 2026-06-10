import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rowToTraveller } from "@/lib/travellers";
import { AccountClient } from "./account-client";

export const metadata = { title: "Personal info — Blindfold" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  // Middleware guarantees a signed-in user here. Read the saved travellers via
  // the RLS-scoped client — Postgres returns only this user's rows.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: rows } = await supabase
    .from("travellers")
    .select("*")
    .order("is_self", { ascending: false })
    .order("created_at", { ascending: true });

  const name = (user?.user_metadata?.full_name as string | undefined)
    ?? (user?.user_metadata?.name as string | undefined)
    ?? user?.email
    ?? "there";
  const email = user?.email ?? "";

  return (
    <div className="aurora relative min-h-[calc(100dvh-65px)]">
      <span className="blob left-[12%] top-24 h-56 w-56 bg-violet-500/25" />
      <span className="blob right-[10%] bottom-24 h-64 w-64 bg-brand-500/25" style={{ animationDelay: "-6s" }} />
      <div className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="font-display text-3xl font-extrabold">Personal info</h1>
        <p className="mt-2 text-white/65">
          Hi {name.split(" ")[0]} — this is yours. We only ask for passport details at the moment of
          booking, and keep them here so you never have to type them twice.
        </p>

        <div className="card mt-6 flex items-center justify-between p-5">
          <div>
            <p className="text-sm text-white/50">Signed in as</p>
            <p className="font-medium">{email}</p>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="btn-ghost px-4 py-2 text-sm">Sign out</button>
          </form>
        </div>

        <AccountClient initialTravellers={(rows ?? []).map(rowToTraveller)} />
      </div>
    </div>
  );
}
