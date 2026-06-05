"use client";

import { useActionState } from "react";
import Link from "next/link";
import { bookSession, type BookState } from "./actions";

const initial: BookState = {};

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
      <div className="tf-card p-8 text-center">
        <div
          className={
            confirmed
              ? "mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-reward text-3xl"
              : "mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber/20 text-3xl"
          }
        >
          {confirmed ? "🎉" : "⏳"}
        </div>
        <h2 className="mt-4 font-display text-xl font-bold text-ink">
          {confirmed
            ? "You're booked in!"
            : `You're on the waitlist (#${state.success.waitlistPosition})`}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {confirmed
            ? "We've emailed your confirmation."
            : "We'll email you the moment a spot opens up."}{" "}
          You can cancel anytime from that email.
        </p>
        <Link
          href={`/s/${slug}`}
          className="mt-6 inline-block text-sm font-semibold text-brand hover:text-brand-deep"
        >
          ← Back to all classes
        </Link>
      </div>
    );
  }

  const full = spotsLeft <= 0;
  return (
    <div className="tf-card p-6">
      <h2 className="font-display text-xl font-bold text-ink">{className}</h2>
      <p className="mt-1 text-sm text-muted tabular-nums">{when}</p>
      <span
        className={
          full
            ? "tf-pill mt-2 bg-amber/15 text-amber"
            : "tf-pill mt-2 bg-reward/15 text-reward-deep"
        }
      >
        {full ? "Class full — join the waitlist" : `${spotsLeft} spots left`}
      </span>

      <form action={action} className="mt-5 space-y-4">
        <input type="hidden" name="session_id" value={sessionId} />
        <input type="hidden" name="slug" value={slug} />
        <div>
          <label htmlFor="name" className="text-sm font-semibold">
            Your name
          </label>
          <input id="name" name="name" required className="tf-input" />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-semibold">
            Email
          </label>
          <input id="email" name="email" type="email" required className="tf-input" />
        </div>
        <button
          type="submit"
          disabled={pending}
          className={full ? "tf-btn-ghost w-full" : "tf-btn-reward w-full"}
        >
          {pending ? "Booking…" : full ? "Join waitlist" : "Book my spot"}
        </button>
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
      </form>
    </div>
  );
}
