"use client";
export function PhaseStepper({ phases, current }: { phases: Record<1|2|3|4, string>; current: number }) {
  const items: { id: 1|2|3|4; label: string }[] = [
    { id: 1, label: "Phase 1" },
    { id: 2, label: "Phase 2" },
    { id: 3, label: "Phase 3" },
    { id: 4, label: "Phase 4" },
  ];
  return (
    <div className="flex items-center gap-3">
      {items.map((p) => {
        const active = current === p.id;
        const state = phases[p.id as 1|2|3|4];
        return (
          <div key={p.id} className={`flex items-center gap-2 px-2 py-1 rounded border ${active ? 'bg-black text-white' : ''}`}>
            <span className="text-xs">{p.label}</span>
            <span className="text-[10px] uppercase tracking-wide opacity-70">{state}</span>
          </div>
        );
      })}
    </div>
  );
}

