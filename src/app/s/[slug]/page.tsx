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
    <main className="mx-auto max-w-xl px-4 py-10">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">{studio.name}</h1>
        {studio.city && (
          <p className="mt-1 text-sm text-neutral-500">{studio.city}</p>
        )}
        <p className="mt-3 text-sm text-neutral-500">Book a class below</p>
      </header>

      <div className="mt-8 space-y-3">
        {sessions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
            No upcoming classes scheduled right now — check back soon.
          </p>
        ) : (
          sessions.map((s) => {
            const full = s.spots_left <= 0;
            return (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{s.class_name}</p>
                  <p className="text-sm text-neutral-500">
                    {fmtDay(s.starts_at)} · {fmtTime(s.starts_at)}
                    {s.instructor_name ? ` · ${s.instructor_name}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {full ? "Class full" : `${s.spots_left} spots left`}
                  </p>
                </div>
                <Link
                  href={`/s/${slug}/book/${s.id}`}
                  className={
                    full
                      ? "shrink-0 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                      : "shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
                  }
                >
                  {full ? "Join waitlist" : "Book"}
                </Link>
              </div>
            );
          })
        )}
      </div>

      <p className="mt-10 text-center text-xs text-neutral-400">
        Powered by TurnFitter
      </p>
    </main>
  );
}
