import { redirect } from "next/navigation";
import { getCurrentStudio } from "@/lib/studios";
import { createClient } from "@/lib/supabase/server";
import { AddClassForm } from "./add-class-form";

type ClassRow = {
  id: string;
  name: string;
  capacity: number;
  instructor_name: string | null;
};

export default async function ClassesPage() {
  const studio = await getCurrentStudio();
  if (!studio) redirect("/onboarding");

  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("id, name, capacity, instructor_name")
    .eq("gym_id", studio.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  const classes = (data as ClassRow[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Each class runs on a weekly schedule. Adding one creates the next 8
          weeks of bookable sessions automatically.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Your classes</h2>
        {classes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
            No classes yet — add your first one below.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {classes.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <p className="text-sm font-medium">{c.name}</p>
                <span className="text-xs text-neutral-500">
                  {c.capacity} spots
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AddClassForm />
    </div>
  );
}
