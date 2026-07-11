# Headroom architecture

Headroom is designed as public code with private operational data.

## Current v0.3 flow

```text
Manual form / generic webhook / OpenAI organization API
                         ↓
              validated snapshots
                         ↓
        .headroom/snapshots.json
                         ↓
        1h / 24h / 7d comparisons
                         ↓
      runway + next-constraint signal
                         ↓
             private dashboard
```

## Why local-first

A user can clone the repo, run one command, and add a provider without creating a database, OAuth application, or billing account. That keeps the tutorial useful and the security boundary understandable.

## Normalized snapshot

Every integration preserves the provider's native metric while exposing a consistent shape:

- provider and optional project
- metric name and native unit
- current usage
- optional usage limit
- optional monetary spend and budget
- captured timestamp
- source: manual, webhook, or OpenAI

## Public and private boundary

- `/dashboard` reads local private snapshots when available.
- `/record/headroom` always displays deterministic mock data.
- `/setup` contains the three simple integration paths.
- `/guide` explains the architecture without exposing private configuration.
- Provider credentials remain server-side.

## Deployment boundary

The file store is intentionally single-user and local-first. A production cloud deployment should replace `lib/store.ts` with a durable database adapter and protect the private routes with authentication.
