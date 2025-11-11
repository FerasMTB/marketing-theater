"use client";
import { useState } from "react";
import type { TheaterLog } from "../../store/useRunStore";

export function MeetingTheater({ logs }: { logs: TheaterLog[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const [reduceMotion, setReduce] = useState(false);
  const [muted, setMuted] = useState(true);
  if (collapsed) {
    return (
      <div className="border rounded-lg p-3 flex items-center justify-between bg-gray-50">
        <span className="text-sm text-gray-700">Theater collapsed</span>
        <div className="flex items-center gap-2">
          <button className="text-xs underline" onClick={() => setCollapsed(false)}>Expand</button>
        </div>
      </div>
    );
  }
  return (
    <div className="border rounded-lg">
      <div className="px-3 py-2 border-b flex items-center justify-between bg-gray-50">
        <div className="text-sm">Meeting Theater</div>
        <div className="flex items-center gap-2 text-xs">
          <label className="inline-flex items-center gap-1"><input type="checkbox" checked={reduceMotion} onChange={(e) => setReduce(e.target.checked)} />Reduce motion</label>
          <label className="inline-flex items-center gap-1"><input type="checkbox" checked={muted} onChange={(e) => setMuted(e.target.checked)} />Mute</label>
          <button className="underline" onClick={() => setCollapsed(true)}>Collapse</button>
        </div>
      </div>
      <div className="max-h-64 overflow-auto p-3 space-y-2">
        {logs.map((l, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white text-xs">{avatar(l.speaker)}</span>
            <div>
              <span className="font-medium mr-2">{l.speaker}</span>
              <span className="text-gray-800" style={{ animation: reduceMotion ? undefined : 'type 1s steps(20, end) 1' }}>{l.text}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function avatar(name: string) {
  if (name.includes("CEO")) return "C";
  if (name.includes("Creative")) return "D";
  if (name.includes("Media")) return "M";
  if (name.includes("Copy")) return "W";
  if (name.includes("Art")) return "A";
  return name[0] || "?";
}

