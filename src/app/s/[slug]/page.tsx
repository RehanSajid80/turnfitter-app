import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Studio = {
  id: number;
  name: string;
  slug: string;
  city: string | null;
  timezone: string | null;
  brand_logo: string | null;
  hero_headline: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  accent_color: string | null;
};

type PublicSession = {
  id: string;
  slug: string;
  class_name: string;
  instructor_name: string | null;
  starts_at: string;
  capacity: number;
  spots_left: number;
  price: number | null;
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
    .select("*")
    .eq("slug", slug)
    .single();
  const studio = studioData as Studio | null;
  if (!studio) notFound();

  const { data: sessionData } = await supabase
    .from("public_sessions")
    .select(
      "id, slug, class_name, instructor_name, starts_at, capacity, spots_left, price",
    )
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

  const accent = studio.accent_color || "#6d28d9";
  const headline = studio.hero_headline || studio.name;
  const hasImage = Boolean(studio.hero_image_url);
  const heroStyle = hasImage
    ? {
        backgroundImage: `linear-gradient(rgba(20,12,40,0.55), rgba(20,12,40,0.78)), url(${studio.hero_image_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background:
          "radial-gradient(700px 320px at 50% -20%, #6d28d9 0%, #4c1d95 70%)",
      };

  return (
    <main className="min-h-screen pb-16">
      {/* Branded hero */}
      <section className="px-5 pb-16 pt-12 text-center text-white" style={heroStyle}>
        {studio.brand_logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={studio.brand_logo}
            alt={studio.name}
            className="mx-auto h-16 w-16 rounded-2xl object-cover ring-1 ring-white/25"
          />
        ) : (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 font-display text-2xl font-bold ring-1 ring-white/20">
            {studio.name.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {headline}
        </h1>
        {studio.hero_subtitle && (
          <p className="mx-auto mt-3 max-w-xl text-base text-violet-100">
            {studio.hero_subtitle}
          </p>
        )}
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {studio.cta_label && (
            <a
              href={studio.cta_url || "#classes"}
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98]"
              style={{ backgroundColor: accent, filter: "brightness(1.1)" }}
            >
              {studio.cta_label}
            </a>
          )}
          <a
            href="#classes"
            className="inline-flex items-center justify-center rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/25"
          >
            Book a class ↓
          </a>
        </div>
      </section>

      {/* Classes */}
      <div id="classes" className="mx-auto -mt-8 max-w-xl space-y-3 px-4">
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
                    {s.price != null ? ` · £${Number(s.price).toFixed(2)}` : ""}
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
                  className="inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98]"
                  style={
                    full
                      ? { backgroundColor: "#6b7280" }
                      : { backgroundColor: accent }
                  }
                >
                  {full ? "Waitlist" : "Book"}
                </Link>
              </div>
            );
          })
        )}

        <p className="pt-8 text-center text-[11px] text-muted">
          Powered by{" "}
          <span className="font-display font-semibold text-ink/70">TurnFitter</span>
        </p>
      </div>
    </main>
  );
}
