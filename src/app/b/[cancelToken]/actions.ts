"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { bookingErrorMessage } from "@/lib/errors";

export type CancelState = { error?: string; done?: boolean };
type CancelResult = {
  promoted_email: string | null;
  promoted_name: string | null;
};

export async function cancelBooking(
  _prev: CancelState,
  formData: FormData,
): Promise<CancelState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Invalid cancellation link." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_booking", {
    p_cancel_token: token,
  });
  if (error) return { error: bookingErrorMessage(error.message) };

  // If a waitlisted guest was auto-promoted, let them know.
  const row = (Array.isArray(data) ? data[0] : data) as
    | CancelResult
    | undefined;
  if (row?.promoted_email) {
    await sendEmail({
      to: row.promoted_email,
      subject: "A spot opened up — you're in! 🎉",
      html: `<p>Hi ${row.promoted_name ?? "there"}, good news — a place opened up and you're now confirmed for your class.</p>`,
    });
  }

  return { done: true };
}
