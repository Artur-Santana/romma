---
phase: 14-anima-es-feedback
plan: "01"
subsystem: contratos
tags: [animation, toast, optimistic-update, ux]
dependency_graph:
  requires: ["14-00"]
  provides: ["ANIM-01 (Contratos)", "ANIM-03 (Contratos)"]
  affects: ["src/components/features/Contratos.js"]
tech_stack:
  added: []
  patterns:
    - "removingIds Set state for exit animation tracking"
    - "Optimistic filter (setContratos prev.filter) — UPDATE variant, never re-fetch contratos"
    - "setTimeout(200) for animation-then-remove sequencing"
    - "toast.success() from sonner after status === 200"
key_files:
  created: []
  modified:
    - src/components/features/Contratos.js
decisions:
  - "OPTIMISTIC FILTER variant chosen: cancelarContrato/encerrarContrato use .update() so getContratos() returns all statuses; re-fetching would resurrect the item. Only setContratos(prev.filter(...)) is called; unidades are re-fetched."
  - "contratosAtivos derived array added for D-07; ativos/encerrados count vars preserved untouched (they feed the subtitle)"
  - "Empty-state guard changed from contratos.length to contratosAtivos.length (Rule 1 fix)"
metrics:
  duration: "~12 minutes"
  completed: "2026-06-12"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 1
---

# Phase 14 Plan 01: Exit Animation + Toasts + Optimistic Filter (Contratos) Summary

**One-liner:** removingIds fade-out (200ms) + sonner toasts + ativo-only listing via optimistic filter in Contratos.js

## What Was Built

Contratos.js received the full ANIM-01 + ANIM-03 treatment for the UPDATE variant:

- **removingIds Set state:** tracks which contrato IDs are fading out; immutable Set mutations via spread.
- **confirmarCancelamento / confirmarEncerramento:** set removingIds before await, rollback on error, fire toast immediately on success, then after 200ms optimistically filter the contrato out of state and re-fetch unidades only (never getContratos).
- **handleCriarContrato:** fires `toast.success("Contrato criado")` inside the status === 200 branch.
- **Row style merge:** isRemoving derived in map; opacity/transform/transition merged into existing COL_STYLE object.
- **D-07:** contratosAtivos derived array drives both the map and the empty-state guard; encerrado/cancelado contratos excluded from main listing on reload.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed empty-state guard to use contratosAtivos**
- **Found during:** Task 2
- **Issue:** Line 308 guard `contratos.length === 0` would never trigger "Nenhum contrato cadastrado" when only encerrado/cancelado contratos exist in state (since map now renders only ativos)
- **Fix:** Changed guard to `contratosAtivos.length === 0` — consistent with the map target
- **Files modified:** src/components/features/Contratos.js
- **Commit:** 0fd3a12

## Known Stubs

None. All wired changes are functional.

## Threat Flags

None. No new trust boundaries, endpoints, or auth paths introduced.

## Self-Check

- [x] src/components/features/Contratos.js exists and modified
- [x] Commit 225ec08 exists (Task 1)
- [x] Commit 0fd3a12 exists (Task 2)
- [x] grep asserts: sonner import, removingIds, 3 toast strings, filter(c=>, isRemoving, scale(0.97), opacity 200ms, ativo filter — all passed
- [x] npm run build exited 0 after both tasks

## Self-Check: PASSED
