export default function Loading() {
  return (
    <div className="aurora relative grid min-h-[calc(100dvh-65px)] place-items-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-brand-400" aria-hidden="true" />
        <p className="text-sm text-white/55">One moment…</p>
      </div>
    </div>
  );
}
