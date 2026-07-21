# Company Brain Runbook

## Release and rollback

1. Run CI against an empty PostgreSQL database; the migration must apply twice and the real HTTP test must pass.
2. Take and verify a managed database backup before applying a reviewed migration.
3. Run `ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate` as a dedicated deployment job.
4. Run `./start.sh check`, deploy the immutable application image, then verify `/api/v2/health` and SSO for every role.
5. Validate one connector sandbox sync, ACL denial, evaluation run, grounded draft, and reviewer decision.

Application rollback is an image replacement. Database rollback is forward-fix or approved point-in-time restore; never run the legacy destructive schema against a governed environment.

## Connector operations

- Connector credentials are resolved by the external connector gateway from `authSecretRef`; Company Brain stores no provider credential value.
- Each sync uses a durable delivery and provider job. `queued` and due `retryable` jobs may be executed by an operator after checking gateway health. Do not manually edit cursor or job rows.
- HTTP 429/5xx/network failures retry with backoff; terminal contracts become `dead-letter`. Connector state and error code remain visible.
- Signed webhook delivery IDs are replay-safe. Treat a duplicate response as successful acknowledgement.
- Deleted source IDs are removed from the live index. Existing query evidence remains as an immutable snapshot and must follow the approved retention policy.
- Documents matching deterministic instruction/secret-exfiltration patterns remain visible as `QUARANTINED` but are never indexed. Investigate the source; do not bypass flags directly in SQL.

Alert on connector error state, oldest due job age, repeated dead letters, sync freshness beyond the source SLA, abnormal deletion volume, and quarantined-document volume.

## Answer quality and safety

Source text is untrusted data, not instructions. The answer gateway receives a typed object and must return `grounded-answer-v1`. Company Brain rejects unknown citations, unsupported claims, malformed output, and cost overruns.

- A passing current retrieval evaluation is required before a new question is accepted.
- Draft answer text is hidden from ordinary requesters until a reviewer approves it.
- Reviewers compare every material claim with displayed versioned excerpts and freshness timestamps. Reject answers with stale, ambiguous, or insufficient evidence.
- Provider errors never become fallback prose. Dead-letter jobs leave the query failed with an explicit code.
- Cost, model, confidence, latency, citations, evaluation score, and decisions are persisted and audited.

Pause answer generation if evaluation recall falls below the configured threshold, latency/cost exceeds budgets, invalid citations rise, source ACLs are disputed, or a prompt-injection incident is suspected.

## Privacy or access incident

1. Disable the affected IdP assignment and connector in the source/gateway; rotate provider, OIDC, and webhook secrets as applicable.
2. Preserve audit events, job metadata, and infrastructure logs. Never add source bodies, answers, tokens, or credentials to request logs.
3. Determine tenant, subject/group, connector, source version, query, citations, and downstream provider scope.
4. Follow legal, privacy, employee-notification, retention, and evidence-preservation policy.
5. Re-run ACL isolation, deletion propagation, evaluation, and reviewer-release tests before reopening.

## Backup and restore

Use encrypted managed PostgreSQL backups and point-in-time recovery. Restore drills run in an isolated account/network without production provider credentials. Validate schema checks, tenant counts, ACL joins, deleted-source exclusion, query evidence snapshots, approval records, and audit sequence continuity. Record the backup reference and evidence URI through the operator workspace; that record supplements rather than replaces the managed backup logs.

## External launch blockers

Provision managed PostgreSQL/PITR and encryption keys; register the OIDC client and tenant/role/group claims; configure HTTPS and DNS; implement and contract the connector and answer gateways; configure secret-manager resolution; approve source access, deletion, retention, employee privacy, and reviewer policies; create a representative evaluation dataset and quality owner; establish cost/latency/freshness SLOs and staffed incident contacts; rotate any reused local legacy secrets; run an isolated restore drill; and complete independent security/privacy review.
