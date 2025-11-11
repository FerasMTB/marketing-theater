"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Duration = { start: string; end: string };

export type ProjectState = {
  projectId?: string;
  name: string;
  region: string;
  duration: Duration;
  brand: {
    toneOfVoice: string[];
    primaryColors: string[];
    guidelinesUrls: string[];
    guidelinesText?: string;
    images: { id: string; name: string; previewUrl?: string }[];
    files: { id: string; name: string; type: string; size: number; url?: string }[];
  };
  strategy: {
    goal: string;
    audience: string;
    campaignStyles: string[];
    alignWithEvents: boolean;
    region?: string;
    timeWindow?: Duration;
    preferences?: { tags?: string[]; ugc?: boolean; constraints?: string };
  };
  setProjectId: (id: string) => void;
  updateMeta: (p: Partial<Pick<ProjectState, "name" | "region" | "duration">>) => void;
  updateBrand: (b: Partial<ProjectState["brand"]>) => void;
  updateStrategy: (s: Partial<ProjectState["strategy"]>) => void;
  reset: () => void;
};

const defaults: Omit<ProjectState, "setProjectId" | "updateMeta" | "updateBrand" | "updateStrategy" | "reset"> = {
  name: "Untitled Project",
  region: "US",
  duration: {
    start: new Date().toISOString().slice(0, 10),
    end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 28).toISOString().slice(0, 10),
  },
  brand: {
    toneOfVoice: ["Confident", "Witty", "Practical"],
    primaryColors: ["#0ea5e9", "#111827", "#f59e0b"],
    guidelinesUrls: [],
    guidelinesText: "",
    images: [],
    files: [],
  },
  strategy: {
    goal: "Drive awareness and signups",
    audience: "Busy pros in tech hubs",
    campaignStyles: ["Social", "Events", "Email"],
    alignWithEvents: true,
    region: "US",
    timeWindow: undefined,
    preferences: { tags: ["UGC", "Creators"], ugc: true, constraints: "Respect brand tone" },
  },
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projectId: undefined,
      ...defaults,
      setProjectId: (id) => set({ projectId: id }),
      updateMeta: (p) => set((s) => ({ ...s, ...p })),
      updateBrand: (b) => set((s) => ({ ...s, brand: { ...s.brand, ...b } })),
      updateStrategy: (u) => set((s) => ({ ...s, strategy: { ...s.strategy, ...u } })),
      reset: () => set(() => ({ projectId: undefined, ...defaults })),
    }),
    { name: "marketing:project" }
  )
);
