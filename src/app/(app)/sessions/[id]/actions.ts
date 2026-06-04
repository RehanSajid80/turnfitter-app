"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// RLS (bk_scope) guarantees only staff of the booking's own studio can update it.
export async function checkIn(formData: FormData) {
  await requireUser();
  const bookingId = String(formData.get("booking_id") ?? "");
  const sessionId = String(formData.get("session_id") ?? "");
  const supabase = await createClient();
  await supabase
    .from("bookings")
    .update({ status: "checked_in", checked_in_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("status", "confirmed");
  revalidatePath(`/sessions/${sessionId}`);
}

export async function undoCheckIn(formData: FormData) {
  await requireUser();
  const bookingId = String(formData.get("booking_id") ?? "");
  const sessionId = String(formData.get("session_id") ?? "");
  const supabase = await createClient();
  await supabase
    .from("bookings")
    .update({ status: "confirmed", checked_in_at: null })
    .eq("id", bookingId)
    .eq("status", "checked_in");
  revalidatePath(`/sessions/${sessionId}`);
}
