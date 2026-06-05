import { redirect } from "next/navigation";
import { getCurrentStudio } from "@/lib/studios";
import { createClient } from "@/lib/supabase/server";
import { AddClassForm } from "./add-class-form";

type ClassRow = {
  id: string;
  name: string;
  capacity: number;
  instructor_name: string | null;
  price: number | null;
};

export default async function ClassesPage() {
  const studio = await getCurrentStudio();
  if (!studio) redirect("/onboarding");

  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("id, name, capacity, instructor_name, price")
    .eq("gym_id", studio.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  const classes = (data as ClassRow[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Classes</h1>
        <p className="mt-1 text-sm text-muted">
          Add a class as a weekly recurring slot or a one-off — bookable sessions
          are created automatically.
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-sm font-bold">Your classes</h2>
        {classes.length === 0 ? (
          <div className="tf-card p-6 text-center text-sm text-muted">
            No classes yet — add your first one below.
          </div>
        ) : (
          <div className="tf-card divide-y divide-line overflow-hidden">
            {classes.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-4 py-3.5"
              >
                <div>
                  <p className="font-semibold text-ink">{c.name}</p>
                  <p className="text-xs text-muted">
                    {c.instructor_name ? `${c.instructor_name} · ` : ""}
                    {c.capacity} spots
                  </p>
                </div>
                {c.price != null && (
                  <span className="tf-pill bg-brand-soft text-brand tabular-nums">
                    £{Number(c.price).toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <AddClassForm />
    </div>
  );
}
