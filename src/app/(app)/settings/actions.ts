"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getCurrentStudio } from "@/lib/studios";
import { createClient } from "@/lib/supabase/server";

export type BrandingState = { error?: string; ok?: boolean };

export async function updateBranding(
  _prev: BrandingState,
  formData: FormData,
): Promise<BrandingState> {
  await requireUser();
  const studio = await getCurrentStudio();
  if (!studio) return { error: "No studio found." };
  const supabase = await createClient();

  const str = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v === "" ? null : v;
  };

  const { error } = await supabase
    .from("gyms")
    .update({
      name: String(formData.get("name") ?? "").trim() || studio.name,
      brand_logo: str("brand_logo"),
      hero_headline: str("hero_headline"),
      hero_subtitle: str("hero_subtitle"),
      hero_image_url: str("hero_image_url"),
      cta_label: str("cta_label"),
      cta_url: str("cta_url"),
      accent_color: str("accent_color"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", studio.id);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}
