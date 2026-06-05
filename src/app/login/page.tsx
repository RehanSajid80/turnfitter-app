"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(sendMagicLink, initialState);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px 420px at 50% -20%, #ede9fe 0%, #f7f7fb 55%)",
        }}
      />
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 block text-center font-display text-2xl font-bold text-ink"
        >
          Turn<span className="text-brand">Fitter</span>
        </Link>

        <div className="tf-card p-8">
          <h1 className="font-display text-2xl font-bold text-ink">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-muted">
            Sign in to manage your studio.
          </p>

          {state.sent ? (
            <div className="mt-6 rounded-xl bg-reward/15 p-4 text-sm font-medium text-reward-deep ring-1 ring-reward/30">
              ✅ Check your email — we sent you a secure sign-in link. You can
              close this tab.
            </div>
          ) : (
            <form action={action} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-semibold">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@yourstudio.com"
                  className="tf-input"
                />
              </div>
              <button type="submit" disabled={pending} className="tf-btn-primary w-full">
                {pending ? "Sending…" : "Send magic link"}
              </button>
              {state.error && (
                <p className="text-sm text-danger">{state.error}</p>
              )}
            </form>
          )}
          <p className="mt-6 text-xs text-muted">
            No password needed — we email you a secure one-time link.
          </p>
        </div>
      </div>
    </main>
  );
}
