"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error?: string };

export async function createStudioWithFirstClass(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  await requireUser();
  const supabase = await createClient();

  const studioName = String(formData.get("studio_name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "UTC").trim();
  const className = String(formData.get("class_name") ?? "").trim();
  const weekday = Number(formData.get("weekday"));
  const startTime = String(formData.get("start_time") ?? "").trim();
  const capacity = Number(formData.get("capacity"));

  if (!studioName) return { error: "Please enter your studio name." };
  if (!className) return { error: "Please enter your first class name." };
  if (Number.isNaN(weekday) || weekday < 0 || weekday > 6)
    return { error: "Please pick a day of the week." };
  if (!startTime) return { error: "Please pick a start time." };
  if (Number.isNaN(capacity) || capacity < 1)
    return { error: "Capacity must be at least 1." };

  // 1. Studio = gym + owner membership + unique slug (atomic, RLS-safe).
  const { data: studioRows, error: studioErr } = await supabase.rpc(
    "create_studio",
    { p_name: studioName, p_timezone: timezone },
  );
  if (studioErr) return { error: studioErr.message };
  const studio = (Array.isArray(studioRows) ? studioRows[0] : studioRows) as
    | { gym_id: number; slug: string }
    | undefined;
  if (!studio?.gym_id)
    return { error: "Could not create your studio. Please try again." };
  const gymId = studio.gym_id;

  // 2. First class type.
  const { data: cls, error: clsErr } = await supabase
    .from("classes")
    .insert({ gym_id: gymId, name: className, capacity, duration_min: 60 })
    .select("id")
    .single();
  if (clsErr || !cls)
    return { error: clsErr?.message ?? "Could not create the class." };
  const classId = (cls as { id: string }).id;

  // 3. Weekly recurring schedule.
  const { data: sched, error: schErr } = await supabase
    .from("class_schedules")
    .insert({
      gym_id: gymId,
      class_id: classId,
      weekday,
      start_time: startTime,
      capacity,
    })
    .select("id")
    .single();
  if (schErr || !sched)
    return { error: schErr?.message ?? "Could not create the schedule." };
  const scheduleId = (sched as { id: string }).id;

  // 4. Generate 8 weeks of bookable sessions.
  await supabase.rpc("generate_sessions", {
    p_schedule_id: scheduleId,
    p_weeks: 8,
  });

  redirect("/dashboard");
}
