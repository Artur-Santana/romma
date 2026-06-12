---
phase: 14-anima-es-feedback
plan: "03"
subsystem: locatarios
tags: [animation, toast, ux, exit-animation, re-fetch]
dependency_graph:
  requires: ["14-00"]
  provides: ["ANIM-02", "ANIM-03", "D-05", "D-09"]
  affects: ["src/components/features/LocatariosDesktop.js", "src/components/features/Locatarios.js"]
tech_stack:
  added: []
  patterns: ["removingIds-Set-state", "re-fetch-after-timeout", "toast.success-on-delete"]
key_files:
  modified:
    - src/components/features/LocatariosDesktop.js
    - src/components/features/Locatarios.js
decisions:
  - "Used RE-FETCH-AFTER-TIMEOUT variant (not optimistic filter) because revogarConvite/deletarLocatario are DELETE — row gone from DB, re-fetch is safe"
  - "Preserved setlocatarios lowercase setter in Locatarios.js per existing inconsistency (CLAUDE.md: do not correct existing inconsistencies)"
  - "Used toast string 'Acesso revogado' for both components (D-08)"
  - "Rollback removingIds on status !== 200 so rows are never left invisible (D-09)"
metrics:
  duration: "~8 minutes"
  completed: "2026-06-12"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 14 Plan 03: Locatarios Exit Animation + Toast Summary

**One-liner:** removingIds exit animation (opacity+scale 200ms) + "Acesso revogado" toast wired into LocatariosDesktop.js (mounted) and Locatarios.js (legacy mobile, per D-05) using the RE-FETCH-AFTER-TIMEOUT variant.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Exit animation + toast in LocatariosDesktop (mounted) | 20601d6 | src/components/features/LocatariosDesktop.js |
| 2 | Exit animation + toast in Locatarios (legacy mobile) | f0329f4 | src/components/features/Locatarios.js |

## What Was Built

**LocatariosDesktop.js (Task 1):**
- Added `import { toast } from "sonner"` 
- Added `const [removingIds, setRemovingIds] = useState(new Set())`
- Rewrote `handleRevogar`: sets removingIds before await; on `status !== 200` sets erro + rolls back removingIds + returns; on success fires `toast.success("Acesso revogado")` then inside `setTimeout(..., 200)` re-fetches `getLocatarios()` and clears the id from removingIds
- Merged `opacity`, `transform`, `transition` into the existing row div style object (single style prop alongside `display: "grid"` and `gridTemplateColumns`)

**Locatarios.js (Task 2):**
- Same pattern applied per D-05
- Preserved lowercase `setlocatarios` setter exactly (existing inconsistency)
- Used Tailwind-less inline style for animation (file uses Tailwind for its own classes; animation style added inline per pattern)
- Note: this component is not imported by any route — changes have no visible effect until the component is wired to a route (D-05 expected behavior)

## Deviations from Plan

None — plan executed exactly as written.

## Success Criteria Verification

- [x] ANIM-02: revogar acesso animates the row out (opacity 0 + scale 0.97 over 200ms)
- [x] ANIM-03: "Acesso revogado" toast fires on success (LocatariosDesktop)
- [x] D-05: Locatarios.js carries the same pattern (unmounted, documented)
- [x] D-09: revoke/delete error rolls back removingIds — row not left invisible
- [x] erroMessage spelling preserved throughout
- [x] `setlocatarios` lowercase preserved in Locatarios.js
- [x] `npm run build` exits 0

## Self-Check: PASSED

Files exist:
- src/components/features/LocatariosDesktop.js — FOUND
- src/components/features/Locatarios.js — FOUND

Commits exist:
- 20601d6 — FOUND
- f0329f4 — FOUND
