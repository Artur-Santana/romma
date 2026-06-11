---
quick_id: 260611-fxt
slug: fix-e2e-seed-add-proprietario-id-to-edif
date: 2026-06-11
description: "fix e2e seed: add proprietario_id to edificios and locatarios inserts"
files_modified:
  - e2e/seed.mjs
---

# Fix E2E Seed — proprietario_id NOT NULL violation

## Context

Phase 11 added `proprietario_id NOT NULL` to `edificios` and `locatarios`. The E2E seed (`e2e/seed.mjs`) was not updated — CI fails with:

```
null value in column "proprietario_id" of relation "edificios" violates not-null constraint
```

## Task

In `e2e/seed.mjs`:

1. Line 36 — `edificios` insert: add `proprietario_id: proprietario.id`
2. Lines 89–97 — `locatarios` insert: add `proprietario_id: proprietario.id`

`proprietario` (the auth user object) is already available from line 24.

## Acceptance Criteria

- `e2e/seed.mjs` edificios insert contains `proprietario_id: proprietario.id`
- `e2e/seed.mjs` locatarios insert contains `proprietario_id: proprietario.id`
- `grep -c "proprietario_id: proprietario.id" e2e/seed.mjs` returns 2
