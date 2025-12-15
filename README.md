This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Run the dev server:

```bash
npm run dev
```

Open http://localhost:3000 to see the app.

Tip: open http://localhost:3000/projects to browse all projects (mock mode auto-seeds a couple demo projects).

This app can run with mock data or a real backend. See Backend Integration below.

## Modes

- Mock (default): no backend needed; data is simulated and stored locally.
- Remote: set `NEXT_PUBLIC_API_BASE` to enable real API calls.

## Env

- `NEXT_PUBLIC_API_BASE` — base URL of backend API. When set, remote mode is used.
- `NEXT_PUBLIC_API_MODE` — `remote` or `mock` to force a mode.

## Backend Integration

See `BACKEND_INTEGRATION.md` for endpoint contracts, SSE message schema, and integration touchpoints in code (`lib/api.ts`, `lib/sseClient.ts`, `lib/upload.ts`).
