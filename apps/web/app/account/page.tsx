import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rowToTraveller } from "@/lib/travellers";
import { AccountTabs } from "./account-tabs";

export const metadata = { title: "Personal info — Blindfold" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  // Middleware guarantees a signed-in user here.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profileRow }, { data: rows }] = await Promise.all([
    supabase.from("profiles").select("full_name, citizen_id").eq("id", user.id).maybeSingle(),
    supabase
      .from("travellers")
      .select("*")
      .order("is_self", { ascending: false })
      .order("created_at", { ascending: true }),
  ]);

  const metaName = (user.user_metadata?.full_name as string | undefined)
    ?? (user.user_metadata?.name as string | undefined)
    ?? "";
  const fullName = profileRow?.full_name ?? metaName ?? "";
  const citizenId = profileRow?.citizen_id ?? "";
  const email = user.email ?? "";
  const firstName = (fullName || email || "there").split(" ")[0];

  return (
    <div className="aurora relative min-h-[calc(100dvh-65px)]">
      <span className="blob left-[12%] top-24 h-56 w-56 bg-violet-500/25" />
      <span className="blob right-[10%] bottom-24 h-64 w-64 bg-brand-500/25" style={{ animationDelay: "-6s" }} />
      <div className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="font-display text-3xl font-extrabold">Personal info</h1>
        <p className="mt-2 text-white/65">
          Hi {firstName} — manage your own details and the travellers you book for. We only ask for
          passport details at booking time.
        </p>
        <AccountTabs
          profile={{ id: user.id, email, fullName, citizenId }}
          initialTravellers={(rows ?? []).map(rowToTraveller)}
        />
      </div>
    </div>
  );
}
