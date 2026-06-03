import Link from "next/link";
import { getBooking } from "@/lib/bookings";
import { toTripView } from "@/lib/trip-view";
import { TripClient } from "./trip-client";
import { Compass } from "@/components/icons";

export const metadata = { title: "My trip — Blindfold" };
export const dynamic = "force-dynamic";

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = getBooking(id);

  return (
    <div className="aurora relative min-h-[calc(100dvh-65px)]">
      <span className="blob left-[6%] top-28 h-64 w-64 bg-brand-500/25" />
      <span className="blob right-[8%] bottom-28 h-72 w-72 bg-violet-500/25" style={{ animationDelay: "-9s" }} />
      {booking ? (
        <TripClient initial={toTripView(booking)} />
      ) : (
        <div className="mx-auto max-w-md px-5 py-24 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-brand-300"><Compass size={28} /></div>
          <h1 className="mt-5 font-display text-2xl font-bold">We can't find that trip</h1>
          <p className="mt-2 text-white/60">It may have expired from this demo's memory. Plan a fresh one — takes a minute.</p>
          <Link href="/start" className="btn-primary mt-6">Plan a trip</Link>
        </div>
      )}
    </div>
  );
}
