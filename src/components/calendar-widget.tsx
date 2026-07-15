"use client";

import { useMemo, useState } from "react";
import { EVENT_TYPE_LABELS } from "@/lib/events";
import type { CalendarEvent } from "@/lib/types";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Local calendar date, not UTC — avoids the classic new Date("YYYY-MM-DD")
// off-by-one-day bug near midnight.
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${MONTH_NAMES[m - 1].slice(0, 3)} ${d}`;
}

type Event = CalendarEvent & { id: string };

export function CalendarWidget({ events }: { events: Event[] }) {
  const today = todayStr();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  const upcoming = useMemo(() => events.filter((e) => e.date >= today).slice(0, 5), [events, today]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function changeMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  return (
    <section className="mt-10 rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-[#233242]">Calendar</h2>
      <div className="mt-4 grid gap-8 md:grid-cols-[280px_1fr]">
        <div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              className="rounded-md px-2 py-1 text-gray-400 hover:text-primary"
            >
              ‹
            </button>
            <p className="text-sm font-medium text-[#233242]">
              {MONTH_NAMES[month]} {year}
            </p>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              className="rounded-md px-2 py-1 text-gray-400 hover:text-primary"
            >
              ›
            </button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
            {WEEKDAY_LABELS.map((w, i) => (
              <div key={i} className="text-gray-400">
                {w}
              </div>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
              const dayEvents = eventsByDate.get(dateStr) ?? [];
              const isToday = dateStr === today;
              return (
                <div
                  key={i}
                  title={dayEvents.map((e) => e.title).join(", ") || undefined}
                  className={`flex aspect-square flex-col items-center justify-center rounded-full text-xs ${
                    isToday ? "bg-primary font-semibold text-white" : "text-[#233242]"
                  }`}
                >
                  {day}
                  {dayEvents.length > 0 && (
                    <span
                      className={`mt-0.5 h-1 w-1 rounded-full ${isToday ? "bg-white" : "bg-primary"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#233242]">Upcoming</h3>
          <ul className="mt-3 space-y-3">
            {upcoming.map((e) => (
              <li
                key={e.id}
                className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm"
              >
                <div className="shrink-0 rounded-md border border-gray-200 bg-white px-2 py-1 text-center text-xs font-medium text-[#233242]">
                  {formatShortDate(e.date)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-[#233242]">{e.title}</p>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {EVENT_TYPE_LABELS[e.type]}
                    </span>
                  </div>
                  {(e.time || e.location) && (
                    <p className="mt-0.5 text-gray-500">
                      {e.time}
                      {e.time && e.location ? " · " : ""}
                      {e.location}
                    </p>
                  )}
                  {e.link && (
                    <a
                      href={e.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-primary hover:underline"
                    >
                      More info →
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {upcoming.length === 0 && <p className="mt-3 text-sm text-gray-500">No upcoming events.</p>}
        </div>
      </div>
    </section>
  );
}
