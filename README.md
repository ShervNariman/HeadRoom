# Headroom

**Know what your product will run out of next.**

Headroom is a private, local-first dashboard for monitoring usage, spend, limits, velocity, and estimated runway across the services powering a modern product.

It is designed to be useful in minutes and understandable enough to copy.

## Fastest setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000/setup` and choose one path:

1. **Connect OpenAI** — sync organization token usage and costs.
2. **Send a webhook** — post usage from any metered service.
3. **Add manually** — enter one provider without an API.

You only need one provider to start.

## What the dashboard answers

- Which provider is doing the most financial heavy lifting?
- What changed over 1 hour, 24 hours, and 7 days?
- Which configured limit is closest?
- How much runway remains at the current pace?
- What action should be taken next?

## Current integrations

| Path | Status | Best for |
|---|---|---|
| Manual provider form | Working | Any service without an accessible usage API |
| Generic JSON webhook | Working | Cron jobs, scripts, automations, and unsupported providers |
| OpenAI organization sync | Working | Month-to-date completion tokens and organization costs |

See [docs/provider-integrations.md](docs/provider-integrations.md) for payloads and credential notes.

## Important routes

- `/setup` — friendly three-path onboarding
- `/dashboard` — private local data, with demo fallback
- `/record/headroom?scenario=critical` — deterministic X capture route
- `/guide` — high-level copyable blueprint

## Private data boundary

- `.headroom/snapshots.json` is ignored by Git.
- `.env.local` is ignored by Git.
- The recording route never reads live data.
- The OpenAI key stays server-side.
- The webhook requires `HEADROOM_INGEST_TOKEN`.
- Deployed private actions require `HEADROOM_ACCESS_TOKEN`.

## Product boundary

Headroom v0.3 is a single-user, local-first monitor. It does not proxy production traffic, alter provider plans, or automatically switch providers. A durable database and full authentication are intentionally outside this marketing MVP.
