# CivicPulse MERN Hackathon Project

CivicPulse turns a citizen report into an actionable civic work item: the API classifies the issue, computes a priority score, routes it to a department, exposes an authority queue, and lets citizens verify the resolution.

## Stack

- **MongoDB** — persistent issues, workflow state, priority data
- **Express + Node.js** — REST API and domain rules
- **React + Vite** — citizen and authority dashboards

## Run locally

1. Install Node.js 20+ and ensure MongoDB is running locally, or set `MONGODB_URI` in `server/.env` from `server/.env.example`.
2. In this folder run `npm install`, then `npm run install:all`.
3. Run `npm run seed` to preload the hackathon demo data.
4. Run `npm run dev`.
5. Visit `http://localhost:5173`.

## API

- `GET /api/issues` — priority-sorted issue queue
- `POST /api/issues` — create and AI-triage a report
- `PATCH /api/issues/:id` — update operational status
- `POST /api/issues/:id/verify` — confirm or reopen a resolved issue
- `GET /api/issues/stats` — authority dashboard summary

The classification and priority scoring are deterministic demo rules, deliberately kept in `server/routes/issues.js` so they can later be replaced with an ML or LLM service without changing the UI contract.
