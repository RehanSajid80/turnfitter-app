"use client";

import { Fragment, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { rescheduleSession } from "./actions";

export type CalSession = {
  id: string;
  class_name: string;
  date: string; // YYYY-MM-DD (studio tz)
  hour: number; // 0-23 (studio tz)
  timeLabel: string;
  booked: number;
  capacity: number;
};

export function WeekCalendar({
  days,
  dayLabels,
  hours,
  sessions,
  weekOffset,
  rangeLabel,
}: {
  days: string[];
  dayLabels: string[];
  hours: number[];
  sessions: CalSession[];
  weekOffset: number;
  rangeLabel: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<CalSession[]>(sessions);
  const [dragId, setDragId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDrop(date: string, hour: number) {
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const existing = items.find((s) => s.id === id);
    if (existing && existing.date === date && existing.hour === hour) return;
    const time = `${String(hour).padStart(2, "0")}:00`;
    setItems((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, date, hour, timeLabel: time } : s,
      ),
    );
    startTransition(async () => {
      await rescheduleSession(id, date, time);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/schedule?w=${weekOffset - 1}`} className="tf-btn-ghost !py-2">
          ← Prev
        </Link>
        <span className="font-display text-sm font-bold">{rangeLabel}</span>
        <Link href={`/schedule?w=${weekOffset + 1}`} className="tf-btn-ghost !py-2">
          Next →
        </Link>
      </div>

      <div className="tf-card overflow-x-auto p-2">
        <div
          className="grid min-w-[760px]"
          style={{ gridTemplateColumns: "52px repeat(7, minmax(96px, 1fr))" }}
        >
          <div />
          {dayLabels.map((d, i) => (
            <div
              key={i}
              className="pb-2 text-center text-xs font-semibold text-ink"
            >
              {d}
            </div>
          ))}

          {hours.map((h) => (
            <Fragment key={h}>
              <div className="pr-2 pt-1 text-right text-[11px] text-muted tabular-nums">
                {String(h).padStart(2, "0")}:00
              </div>
              {days.map((date) => {
                const cell = items.filter(
                  (s) => s.date === date && s.hour === h,
                );
                return (
                  <div
                    key={date + h}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(date, h)}
                    className="min-h-[46px] border-b border-l border-line/60 p-1"
                  >
                    {cell.map((s) => {
                      const full = s.booked >= s.capacity;
                      return (
                        <div
                          key={s.id}
                          draggable
                          onDragStart={() => setDragId(s.id)}
                          className="mb-1 cursor-grab rounded-lg bg-brand px-1.5 py-1 text-[11px] text-white shadow-sm active:cursor-grabbing"
                        >
                          <div className="truncate font-semibold">
                            {s.class_name}
                          </div>
                          <div className="tabular-nums opacity-80">
                            {s.timeLabel} ·{" "}
                            <span className={full ? "text-amber" : "text-reward"}>
                              {s.booked}/{s.capacity}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <p className="mt-2 text-xs text-muted">
        💡 Drag a class to another day or time to reschedule it.{" "}
        {pending && <span className="text-brand">Saving…</span>}
      </p>
    </div>
  );
}
