# Audit Note — company-brain

**Date:** 2026-05-07
**Bucket:** A. WORKING_PRODUCT (extended)
**Stack:** node-express + react/vite, Postgres (`company_brain_db`), JWT
**Run:** `./start.sh` → backend :3005, frontend :5173, login `admin@demo.com / demo123`

## Domain

CompanyBrain is a company knowledge / memory hub: knowledge entries, documents,
queries, procedures, policies, decisions, plus an AI Center backed by OpenRouter
(`anthropic/claude-haiku-4.5` by default).

## Recent changes (2026-05-07)

Added **5 new AI features** + **3 new non-AI utility features** (8 total) — see
`/Users/erolakarsu/projects/_AUDIT/apply3_logs/feature_add_company-brain.md` for
the full log.

### New AI endpoints (mounted under `/api/ai`)
- `POST /summarize-document` — document summarizer
- `POST /find-similar` — semantic-similar-doc finder
- `POST /extract-entities` — NER over arbitrary text
- `POST /auto-tag` — auto-tagger / category suggester
- `POST /staleness-rank` — knowledge-staleness ranker

All five guard on `OPENROUTER_API_KEY` and return **HTTP 503** with an explicit
error when the key is missing. Implemented in the existing `backend/routes/ai.js`
(extended; original endpoints untouched).

### New utility endpoints
- `GET /api/export/:resource` — CSV export (knowledge / documents / queries /
  procedures / policies / decisions / audit). Lists at `GET /api/export/`.
- `GET /api/search?q=&scope=&department=&category=&limit=` — unified
  cross-corpus search returning `{kind,id,title,snippet,meta}` rows.
- `GET|POST|DELETE /api/audit` — audit log. Backed by new `audit_log` table.

### Schema change
- Added `audit_log` table to `backend/db/schema.sql` (id, user_id, user_email,
  action, resource, resource_id, details, created_at). Re-applying schema is
  destructive (existing `DROP TABLE` pattern); seed.sql is untouched and still
  applies after.

### Frontend
- New page `frontend/src/pages/MoreAIPage.tsx` mounted at `/ai-more` (5 AI tools).
- New page `frontend/src/pages/UtilitiesPage.tsx` mounted at `/utilities` (CSV
  export, search+filter, audit log).
- Sidebar `Layout.tsx` extended with "More AI" and "Utilities" entries.

## Patterns followed
- Express Router + `verifyToken` middleware on every protected route.
- JWT bearer in `Authorization` header (already enforced by `middleware/auth.js`).
- All errors returned as `{error: "..."}` JSON; 4xx / 5xx status codes honored.
- ILIKE-based text search, parameterized queries, no string concatenation of
  user input into SQL.
- Frontend uses the existing `apiFetch` helper from `src/api.ts`.
- AI endpoints share the existing `callAI` helper; tone/structure of system
  prompts matches existing routes.

## Not changed
- Auth, db.js, package.json, seed.sql, existing AI endpoints, all CRUD routes,
  all existing pages and components, `start.sh`.
- `npm install` was **not** run; all new code uses already-installed deps
  (`express`, `pg`, `jsonwebtoken`, `bcrypt`, plus the existing React + lucide
  + react-router stack on the frontend).

## Smoke-test summary
Live test on port 3005 confirmed: login works, search returns 18 unified
results, CSV export returns proper header + rows, audit POST/GET roundtrip
works, AI 400 on missing fields, 401 on no token, all syntax checks (`node -c`,
`tsc --noEmit`) clean.

## Sample Data feature (2026-05-07)

Added an admin "Sample Data" page that seeds the database with
domain-realistic rows for each main entity (knowledge / documents /
queries / procedures / policies / decisions — skips `users` and
`audit_log`).

### Backend
- New `backend/routes/sample_data.js`, mounted at `/api/admin`.
- `GET  /api/admin/sample-data`           → list of supported entities.
- `POST /api/admin/sample-data/:entity`   → inserts 5-10 hand-written
  rows; returns `{inserted, entity}`.
- JWT-protected via existing `verifyToken`. Parameterized SQL only.
- Sample content is company-knowledge-base flavored (e.g. "Q3 Engineering
  Roadmap", "Customer Onboarding Playbook", "Sev1 Incident Response",
  "AI Tooling Usage Policy", "Adopt Postgres over MySQL").

### Frontend
- New page `frontend/src/pages/SampleDataPage.tsx` mounted at
  `/sample-data`. Six buttons, one per entity, with toast + per-entity
  insert counter. Matches existing dark-theme styling.
- Sidebar `Layout.tsx` extended with a "Sample Data" link (Database icon,
  emerald active state) under Utilities.

### Smoke-test
Live test on port 3005 confirmed: login works, `POST
/api/admin/sample-data/documents` returns **200** with
`{"inserted":7,"entity":"documents"}`, count goes 15 → 22, no-token →
**401**, unknown entity → **400**, syntax checks clean. Test rows then
deleted to leave seed state untouched. Full log:
`/Users/erolakarsu/projects/_AUDIT/apply3_logs/sample_data_company-brain.md`.

## 2026-05-07 — Sample-Prefill buttons on AI feature pages

Added inline "Try a sample:" button rows to every AI feature panel so
users can populate the form with realistic company-knowledge data in
one click instead of typing or pasting.

### Coverage
Two files, nine AI panels, 25 sample buttons total (2-3 per panel).

- `frontend/src/components/AICenter.tsx` (route `/ai`)
  - Extract Knowledge: Slack incident / Customer ticket / Meeting notes
  - Answer Query: Refund policy / On-call rotation / PTO request
  - Generate Procedure: Customer onboarding / Incident response / Expense reimburse
  - Knowledge Gaps: Engineering / Customer Success / Finance
- `frontend/src/pages/MoreAIPage.tsx` (route `/ai-more`)
  - Summarize Document: Q3 Eng Roadmap / Onboarding playbook / Incident runbook
  - Find Similar: Refund policies / On-call procedures
  - Extract Entities: Postmortem / Sales kickoff / Vendor contract
  - Auto-Tag: Eng roadmap / Expense policy / CS onboarding
  - Staleness Rank: Mixed docs / Policies set

### Implementation
There is no shared form abstraction between panels — each owns its own
state — so prefill buttons are inline. Each panel gets a flex row
`Try a sample: [btn] [btn] [btn]` above its existing inputs and a small
`load*(s)` helper that fully populates every form field for that panel.
Sample data uses real-feeling docs (Q3 Engineering Roadmap, Customer
Onboarding Playbook, Incident Response Runbook), real departments
(Engineering, Customer Success, Finance), and realistic processes
(Stripe webhook rotation, SOC2 access review, PagerDuty escalation,
Expensify reimbursement).

### Smoke-test
`npx tsc --noEmit` clean; `npx vite build` clean (1487 modules, 273 kB
JS); backend up on port 3005; login `admin@demo.com / demo123` returns
token; `POST /api/ai/extract-knowledge` with the "Slack incident"
sample payload returns **HTTP 200** with valid extracted entries.
Backend stopped, dist/ removed. Full log:
`/Users/erolakarsu/projects/_AUDIT/apply3_logs/samples_company-brain.md`.

## 2026-05-07 — Dashboard page (post-login landing)

Added a domain-appropriate **Dashboard** page that is now the first
sidebar entry and the default post-login route.

### Backend
- New `backend/routes/dashboard.js`, mounted at `/api/dashboard`.
- `GET /api/dashboard/stats` — JWT-protected via existing
  `verifyToken`. Returns `{counts, meta, recent_activity, generated_at}`
  where `counts` covers all six main entities (knowledge / documents /
  queries / procedures / policies / decisions), `meta` adds indexed
  doc count, helpful-query count and active-policy count, and
  `recent_activity` is the latest 10 rows from `audit_log`.

### Frontend
- New page `frontend/src/pages/Dashboard.tsx` mounted at `/dashboard`.
  Six KPI cards (each a `<Link>` to its page) + 4 quick-action tiles
  (AI Center / Knowledge / Documents / Sample Data) + recent-activity
  panel pulling from `audit_log` with action-tone tags and relative
  timestamps. Loading / error / empty states; Refresh button.
- `Layout.tsx` extended: `LayoutDashboard` icon, "Dashboard" added as
  the **first** entry in `navItems`.
- `App.tsx` route added; root redirect changed `/knowledge` →
  `/dashboard`. `Login.tsx` post-login `navigate('/knowledge')` →
  `navigate('/dashboard')`.

### Smoke-test
Backend on port 3005 + login `admin@demo.com / demo123` →
`GET /api/dashboard/stats` with bearer returns **HTTP 200** with full
counts payload (knowledge=16, documents=15, queries=15, procedures=15,
policies=15, decisions=15). No token → 401; invalid token → 403.
`node -c` + `npx tsc --noEmit` + `npx vite build` (1488 modules,
283 kB JS) all clean. Backend stopped, `dist/` removed, port 3005
verified free. No DB writes (read-only route). Full log:
`/Users/erolakarsu/projects/_AUDIT/apply3_logs/dashboard_company-brain.md`.

## 2026-05-07 — Merged duplicate AI sidebar entries

The sidebar previously had two parallel AI links — "AI Tools"
(`/ai` → `AICenter.tsx`, 4 tools) and "More AI" (`/ai-more` →
`MoreAIPage.tsx`, 5 tools). Consolidated into a **single tabbed AI
Center** with all 9 tools accessible via a tab strip.

### Changes
- `frontend/src/components/AICenter.tsx` — refactored from stacked
  sections into a tabbed layout. 9 tabs: Extract Knowledge, Answer
  Query, Generate Procedure, Knowledge Gaps (original 4) +
  Summarize, Find Similar, Extract Entities, Auto-Tag,
  Staleness Rank (migrated from MoreAIPage). All state, sample-prefill
  buttons, `load*()` helpers, API calls preserved verbatim.
- `frontend/src/components/Layout.tsx` — removed the "More AI"
  `<Link to="/ai-more">` block from the sidebar.
- `frontend/src/App.tsx` — removed `MoreAIPage` import; replaced the
  `/ai-more` route element with `<Navigate to="/ai" replace />` so
  existing bookmarks/links keep working.
- `frontend/src/pages/MoreAIPage.tsx` — deleted (optional cleanup).

### Smoke-test
`npx tsc --noEmit` clean; `npx vite build` clean (1487 modules,
283 kB JS). Backend on port 3005, login → token len 217.
`POST /api/ai/extract-knowledge` (original AICenter endpoint) → 200,
`POST /api/ai/summarize-document` (migrated MoreAI endpoint) → 200.
No backend changes. No `npm install`. Backend stopped, dist/ removed.
Full log: `/Users/erolakarsu/projects/_AUDIT/apply3_logs/merge_ai_company-brain.md`.
