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

  const totalBooked = sessions.reduce((n, s) => n + s.booked_count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {studio.name}
        </h1>
        <p className="mt-1 text-sm text-muted">Your studio dashboard</p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Upcoming classes" value={sessions.length} />
        <Stat label="Total bookings" value={totalBooked} tone="reward" />
        <Stat label="Public page" value="Live" tone="brand" />
      </div>

      {/* Booking link */}
      <section className="tf-card overflow-hidden">
        <div className="bg-brand px-6 py-5 text-white">
          <h2 className="font-display text-base font-bold">
            Your public booking page
          </h2>
          <p className="mt-1 text-sm text-violet-100">
            Share this anywhere — members book straight from it, no account
            needed.
          </p>
        </div>
        <div className="flex items-center gap-2 p-4">
          <code className="flex-1 truncate rounded-lg bg-canvas px-3 py-2 text-sm text-ink">
            {bookingUrl}
          </code>
          <CopyButton text={bookingUrl} />
          <a
            href={bookingUrl}
            target="_blank"
            rel="noreferrer"
            className="tf-btn-ghost shrink-0 !px-3 !py-2 text-xs"
          >
            Preview ↗
          </a>
        </div>
      </section>

      {/* Upcoming */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Upcoming classes</h2>
          <Link
            href="/classes"
            className="text-sm font-semibold text-brand hover:text-brand-deep"
          >
            Manage classes →
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="tf-card p-8 text-center text-sm text-muted">
            No upcoming classes yet.{" "}
            <Link href="/classes" className="font-semibold text-brand">
              Add a class
            </Link>
            .
          </div>
        ) : (
          <div className="tf-card divide-y divide-line overflow-hidden">
            {sessions.map((s) => {
              const spotsLeft = Math.max(s.capacity - s.booked_count, 0);
              return (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex items-center justify-between px-4 py-3.5 transition hover:bg-canvas"
                >
                  <div>
                    <p className="font-semibold text-ink">{s.class_name}</p>
                    <p className="text-xs text-muted tabular-nums">
                      {fmt(s.starts_at)}
                    </p>
                  </div>
                  <span className="flex items-center gap-2 text-xs text-muted tabular-nums">
                    {s.booked_count}/{s.capacity}
                    {spotsLeft === 0 ? (
                      <span className="tf-pill bg-amber/15 text-amber">Full</span>
                    ) : (
                      <span className="tf-pill bg-reward/15 text-reward-deep">
                        {spotsLeft} left
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "reward" | "brand";
}) {
  const valueCls =
    tone === "reward"
      ? "text-reward-deep"
      : tone === "brand"
        ? "text-brand"
        : "text-ink";
  return (
    <div className="tf-card p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${valueCls}`}>
        {value}
      </p>
    </div>
  );
}
