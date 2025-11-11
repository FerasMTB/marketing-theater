"use client";
import type { CalendarEntry } from "../../store/useRunStore";

export function EventModal({ entry, onClose }: { entry: (CalendarEntry & { description?: string; relatedEvents?: string[] }) | null; onClose: () => void }) {
  if (!entry) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg w-full max-w-lg p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">{entry.channel} — {entry.type}</div>
          <button className="text-sm" onClick={onClose}>Close</button>
        </div>
        <div className="mt-2 space-y-2 text-sm">
          <div><b>Title:</b> {entry.title}</div>
          <div><b>Date:</b> {entry.date}</div>
          <div><b>Owner:</b> {entry.owner || '—'}</div>
          <div><b>Effort:</b> {entry.effort || '—'}</div>
          {entry.description && <div><b>Description:</b> {entry.description}</div>}
          {entry.relatedEvents?.length ? (
            <div>
              <b>Related events:</b>
              <div className="flex gap-2 mt-1 flex-wrap">
                {entry.relatedEvents.map((r, i) => <span key={i} className="text-xs px-2 py-1 rounded-full bg-gray-100">{r}</span>)}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

