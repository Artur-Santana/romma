---
quick_id: 260611-fxt
slug: fix-e2e-seed-add-proprietario-id-to-edif
date: 2026-06-11
status: complete
files_changed:
  - e2e/seed.mjs
---

# Summary

Adicionado `proprietario_id: proprietario.id` nos dois inserts do seed E2E que violavam o NOT NULL introduzido pela Phase 11.

## Changes

| File | Change |
|------|--------|
| `e2e/seed.mjs` | +2 linhas: `proprietario_id: proprietario.id` em `edificios` insert (linha 36) e `locatarios` insert (linha 92) |

## Root Cause

Phase 11 aplicou `ALTER COLUMN proprietario_id SET NOT NULL` em `edificios` e `locatarios`. O seed de E2E inservia nessas tabelas via `supabaseAdmin` (que bypassa RLS) sem passar o campo — violação de constraint.
