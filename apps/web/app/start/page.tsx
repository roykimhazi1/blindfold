import { WizardClient } from "./wizard-client";

export const metadata = { title: "Plan my surprise — Blindfold" };

export default function StartPage() {
  return (
    <div className="aurora relative min-h-[calc(100dvh-65px)]">
      <span className="blob left-[6%] top-24 h-64 w-64 bg-brand-500/40" />
      <span className="blob right-[8%] bottom-20 h-72 w-72 bg-violet-500/40" style={{ animationDelay: "-8s" }} />
      <div className="mx-auto max-w-xl px-5 py-12">
        <WizardClient />
      </div>
    </div>
  );
}
