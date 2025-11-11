Backend Integration Guide

Overview
- The frontend can run in two modes: mock (default) and remote API.
- Remote mode is enabled by setting env vars and providing the endpoints below.
- Code entry points to adjust are in `lib/api.ts` (REST), `lib/sseClient.ts` (SSE), and `lib/upload.ts` (uploads).

Environment
- NEXT_PUBLIC_API_BASE: Base URL of backend, e.g., https://api.example.com
- NEXT_PUBLIC_API_MODE: "remote" to force remote mode (optional if API_BASE is set)

REST Endpoints
1) POST /projects → { projectId }
   - Body: { name: string, region: string, duration: { start: ISODate, end: ISODate } }
   - Used at project creation (app/page.tsx) via `createProject()`.

2) GET /projects/{id} → ProjectMeta
   - Response: { id, name, region, duration, createdAt, updatedAt }

3) PUT /projects/{id}
   - Body: Partial<ProjectMeta>
   - Called opportunistically after uploads; you may ignore the placeholder patch for now.

4) POST /uploads/presign → { url, fields, fileId?, publicUrl? }
   - Body: { filename, type, size, kind: "doc"|"image", projectId }
   - Frontend then POSTs form-data to `url` with `fields` + file (S3-compatible).
   - If you can return `publicUrl`, it will be saved and used for previews.
   - Code: `lib/upload.ts` `presignUpload()` and `uploadToPresignedUrl()`.

5) POST /runs → { runId }
   - Body: { projectId, snapshot?: { brand?: BrandInputs, strategy?: StrategyInputs } }
   - Trigger a new run and snapshot inputs server-side (recommended).

6) GET /runs/{runId} → RunSnapshot
   - Response includes persisted phase results and calendar snapshot.

7) POST /runs/{runId}/select-strategy → { selectedStrategyId }
   - Body: { selectedStrategyId }
   - Called after Phase 3 to gate Phase 4.

8) POST /projects/{id}/extract-dna → { toneOfVoice: string[], primaryColors: string[] }
   - Optional convenience endpoint. The frontend calls this on Review step’s "Extract".
   - You can ignore the request body and infer from uploaded assets bound to the project.

SSE Endpoint
- GET /runs/{runId}/stream (text/event-stream)
- Emits JSON lines as `data:` with objects of the following shapes:
  • { type: "phase_start", phase: number, title: string, participants: string[] }
  • { type: "log", phase: number, speaker: string, text: string, ts: number }
  • { type: "phase_result", phase: number, summary: string, artifacts: any[], candidates?: any[] }
  • { type: "strategy_candidates", items: [{ id, name, rationale, highlights: string[] }], recommendedId?: string }
  • { type: "calendar_day", date: YYYY-MM-DD, entries: CalendarEntry[] }
  • { type: "error", message: string }
  • { type: "done" }
- Frontend consumer: `lib/sseClient.ts` `startStream()`.

Data Contracts (TypeScript)
- See `lib/api.ts` for the following exported types:
  • ProjectMeta, BrandInputs (guidelinesText preferred over guidelinesUrls), StrategyInputs
  • PhaseResult, CalendarEntry, RunSnapshot

Important UX Rules
- Frontend only persists phase results and the final calendar; logs are ephemeral.
- Phase 4 (calendar) must run only after `selectedStrategyId` is set via the selection endpoint.

Implementation Pointers
- Hook points to edit backend wiring:
  • REST: `lib/api.ts` — remote implementation via `http()` is already in place; ensure your backend matches endpoints.
  • Uploads: `lib/upload.ts` — implement `/uploads/presign` to return an S3-compatible POST target.
  • SSE: `lib/sseClient.ts` — front uses EventSource; send the JSON objects listed above as `data:` lines.
- Toggle mock vs remote via `NEXT_PUBLIC_API_BASE` and `NEXT_PUBLIC_API_MODE`.

Testing Checklist
- Create project → 201 with projectId.
- Upload files/images → presign works, upload succeeds, returns publicUrl.
- Review step → POST /projects/{id}/extract-dna returns tones/colors.
- Start run → POST /runs returns runId.
- SSE emits phases, results; at Phase 3 emit strategy_candidates; after user POSTs select-strategy, emit calendar_day lines then done.
- GET /runs/{runId} returns persisted results and calendar.

