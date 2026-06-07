import Link from "next/link";
import { listOutbox } from "@/lib/notify";
import { Mail, Suitcase, Check, Clock } from "@/components/icons";

export const metadata = { title: "Outbox — Blindfold admin" };
export const dynamic = "force-dynamic";

const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function AdminOutbox() {
  const emails = await listOutbox();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Outbox</h1>
      <p className="mt-1 text-sm text-white/55">
        Emails we send around each booking. No provider is wired in this demo, so they're recorded here.
        Every message is leak-checked — none names the destination.
      </p>

      {emails.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-sm text-white/55">
          Nothing queued yet. <Link href="/start" className="text-brand-300">Make a booking</Link> to generate the confirmation + teaser.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {emails.map((e) => (
            <div key={e.id} className="card p-5">
              <div className="flex items-start gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${e.kind === "confirmation" ? "bg-brand-500/20 text-brand-200" : "bg-sun-400/15 text-sun-300"}`}>
                  {e.kind === "confirmation" ? <Mail size={20} /> : <Suitcase size={20} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{e.subject}</div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs ${e.status === "sent" ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/60"}`}>
                      {e.status === "sent" ? <Check size={12} /> : <Clock size={12} />}
                      {e.status === "sent" ? "sent" : `scheduled ${fmt(e.scheduledForIso)}`}
                    </span>
                  </div>
                  <div className="text-xs text-white/45">to {e.to}</div>
                  <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-white/10 bg-white/5 p-3 font-sans text-sm leading-relaxed text-white/70">{e.body}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
