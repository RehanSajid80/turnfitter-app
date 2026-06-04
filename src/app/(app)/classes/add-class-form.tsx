"use client";

import { useActionState, useEffect, useRef } from "react";
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
const inputCls =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

export function AddClassForm() {
  const [state, action, pending] = useActionState(addClass, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-2xl border border-neutral-200 bg-white p-6"
    >
      <h2 className="text-sm font-semibold">Add a class</h2>
      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="class_name" className="text-sm font-medium">
            Class name
          </label>
          <input
            id="class_name"
            name="class_name"
            required
            placeholder="Reformer Pilates"
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
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
              Time
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
          <div>
            <label htmlFor="capacity" className="text-sm font-medium">
              Capacity
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
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add class"}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.ok && (
          <p className="text-sm text-green-600">
            Class added — 8 weeks of sessions created. ✅
          </p>
        )}
      </div>
    </form>
  );
}
