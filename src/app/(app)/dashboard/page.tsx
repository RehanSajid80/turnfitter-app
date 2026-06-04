import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStudio } from "@/lib/studios";
import { getUpcomingSessions } from "@/lib/sessions";
import { CopyButton } from "./copy-button";

export default async function DashboardPage() {
  const studio = await getCurrentStudio();
  if (!studio) redirect("/onboarding");

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;
  const bookingUrl = `${base}/s/${studio.slug}`;

  const sessions = await getUpcomingSessions(studio.id, 20);
  const tz = studio.timezone ?? "UTC";
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz,
    }).format(new Date(iso));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{studio.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">Your studio dashboard</p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold">Your public booking page</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Share this link anywhere — members book straight from it, no account
          needed.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-neutral-100 px-3 py-2 text-sm">
            {bookingUrl}
          </code>
          <CopyButton text={bookingUrl} />
          <a
            href={bookingUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium hover:bg-neutral-50"
          >
            Preview ↗
          </a>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Upcoming classes</h2>
          <Link
            href="/classes"
            className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
          >
            Manage classes →
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
            No upcoming classes yet.{" "}
            <Link href="/classes" className="font-medium text-neutral-900 underline">
              Add a class
            </Link>
            .
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {sessions.map((s) => {
              const spotsLeft = Math.max(s.capacity - s.booked_count, 0);
              return (
                <li key={s.id}>
                  <Link
                    href={`/sessions/${s.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
                  >
                    <div>
                      <p className="text-sm font-medium">{s.class_name}</p>
                      <p className="text-xs text-neutral-500">{fmt(s.starts_at)}</p>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {s.booked_count}/{s.capacity} booked
                      {spotsLeft === 0 && (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">
                          Full
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
