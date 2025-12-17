"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import { useProjectStore } from "../../../../store/useProjectStore";
import { useRunStore } from "../../../../store/useRunStore";
import { startStream } from "../../../../lib/sseClient";
import { PhaseStepper } from "../../../../components/run/PhaseStepper";
import { MeetingTheater } from "../../../../components/run/MeetingTheater";
import { PhaseResultCard } from "../../../../components/run/PhaseResultCard";
import { StrategySelectModal } from "../../../../components/run/StrategySelectModal";
import { selectStrategy, getLatestRunForProject } from "../../../../lib/api"; 
import { ConnectionStatus } from "../../../../components/run/ConnectionStatus";

export default function RunPage() {
  const { id } = useParams<{ id: string }>(); // This is Project ID
  const project = useProjectStore();
  const run = useRunStore();
  const [conn, setConn] = useState<"connecting" | "open" | "closed">("connecting");
  const [strategyPrompt, setStrategyPrompt] = useState<{ items: any[]; recommendedId?: string } | null>(null);

  const duration = useMemo(() => ({ start: project.duration.start, end: project.duration.end }), [project.duration]);

  useEffect(() => {
    let mounted = true;
    let eventSource: any = null;

    async function initRun() {
      try {
        let activeRunId = run.runId;

        // 1. Fetch Latest Run Data (ID + Results)
        if (!activeRunId) {
          console.log("Fetching latest run data for project:", id);
          const latest = await getLatestRunForProject(id);
          
          if (latest && mounted) {
            activeRunId = latest.runId;
            run.setRunId(latest.runId);
            if (latest.selectedStrategyId) {
              run.setSelectedStrategy(latest.selectedStrategyId);
            }

            // 🌟 HYDRATION FIX: Populate Phases 1, 2, 3 immediately from API 🌟
            if (latest.results) {
              Object.entries(latest.results).forEach(([phaseStr, data]: [string, any]) => {
                const p = parseInt(phaseStr) as 1 | 2 | 3 | 4;
                if ([1, 2, 3, 4].includes(p)) {
                  console.log(`💧 Hydrating Phase ${p} from API`);
                  
                  // Update Result Card
                  run.setResult({
                    phase: p,
                    summary: data.summary,
                    artifacts: data.artifacts,
                    candidates: data.candidates
                  });
                  
                  // Mark as Done
                  run.setPhaseStatus(p, "done");
                }
              });

              // Smart Phase Pointer: If Phase 3 is done, move pointer to 4
              if (latest.results["3"]) {
                run.setCurrentPhase(4);
              }
            }
          }
        }

        if (!activeRunId && mounted) {
           console.warn("No run found, defaulting to 'local'");
           activeRunId = "local"; 
        }

        if (!mounted || !activeRunId) return;

        // 2. Start Stream (Only for NEW updates)
        run.setStatus("running");
        setConn("open");

        console.log("Starting stream for Run ID:", activeRunId);

        eventSource = startStream(
          {
            runId: activeRunId,
            startDateISO: dayjs(duration.start).toISOString(),
            endDateISO: dayjs(duration.end).toISOString(),
            getSelectedStrategyId: () => run.selectedStrategyId,
          },
          {
            onEvent: (ev: any) => {
              switch (ev.type) {
                case "phase_start":
                  run.setCurrentPhase(ev.phase as 1|2|3|4);
                  run.setPhaseStatus(ev.phase as 1|2|3|4, "running");
                  break;
                case "log":
                  run.pushLog({ phase: ev.phase, speaker: ev.speaker, text: ev.text, ts: ev.ts });
                  break;
                case "phase_result":
                  // Stream updates overwrite/ensure the UI is correct
                  run.setResult({ phase: ev.phase, summary: ev.summary, artifacts: ev.artifacts, candidates: ev.candidates });
                  run.setPhaseStatus(ev.phase as 1|2|3|4, "done");
                  if (ev.phase < 4) run.setCurrentPhase((ev.phase + 1) as any);
                  break;
                case "strategy_candidates":
                  setStrategyPrompt({ items: ev.items, recommendedId: ev.recommendedId });
                  break;
                case "calendar_day":
                  run.setPhaseStatus(4, "running");
                  run.setCurrentPhase(4);
                  run.addCalendarEntries(ev.date, ev.entries);
                  break;
                case "done":
                  run.setPhaseStatus(4, "done");
                  run.setCurrentPhase(5);
                  run.setStatus("done");
                  setConn("closed");
                  break;
                case "error":
                  run.setStatus("error");
                  setConn("closed");
                  break;
              }
            },
          }
        );

      } catch (err) {
        console.error("Failed to init run:", err);
        if(mounted) {
            setConn("closed");
            run.setStatus("error");
        }
      }
    }

    initRun();

    return () => {
      mounted = false;
      if (eventSource) eventSource.stop();
      setConn("closed");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function confirmStrategy(idSelected: string) {
    run.setSelectedStrategy(idSelected);
    if (run.runId) await selectStrategy(run.runId, idSelected);
    setStrategyPrompt(null);
  }

  const currentLogs = run.theater[run.currentPhase as 1|2|3|4|5] || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PhaseStepper phases={run.phases} current={run.currentPhase || 1} />
        <ConnectionStatus status={conn} />
      </div>
      <MeetingTheater logs={currentLogs} />
      <div className="grid gap-4 md:grid-cols-3">
        {[1,2,3].map((p) => {
          const res = run.results[p as 1|2|3|4];
          // If no result, show waiting state
          if (!res) return <div key={p} className="border rounded-lg p-4 text-sm text-gray-500">Waiting for Phase {p}...</div>;
          return <PhaseResultCard key={p} phase={p} summary={res.summary} artifacts={res.artifacts} />;
        })}
      </div>

      {strategyPrompt && (
        <StrategySelectModal
          open
          items={strategyPrompt.items}
          recommendedId={strategyPrompt.recommendedId}
          brief={project.strategy}
          results={run.results}
          onSelect={confirmStrategy}
          onClose={() => setStrategyPrompt(null)}
        />
      )}

      {run.status === "done" && (
        <div className="rounded bg-green-50 border border-green-200 p-3 text-green-800 text-sm">Run completed. Open Calendar, then click a day to generate assets (Phase 5).</div>
      )}
    </div>
  );
}