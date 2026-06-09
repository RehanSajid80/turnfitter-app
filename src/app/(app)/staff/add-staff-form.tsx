"use client";

import { useActionState, useEffect, useRef } from "react";
import { addStaff, type StaffState } from "./actions";

const initial: StaffState = {};

export function AddStaffForm() {
  const [state, action, pending] = useActionState(addStaff, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="tf-card p-6">
      <h2 className="font-display text-sm font-bold">Add a team member</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label htmlFor="name" className="text-sm font-semibold">
            Name
          </label>
          <input id="name" name="name" required placeholder="Jess Bowen" className="tf-input" />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-semibold">
            Email <span className="text-muted">(optional)</span>
          </label>
          <input id="email" name="email" type="email" placeholder="jess@studio.com" className="tf-input" />
        </div>
        <div>
          <label htmlFor="role" className="text-sm font-semibold">
            Role
          </label>
          <select id="role" name="role" className="tf-input" defaultValue="instructor">
            <option value="instructor">Instructor</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={pending} className="tf-btn-primary">
          {pending ? "Adding…" : "Add team member"}
        </button>
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.ok && <p className="text-sm font-medium text-reward-deep">Added ✓</p>}
      </div>
    </form>
  );
}
