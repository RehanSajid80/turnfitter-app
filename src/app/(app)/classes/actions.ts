"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getCurrentStudio } from "@/lib/studios";
import { createClient } from "@/lib/supabase/server";

export type AddClassState = { error?: string; ok?: boolean };

export async function addClass(
  _prev: AddClassState,
  formData: FormData,
): Promise<AddClassState> {
  await requireUser();
  const studio = await getCurrentStudio();
  if (!studio) return { error: "No studio found." };

  const name = String(formData.get("class_name") ?? "").trim();
  const instructor = String(formData.get("instructor_name") ?? "").trim() || null;
  const startTime = String(formData.get("start_time") ?? "").trim();
  const capacity = Number(formData.get("capacity"));
  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = priceRaw === "" ? null : Number(priceRaw);
  const recurring = String(formData.get("recurring") ?? "weekly") === "weekly";
  const weekday = Number(formData.get("weekday"));
  const date = String(formData.get("date") ?? "").trim();

  if (!name) return { error: "Please enter a class name." };
  if (!startTime) return { error: "Please pick a start time." };
  if (Number.isNaN(capacity) || capacity < 1)
    return { error: "Capacity must be at least 1." };
  if (price !== null && (Number.isNaN(price) || price < 0))
    return { error: "Price must be a positive number." };
  if (recurring) {
    if (Number.isNaN(weekday) || weekday < 0 || weekday > 6)
      return { error: "Please pick a day of the week." };
  } else if (!date) {
    return { error: "Please pick a date for the one-off class." };
  }

  const supabase = await createClient();
  const { data: cls, error: clsErr } = await supabase
    .from("classes")
    .insert({
      gym_id: studio.id,
      name,
      capacity,
      duration_min: 60,
      instructor_name: instructor,
      price,
    })
    .select("id")
    .single();
  if (clsErr || !cls)
    return { error: clsErr?.message ?? "Could not create the class." };
  const classId = (cls as { id: string }).id;

  if (recurring) {
    const { data: sched, error: schErr } = await supabase
      .from("class_schedules")
      .insert({
        gym_id: studio.id,
        class_id: classId,
        weekday,
        start_time: startTime,
        capacity,
      })
      .select("id")
      .single();
    if (schErr || !sched)
      return { error: schErr?.message ?? "Could not create the schedule." };
    await supabase.rpc("generate_sessions", {
      p_schedule_id: (sched as { id: string }).id,
      p_weeks: 8,
    });
  } else {
    const { error: oneOffErr } = await supabase.rpc("create_one_off_session", {
      p_class_id: classId,
      p_date: date,
      p_time: startTime,
    });
    if (oneOffErr) return { error: oneOffErr.message };
  }

  revalidatePath("/classes");
  revalidatePath("/dashboard");
  revalidatePath("/schedule");
  return { ok: true };
}
