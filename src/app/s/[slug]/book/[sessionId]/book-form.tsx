"use client";

import { useActionState } from "react";
import Link from "next/link";
import { bookSession, type BookState } from "./actions";

const initial: BookState = {};
const inputCls =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

export function BookForm({
  slug,
  sessionId,
  className,
  when,
  spotsLeft,
}: {
  slug: string;
  sessionId: string;
  className: string;
  when: string;
  spotsLeft: number;
}) {
  const [state, action, pending] = useActionState(bookSession, initial);

  if (state.success) {
    const confirmed = state.success.status === "confirmed";
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center">
        <div className="text-4xl">{confirmed ? "✅" : "⏳"}</div>
        <h2 className="mt-3 text-lg font-semibold">
          {confirmed
            ? "You're booked in!"
            : `You're on the waitlist (#${state.success.waitlistPosition})`}
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          {confirmed
            ? "We've emailed your confirmation."
            : "We'll email you if a spot opens up."}{" "}
          You can cancel anytime from that email.
        </p>
        <Link
          href={`/s/${slug}`}
          className="mt-6 inline-block text-sm font-medium text-neutral-900 underline"
        >
          ← Back to all classes
        </Link>
      </div>
    );
  }

  const full = spotsLeft <= 0;
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-semibold">{className}</h2>
      <p className="mt-1 text-sm text-neutral-500">{when}</p>
      <p className="mt-1 text-xs text-neutral-400">
        {full ? "This class is full — join the waitlist below." : `${spotsLeft} spots left`}
      </p>

      <form action={action} className="mt-5 space-y-4">
        <input type="hidden" name="session_id" value={sessionId} />
        <input type="hidden" name="slug" value={slug} />
        <div>
          <label htmlFor="name" className="text-sm font-medium">
            Your name
          </label>
          <input id="name" name="name" required className={inputCls} />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={inputCls}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-60"
        >
          {pending ? "Booking…" : full ? "Join waitlist" : "Book class"}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </form>
    </div>
  );
}
