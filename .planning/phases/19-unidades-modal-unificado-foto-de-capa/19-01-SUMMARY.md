---
phase: 19-unidades-modal-unificado-foto-de-capa
plan: "01"
subsystem: unidades-actions
tags: [server-actions, storage, foto_url, crud]
dependency_graph:
  requires: []
  provides: [criarUnidade-returns-id, editarUnidade-foto_url, deletarUnidade-storage-cleanup, getUnidades-foto_url]
  affects: [src/actions/unidades.js, src/lib/queries-client.js]
tech_stack:
  added: []
  patterns: [supabaseAdmin-storage-best-effort-cleanup, select-id-single-return, patch-conditional-field]
key_files:
  modified:
    - src/actions/unidades.js
    - src/lib/queries-client.js
decisions:
  - "criarUnidade chains .select('id').single() and returns { status: 200, id: data.id } so browser can build the {unidade_id}/{uuid}.ext Storage path per D-08"
  - "editarUnidade patches foto_url only when foto_url !== undefined to allow partial patch calls (e.g. foto-only update in step 3 of create flow)"
  - "deletarUnidade cleanup guards on !startsWith('/') to skip /public static assets per D-09"
  - "cleanup uses .catch(() => {}) so a Storage error never blocks the DB delete (best-effort per D-11)"
metrics:
  duration: "~8 minutes"
  completed: "2026-06-14"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 19 Plan 01: Unidades Server-Action & Query Layer — foto_url Support Summary

Extend `criarUnidade`/`editarUnidade`/`deletarUnidade` and `getUnidades` with `foto_url` support: `criarUnidade` returns the created row `id` for browser upload-path construction; `editarUnidade` conditionally patches `foto_url`; `deletarUnidade` performs best-effort Storage cleanup before the DB delete; `getUnidades` SELECT now includes `foto_url`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend criarUnidade (return id) and editarUnidade (persist foto_url) | 04e86cc | src/actions/unidades.js |
| 2 | Best-effort Storage cleanup in deletarUnidade + foto_url to getUnidades SELECT | 21d14b7 | src/actions/unidades.js, src/lib/queries-client.js |

## Changes Made

### `src/actions/unidades.js`

**`criarUnidade`:**
- Destructures `foto_url` from `form` (was missing)
- Insert now includes `foto_url: foto_url ?? null`
- `.insert({...}).select('id').single()` to retrieve the created row id
- Returns `{ status: 200, id: data.id }` instead of `{ status: 200 }`
- All existing validations (nome, edificio_id UUID, area_m2, valor_mensal, status, edificio ownership) unchanged

**`editarUnidade`:**
- Destructures `foto_url` from `form`
- `if (foto_url !== undefined) patch.foto_url = foto_url` added to patch object
- Ownership chain (unidade→edificio.proprietario_id === user.id) unchanged

**`deletarUnidade`:**
- Select changed from `'edificio_id'` to `'edificio_id, foto_url'`
- Before the DB delete: if `unidade.foto_url` is truthy and does not start with `'/'`, calls `supabaseAdmin.storage.from('unidades-fotos').remove([unidade.foto_url]).catch(() => {})` — best-effort, non-blocking
- DB delete runs regardless of Storage cleanup outcome
- Return shapes `{ status: 200 }` / `{ status: 500, erroMessage }` unchanged

### `src/lib/queries-client.js`

**`getUnidades`:**
- `foto_url` appended to SELECT column string

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all changes are functional data layer modifications; no placeholder values introduced.

## Threat Flags

No new threat surface introduced. All three mutations retain the existing `authGuard()` + `edificio.proprietario_id === user.id` ownership chain. `foto_url` is stored as a verbatim path string with no server-side path interpolation into queries (T-19-03 mitigated).

## Self-Check: PASSED

- [x] `src/actions/unidades.js` exists and contains `.select('id').single()`, `return { status: 200, id: data.id }`, `patch.foto_url = foto_url`, `select('edificio_id, foto_url')`, storage cleanup block
- [x] `src/lib/queries-client.js` contains `foto_url` in getUnidades SELECT
- [x] Commit `04e86cc` exists (Task 1)
- [x] Commit `21d14b7` exists (Task 2)
- [x] ESLint clean on both files
- [x] Both grep gates from plan `<automated>` blocks passed
