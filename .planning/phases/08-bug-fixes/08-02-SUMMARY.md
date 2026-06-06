---
plan: 08-02
phase: 08-bug-fixes
status: complete
executor: orchestrator-inline
completed: 2026-06-06
---

# Plan 08-02 Summary — BUG-01: Revogar Acesso com FK Check e Erro Inline

## What Was Built

Fixed BUG-01 in two layers: (1) Server Action now checks for linked contracts before deleting a locatário; (2) UI replaced alert() with inline error in the table.

## Files Changed

- `src/actions/locatarios.js` — Added FK check in `revogarConvite` before delete
- `src/components/features/LocatariosDesktop.js` — Replaced `alert()` with `setErro()`, added inline error block below table header, cleared error on invite modal open

## Key Details

### Task 1 (locatarios.js)
After the existing `status_convite !== 'pendente'` guard, inserted a count query on `contratos` table with `locatario_id = id` (no status filter — any contract blocks delete per FK constraint). Returns `{ status: 400, erroMessage: 'Locatário tem contratos vinculados — encerre-os antes de revogar.' }` when count > 0.

### Task 2 (LocatariosDesktop.js)
- `handleRevogar`: added `setErro("")` at start, replaced `alert()` with `setErro(erroMessage)`
- Inline error block with `className="px-5 py-2 font-mono text-[11px] text-danger-fg border-t border-border-3"` positioned below table header, before rows
- Both invite modal open triggers now call `setErro("")` before `setShowInviteForm(true)` to prevent stale error leaking into modal

## Self-Check

- [x] `alert(` removed from LocatariosDesktop.js (grep returns 0)
- [x] Inline error block with correct classes present
- [x] FK check inserted after status_convite guard, before delete
- [x] Error message matches exact D-02 copy
- [x] `erroMessage` key used (not `errorMessage`)
- [x] No new `erroRevogar` state — reuses existing `erro`
- [x] Both modal open triggers clear `erro` first

## Issues / Deviations

None.
