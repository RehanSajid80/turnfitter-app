import Link from "next/link";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { getCurrentStudio } from "@/lib/studios";
import { signOut } from "./actions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireUser();
  const studio = await getCurrentStudio();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="font-bold tracking-tight">
            TurnFitter
          </Link>

          {studio && (
            <nav className="hidden items-center gap-5 text-sm text-neutral-600 sm:flex">
              <Link href="/dashboard" className="hover:text-neutral-900">
                Dashboard
              </Link>
              <Link href="/classes" className="hover:text-neutral-900">
                Classes
              </Link>
              <Link href="/schedule" className="hover:text-neutral-900">
                Schedule
              </Link>
              <Link href="/settings" className="hover:text-neutral-900">
                Settings
              </Link>
            </nav>
          )}

          <form action={signOut}>
            <button className="text-sm text-neutral-500 hover:text-neutral-900">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
