"use client";
import Link from "next/link";
import dayjs from "dayjs";
import type { CalendarEntry } from "../../store/useRunStore";

export function MonthGrid({
  monthISO,
  entriesByDay,
  onEventClick,
  dayHref,
}: {
  monthISO: string;
  entriesByDay: Record<string, CalendarEntry[]>;
  onEventClick?: (e: CalendarEntry) => void;
  dayHref?: (dateISO: string) => string;
}) {
  const start = dayjs(monthISO).startOf("month");
  const end = dayjs(monthISO).endOf("month");
  const days: dayjs.Dayjs[] = [];
  let c = start.startOf("week");
  const last = end.endOf("week");
  while (c.isBefore(last) || c.isSame(last, "day")) {
    days.push(c);
    c = c.add(1, "day");
  }
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d, idx) => {
        const key = d.format("YYYY-MM-DD");
        const entries = entriesByDay[key] || [];
        const faded = d.month() !== start.month();
        return (
          <div key={idx} className={`min-h-24 border rounded p-2 ${faded ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between">
              {dayHref ? (
                <Link href={dayHref(key)} className="text-xs text-gray-500 hover:underline">
                  {d.date()}
                </Link>
              ) : (
                <div className="text-xs text-gray-500">{d.date()}</div>
              )}
              {dayHref && entries.length ? (
                <Link href={dayHref(key)} className="text-[11px] text-gray-500 hover:underline">
                  Open
                </Link>
              ) : null}
            </div>
            <div className="space-y-1 mt-1">
              {entries.slice(0,3).map((e) => (
                <button key={e.id} className="text-left w-full text-[11px] px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 cursor-pointer" onClick={() => onEventClick?.(e)}>
                  <span className="font-medium">{e.channel}</span> · {e.type}
                </button>
              ))}
              {entries.length > 3 && <div className="text-[11px] text-gray-500">+{entries.length - 3} more</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
