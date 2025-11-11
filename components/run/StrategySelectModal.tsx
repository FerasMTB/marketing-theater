"use client";
import { useEffect } from "react";

export function StrategySelectModal({ open, items, recommendedId, onSelect, onClose }: { open: boolean; items: any[]; recommendedId?: string; onSelect: (id: string) => void; onClose: () => void }) {
  useEffect(() => {
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    if (open) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg w-full max-w-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Select a Strategy</div>
          <button className="text-sm" onClick={onClose}>Close</button>
        </div>
        <div className="space-y-3 max-h-[60vh] overflow-auto">
          {items.map((it: any) => (
            <div key={it.id} className={`border rounded p-3 ${it.id === recommendedId ? 'border-blue-500' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="font-medium">{it.name}</div>
                {it.id === recommendedId && <span className="text-xs text-blue-600">Recommended</span>}
              </div>
              <div className="text-sm text-gray-700">{it.rationale}</div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {it.highlights.map((h: string, i: number) => <span key={i} className="text-xs px-2 py-1 rounded-full bg-gray-100">{h}</span>)}
              </div>
              <div className="pt-2 text-right">
                <button className="text-sm px-3 py-1 rounded bg-black text-white" onClick={() => onSelect(it.id)}>Choose</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

