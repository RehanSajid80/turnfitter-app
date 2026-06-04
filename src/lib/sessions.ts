import { createClient } from "@/lib/supabase/server";

export type SessionRow = {
  id: string;
  class_id: string;
  class_name: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  booked_count: number;
  status: string;
};

type RawSession = {
  id: string;
  class_id: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  booked_count: number;
  status: string;
  classes: { name: string } | { name: string }[] | null;
};

function className(c: RawSession["classes"]): string {
  if (!c) return "Class";
  return Array.isArray(c) ? (c[0]?.name ?? "Class") : c.name;
}

export async function getUpcomingSessions(
  gymId: number,
  limit = 50,
): Promise<SessionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("class_sessions")
    .select(
      "id, class_id, starts_at, ends_at, capacity, booked_count, status, classes(name)",
    )
    .eq("gym_id", gymId)
    .eq("status", "scheduled")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(limit);

  return ((data as RawSession[] | null) ?? []).map((s) => ({
    id: s.id,
    class_id: s.class_id,
    class_name: className(s.classes),
    starts_at: s.starts_at,
    ends_at: s.ends_at,
    capacity: s.capacity,
    booked_count: s.booked_count,
    status: s.status,
  }));
}
