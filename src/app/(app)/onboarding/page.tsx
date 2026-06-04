"use client";

import { useActionState, useEffect, useState } from "react";
import { createStudioWithFirstClass, type OnboardingState } from "./actions";

const initial: OnboardingState = {};
const DAYS = [
  { v: 1, label: "Monday" },
  { v: 2, label: "Tuesday" },
  { v: 3, label: "Wednesday" },
  { v: 4, label: "Thursday" },
  { v: 5, label: "Friday" },
  { v: 6, label: "Saturday" },
  { v: 0, label: "Sunday" },
];

const inputCls =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

export default function OnboardingPage() {
  const [state, action, pending] = useActionState(
    createStudioWithFirstClass,
    initial,
  );
  const [tz, setTz] = useState("UTC");
  useEffect(() => {
    try {
      setTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      /* keep UTC */
    }
  }, []);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight">Set up your studio</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Takes about 2 minutes. You&apos;ll get a shareable booking page at the
        end.
      </p>

      <form action={action} className="mt-8 space-y-8">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-neutral-900">
            1. Your studio
          </h2>
          <div className="mt-4">
            <label htmlFor="studio_name" className="text-sm font-medium">
              Studio name
            </label>
            <input
              id="studio_name"
              name="studio_name"
              required
              placeholder="Riverside Yoga"
              className={inputCls}
            />
          </div>
          <input type="hidden" name="timezone" value={tz} />
          <p className="mt-2 text-xs text-neutral-400">Timezone: {tz}</p>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-neutral-900">
            2. Your first class
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="class_name" className="text-sm font-medium">
                Class name
              </label>
              <input
                id="class_name"
                name="class_name"
                required
                placeholder="Vinyasa Flow"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="weekday" className="text-sm font-medium">
                  Day
                </label>
                <select id="weekday" name="weekday" className={inputCls}>
                  {DAYS.map((d) => (
                    <option key={d.v} value={d.v}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="start_time" className="text-sm font-medium">
                  Start time
                </label>
                <input
                  id="start_time"
                  name="start_time"
                  type="time"
                  required
                  defaultValue="18:00"
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label htmlFor="capacity" className="text-sm font-medium">
                Capacity (spots)
              </label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                required
                defaultValue={12}
                className={inputCls}
              />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-60"
        >
          {pending ? "Creating your booking page…" : "Create my booking page"}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </form>
    </div>
  );
}
