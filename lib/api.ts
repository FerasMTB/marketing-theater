"use client";
import { nanoid } from "nanoid";
import { IS_REMOTE } from "./config";
import { http } from "./http";

export type Duration = { start: string; end: string };

export type ProjectMeta = {
  id: string;
  name: string;
  region: string;
  duration: Duration;
  createdAt: string;
  updatedAt: string;
  brand?: BrandInputs;
  strategy?: StrategyInputs;
};

export type BrandInputs = {
  toneOfVoice: string[];
  primaryColors: string[]; // hex
  guidelinesUrls: string[]; // deprecated; prefer guidelinesText
  guidelinesText?: string;
  images: { id: string; name: string; previewUrl?: string }[];
  files: {
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
  }[];
};

export type StrategyInputs = {
  goal: string;
  audience: string;
  campaignStyles: string[]; // chips
  alignWithEvents: boolean;
  region?: string;
  timeWindow?: Duration;
  preferences?: { tags?: string[]; ugc?: boolean; constraints?: string };
};

export type PhaseResult = {
  phase: 1 | 2 | 3 | 4;
  summary: string;
  artifacts: any[];
  candidates?: {
    id: string;
    name: string;
    rationale: string;
    highlights: string[];
  }[];
};

export type CalendarEntry = {
  id: string;
  date: string; // ISO date
  channel: string;
  type: string; // content type
  title: string;
  owner?: string;
  effort?: "low" | "med" | "high";
  description?: string;
  relatedEvents?: string[];
};

export type RunSnapshot = {
  runId: string;
  projectId: string;
  createdAt: string;
  results: Record<string, PhaseResult>; // "1","2","3","4"
  selectedStrategyId?: string;
  calendar: Record<string, CalendarEntry[]>; // date -> entries
};

// Simple localStorage-backed simulation
const LS_PROJECTS = "sim:projects";
const LS_RUNS = "sim:runs";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export async function createProject(input: {
  name: string;
  region: string;
  duration: Duration;
}): Promise<{ projectId: string }> {
  if (IS_REMOTE) {
    return http<{ projectId: string }>(`/projects`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
  const id = nanoid(8);
  const projects = read<Record<string, ProjectMeta>>(LS_PROJECTS, {});
  const now = new Date().toISOString();
  projects[id] = {
    id,
    name: input.name || "Untitled Project",
    region: input.region || "US",
    duration: input.duration,
    createdAt: now,
    updatedAt: now,
  };
  write(LS_PROJECTS, projects);
  return new Promise((res) => setTimeout(() => res({ projectId: id }), 300));
}

export async function getProject(
  projectId: string
): Promise<ProjectMeta | null> {
  if (IS_REMOTE) {
    return http<ProjectMeta>(`/projects/${projectId}`);
  }
  const projects = read<Record<string, ProjectMeta>>(LS_PROJECTS, {});
  return projects[projectId] ?? null;
}

export async function updateProject(
  projectId: string,
  patch: Partial<ProjectMeta>
): Promise<void> {
  if (IS_REMOTE) {
    await http<void>(`/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    return;
  }
  const projects = read<Record<string, ProjectMeta>>(LS_PROJECTS, {});
  const current = projects[projectId];
  if (!current) return;
  projects[projectId] = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  } as ProjectMeta;
  write(LS_PROJECTS, projects);
}

export async function createRun(input: {
  projectId: string;
  snapshot?: { brand?: BrandInputs; strategy?: StrategyInputs };
}): Promise<{ runId: string }> {
  if (IS_REMOTE) {
    return http<{ runId: string }>(`/runs`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
  const runId = nanoid(10);
  const runs = read<Record<string, RunSnapshot>>(LS_RUNS, {});
  runs[runId] = {
    runId,
    projectId: input.projectId,
    createdAt: new Date().toISOString(),
    results: {},
    calendar: {},
  };
  write(LS_RUNS, runs);
  return new Promise((res) => setTimeout(() => res({ runId }), 300));
}

export async function getRun(runId: string): Promise<RunSnapshot | null> {
  if (IS_REMOTE) {
    return http<RunSnapshot>(`/runs/${runId}`);
  }
  const runs = read<Record<string, RunSnapshot>>(LS_RUNS, {});
  return runs[runId] ?? null;
}

export async function savePhaseResult(
  runId: string,
  result: PhaseResult
): Promise<void> {
  if (IS_REMOTE) return; // backend persists
  const runs = read<Record<string, RunSnapshot>>(LS_RUNS, {});
  const run = runs[runId];
  if (!run) return;
  run.results[String(result.phase)] = result;
  write(LS_RUNS, runs);
}

export async function selectStrategy(
  runId: string,
  selectedStrategyId: string
): Promise<{ selectedStrategyId: string }> {
  if (IS_REMOTE) {
    return http<{ selectedStrategyId: string }>(
      `/runs/${runId}/select-strategy`,
      { method: "POST", body: JSON.stringify({ selectedStrategyId }) }
    );
  }
  const runs = read<Record<string, RunSnapshot>>(LS_RUNS, {});
  const run = runs[runId];
  if (!run) return { selectedStrategyId };
  run.selectedStrategyId = selectedStrategyId;
  write(LS_RUNS, runs);
  return { selectedStrategyId };
}

export async function appendCalendarDay(
  runId: string,
  date: string,
  entries: CalendarEntry[]
): Promise<void> {
  if (IS_REMOTE) return; // backend persists
  const runs = read<Record<string, RunSnapshot>>(LS_RUNS, {});
  const run = runs[runId];
  if (!run) return;
  run.calendar[date] = [...(run.calendar[date] || []), ...entries];
  write(LS_RUNS, runs);
}

// Simulated extraction from uploaded files/images
export async function extractBusinessDNA(input: {
  projectId?: string;
  files: BrandInputs["files"];
  images: BrandInputs["images"];
}): Promise<Pick<BrandInputs, "toneOfVoice" | "primaryColors">> {
  if (IS_REMOTE && input.projectId) {
    return http(`/projects/${input.projectId}/extract-dna`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }
  // Pretend “analysis”: seed from filenames to vary results
  const names = [
    ...input.files.map((f) => f.name.toLowerCase()),
    ...input.images.map((i) => i.name.toLowerCase()),
  ].join(" ");
  const tones = [
    "Confident",
    "Witty",
    "Practical",
    "Friendly",
    "Bold",
    "Helpful",
  ];
  const colors = [
    "#0ea5e9",
    "#111827",
    "#f59e0b",
    "#10b981",
    "#8b5cf6",
    "#ef4444",
  ];
  const pick = (seed: number, list: string[], n: number) =>
    Array.from({ length: n }, (_, i) => list[(seed + i) % list.length]);
  const seed = names.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 7;
  return new Promise((res) =>
    setTimeout(
      () =>
        res({
          toneOfVoice: pick(seed, tones, 3),
          primaryColors: pick(seed + 2, colors, 3),
        }),
      400
    )
  );
}

export async function getProjects(): Promise<ProjectMeta[]> {
  if (IS_REMOTE) {
    return http<ProjectMeta[]>(`/projects`);
  }
  // Fallback for local storage mode (if needed)
  const projects = read<Record<string, ProjectMeta>>("sim:projects", {});
  return Object.values(projects).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
