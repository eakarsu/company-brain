# Company Brain — Governed Knowledge Answers

Company Brain provides permission-aware answers over synchronized company sources. Its production workflow is intentionally bounded: an admin registers a connector by secret-manager reference, incremental sync persists source versions and deletions, retrieval is filtered by connector ACL, a passing evaluation gates answer generation, a typed answer provider must cite the retrieved source IDs, and a reviewer approves or rejects the draft before the requester can see it.

## Production properties

- PostgreSQL tenant isolation for identities, connectors, ACLs, source documents, chunks, evaluations, queries, approvals, durable provider jobs, restore drills, and append-only audit events
- RS256 OIDC authorization-code login with state, PKCE, short-lived cookies, and governed roles (`reader`, `editor`, `reviewer`, `admin`, `operator`)
- Incremental connector cursors, content digests, source versions, source/sync timestamps, deletion propagation, and replay-safe signed webhooks
- Deterministic prompt-injection pattern quarantine before indexing
- PostgreSQL full-text retrieval constrained by role, subject, or group ACL
- Immutable per-query evidence snapshots so future source changes do not rewrite prior citations
- Typed `grounded-answer-v1` provider contract with citation allowlist, unsupported-claim rejection, cost budget, timeout, idempotency, retries, and dead letters
- Retrieval evaluation gates and mandatory human approval before answer release

Legacy password authentication, unscoped tables, generic prompts, mock routes, and generated gap pages remain only for historical comparison. They are not mounted unless `ENABLE_LEGACY_DEMOS=1` in a non-production environment.

## Verify locally

Requirements: Node 20.19+ and PostgreSQL 16+.

```bash
npm --prefix backend ci
npm --prefix frontend ci
createdb company_brain_test
TEST_DATABASE_URL=postgres:///company_brain_test npm --prefix backend test
npm --prefix frontend run build
npm --prefix backend audit --audit-level=moderate
npm --prefix frontend audit --audit-level=moderate
```

The integration test truncates governed tables in the exact database named by `TEST_DATABASE_URL`; never point it at shared or production data.

## Deploy

Copy `.env.example` into the deployment configuration and secret manager. Do not reuse the legacy local `.env` values. Only public RS256 verification material belongs in application configuration; OIDC, webhook, connector gateway, and answer gateway secrets must be injected at runtime.

```bash
ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate
./start.sh check
./start.sh build
./start.sh start
```

Startup never creates a database, seeds data, runs a migration, installs dependencies, kills processes, or starts a development watcher. See [RUNBOOK.md](RUNBOOK.md) for sync recovery, answer incidents, backup/restore, and rollout controls.
