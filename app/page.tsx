"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "../lib/api";
import { useProjectStore } from "../store/useProjectStore";

export default function Home() {
  const router = useRouter();
  const projectStore = useProjectStore();
  useEffect(() => {
    projectStore.reset();
  }, []);
  const [name, setName] = useState("Untitled Project");
  const [region, setRegion] = useState("US");
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [end, setEnd] = useState(
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 28).toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);

  async function onContinue() {
    setLoading(true);
    const { projectId } = await createProject({
      name,
      region,
      duration: { start, end },
    });
    projectStore.updateMeta({ name, region, duration: { start, end } });
    projectStore.setProjectId(projectId);
    router.push(`/projects/${projectId}/inputs/brand`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-xl p-6 border rounded-lg shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">Welcome</h1>
        <p className="text-sm text-gray-600 mb-6">Create a project to begin.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Project Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., Q1 Awareness"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option>US</option>
                <option>EU</option>
                <option>APAC</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Start</label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">End</label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          <button
            onClick={onContinue}
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center rounded bg-black text-white px-4 py-2 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
