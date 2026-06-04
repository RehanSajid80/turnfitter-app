"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(sendMagicLink, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">TurnFitter</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Sign in to manage your studio.
        </p>

        {state.sent ? (
          <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-800">
            ✅ Check your email — we sent you a magic sign-in link. You can close
            this tab.
          </div>
        ) : (
          <form action={action} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@yourstudio.com"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send magic link"}
            </button>
            {state.error && (
              <p className="text-sm text-red-600">{state.error}</p>
            )}
          </form>
        )}
        <p className="mt-6 text-xs text-neutral-400">
          No password needed — we email you a secure one-time link.
        </p>
      </div>
    </main>
  );
}
