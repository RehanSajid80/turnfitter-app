import { redirect } from "next/navigation";
import { getCurrentStudio } from "@/lib/studios";
import { createClient } from "@/lib/supabase/server";
import { WeekCalendar, type CalSession } from "./week-calendar";

type ClassEmbed = { name: string } | { name: string }[] | null;
function className(c: ClassEmbed): string {
  if (!c) return "Class";
  return Array.isArray(c) ? (c[0]?.name ?? "Class") : c.name;
}

type RawSession = {
  id: string;
  starts_at: string;
  capacity: number;
  booked_count: number;
  classes: ClassEmbed;
};

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  const { w } = await searchParams;
  const weekOffset = Number.parseInt(w ?? "0", 10) || 0;

  const studio = await getCurrentStudio();
  if (!studio) redirect("/onboarding");
  const tz = studio.timezone ?? "UTC";

  // Monday of the viewed week, computed in the studio's timezone.
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(
    new Date(),
  );
  const base = new Date(`${todayStr}T00:00:00`);
  const dow = base.getDay(); // 0=Sun..6=Sat
  const mondayDelta = (dow === 0 ? -6 : 1 - dow) + weekOffset * 7;
  const weekStart = new Date(base);
  weekStart.setDate(base.getDate() + mondayDelta);

  const days: string[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return ymd(d);
  });
  const dayLabels = days.map((ds) =>
    new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${ds}T12:00:00Z`)),
  );
  const rangeLabel = `${dayLabels[0]} – ${dayLabels[6]}`;

  // Fetch a UTC window padded by a day on each side, then bucket by tz-local date.
  const fromUtc = new Date(`${days[0]}T00:00:00Z`);
  fromUtc.setUTCDate(fromUtc.getUTCDate() - 1);
  const toUtc = new Date(`${days[6]}T00:00:00Z`);
  toUtc.setUTCDate(toUtc.getUTCDate() + 2);

  const supabase = await createClient();
  const { data } = await supabase
    .from("class_sessions")
    .select("id, starts_at, capacity, booked_count, classes(name)")
    .eq("gym_id", studio.id)
    .eq("status", "scheduled")
    .gte("starts_at", fromUtc.toISOString())
    .lt("starts_at", toUtc.toISOString())
    .order("starts_at", { ascending: true });

  const dateFmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz });
  const hourFmt = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone: tz,
  });
  const timeFmt = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: tz,
  });

  const sessions: CalSession[] = ((data as RawSession[] | null) ?? [])
    .map((s) => {
      const dt = new Date(s.starts_at);
      return {
        id: s.id,
        class_name: className(s.classes),
        date: dateFmt.format(dt),
        hour: Number.parseInt(hourFmt.format(dt), 10),
        timeLabel: timeFmt.format(dt),
        booked: s.booked_count,
        capacity: s.capacity,
      };
    })
    .filter((s) => days.includes(s.date));

  // Visible hour range: 7–21 by default, expanded to fit any session.
  let minH = 7;
  let maxH = 21;
  for (const s of sessions) {
    minH = Math.min(minH, s.hour);
    maxH = Math.max(maxH, s.hour);
  }
  const hours = Array.from({ length: maxH - minH + 1 }, (_, i) => minH + i);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Schedule</h1>
        <p className="mt-1 text-sm text-muted">
          Your week at a glance — drag any class to reschedule it.
        </p>
      </div>
      <WeekCalendar
        days={days}
        dayLabels={dayLabels}
        hours={hours}
        sessions={sessions}
        weekOffset={weekOffset}
        rangeLabel={rangeLabel}
      />
    </div>
  );
}
