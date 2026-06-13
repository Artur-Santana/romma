---
phase: 16-fechamento-idor-mt02
plan: "02"
subsystem: auth
tags: [idor, server-actions, supabase, ownership-chain, security]

requires:
  - phase: 15-testes
    provides: authGuard { user } pattern + 3-hop ownership chain in contratos.js/unidades.js
  - phase: 16-fechamento-idor-mt02
    provides: 16-01 pattern (same phase, wave 1 sibling)

provides:
  - parcelas.js authGuard returning { user } on success path
  - marcarParcelaComoPaga 4-hop ownership pre-check (parcela→contrato→unidade→edificio→proprietario_id)
  - MT-03 IDOR write vector closed

affects:
  - 16-03 (unit tests will assert this ownership chain)
  - any future action touching parcelas with supabaseAdmin

tech-stack:
  added: []
  patterns:
    - "4-hop ownership pre-check: parcela→contrato→unidade→edificio scoped by .eq('proprietario_id', user.id) before update"
    - "Each hop uses distinct variable names (parcela/contrato/unidade/edificio) and distinct error names (fetchParcelaErr/fetchContratoErr/fetchUnidadeErr/fetchEdificioErr) to avoid shadowing"
    - "Return 404 'Parcela não encontrada.' on any missing hop — does not reveal cross-tenant existence"

key-files:
  created: []
  modified:
    - src/actions/parcelas.js

key-decisions:
  - "Return 404 (not 403) on cross-tenant parcela — matches 15-02 convention, does not confirm existence of another tenant's parcela (T-16-02 accepted)"
  - "authGuard success path returns { user } — mirrors contratos.js and unidades.js post-15-02"
  - "4-hop chain uses supabaseAdmin (bypasses RLS) because the Server Action itself must verify ownership — RLS is not available here"

patterns-established:
  - "4-hop ownership pre-check mirrors 3-hop from contratos.js — add one extra first hop for parcela→contrato_id before continuing"

requirements-completed: [MT-03]

duration: 8min
completed: 2026-06-12
---

# Phase 16 Plan 02: Parcelas IDOR Close (MT-03) Summary

**marcarParcelaComoPaga gains 4-hop ownership pre-check (parcela→contrato→unidade→edificio→proprietario_id) and authGuard now returns { user }, closing MT-03 cross-tenant IDOR write vector**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-12T22:40:00Z
- **Completed:** 2026-06-12T22:48:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- authGuard in parcelas.js returns `{ user }` on success (was `{}` — same bug 15-02 fixed in unidades.js/contratos.js)
- marcarParcelaComoPaga destructures `{ err, user }` from authGuard
- 4-hop ownership pre-check added before the parcela update: parcela→contrato→unidade→edificio scoped by `.eq('proprietario_id', user.id)`, returning 404 on any missing hop
- Cross-tenant parcela submission now rejected with 404 before `supabaseAdmin.update` is ever reached
- ESLint clean; `{ status, erroMessage }` contract preserved

## Task Commits

1. **Task 1: authGuard returns { user } + 4-hop ownership pre-check in marcarParcelaComoPaga** - `3df8a4c` (fix)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `src/actions/parcelas.js` - authGuard returns { user }; marcarParcelaComoPaga adds 4-hop pre-check before update

## Decisions Made
- Return 404 (not 403) on cross-tenant — matches 15-02 convention, does not disclose existence of another tenant's parcela
- Each hop uses distinct local variable and error names to avoid shadowing (contratos.js naming style)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Threat Flags

No new threat surface introduced. T-16-01 (IDOR write on marcarParcelaComoPaga) mitigated. T-16-02 (404 vs 403) accepted per plan.

## Next Phase Readiness
- 16-03 (unit tests for this ownership chain) can proceed — the 4-hop chain is in place for mocking
- marcarParcelaComoPaga is now as secure as cancelarContrato/encerrarContrato (3-hop equivalent + 1 extra parcela hop)

---
*Phase: 16-fechamento-idor-mt02*
*Completed: 2026-06-12*
