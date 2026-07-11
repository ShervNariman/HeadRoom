# Provider integrations

Headroom v0.3 supports three deliberately simple input paths.

## 1. Manual provider

Use `/setup` to enter a provider, metric, current usage, and optional limit, spend, or budget. This is the fastest path for services without a usable billing API.

Manual entries are written to the local snapshot file and immediately appear on `/dashboard`.

## 2. Generic webhook

Send any metered service to:

```text
POST /api/ingest
Authorization: Bearer <HEADROOM_INGEST_TOKEN>
Content-Type: application/json
```

Example payload:

```json
{
  "provider": "Replicate",
  "metric": "Predictions",
  "usage": 840,
  "unit": "predictions",
  "limit": 1000,
  "spend": 31.4,
  "budget": 50
}
```

Each event becomes a timestamped snapshot. Sending the same provider and metric over time enables the 1h, 24h, 7d, and runway calculations.

## 3. OpenAI organization sync

Add these variables to `.env.local`:

```text
OPENAI_ADMIN_KEY=
OPENAI_MONTHLY_BUDGET=100
OPENAI_PROJECT_LABEL=My product
```

Then open `/setup` and select **Sync OpenAI now**.

Headroom reads month-to-date completion tokens and organization costs, combines them into one local snapshot, and never sends the admin key to the browser.

> OpenAI organization usage and costs endpoints require an organization admin key. Treat it as highly sensitive and use this integration only in a private, server-side deployment.

## Storage boundary

The starter is local-first and stores snapshots in `.headroom/snapshots.json`. Override this with `HEADROOM_DATA_FILE` when needed.

This file-based store is excellent for a private local dashboard and a reproducible demo. It is not intended for multi-instance serverless deployments. A durable database adapter is the next production step.
