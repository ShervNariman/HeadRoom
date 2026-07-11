# Headroom

**Know what your product will run out of next.**

Headroom is a private dashboard for monitoring API usage, remaining spend, limits, short-term velocity, and estimated runway across the services powering a modern SaaS or AI product.

The code can be shared publicly. Provider credentials, exact account usage, and the live deployment remain private.

## The narrow problem

Every usage-based provider has its own console. Small teams can usually see individual totals, but not one clear answer to:

> Which provider is becoming a constraint, how quickly is it changing, and what should we do next?

Headroom is built around that question—not generic invoice reporting.

## What the dashboard shows

| Provider | Usage | Spend remaining | Limit | Stack share | 1h | 24h | 7d | Runway | Status |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| OpenAI | 8.2M tokens | $58 | $100 budget | 46% | +12% | +31% | +8% | 14 days | Elevated |
| Resend | 2,760 emails | 240 emails | 3,000/month | 12% | +87% | +48% | +22% | 19 hours | Critical |

The main Headroom signal combines visible inputs into a plain-language warning and recommended action.

## Current MVP

- Next.js, TypeScript, and Tailwind
- Deterministic normal, spike, and near-limit scenarios
- KPI summary cards
- Provider usage and runway table
- Explainable next-constraint alert
- `/record/headroom` screenshot route
- `/guide` high-level build blueprint
- Public-code/private-data security boundary
- Repo-specific Cursor workspace and rules

## Local setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open:

- `http://localhost:3000/dashboard`
- `http://localhost:3000/record/headroom?scenario=critical`
- `http://localhost:3000/guide`

Demo mode requires no provider credentials.

## Build your own

1. Fetch usage and limit data server-side using read-only credentials.
2. Normalize every provider into timestamped snapshots.
3. Compare matching metrics across 1h, 24h, and 7d windows.
4. Estimate time to budget or quota exhaustion.
5. Keep the recording route deterministic and disconnected from live data.

See [docs/architecture.md](docs/architecture.md) and [docs/security.md](docs/security.md).

## Product boundary

Headroom is a read-only monitor. The MVP does not proxy production traffic, modify provider plans, or automatically switch providers.
