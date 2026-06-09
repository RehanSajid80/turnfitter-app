import Link from "next/link";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { getCurrentStudio } from "@/lib/studios";
import { signOut } from "./actions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireUser();
  const studio = await getCurrentStudio();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="font-display text-lg font-bold text-ink">
            Turn<span className="text-brand">Fitter</span>
          </Link>

          {studio && (
            <nav className="hidden items-center gap-1 text-sm font-medium text-muted sm:flex">
              {[
                ["/dashboard", "Dashboard"],
                ["/classes", "Classes"],
                ["/schedule", "Schedule"],
                ["/staff", "Staff"],
                ["/settings", "Settings"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-lg px-3 py-1.5 hover:bg-brand-soft hover:text-brand"
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          <form action={signOut}>
            <button className="text-sm font-medium text-muted hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
