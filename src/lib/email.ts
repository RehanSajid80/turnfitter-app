type SendArgs = { to: string; subject: string; html: string };

// Transactional email via Resend's REST API (no SDK needed).
// No-ops with a warning if RESEND_API_KEY isn't set, so dev/build never breaks.
export async function sendEmail({ to, subject, html }: SendArgs): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "TurnFitter <onboarding@resend.dev>";

  if (!key) {
    console.warn(`[email] RESEND_API_KEY not set — skipped "${subject}" to ${to}`);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      console.error(`[email] send failed (${res.status}): ${await res.text()}`);
    }
  } catch (err) {
    console.error("[email] send error", err);
  }
}
