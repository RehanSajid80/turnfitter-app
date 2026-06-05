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
      <span className="tf-pill bg-brand-soft text-brand">● Step 1 of 1</span>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
        Set up your studio
      </h1>
      <p className="mt-1 text-sm text-muted">
        Takes about 2 minutes — you&apos;ll get a shareable booking page at the
        end.
      </p>

      <form action={action} className="mt-8 space-y-6">
        <section className="tf-card p-6">
          <h2 className="font-display text-sm font-bold text-ink">
            1. Your studio
          </h2>
          <div className="mt-4">
            <label htmlFor="studio_name" className="text-sm font-semibold">
              Studio name
            </label>
            <input
              id="studio_name"
              name="studio_name"
              required
              placeholder="Riverside Yoga"
              className="tf-input"
            />
          </div>
          <input type="hidden" name="timezone" value={tz} />
          <p className="mt-2 text-xs text-muted">Timezone: {tz}</p>
        </section>

        <section className="tf-card p-6">
          <h2 className="font-display text-sm font-bold text-ink">
            2. Your first class
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="class_name" className="text-sm font-semibold">
                Class name
              </label>
              <input
                id="class_name"
                name="class_name"
                required
                placeholder="Vinyasa Flow"
                className="tf-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="weekday" className="text-sm font-semibold">
                  Day
                </label>
                <select id="weekday" name="weekday" className="tf-input">
                  {DAYS.map((d) => (
                    <option key={d.v} value={d.v}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="start_time" className="text-sm font-semibold">
                  Start time
                </label>
                <input
                  id="start_time"
                  name="start_time"
                  type="time"
                  required
                  defaultValue="18:00"
                  className="tf-input"
                />
              </div>
            </div>
            <div>
              <label htmlFor="capacity" className="text-sm font-semibold">
                Capacity (spots)
              </label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                required
                defaultValue={12}
                className="tf-input"
              />
            </div>
          </div>
        </section>

        <button type="submit" disabled={pending} className="tf-btn-reward w-full">
          {pending ? "Creating your booking page…" : "Create my booking page →"}
        </button>
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
      </form>
    </div>
  );
}
