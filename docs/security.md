# Headroom security boundary

Headroom is intended to keep the implementation reproducible without exposing operational data.

## Safe to share

- application code
- deterministic mock data
- architecture diagrams
- environment variable names
- high-level provider setup instructions

## Keep private

- API keys and access tokens
- account and organization identifiers
- exact live balances and invoices
- production request logs
- customer or project usage data

## Required controls

- Use read-only or least-privilege credentials whenever available.
- Execute provider requests server-side.
- Keep `.env*` files ignored except `.env.example`.
- Ensure `/record/headroom` cannot import or query live provider integrations.
- Redact secrets and private values from errors and logs.
- Review screenshots before publishing.
