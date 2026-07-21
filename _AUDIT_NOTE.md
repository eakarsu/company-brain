# Audit Note — company-brain

**Date:** 2026-05-07
**Bucket:** A. WORKING_PRODUCT (extended)
**Stack:** node-express + react/vite, Postgres (`company_brain_db`), JWT
**Run:** historical demo run; embedded demo credentials have since been removed

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
JS); backend up on port 3005; the then-current legacy demo login returned a
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
Backend on port 3005 with the then-current legacy demo login →
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

## Apply pass 7 (full backlog implementation)

**Date:** 2026-05-21
**Source audit:** `_AUDIT/reports/batch_extras.md` § 6 (company-brain).

Cross-checked the original audit's gap + custom-feature list against what
prior passes shipped. The backend routes and frontend pages for all
`gap-ai-*`, `gap-nonai-*`, and `cf-*` items had been **scaffolded but
left orphaned** — `server.js` mounted the routes, but `App.tsx` never
routed the pages and `Layout.tsx` never linked them, so they were
unreachable from the UI. Pass 7 wires them in and lands the missing
schema entry.

### Items addressed (16 features now reachable)

Gap AI (5):
- `/gap/skill-file-generator`    → POST `/api/gap-ai-skill-file-generator`
- `/gap/knowledge-refresh-agent` → POST `/api/gap-ai-knowledge-refresh-agent`
- `/gap/query-route-to-source`   → POST `/api/gap-ai-query-route-to-source`
- `/gap/contradiction-detector`  → POST `/api/gap-ai-contradiction-detector`
- `/gap/onboarding-curriculum`   → POST `/api/gap-ai-onboarding-curriculum`

Gap Infra / Non-AI (6):
- `/gap/connectors`          → `/api/gap-nonai-connectors`
- `/gap/embeddings-store`    → `/api/gap-nonai-embeddings-store`
- `/gap/versioning`          → `/api/gap-nonai-versioning`
- `/gap/dept-access-control` → `/api/gap-nonai-dept-access-control`
- `/gap/webhook-ingest`      → `/api/gap-nonai-webhook-ingest`
- `/gap/scim-sso`            → `/api/gap-nonai-scim-sso`

Custom Features / cf (5):
- `/cf/skills-json`         → `/api/cf-skills-json`
- `/cf/staleness-pr`        → `/api/cf-staleness-pr`
- `/cf/multi-llm-voting`    → `/api/cf-multi-llm-voting`
- `/cf/dept-graphs`         → `/api/cf-dept-graphs`
- `/cf/meeting-transcripts` → `/api/cf-meeting-transcripts`

### Schema
- Added `gap_features` table (id, feature_slug, user_id, input JSONB,
  output, created_at) to `backend/db/schema.sql` using
  `CREATE TABLE IF NOT EXISTS` + two `CREATE INDEX IF NOT EXISTS`
  (slug, created_at). Matches the runtime `ensureTable()` definition in
  every `gap-*` / `cf-*` route, so fresh installs no longer rely on a
  lazy first-request DDL. Non-destructive — safe to apply on top of the
  existing destructive schema.

### Frontend
- `frontend/src/App.tsx`: added 16 imports + 16 `<Route>` entries under
  `/gap/*` and `/cf/*`. No existing routes modified.
- `frontend/src/components/Layout.tsx`: extended the lucide-react import
  with 14 new icons (verified all exist in installed lucide-react). Added
  three new sidebar sections — **Gap AI** (5 links), **Gap Infra** (6
  links), **Custom Features** (5 links) — placed above the existing
  Utilities section. Existing nav untouched.

### Skipped per task rules
- SCIM/SSO ingestion **persistence** scaffolds shipped (table + page);
  the *real* SCIM provider wiring would be NEEDS-CREDS / TOO-RISKY.
- Real Slack/Notion/email connectors — same constraint; the connectors
  page exposes the in-DB registry only.

### Constraints honored
- No new dependencies (no `npm install`).
- No breaking changes to existing routes, pages, schema rows, or auth.
- Backend routes were already mounted before the 500 error handler (no
  404 handler in this app — only error middleware at the tail); ordering
  preserved.
- All new code follows the existing project style (lucide-icon nav
  groups, `apiFetch`-style fetch with bearer token, parameterized SQL).

### Smoke-test
- `node --check backend/server.js` → OK (no backend JS modified, but
  re-checked to be safe).
- `node --check` on every `routes/gap-*.js` + `routes/cf-*.js` → all
  clean (16 files).
- `npx vite build` → clean, **1518 modules** (was 1487 — the 16 new
  reachable pages added 31 modules), 413 kB JS / 96 kB gzip.
- Pre-existing TS6133 noise in `CodexCustomVizFeature.tsx` /
  `TimelineView.tsx` is unchanged (untracked files from a prior pass —
  not touched here).
- `dist/` removed after build.
