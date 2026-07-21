# Completeness Review: company-brain

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 111 project files (95 source files), 3 manifest(s), 0 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Functional but incomplete**

This is a substantive but unfinished AI/agent platform application, not just an empty scaffold. Inspection found 95 source files across `frontend/`, `backend/` using Next.js, React, Express; however, the checked-in workflow and delivery controls do not yet demonstrate a complete, production-operable product.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No recognizable project-owned automated tests were found for the main workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Replace generic prompt wrappers with typed domain tools, grounded retrieval, provenance, and schema-validated outputs.
2. Add tenant-scoped connectors, permission-aware indexing, incremental sync, deletion propagation, and source freshness indicators.
3. Implement evaluation datasets, quality/safety gates, cost and latency budgets, tracing, and human approval checkpoints.
4. Run tools in isolated jobs with timeouts, retries, idempotency, rate limits, and auditable input/output records.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Credential/configuration exposure: environment files are present in the repository tree and must be checked against Git history and rotated if real.
- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.
- AI-provider availability, cost, privacy, prompt injection, and unvalidated output are launch risks until bounded and evaluated.

## Evidence inspected

- `frontend/src/App.tsx:23`
- `frontend/src/components/AICenter.tsx:367`
- `backend/server.js`
- `backend/middleware/auth.js`
- `requirements.txt`
- `start.sh`

## Recommended next action

Choose one real AI/agent platform journey, define acceptance criteria and external contracts, then close its persistence, permission, integration, failure, and test gaps before expanding features.

## Implementation progress (2026-07-19)

The source-actionable findings are implemented around one governed journey: an administrator registers a tenant connector by opaque secret-manager reference, grants connector ACLs, queues an incremental sync, preserves source version/freshness and deletion state, quarantines instruction-like content before indexing, runs a retrieval evaluation, and permits a reader to queue a permission-filtered question. A typed answer provider must stay within timeout/cost limits and cite only retrieved source IDs; malformed, unsupported, or ungrounded output fails explicitly. Draft text is hidden from ordinary requesters until a reviewer approves it against immutable versioned evidence snapshots.

- Added replay-safe PostgreSQL migrations for tenants, identities, connectors, role/subject/group ACLs, source documents/chunks, sync deliveries, evaluation cases/runs, queries, source snapshots, reviewer decisions, durable provider jobs, signed webhook receipts, restore drills, and append-only audit events.
- Added RS256 OIDC authorization-code login with state and PKCE, short-lived secure cookies, fail-closed TLS/CORS/secrets configuration, tenant and governed-role checks, scoped source retrieval, persistent hourly query limits, and production security headers.
- Added connector and answer gateway adapters with typed contracts, HTTPS bearer authentication, timeouts, idempotency, retry/backoff/dead-letter state, explicit failure codes, cost and latency budgets, signed replay-safe webhooks, and operator recovery controls. Credentials are never stored; only approved secret-manager references are persisted.
- Added incremental cursor sync, content digests, external version and update timestamps, freshness indicators, live-index deletion propagation, deterministic prompt-injection quarantine, PostgreSQL full-text retrieval, and immutable per-query source snapshots so later source updates/deletions cannot rewrite historical citations.
- Added representative retrieval datasets and recorded recall@5/p95 evaluation gates, invalid-citation and unsupported-claim rejection, hidden drafts, mandatory reviewer approve/reject decisions, non-sensitive JSON tracing, health/schema checks, safe explicit migration/startup commands, a non-root container, CI, environment documentation, and operational/privacy/backup runbooks.
- Replaced the production frontend with role-specific reader, reviewer, admin, and operator workflows. Legacy shared-secret password auth, unscoped data, generic prompt wrappers, mock integrations, sample data, and generated-gap APIs are quarantined unless explicitly enabled in a non-production environment.
- Verification completed locally: all 7 tests passed against a disposable real PostgreSQL database and Express HTTP server; the migration applied repeatedly; cross-tenant and ACL denial, idempotent sync/query replay, evaluation gating, hostile-source quarantine, hidden draft/reviewer release, invalid-citation dead-lettering, signed webhook replay, source deletion propagation, restore evidence, and audit immutability were exercised. The Vite 7.3.6/React 19 production build, backend syntax checks, explicit migrate/check/build commands, shell syntax, both dependency audits (0 vulnerabilities), and `git diff --check` passed.

Remaining launch dependencies are external: provision managed PostgreSQL with encrypted PITR; register the OIDC client and tenant/role/group claims; configure HTTPS/DNS; implement and contract production connector and answer gateways plus secret-manager resolution; approve source access, deletion, retention, employee privacy, reviewer, and incident policies; create and own a representative evaluation dataset; set production cost/latency/freshness SLOs and staffed contacts; rotate any reused local legacy secrets; run an isolated restore drill; and complete independent security/privacy review. No code path claims those systems or approvals are complete.

## Runtime acceptance (2026-07-20)

The non-suite validator passed the complete disposable runtime journey on
PostgreSQL `55633`, API `6080`, and UI `6081` at `2026-07-20T20:45:29Z`:
`API_VERIFIED / startup_login_session_api`. The passing run proved startup,
explicitly provisioned scrypt login, opaque PostgreSQL session
persistence/revalidation, and authenticated API use. The production OIDC path
remains fail-closed; local auth requires the exact non-production bootstrap
acknowledgement. The validator-visible legacy schema is additive rather than
destructive, and the static demo login/hash were removed.
