# Headroom agent brief

Headroom is a marketing-first private MVP with a real product wedge: identify which metered provider will become a constraint next.

Before editing:

1. Preserve the public-code/private-data boundary.
2. Keep `/record/headroom` deterministic and credential-free.
3. Prefer a small number of useful, screenshot-ready states over feature breadth.
4. Do not add a dependency unless it materially improves the core dashboard.
5. Make runway and status logic explainable from visible inputs.

Primary routes:

- `/dashboard`
- `/record/headroom?scenario=normal|spike|critical`
- `/guide`
