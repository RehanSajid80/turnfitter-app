import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookForm } from "./book-form";

type PublicSession = {
  id: string;
  slug: string;
  class_name: string;
  starts_at: string;
  spots_left: number;
};
type StudioInfo = { name: string; timezone: string | null };

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string; sessionId: string }>;
}) {
  const { slug, sessionId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("public_sessions")
    .select("id, slug, class_name, starts_at, spots_left")
    .eq("id", sessionId)
    .single();
  const session = data as PublicSession | null;
  if (!session || session.slug !== slug) notFound();

  const { data: st } = await supabase
    .from("studio_public")
    .select("name, timezone")
    .eq("slug", slug)
    .single();
  const studio = st as StudioInfo | null;
  const tz = studio?.timezone ?? "UTC";
  const when = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  }).format(new Date(session.starts_at));

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Link
        href={`/s/${slug}`}
        className="text-xs text-neutral-500 hover:text-neutral-900"
      >
        ← {studio?.name ?? "Back"}
      </Link>
      <div className="mt-4">
        <BookForm
          slug={slug}
          sessionId={sessionId}
          className={session.class_name}
          when={when}
          spotsLeft={session.spots_left}
        />
      </div>
    </main>
  );
}
