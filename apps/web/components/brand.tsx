import Link from "next/link";
import { Gift } from "@/components/icons";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight ${className}`}
      aria-label="Blindfold — home"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-lg shadow-brand-500/30 transition-transform duration-300 group-hover:-rotate-6">
        <Gift size={20} />
      </span>
      <span>Blindfold</span>
    </Link>
  );
}
