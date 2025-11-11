"use client";
import { useParams, useRouter } from "next/navigation";
import { useProjectStore } from "../../../../../store/useProjectStore";
import { useState } from "react";

export default function StrategyInputsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const store = useProjectStore();
  const [goal, setGoal] = useState(store.strategy.goal);
  const [audience, setAudience] = useState(store.strategy.audience);
  const [styles, setStyles] = useState<string[]>(store.strategy.campaignStyles);
  const [align, setAlign] = useState<boolean>(store.strategy.alignWithEvents);
  const [region, setRegion] = useState(store.strategy.region || store.region);
  const [showAdvanced, setShowAdvanced] = useState(false);

  function toggleStyle(s: string) {
    setStyles((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Strategy Inputs</h1>
        <p className="text-sm text-gray-600">Minimal fields with progressive disclosure.</p>
      </div>

      <div className="border rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-sm mb-1">Primary Goal</label>
          <input value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g., Awareness + Signups" />
        </div>
        <div>
          <label className="block text-sm mb-1">Audience</label>
          <input value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g., Busy pros in tech hubs" />
        </div>
        <div>
          <label className="block text-sm mb-1">Campaign Styles</label>
          <div className="flex flex-wrap gap-2">
            {['Social', 'Events', 'Email', 'PR', 'Influencers'].map((s) => (
              <button key={s} type="button" onClick={() => toggleStyle(s)} className={`text-xs px-3 py-1 rounded-full border ${styles.includes(s) ? 'bg-black text-white' : ''}`}>{s}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input id="align" type="checkbox" checked={align} onChange={(e) => setAlign(e.target.checked)} />
          <label htmlFor="align" className="text-sm">Align with upcoming events?</label>
        </div>
        {align && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Region</label>
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full border rounded px-3 py-2">
                <option>US</option>
                <option>EU</option>
                <option>APAC</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Time window (weeks)</label>
              <select defaultValue="4" className="w-full border rounded px-3 py-2">
                <option>2</option>
                <option>4</option>
                <option>8</option>
              </select>
            </div>
          </div>
        )}
        <button className="text-sm text-gray-700 underline" onClick={() => setShowAdvanced((v) => !v)}>{showAdvanced ? 'Hide' : 'Show'} details</button>
        {showAdvanced && (
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="block text-sm mb-1">Preferences (tags)</label>
              <input className="w-full border rounded px-2 py-1" placeholder="e.g., UGC, creators" />
            </div>
            <div className="flex items-center gap-2">
              <input id="ugcy" type="checkbox" defaultChecked />
              <label htmlFor="ugcy" className="text-sm">UGC friendly</label>
            </div>
            <div>
              <label className="block text-sm mb-1">Constraints</label>
              <input className="w-full border rounded px-2 py-1" placeholder="e.g., Legal approvals needed" />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button className="px-4 py-2 rounded border" onClick={() => router.push(`/projects/${id}/inputs/brand`)}>Back</button>
        <button className="px-4 py-2 rounded bg-black text-white" onClick={() => { store.updateStrategy({ goal, audience, campaignStyles: styles, alignWithEvents: align, region }); router.push(`/projects/${id}/review`); }}>Review</button>
      </div>
    </div>
  );
}

