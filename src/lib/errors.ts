// Maps raw Postgres RPC exception text to friendly, member-facing messages.
export function bookingErrorMessage(raw: string | undefined | null): string {
  const m = raw ?? "";
  if (m.includes("SESSION_NOT_AVAILABLE"))
    return "Sorry — this class is no longer available.";
  if (m.includes("ALREADY_BOOKED"))
    return "You've already booked this class with that email.";
  if (m.includes("NAME_REQUIRED")) return "Please enter your name.";
  if (m.includes("EMAIL_REQUIRED")) return "Please enter a valid email address.";
  if (m.includes("BOOKING_NOT_FOUND"))
    return "We couldn't find that booking — it may have already been cancelled.";
  return "Something went wrong. Please try again.";
}
