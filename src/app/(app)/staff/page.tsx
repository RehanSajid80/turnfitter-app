import { redirect } from "next/navigation";
import { getCurrentStudio } from "@/lib/studios";
import { createClient } from "@/lib/supabase/server";
import { AddStaffForm } from "./add-staff-form";
import { deactivateStaff } from "./actions";

type Staff = {
  id: string;
  name: string;
  email: string | null;
  role: string;
};

const roleStyle: Record<string, string> = {
  instructor: "bg-brand-soft text-brand",
  admin: "bg-reward/15 text-reward-deep",
  staff: "bg-canvas text-muted",
};

export default async function StaffPage() {
  const studio = await getCurrentStudio();
  if (!studio) redirect("/onboarding");

  const supabase = await createClient();
  const { data } = await supabase
    .from("gym_staff")
    .select("id, name, email, role")
    .eq("gym_id", studio.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  const staff = (data as Staff[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Instructors &amp; staff
        </h1>
        <p className="mt-1 text-sm text-muted">
          Add your team, then pick an instructor when you create a class.
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-sm font-bold">Your team</h2>
        {staff.length === 0 ? (
          <div className="tf-card p-6 text-center text-sm text-muted">
            No team members yet — add your first below.
          </div>
        ) : (
          <div className="tf-card divide-y divide-line overflow-hidden">
            {staff.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="font-semibold text-ink">{m.name}</p>
                  {m.email && <p className="text-xs text-muted">{m.email}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`tf-pill ${roleStyle[m.role] ?? "bg-canvas text-muted"}`}>
                    {m.role}
                  </span>
                  <form action={deactivateStaff}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="text-xs font-medium text-muted hover:text-danger">
                      Remove
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <AddStaffForm />
    </div>
  );
}
