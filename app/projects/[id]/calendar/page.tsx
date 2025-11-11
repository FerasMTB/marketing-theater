"use client";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { useRunStore } from "../../../../store/useRunStore";
import { MonthGrid } from "../../../../components/calendar/MonthGrid";
import { useProjectStore } from "../../../../store/useProjectStore";
import { EventModal } from "../../../../components/calendar/EventModal";
import type { CalendarEntry } from "../../../../store/useRunStore";

export default function CalendarPage() {
  const run = useRunStore();
  const project = useProjectStore();
  const [month, setMonth] = useState(dayjs(project.duration.start).format("YYYY-MM-01"));
  const entries = useMemo(() => run.calendar, [run.calendar]);
  const [open, setOpen] = useState< (CalendarEntry & { description?: string; relatedEvents?: string[] }) | null >(null);

  function prev() {
    setMonth((m) => dayjs(m).subtract(1, "month").format("YYYY-MM-01"));
  }
  function next() {
    setMonth((m) => dayjs(m).add(1, "month").format("YYYY-MM-01"));
  }
  function downloadJSON() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'calendar.json'; a.click(); URL.revokeObjectURL(url);
  }
  function downloadCSV() {
    const rows: string[] = ["date,channel,type,title,owner,effort"]; 
    Object.entries(entries).forEach(([date, list]) => {
      list.forEach((e) => rows.push([date, e.channel, e.type, e.title, e.owner||'', e.effort||''].map((x) => `"${String(x).replaceAll('"','\"')}"`).join(',')));
    });
    const blob = new Blob([rows.join("\n")], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'calendar.csv'; a.click(); URL.revokeObjectURL(url);
  }
  function downloadICS() {
    const header = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Marketing Theater//EN',
    ];
    const events: string[] = [];
    Object.entries(entries).forEach(([date, list]) => {
      list.forEach((e) => {
        const dt = dayjs(`${date}T09:00:00`).format('YYYYMMDDTHHmmss');
        events.push('BEGIN:VEVENT');
        events.push(`UID:${e.id}@marketing-theater`);
        events.push(`DTSTAMP:${dayjs().format('YYYYMMDDTHHmmssZ')}`);
        events.push(`DTSTART:${dt}`);
        events.push(`SUMMARY:${e.channel} · ${e.title}`);
        events.push('END:VEVENT');
      });
    });
    const ics = [...header, ...events, 'END:VCALENDAR'].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'calendar.ics'; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-medium">Calendar</div>
        <div className="flex gap-2">
          <button className="px-2 py-1 rounded border" onClick={prev}>Prev</button>
          <button className="px-2 py-1 rounded border" onClick={next}>Next</button>
          <button className="px-2 py-1 rounded border" onClick={downloadCSV}>Export CSV</button>
          <button className="px-2 py-1 rounded border" onClick={downloadICS}>Export ICS</button>
          <button className="px-2 py-1 rounded bg-black text-white" onClick={downloadJSON}>Export JSON</button>
        </div>
      </div>
      <MonthGrid monthISO={month} entriesByDay={entries} onEventClick={(e) => setOpen(e as any)} />
      <EventModal entry={open} onClose={() => setOpen(null)} />
    </div>
  );
}
