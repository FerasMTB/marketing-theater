Backend Integration Guide

Overview
- The frontend can run in two modes: mock (default) and remote API.
- Remote mode is enabled by setting env vars and implementing the endpoints below.
- Code entry points: `lib/api.ts` (REST), `lib/sseClient.ts` (SSE), `lib/upload.ts` (uploads).

Environment
- NEXT_PUBLIC_API_BASE: Base URL of backend, e.g., https://api.example.com
- NEXT_PUBLIC_API_MODE: "remote" to force remote mode (optional if API_BASE is set)

REST Endpoints
1) GET /projects -> ProjectMeta[]
   - Used by the projects list page (app/projects/page.tsx) via `getProjects()`.

2) POST /projects -> { projectId }
   - Body: { name: string, region: string, duration: { start: ISODate, end: ISODate } }
   - Used at project creation (app/page.tsx) via `createProject()`.

3) GET /projects/{id} -> ProjectMeta
   - Response includes: { id, name, region, duration, createdAt, updatedAt }

4) PUT /projects/{id} -> 204
   - Body: Partial<ProjectMeta>
   - Called opportunistically after uploads; you may ignore the placeholder patch for now.

5) POST /uploads/presign -> { url, fields, fileId?, publicUrl? }
   - Body: { filename, type, size, kind: "doc"|"image", projectId }
   - Frontend then POSTs form-data to `url` with `fields` + file (S3-compatible).
   - If you can return `publicUrl`, it will be saved and used for previews and asset overrides.
   - Code: `lib/upload.ts` `presignUpload()` and `uploadToPresignedUrl()`.

6) POST /runs -> { runId }
   - Body: { projectId, snapshot?: { brand?: BrandInputs, strategy?: StrategyInputs } }
   - Triggers a new run and snapshots inputs server-side (recommended).

7) GET /runs/{runId} -> RunSnapshot
   - Response includes persisted phase results and calendar snapshot.

8) GET /projects/{id}/runs/latest -> RunSnapshot
   - Used to hydrate the calendar/day pages after refresh:
     - app/projects/[id]/calendar/page.tsx
     - app/projects/[id]/calendar/[date]/page.tsx
   - Frontend call: `getLatestRunForProject()`.

9) POST /runs/{runId}/select-strategy -> { selectedStrategyId }
   - Body: { selectedStrategyId }
   - Called after Phase 3 to gate Phase 4.

10) POST /projects/{id}/extract-dna -> { toneOfVoice: string[], primaryColors: string[] }
   - Optional convenience endpoint. The frontend calls this on Review step's "Extract".
   - You can ignore the request body and infer from uploaded assets bound to the project.

Phase 5 (Assets) endpoints
11) GET /projects/{projectId}/entries/{entryId}/asset-versions -> AssetVersion[]
   - Returns the asset generation history for a calendar entry.
   - Used by the day detail page via `getAssetVersions()`.

12) POST /projects/{projectId}/entries/{entryId}/asset-versions -> AssetVersion
   - Creates a new asset version (carousel/video/text/image outputs).
   - Body: { date: YYYY-MM-DD, baseText: string, changeRequest?: string, uploadPrompt?: string, imageOverrideUrl?: string }
   - For image uploads, prefer: presign -> upload -> pass a public `imageOverrideUrl`.
   - Used by the day detail page via `generateAssetVersion()`.

SSE Endpoint
- GET /runs/{runId}/stream (text/event-stream)
- Emits JSON lines as `data:` with objects of the following shapes:
  - { type: "phase_start", phase: number, title: string, participants: string[] }
  - { type: "log", phase: number, speaker: string, text: string, ts: number }
  - { type: "phase_result", phase: number, summary: string, artifacts: any[], candidates?: any[] }
  - { type: "strategy_candidates", items: [{ id, name, rationale, highlights: string[] }], recommendedId?: string }
  - { type: "calendar_day", date: YYYY-MM-DD, entries: CalendarEntry[] }
  - { type: "error", message: string }
  - { type: "done" }
- Frontend consumer: `lib/sseClient.ts` `startStream()`.

Data Contracts (TypeScript)
- See `lib/api.ts` for exported types:
  - ProjectMeta, BrandInputs (guidelinesText preferred over guidelinesUrls), StrategyInputs
  - PhaseResult, CalendarEntry, RunSnapshot
  - Asset, AssetVersion

Important UX Rules
- Frontend only persists phase results and the final calendar; logs are ephemeral.
- Phase 4 (calendar) must run only after `selectedStrategyId` is set via the selection endpoint.
- Phase 5 (assets) is interactive per calendar day/entry; it uses REST (not SSE) and keeps a version history.

Implementation Pointers
- REST: `lib/api.ts` uses `http()` in remote mode; ensure your backend matches endpoints.
- Uploads: `lib/upload.ts` expects `/uploads/presign` to return an S3-compatible POST target.
- SSE: `lib/sseClient.ts` uses EventSource; send the JSON objects listed above as `data:` lines.
- Toggle mock vs remote via `NEXT_PUBLIC_API_BASE` and `NEXT_PUBLIC_API_MODE`.

Testing Checklist
- Create project -> 201 with projectId.
- List projects -> GET /projects returns ProjectMeta[].
- Upload files/images -> presign works, upload succeeds, returns publicUrl.
- Review step -> POST /projects/{id}/extract-dna returns tones/colors.
- Start run -> POST /runs returns runId.
- SSE emits phases and results; at Phase 3 emit strategy_candidates; after user POSTs select-strategy, emit calendar_day lines then done.
- Persisted hydration -> GET /projects/{id}/runs/latest returns latest calendar.
- Phase 5 assets -> POST/GET asset-versions works (including optional imageOverrideUrl).

