"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function rescheduleSession(
  sessionId: string,
  date: string,
  time: string,
) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("reschedule_session", {
    p_session_id: sessionId,
    p_date: date,
    p_time: time,
  });
  if (error) return { error: error.message };
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  return { ok: true };
}
