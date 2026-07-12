# Headroom production v1 architecture

Headroom v1 is being built as a production-grade, self-hosted, single-workspace application. Multi-tenant hosted SaaS features are intentionally deferred until the self-hosted security, persistence, and reliability model is proven.

## Production gates

Headroom is not production-ready until all of these are complete:

- PostgreSQL storage with committed migrations, constraints, indexes, retention, backup, and restore guidance
- authenticated browser sessions and authorization on every private read and mutation
- encrypted provider credentials with versioned rotation metadata
- hashed and revocable webhook tokens
- durable scheduled jobs with leases, idempotency, retry/backoff, and run history
- strict runtime and payload validation, request-size limits, and shared rate limits
- data-confidence and stale/disconnected semantics for every calculation
- redacted structured logs, liveness/readiness checks, and operations diagnostics
- automated route, database, migration, provider-fixture, security, and clean-install tests
- reproducible container and managed PostgreSQL deployment documentation

## Current transition

The v0.3 JSON snapshot file is now behind `SnapshotStore`. The file implementation remains useful for local development, but it is not the production target. PostgreSQL will be introduced as a second adapter and then made mandatory when `NODE_ENV=production`.

Application code must depend on the storage contract rather than importing filesystem or database details. This boundary covers ingestion, provider synchronization, dashboard queries, alerts, tests, and health checks.

## Planned database records

- workspace
- user and session
- provider connection
- encrypted credential envelope
- metric definition
- immutable usage snapshot
- synchronization run
- webhook token
- alert policy and delivery attempt
- audit event

Snapshots and sync runs will carry deterministic idempotency keys enforced by unique database constraints.

## Security model

- Provider credentials remain server-side and encrypted at rest.
- Session cookies are HTTP-only, secure in production, and same-site protected.
- Webhook tokens are stored as hashes and shown only at creation.
- Browser mutations enforce authorization and origin/CSRF checks.
- Public demo and recording routes cannot import production storage or credential modules.
- Logs, error responses, fixtures, analytics, screenshots, and health endpoints must not contain secrets, raw provider bodies, account identifiers, or exact private values.

## Provider contract

Each native provider adapter must declare its capabilities and implement:

- connection validation
- safe synchronization
- normalized metric output
- freshness and minimum polling guidance
- retry classification
- a sanitized operator-facing error

OpenAI is the first production adapter. Manual metrics and the generic webhook remain first-class input paths.

## Job model

A scheduled trigger creates or claims a durable synchronization run. A lease prevents duplicate concurrent execution. Retries use bounded exponential backoff with jitter, and snapshot idempotency prevents duplicate data. The last known good snapshot remains available through transient provider failures.

## Health endpoints

- `GET /api/health/live` verifies the application process can respond.
- `GET /api/health/ready` verifies current storage and production access configuration are usable.

Health responses contain only categorical status and never private data.

## Model policy

- Grok 4.5 Very Fast for routine implementation.
- Sonnet 5 for authentication, cryptography, database migration review, complex failures, and final release QA.
