import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Studio = {
  id: number;
  name: string;
  slug: string;
  city: string | null;
  timezone: string | null;
};

type PublicSession = {
  id: string;
  slug: string;
  class_name: string;
  description: string | null;
  instructor_name: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  spots_left: number;
};

export default async function PublicStudioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: studioData } = await supabase
    .from("studio_public")
    .select("id, name, slug, city, timezone")
    .eq("slug", slug)
    .single();
  const studio = studioData as Studio | null;
  if (!studio) notFound();

  const { data: sessionData } = await supabase
    .from("public_sessions")
    .select("*")
    .eq("slug", slug)
    .order("starts_at", { ascending: true })
    .limit(50);
  const sessions = (sessionData as PublicSession[] | null) ?? [];

  const tz = studio.timezone ?? "UTC";
  const fmtDay = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: tz,
    }).format(new Date(iso));
  const fmtTime = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz,
    }).format(new Date(iso));

  return (
    <main className="min-h-screen pb-16">
      {/* Studio header band */}
      <div
        className="px-5 pb-12 pt-12 text-center text-white"
        style={{
          background:
            "radial-gradient(700px 280px at 50% -30%, #6d28d9 0%, #4c1d95 70%)",
        }}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 font-display text-2xl font-bold ring-1 ring-white/20">
          {studio.name.charAt(0).toUpperCase()}
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
          {studio.name}
        </h1>
        {studio.city && <p className="mt-1 text-sm text-violet-200">{studio.city}</p>}
        <p className="mt-3 text-sm text-violet-100">Book a class below</p>
      </div>

      <div className="mx-auto -mt-6 max-w-xl space-y-3 px-4">
        {sessions.length === 0 ? (
          <div className="tf-card p-8 text-center text-sm text-muted">
            No upcoming classes scheduled right now — check back soon.
          </div>
        ) : (
          sessions.map((s) => {
            const full = s.spots_left <= 0;
            return (
              <div key={s.id} className="tf-card flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="font-display text-base font-bold text-ink">
                    {s.class_name}
                  </p>
                  <p className="mt-0.5 text-sm text-muted tabular-nums">
                    {fmtDay(s.starts_at)} · {fmtTime(s.starts_at)}
                    {s.instructor_name ? ` · ${s.instructor_name}` : ""}
                  </p>
                  <span
                    className={
                      full
                        ? "tf-pill mt-2 bg-amber/15 text-amber"
                        : "tf-pill mt-2 bg-reward/15 text-reward-deep"
                    }
                  >
                    {full ? "Class full" : `${s.spots_left} spots left`}
                  </span>
                </div>
                <Link
                  href={`/s/${slug}/book/${s.id}`}
                  className={full ? "tf-btn-ghost shrink-0" : "tf-btn-primary shrink-0"}
                >
                  {full ? "Waitlist" : "Book"}
                </Link>
              </div>
            );
          })
        )}

        <p className="pt-6 text-center text-xs text-muted">
          Powered by{" "}
          <span className="font-display font-semibold text-ink">TurnFitter</span>
        </p>
      </div>
    </main>
  );
}
