"use client";

import { useActionState } from "react";
import { cancelBooking, type CancelState } from "./actions";

const initial: CancelState = {};

export function CancelForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(cancelBooking, initial);

  if (state.done) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center">
        <div className="text-4xl">👋</div>
        <h1 className="mt-3 text-lg font-semibold">Booking cancelled</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Your spot has been released. Hope to see you another time!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center">
      <h1 className="text-lg font-semibold">Cancel your booking?</h1>
      <p className="mt-2 text-sm text-neutral-500">
        This frees up your spot for someone else.
      </p>
      <form action={action} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
        >
          {pending ? "Cancelling…" : "Yes, cancel my booking"}
        </button>
        {state.error && (
          <p className="mt-3 text-sm text-red-600">{state.error}</p>
        )}
      </form>
    </div>
  );
}
