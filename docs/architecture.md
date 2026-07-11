# Headroom architecture

Headroom is designed as public code with private operational data.

## Core flow

```text
Read-only provider APIs
        ↓
Provider adapters
        ↓
Normalized timestamped snapshots
        ↓
1h / 24h / 7d comparisons
        ↓
Runway and next-constraint logic
        ↓
Private dashboard + deterministic public demo
```

## Normalized snapshot

Every adapter should preserve the provider's native metric while exposing a consistent shape:

- provider and project
- metric key and native unit
- current usage
- monetary spend when available
- allowance or configured budget
- reset time
- captured timestamp
- source freshness and confidence

## Public and private boundary

- `/dashboard` can eventually display authenticated live data.
- `/record/headroom` always displays deterministic mock data.
- `/guide` explains the architecture without exposing private configuration.
- Provider credentials are used server-side only.

## MVP boundary

The MVP is a read-only monitor. It does not proxy production traffic, alter plans, rotate keys, or automatically switch providers.
