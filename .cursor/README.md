# Headroom Cursor workspace

Open `headroom.code-workspace` from this repository root.

This is intentionally a single-product, single-root workspace. All Headroom application code, tests, documentation, and release preparation belong in this repository. Do not add EdgeLens, XProductInsights, sherv-website, or another sibling repository to the workspace.

Private files are excluded from Cursor context through `.cursorignore`, including environment files, local snapshots, credentials, logs, and private screenshots.

Before a change is considered complete, run:

```bash
pnpm audit:public
pnpm lint
pnpm build
```

Use Grok 4.5 Very Fast for normal tasks. Use Sonnet 5 only for difficult security or architecture work, unresolved defects, or final release QA.
