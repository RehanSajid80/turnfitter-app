"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { bookingErrorMessage } from "@/lib/errors";

export type BookState = {
  error?: string;
  success?: {
    status: string;
    waitlistPosition: number | null;
    cancelToken: string;
  };
};

type BookResult = {
  booking_id: string;
  status: string;
  waitlist_position: number | null;
  cancel_token: string;
};

export async function bookSession(
  _prev: BookState,
  formData: FormData,
): Promise<BookState> {
  const sessionId = String(formData.get("session_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!name) return { error: "Please enter your name." };
  if (!email.includes("@"))
    return { error: "Please enter a valid email address." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("book_session", {
    p_session_id: sessionId,
    p_name: name,
    p_email: email,
  });
  if (error) return { error: bookingErrorMessage(error.message) };

  const row = (Array.isArray(data) ? data[0] : data) as BookResult | undefined;
  if (!row) return { error: "Something went wrong. Please try again." };

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto =
    host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;
  const cancelUrl = `${base}/b/${row.cancel_token}`;

  const confirmed = row.status === "confirmed";
  await sendEmail({
    to: email,
    subject: confirmed ? "Your class is booked ✅" : "You're on the waitlist",
    html: `<p>Hi ${name},</p><p>${
      confirmed
        ? "You're booked in — see you there!"
        : `You're on the waitlist (position ${row.waitlist_position}). We'll email you if a spot opens up.`
    }</p><p>Need to cancel? <a href="${cancelUrl}">Cancel your booking</a>.</p>`,
  });

  return {
    success: {
      status: row.status,
      waitlistPosition: row.waitlist_position,
      cancelToken: row.cancel_token,
    },
  };
}
