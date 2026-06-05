import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

export default async function Home() {
  const user = await getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="font-display text-xl font-bold text-ink">
          Turn<span className="text-brand">Fitter</span>
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-ink hover:text-brand"
          >
            Sign in
          </Link>
          <Link href="/login" className="tf-btn-primary !py-2.5 !px-4 text-sm">
            Start free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(1200px 500px at 50% -10%, #6d28d9 0%, #4c1d95 45%, #2a1659 100%)",
          }}
        />
        <div className="mx-auto max-w-4xl px-5 pb-24 pt-16 text-center text-white sm:pt-24">
          <span className="tf-pill bg-reward/20 text-reward ring-1 ring-reward/30">
            ● Free to start — no card required
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Run your studio.
            <br />
            <span className="text-reward">Reward</span> your members.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-violet-100">
            The booking platform that helps independent gyms, studios, and
            trainers stand out — beautiful booking pages, effortless check-in,
            and rewards that keep members coming back.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login" className="tf-btn-reward w-full sm:w-auto">
              Create your free booking page →
            </Link>
            <span className="text-sm text-violet-200">
              Live in under 15 minutes
            </span>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto -mt-12 max-w-5xl px-5 pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              t: "Shareable booking pages",
              d: "A gorgeous public page members book from on their phones — no app, no account, no friction.",
              e: "📅",
            },
            {
              t: "Tap-to-check-in",
              d: "Run your class roster from your phone at the door. See who's in, who's on the waitlist, instantly.",
              e: "✅",
            },
            {
              t: "Rewards that retain",
              d: "Turn check-ins and streaks into rewards — the proven way to keep members from drifting away.",
              e: "🏆",
            },
          ].map((f) => (
            <div key={f.t} className="tf-card p-6">
              <div className="text-2xl">{f.e}</div>
              <h3 className="mt-3 text-base font-bold text-ink">{f.t}</h3>
              <p className="mt-1.5 text-sm text-muted">{f.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl bg-brand px-6 py-10 text-center text-white">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Ready to stand out from the crowd?
          </h2>
          <Link href="/login" className="tf-btn-reward">
            Get started free →
          </Link>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-muted">
        © {new Date().getFullYear()} TurnFitter ·{" "}
        <span className="font-display font-semibold text-ink">
          stand out from the crowd
        </span>
      </footer>
    </div>
  );
}
