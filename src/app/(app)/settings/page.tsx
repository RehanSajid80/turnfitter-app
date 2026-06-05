import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentStudio } from "@/lib/studios";
import { createClient } from "@/lib/supabase/server";
import { BrandingForm, type Branding } from "./branding-form";

export default async function SettingsPage() {
  const studio = await getCurrentStudio();
  if (!studio) redirect("/onboarding");

  const supabase = await createClient();
  const { data } = await supabase
    .from("gyms")
    .select(
      "name, brand_logo, hero_headline, hero_subtitle, hero_image_url, cta_label, cta_url, accent_color",
    )
    .eq("id", studio.id)
    .single();
  const gym = (data as Branding | null) ?? {
    name: studio.name,
    brand_logo: null,
    hero_headline: null,
    hero_subtitle: null,
    hero_image_url: null,
    cta_label: null,
    cta_url: null,
    accent_color: null,
  };

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;
  const bookingUrl = `${base}/s/${studio.slug}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Your studio site
        </h1>
        <p className="mt-1 text-sm text-muted">
          Customise your public booking page —{" "}
          <span className="font-medium text-ink">{bookingUrl}</span>
        </p>
      </div>
      <BrandingForm gym={gym} bookingUrl={bookingUrl} />
    </div>
  );
}
