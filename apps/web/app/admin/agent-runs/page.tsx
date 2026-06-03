import { exampleParams } from "@sv/engine";
import { orchestrateDeals } from "@sv/agents";

export const metadata = { title: "Agent runs — Blindfold admin" };
export const dynamic = "force-dynamic";

// Internal observability demo: runs the orchestrator on a sample search and
// shows the per-agent trace + leak-check status. In production this reads from
// the `agent_runs` table instead of executing live.
export default async function AgentRunsPage() {
  const { deals, traces, diagnostics } = await orchestrateDeals(exampleParams());

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <h1 className="text-2xl font-bold">Agent runs</h1>
      <p className="mt-1 text-sm text-white/60">
        Sample orchestration · mode: <span className="text-brand-300">{traces[0]?.mode}</span> ·{" "}
        {diagnostics.candidates} candidates → {deals.length} deals · {diagnostics.totalMs}ms
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-white/60">
            <tr>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">ms</th>
              <th className="px-4 py-3">Summary</th>
            </tr>
          </thead>
          <tbody>
            {traces.map((t, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="px-4 py-3 font-medium">{t.agent}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      t.status === "ok"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : t.status === "fallback"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    {t.status}
                  </span>
                  {t.leakBlocked && (
                    <span className="ml-2 rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300">
                      leak blocked
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-white/60">{t.mode}</td>
                <td className="px-4 py-3 text-white/60">{t.durationMs}</td>
                <td className="px-4 py-3 text-white/75">{t.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-white/40">
        The leak-check guarantees no agent output exposes the destination before the reveal.
      </p>
    </div>
  );
}
