---
phase: 20-edif-cios-cards-drill-in
plan: "01"
subsystem: ui
tags: [modal, e2e, lockEdificio, scaffold, tdd-wave0]
dependency_graph:
  requires: []
  provides: [lockEdificio-prop, edificios-e2e-scaffold]
  affects: [src/components/ui/UnifiedUnidadeModal.js, e2e/crud-edificios.spec.js]
tech_stack:
  added: []
  patterns: [prop-extension, wave0-red-scaffold, disabled-select-filter]
key_files:
  modified:
    - src/components/ui/UnifiedUnidadeModal.js
    - e2e/crud-edificios.spec.js
decisions:
  - lockEdificio defaults to false to preserve Unidades.js call-site without changes
  - FSelect options filtered to current edificio_id when lockEdificio=true (Pitfall 3 avoidance)
  - E2E tests authored as RED scaffold — will pass after Plan 02 implements GestaoEdificios cards
  - onChange guarded with !lockEdificio (not just disabled HTML attr) for defense-in-depth
metrics:
  duration: "~10 min"
  completed: "2026-06-15T14:07:41Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 20 Plan 01: lockEdificio Prop & E2E Wave 0 Scaffold Summary

**One-liner:** UnifiedUnidadeModal extended with `lockEdificio=false` prop that disables and filters the FSelect; E2E Wave 0 scaffold adds 6 RED tests for EDIF-01..03 card/stats/accordion/drill-in assertions.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Adicionar prop lockEdificio ao UnifiedUnidadeModal | `9964744` | `src/components/ui/UnifiedUnidadeModal.js` |
| 2 | Estender e2e/crud-edificios.spec.js com asserções Phase 20 | `1788b23` | `e2e/crud-edificios.spec.js` |

---

## What Was Built

### Task 1 — lockEdificio prop

Extended `UnifiedUnidadeModal` with a minimal API surface:

- **Component signature:** `{ mode, initial, edificios, onClose, onSaved, lockEdificio = false }` — default `false` preserves all existing call-sites.
- **FSelect primitive:** Added `disabled` prop forwarded to `<select>` element. Visual cues: `opacity: 0.5` and `cursor: default` when disabled (vs `opacity: 1` / `cursor: pointer` when enabled).
- **Edifício field:** Passes `disabled={lockEdificio}` to FSelect. When `lockEdificio=true`: options filtered via `edificios.filter(ed => ed.id === form.edificio_id)` (shows only the current building). `onChange` guarded with `!lockEdificio` before calling `setForm`.
- **Call-site safety:** `Unidades.js` not modified — `lockEdificio` defaults to `false`, behavior is identical.

### Task 2 — E2E Wave 0 scaffold (RED until Plan 02)

Added 6 new test cases to `e2e/crud-edificios.spec.js` across 3 new `test.describe` blocks:

| Block | Tests | Assertions |
|-------|-------|------------|
| EDIF-01 card grid & stats | 2 | Stats labels Unidades/Ocupação/MRR/Área total visible per card |
| EDIF-02 barra de ocupação | 1 | Legend regex `/\d+ alugada.* · \d+ dispon/` visible |
| EDIF-03 accordion + drill-in + lockEdificio | 3 | Ver N unidade(s) button; accordion expand/collapse; drill-in opens modal; select disabled |

All 3 original CRUD tests (criar/editar/deletar edifício) preserved unchanged.

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Verification Results

| Check | Result |
|-------|--------|
| `node -e "lockEdificio checks"` | PASS |
| `npx eslint src/components/ui/UnifiedUnidadeModal.js` | 0 errors (2 pre-existing warnings) |
| Unidades.js call-site unchanged | Confirmed — no `lockEdificio` reference |
| E2E spec parse (9 tests discoverable) | PASS — 3 CRUD + 6 new scaffold tests |
| New tests keywords (Ver/ocupa/drill/lockEdificio/stats/accordion) | 34 matching lines |

---

## Known Stubs

None. The 6 E2E tests are intentionally RED until Plan 02 implements the GestaoEdificios card UI — this is Wave 0 / Nyquist compliance by design, not a stub.

---

## Threat Flags

None. `lockEdificio` is UI-only; the Server Action `editarUnidade` already validates `proprietario_id` ownership chain (Phase 15/19). No new attack surface introduced (T-20-01 confirmed accepted).

---

## Self-Check: PASSED

- [x] `src/components/ui/UnifiedUnidadeModal.js` modified with lockEdificio prop
- [x] `e2e/crud-edificios.spec.js` extended with 6 new E2E assertions
- [x] Commit `9964744` exists (Task 1)
- [x] Commit `1788b23` exists (Task 2)
