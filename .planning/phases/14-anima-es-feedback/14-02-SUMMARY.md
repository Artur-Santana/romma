---
phase: 14-anima-es-feedback
plan: "02"
subsystem: features/Unidades + features/Parcelas
tags: [animation, toast, ux-feedback, sonner]
dependency_graph:
  requires: ["14-00"]
  provides: [ANIM-02, ANIM-03]
  affects: ["src/components/features/Unidades.js", "src/components/features/Parcelas.js"]
tech_stack:
  added: []
  patterns: ["removingIds Set for exit animation", "re-fetch-after-timeout", "sonner toast.success"]
key_files:
  created: []
  modified:
    - src/components/features/Unidades.js
    - src/components/features/Parcelas.js
decisions:
  - "RE-FETCH-AFTER-TIMEOUT variant used for Unidades (delete removes row, safe to re-fetch)"
  - "Wrapper div owns key + inline animation style; UnidadeCard untouched (opaque component)"
  - "Parcelas: toast-only (D-04), no exit animation, no removingIds"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-12"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 2
---

# Phase 14 Plan 02: Unidades Exit Animation + Toasts Summary

Exit animation (opacity + scale ~200ms) on Unidades delete using removingIds Set + re-fetch-after-timeout; sonner toast "Unidade removida"; Parcelas gets toast "Parcela marcada como paga" with no animation.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Exit animation + toast in Unidades (wrapper div, re-fetch variant) | 461a1ff |
| 2 | Toast on marcarComoPaga in Parcelas (no animation) | 58b8d4d |

## What Was Built

**Task 1 — Unidades.js:**
- Added `import { toast } from "sonner"` and `const [removingIds, setRemovingIds] = useState(new Set())`
- Rewrote `handleDeletarUnidade`: sets removingIds before await (starts fade-out while request in flight); on error sets erroDelete + rolls back removingIds (immutable delete from Set); on success fires `toast.success("Unidade removida")` then setTimeout 200ms triggers re-fetch + clear
- Map now wraps each UnidadeCard in a `<div>` with key + inline style (opacity/transform/transition); UnidadeCard unchanged

**Task 2 — Parcelas.js:**
- Added `import { toast } from "sonner"` 
- Added `toast.success("Parcela marcada como paga")` inside the `status === 200` branch of `marcarComoPaga`
- No removingIds, no setTimeout, no exit animation — item stays in list with updated status

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. Both edits touch Client Component local state, toasts, and inline styles only. No new trust boundaries.

## Self-Check: PASSED

- [x] `src/components/features/Unidades.js` exists and modified
- [x] `src/components/features/Parcelas.js` exists and modified
- [x] Commit 461a1ff present (Task 1)
- [x] Commit 58b8d4d present (Task 2)
- [x] `npm run build` exits 0 (verified after each task)
- [x] Source asserts: sonner imports, removingIds (Unidades only), both toast strings, scale(0.97), setTimeout
- [x] No removingIds in Parcelas (negative assert)
