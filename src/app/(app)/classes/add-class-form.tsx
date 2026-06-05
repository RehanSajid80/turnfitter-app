"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addClass, type AddClassState } from "./actions";

const initial: AddClassState = {};
const DAYS = [
  { v: 1, label: "Monday" },
  { v: 2, label: "Tuesday" },
  { v: 3, label: "Wednesday" },
  { v: 4, label: "Thursday" },
  { v: 5, label: "Friday" },
  { v: 6, label: "Saturday" },
  { v: 0, label: "Sunday" },
];

export function AddClassForm() {
  const [state, action, pending] = useActionState(addClass, initial);
  const [recurring, setRecurring] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setRecurring(true);
    }
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="tf-card p-6">
      <h2 className="font-display text-sm font-bold">Add a class</h2>
      <div className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="class_name" className="text-sm font-semibold">
              Class name
            </label>
            <input
              id="class_name"
              name="class_name"
              required
              placeholder="Reformer Pilates"
              className="tf-input"
            />
          </div>
          <div>
            <label htmlFor="instructor_name" className="text-sm font-semibold">
              Instructor <span className="text-muted">(optional)</span>
            </label>
            <input
              id="instructor_name"
              name="instructor_name"
              placeholder="Jess Bowen"
              className="tf-input"
            />
          </div>
        </div>

        {/* Recurring toggle */}
        <div>
          <span className="text-sm font-semibold">Repeats?</span>
          <div className="mt-2 inline-flex rounded-xl border border-line bg-white p-1">
            <button
              type="button"
              onClick={() => setRecurring(true)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${recurring ? "bg-brand text-white" : "text-muted"}`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setRecurring(false)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${!recurring ? "bg-brand text-white" : "text-muted"}`}
            >
              One-off
            </button>
          </div>
          <input type="hidden" name="recurring" value={recurring ? "weekly" : "oneoff"} />
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          {recurring ? (
            <div className="sm:col-span-2">
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
          ) : (
            <div className="sm:col-span-2">
              <label htmlFor="date" className="text-sm font-semibold">
                Date
              </label>
              <input id="date" name="date" type="date" className="tf-input" />
            </div>
          )}
          <div>
            <label htmlFor="start_time" className="text-sm font-semibold">
              Time
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
          <div>
            <label htmlFor="capacity" className="text-sm font-semibold">
              Capacity
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

        <div className="sm:w-1/3">
          <label htmlFor="price" className="text-sm font-semibold">
            Price <span className="text-muted">(optional)</span>
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step="0.01"
            placeholder="12.00"
            className="tf-input"
          />
        </div>

        <button type="submit" disabled={pending} className="tf-btn-primary">
          {pending ? "Adding…" : "Add class"}
        </button>
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.ok && (
          <p className="text-sm font-medium text-reward-deep">
            Class added — bookable sessions created. ✅
          </p>
        )}
      </div>
    </form>
  );
}
