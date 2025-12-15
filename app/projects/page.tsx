"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ensureDemoProjects, getProjects, type ProjectMeta } from "../../lib/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await ensureDemoProjects();
        const items = await getProjects();
        if (mounted) setProjects(items);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const hasProjects = useMemo(() => projects.length > 0, [projects.length]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/projects" className="font-semibold">
            Marketing Theater
          </Link>
          <div className="flex gap-2">
            <Link
              href="/"
              className="text-sm px-3 py-2 rounded bg-black text-white"
            >
              New Project
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 flex-1 space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Projects</h1>
            <p className="text-sm text-gray-600">
              Pick a project to continue.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="border rounded-lg p-4 text-sm text-gray-600">
            Loading projects...
          </div>
        ) : !hasProjects ? (
          <div className="border rounded-lg p-4 text-sm text-gray-600">
            No projects yet. Create one to begin.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-gray-600">
                      Region: {p.region}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    <div>Updated</div>
                    <div>{new Date(p.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

