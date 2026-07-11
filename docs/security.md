# Headroom security boundary

Headroom keeps the implementation reproducible without exposing operational data.

## Safe to share

- application code
- deterministic mock data
- architecture diagrams
- environment variable names
- generic webhook payload examples

## Keep private

- API keys and access tokens
- `.headroom/snapshots.json`
- account and organization identifiers
- exact live balances and invoices
- production request logs

## Current controls

- `.env*` is ignored except `.env.example`.
- `.headroom/` is ignored.
- `/record/headroom` does not fetch the live dashboard API.
- `/api/ingest` requires `HEADROOM_INGEST_TOKEN`.
- Deployed manual and sync actions require `HEADROOM_ACCESS_TOKEN`.
- Provider requests execute server-side.

## OpenAI warning

The organization usage and costs endpoints use an OpenAI organization admin key. This is a high-privilege credential, not a read-only key. Keep Headroom private, store the key only in server-side environment variables, and rotate it immediately if exposed.

## Before publishing screenshots

Use `/record/headroom`, not the private dashboard. Confirm the image contains no browser extensions, account identifiers, exact live balances, or environment values.
