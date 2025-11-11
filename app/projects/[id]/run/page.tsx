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
import { selectStrategy } from "../../../../lib/api";
import { ConnectionStatus } from "../../../../components/run/ConnectionStatus";

export default function RunPage() {
  const { id } = useParams<{ id: string }>();
  const project = useProjectStore();
  const run = useRunStore();
  const [conn, setConn] = useState<"connecting" | "open" | "closed">("connecting");
  const [strategyPrompt, setStrategyPrompt] = useState<{ items: any[]; recommendedId?: string } | null>(null);

  const duration = useMemo(() => ({ start: project.duration.start, end: project.duration.end }), [project.duration]);

  useEffect(() => {
    run.setStatus("running");
    run.setCurrentPhase(1);
    run.setPhaseStatus(1, "running");
    setConn("open");

    const sim = startStream(
      {
        runId: run.runId || "local",
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

    // Cleanup
    return () => {
      sim.stop();
      setConn("closed");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirmStrategy(idSelected: string) {
    run.setSelectedStrategy(idSelected);
    if (run.runId) await selectStrategy(run.runId, idSelected);
    setStrategyPrompt(null);
  }

  const currentLogs = run.theater[run.currentPhase as 1|2|3|4] || [];

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
          if (!res) return <div key={p} className="border rounded-lg p-4 text-sm text-gray-500">Waiting for Phase {p}...</div>;
          return <PhaseResultCard key={p} phase={p} summary={res.summary} artifacts={res.artifacts} />;
        })}
      </div>

      {strategyPrompt && (
        <StrategySelectModal open items={strategyPrompt.items} recommendedId={strategyPrompt.recommendedId} onSelect={confirmStrategy} onClose={() => setStrategyPrompt(null)} />
      )}

      {run.status === "done" && (
        <div className="rounded bg-green-50 border border-green-200 p-3 text-green-800 text-sm">Run completed. Open Calendar for the plan.</div>
      )}
    </div>
  );
}
