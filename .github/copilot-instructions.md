# Project Guidelines

## Architecture

- This workspace is split into a React + TypeScript frontend in `src/` and an Express backend in `server/`.
- Frontend calls external data through the backend proxy. Prefer `src/services/apiClient.ts` for frontend API usage.
- Backend route handlers live in `server/routes/` and source integrations/business logic live in `server/services/`.
- Keep concerns separated: page composition in `src/pages/`, reusable UI in `src/components/`, transport/contracts in `src/services/` and `src/lib/`.

## Build And Run

- Frontend install: `npm install`
- Frontend dev: `npm run dev`
- Frontend build: `npm run build`
- Frontend lint: `npm run lint`
- Backend install: `cd server && npm install`
- Backend dev: `cd server && npm run dev`
- Backend start: `cd server && npm start`
- Combined local startup: `powershell -ExecutionPolicy Bypass -File start.ps1`

## Environment And Ports

- Frontend default dev port is `8080` (Vite), backend is `5000`.
- Frontend API base should come from `VITE_API_URL` (default `http://localhost:5000/api`).
- Backend CORS must continue to allow local frontend origins (`http://localhost:8080` and `http://localhost:5173`).

## Conventions

- Do not introduce direct browser-side calls to external research APIs in page components.
- Prefer adding new backend endpoints in `server/routes/api.js` and related service modules, then call them from `src/services/apiClient.ts`.
- Follow existing frontend data-fetch pattern: React Query (`useQuery`) with explicit loading/error states.
- Reuse shared UI primitives from `src/components/ui/` and utility composition via `src/lib/utils.ts`.
- Preserve existing response shape expectations (`{ success, data, count }` or endpoint-specific typed response) when extending backend APIs.
- Keep TypeScript changes compatible with the repo's non-strict TS configuration unless explicitly migrating strictness.

## Reliability Notes

- Semantic Scholar can rate-limit requests; handle partial failures gracefully and avoid hard-failing aggregate responses.
- Keep assistant and harvest features backward compatible with current response contracts used by frontend pages.

## Useful Docs

- `README.md`
- `server/README.md`
- `API_INTEGRATION_GUIDE.md`
- `CORS_FIXES.md`
- `RATE_LIMITING_EXPLAINED.md`
- `QUICK_START.md`
