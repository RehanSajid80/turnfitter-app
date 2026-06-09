"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getCurrentStudio } from "@/lib/studios";
import { createClient } from "@/lib/supabase/server";

export type StaffState = { error?: string; ok?: boolean };

export async function addStaff(
  _prev: StaffState,
  formData: FormData,
): Promise<StaffState> {
  await requireUser();
  const studio = await getCurrentStudio();
  if (!studio) return { error: "No studio found." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "instructor");
  if (!name) return { error: "Please enter a name." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("gym_staff")
    .insert({ gym_id: studio.id, name, email, role });
  if (error) return { error: error.message };

  revalidatePath("/staff");
  revalidatePath("/classes");
  return { ok: true };
}

export async function deactivateStaff(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("gym_staff").update({ is_active: false }).eq("id", id);
  revalidatePath("/staff");
  revalidatePath("/classes");
}
