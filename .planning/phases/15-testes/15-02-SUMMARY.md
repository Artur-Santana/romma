---
phase: 15-testes
plan: "02"
subsystem: actions
tags: [security, idor, multi-tenant, server-actions]
dependency_graph:
  requires: ["15-01"]
  provides: ["15-03", "15-04"]
  affects: ["src/actions/unidades.js", "src/actions/contratos.js"]
tech_stack:
  added: []
  patterns: ["ownership pre-check via fetch-then-verify", "authGuard returning user identity"]
key_files:
  modified:
    - src/actions/unidades.js
    - src/actions/contratos.js
decisions:
  - "authGuard returns { user } on success — minimal diff, no structural change to 401/403 branches"
  - "ownership verified via fetch-then-check (fetch unidade.edificio_id, then edificios filtered by proprietario_id = user.id) — same pattern as revogarConvite in locatarios.js (Phase 11)"
  - "contratos ownership uses 3-hop chain: contrato.unidade_id → unidade.edificio_id → edificios.proprietario_id — no proprietario_id column on contratos or unidades tables"
  - "criarContrato and editarContrato adopt { err, user } destructure only — no new ownership logic (not in D-06 scope)"
  - "returns 404 (not 403) when cross-tenant attempt detected — same convention as revogarConvite"
metrics:
  duration: "~15 minutes"
  completed: "2026-06-12"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 15 Plan 02: IDOR Fix — authGuard + Ownership Scoping Summary

**One-liner:** Closed cross-tenant write IDOR in four Server Actions by making authGuard return `{ user }` and adding fetch-then-verify ownership chains before editar/deletar unidade and cancelar/encerrar contrato.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Scope editarUnidade/deletarUnidade by owner (via edificio_id) | db637de | src/actions/unidades.js |
| 2 | Scope cancelarContrato/encerrarContrato by owner (via unidade → edificio) | b72e904 | src/actions/contratos.js |

---

## What Was Built

### Task 1 — unidades.js

`authGuard()` previously returned `{}` on the success path, discarding the authenticated user identity. All call sites used `const { err } = await authGuard()`, leaving no user reference available in the Action body. Because `supabaseAdmin` bypasses RLS, any authenticated Proprietário could call `editarUnidade` or `deletarUnidade` with an arbitrary row id and mutate rows they do not own.

Fix:
- `authGuard()` now returns `{ user }` on success
- `editarUnidade` and `deletarUnidade` destructure `const { err, user } = await authGuard()`
- After UUID validation, both Actions now execute a two-step ownership pre-check:
  1. `supabaseAdmin.from('unidades').select('edificio_id').eq('id', id).single()` — retrieve the edificio_id
  2. `supabaseAdmin.from('edificios').select('id').eq('id', edificio_id).eq('proprietario_id', user.id).single()` — verify the edificio belongs to the caller
- If either step errors or returns no row, return `{ status: 404, erroMessage: 'Unidade não encontrada.' }` before any update/delete
- `criarUnidade` adopts `{ err, user }` destructure for consistency but no new logic

### Task 2 — contratos.js

Same authGuard fix applied. For `cancelarContrato` and `encerrarContrato`, the existing fetch of `contrato.unidade_id` is extended with two additional ownership steps:
1. Fetch `unidades.edificio_id` via `unidade_id`
2. Verify `edificios.proprietario_id = user.id`

If any step fails → `{ status: 404, erroMessage: 'Contrato não encontrado.' }` before any mutation (status update, unidade reset to 'disponivel', or parcelas delete).

`criarContrato` and `editarContrato` adopt `{ err, user }` destructure only — no new ownership logic per D-06 scope boundary.

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: T-15-01 closed | src/actions/unidades.js | Elevation of privilege (IDOR) in editarUnidade/deletarUnidade — mitigated by ownership pre-check |
| threat_flag: T-15-01 closed | src/actions/contratos.js | Elevation of privilege (IDOR) in cancelarContrato/encerrarContrato — mitigated by 3-hop ownership chain |

---

## Known Stubs

None.

---

## Self-Check: PASSED

- [x] src/actions/unidades.js — modified, committed db637de
- [x] src/actions/contratos.js — modified, committed b72e904
- [x] authGuard returns `{ user }` in both files
- [x] proprietario_id filter present in both files (editarUnidade, deletarUnidade, cancelarContrato, encerrarContrato)
- [x] `const { err, user } = await authGuard()` at all call sites in both files
- [x] ESLint clean on both files
- [x] `npx playwright test --list` exits without errors (no syntax break)
- [x] {status, erroMessage} contract preserved throughout
