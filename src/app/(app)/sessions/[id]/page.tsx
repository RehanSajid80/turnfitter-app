import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStudio } from "@/lib/studios";
import { checkIn, undoCheckIn } from "./actions";

type ClassEmbed = { name: string } | { name: string }[] | null;
function className(c: ClassEmbed): string {
  if (!c) return "Class";
  return Array.isArray(c) ? (c[0]?.name ?? "Class") : c.name;
}

type SessionData = {
  id: string;
  gym_id: number;
  starts_at: string;
  capacity: number;
  booked_count: number;
  classes: ClassEmbed;
};

type Booking = {
  id: string;
  guest_name: string;
  guest_email: string;
  status: string;
  waitlist_position: number | null;
  checked_in_at: string | null;
};

export default async function SessionRosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studio = await getCurrentStudio();
  if (!studio) redirect("/onboarding");

  const supabase = await createClient();
  const { data: sessionData } = await supabase
    .from("class_sessions")
    .select("id, gym_id, starts_at, capacity, booked_count, classes(name)")
    .eq("id", id)
    .single();
  const session = sessionData as SessionData | null;
  if (!session) notFound();

  const { data: bookingData } = await supabase
    .from("bookings")
    .select("id, guest_name, guest_email, status, waitlist_position, checked_in_at")
    .eq("session_id", id)
    .in("status", ["confirmed", "waitlisted", "checked_in"])
    .order("booked_at", { ascending: true });
  const bookings = (bookingData as Booking[] | null) ?? [];

  const attendees = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "checked_in",
  );
  const waitlist = bookings
    .filter((b) => b.status === "waitlisted")
    .sort((a, b) => (a.waitlist_position ?? 0) - (b.waitlist_position ?? 0));
  const checkedInCount = attendees.filter(
    (b) => b.status === "checked_in",
  ).length;

  const when = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: studio.timezone ?? "UTC",
  }).format(new Date(session.starts_at));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-xs text-neutral-500 hover:text-neutral-900"
        >
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {className(session.classes)}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">{when}</p>
        <p className="mt-1 text-sm text-neutral-500">
          {checkedInCount}/{attendees.length} checked in · {attendees.length}/
          {session.capacity} booked
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Attendees</h2>
        {attendees.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
            No bookings yet.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {attendees.map((b) => {
              const isIn = b.status === "checked_in";
              return (
                <li
                  key={b.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{b.guest_name}</p>
                    <p className="text-xs text-neutral-500">{b.guest_email}</p>
                  </div>
                  <form action={isIn ? undoCheckIn : checkIn}>
                    <input type="hidden" name="booking_id" value={b.id} />
                    <input type="hidden" name="session_id" value={session.id} />
                    <button
                      className={
                        isIn
                          ? "rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700"
                          : "rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700"
                      }
                    >
                      {isIn ? "Checked in ✓" : "Check in"}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {waitlist.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">Waitlist</h2>
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {waitlist.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{b.guest_name}</p>
                  <p className="text-xs text-neutral-500">{b.guest_email}</p>
                </div>
                <span className="text-xs text-neutral-400">
                  #{b.waitlist_position}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
