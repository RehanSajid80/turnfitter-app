import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStudio } from "@/lib/studios";
import { getUpcomingSessions } from "@/lib/sessions";

export default async function SchedulePage() {
  const studio = await getCurrentStudio();
  if (!studio) redirect("/onboarding");

  const sessions = await getUpcomingSessions(studio.id, 60);
  const tz = studio.timezone ?? "UTC";
  const fmtDay = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: tz,
    }).format(new Date(iso));
  const fmtTime = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz,
    }).format(new Date(iso));

  // Group sessions by day.
  const byDay = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const key = fmtDay(s.starts_at);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(s);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
      {byDay.size === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
          No upcoming sessions.{" "}
          <Link href="/classes" className="font-medium text-neutral-900 underline">
            Add a class
          </Link>
          .
        </p>
      ) : (
        [...byDay.entries()].map(([day, daySessions]) => (
          <section key={day}>
            <h2 className="mb-2 text-sm font-semibold text-neutral-700">{day}</h2>
            <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              {daySessions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/sessions/${s.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
                  >
                    <span className="text-sm">
                      <span className="font-medium">{fmtTime(s.starts_at)}</span>{" "}
                      · {s.class_name}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {s.booked_count}/{s.capacity}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
