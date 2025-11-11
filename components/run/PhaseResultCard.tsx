"use client";
export function PhaseResultCard({ phase, summary, artifacts }: { phase: number; summary: string; artifacts: any[] }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="text-sm text-gray-500 mb-1">Result — Phase {phase}</div>
      <div className="font-medium mb-2">{summary}</div>
      <div className="grid gap-3">
        {artifacts.map((a: any, i: number) => (
          <div key={i} className="rounded border p-2">
            {a.title && <div className="font-medium text-sm mb-1">{a.title}</div>}
            {a.bullets && (
              <ul className="list-disc pl-5 text-sm">
                {a.bullets.map((b: string, j: number) => <li key={j}>{b}</li>)}
              </ul>
            )}
            {a.items && (
              <ul className="list-disc pl-5 text-sm">
                {a.items.map((b: string, j: number) => <li key={j}>{b}</li>)}
              </ul>
            )}
            {a.channel && (
              <div className="text-sm">
                <div><b>Channel:</b> {a.channel}</div>
                <div><b>KPIs:</b> {(a.kpis||[]).join(', ')}</div>
                <div><b>Budget:</b> {a.budget}</div>
                <div><b>Sample:</b> {a.samplePost}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

