---
phase: 20-edif-cios-cards-drill-in
plan: "02"
subsystem: ui
tags: [cards, drill-in, accordion, modal, stats, occupation-bar]
dependency_graph:
  requires: [lockEdificio-prop, edificios-e2e-scaffold]
  provides: [edificios-cards-ui, EDIF-01, EDIF-02, EDIF-03]
  affects: [src/components/features/GestaoEdificios.js]
tech_stack:
  added: []
  patterns: [promise-all-parallel-load, client-side-stat-derivation, flex-proportion-bar, set-state-accordion, drill-in-row-click, modal-lock-prop]
key_files:
  modified:
    - src/components/features/GestaoEdificios.js
decisions:
  - Tasks 1 and 2 implemented as single atomic write — data infra and render layer are inseparable in React; partial-render intermediate state would not compile
  - computeStats and unidadesPorEdificio computed inline before render (no useMemo — TCC dataset is small)
  - OccupationBar segments rendered conditionally to avoid flex gap bugs when count=0
  - expandidos Set state never touched by carregarDados — accordion survives reload
  - First accordion row borderTop creates separator between expand button and first unit row (intentional)
metrics:
  duration: "~4 min"
  completed: "2026-06-15T14:13:54Z"
  tasks_completed: 2
  tasks_total: 3
  files_modified: 1
---

# Phase 20 Plan 02: Edifícios Cards & Drill-in Summary

**One-liner:** GestaoEdificios.js restructured from vertical list to 2-column card grid with per-building stats (units, occupancy %, MRR gold, total area), contiguous occupation bar (alugadas-first, no gaps), accordion drill-in "Ver N unidade(s)" expanding a clickable unit list that opens UnifiedUnidadeModal with lockEdificio=true.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Data infra — Promise.all, computeStats, fmtBRLk, OccupationBar | `accfecd` | `src/components/features/GestaoEdificios.js` |
| 2 | Render — card grid 2-col, accordion, modal drill-in | `accfecd` | `src/components/features/GestaoEdificios.js` (same commit as Task 1) |

---

## What Was Built

### Task 1 — Data Infrastructure

- **`carregarDados`**: replaces `carregarEdificios`; uses `Promise.all([getEdificios(), getUnidades()])` with `?? []` guards. Never touches `expandidos` state.
- **New state**: `unidades` (default `[]`), `expandidos` (default `new Set()`), `modalState` (default `null`).
- **`computeStats(lista)`**: derives `{ total, alugadas, disponiveis, ocupacaoPct, mrr, areaTotal }` — `ocupacaoPct = Math.round(alugadas/total*100)`, `mrr = sum valor_mensal of alugadas`, `areaTotal = sum area_m2 of all`.
- **`fmtBRLk(v)`**: copied verbatim from Unidades.js for MRR formatting (R$ 12k / R$ 800).
- **`OccupationBar({ alugadas, disponiveis })`**: flex container height 6px; renders each segment conditionally (`{alugadas > 0 && ...}` then `{disponiveis > 0 && ...}`) to avoid zero-width flex gaps; empty state = single full-width `var(--border-3)` bar.
- **`unidadesPorEdificio`**: reduce grouping by `edificio_id`, computed inline before render.

### Task 2 — Rendering

- **Page shell**: `romma-page r-fade` with `padding: var(--rd-page-y) var(--rd-gutter)`, `paddingBottom: 64`.
- **SkeletonEdificios**: adapted to 2-column card grid (`repeat(auto-fill, minmax(340px, 1fr))`).
- **Card grid**: `display: grid; gridTemplateColumns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; alignItems: start` — naturally collapses to 1-col on mobile.
- **Card header row**: building name (20px bold fg-1) + address (13px fg-4); Editar/Remover ghost buttons preserved.
- **Stats row**: 4-cell inline grid (border-3 perimeter + borderRight separators); cells: Unidades (fg-1), Ocupação % (fg-1), MRR (gold `--highlight`), Área total (fg-1); each with `r-label` (9.5px) and `r-meta` sub-label.
- **Occupation bar + legend**: `<OccupationBar>` + `r-meta` legend "X alugada(s) · Y disponíve{is|l}".
- **Expand button**: `style={{ all: "unset" }}`, border-indigo, `disabled` + `opacity: 0.4` + `cursor: not-allowed` when N=0.
- **`toggleExpandido`**: immutable Set update via `new Set(prev)` + add/delete.
- **Accordion panel**: `borderTop: 1px solid var(--border-3)` on container + each row; rows are fully clickable with `onMouseEnter/Leave` hover effect to `var(--surface-hi)`.
- **Drill-in row**: displays unit name (13px 600 fg-1), status pill (alugada=indigo-soft, disponivel=success), area.
- **Modal invocation**: `{modalState && <UnifiedUnidadeModal mode="edit" initial={modalState.unidade} edificios={edificios} lockEdificio={true} onClose={...} onSaved={...} />}` — `onSaved` calls `carregarDados()` then `setModalState(null)` WITHOUT resetting `expandidos`.
- **Inline edit form preserved**: within card boundary, no column spanning.
- **CRUD handlers preserved**: `handleCriar`, `handleEditar`, `handleSalvar`, `handleDeletar` — only call-site updated from `carregarEdificios()` to `carregarDados()`.

---

## Deviations from Plan

### Implementation consolidation

**Tasks 1 and 2 implemented as single atomic commit** (one Write call, one commit `accfecd`).

- **Reason**: React component data infrastructure and render layer are inseparable — writing a version with only `computeStats`/`OccupationBar`/`carregarDados` but without the card grid render would still require the full JSX to compile without errors.
- **Impact**: None — all acceptance criteria for both tasks are met; git log shows one commit instead of two.

---

## Verification Results

| Check | Result |
|-------|--------|
| `node -e "Promise.all + computeStats + OccupationBar + getUnidades + fmtBRLk"` | PASS |
| `node -e "minmax(340px) + lockEdificio={true} + toggleExpandido + Ver template"` | PASS (template literal confirmed via `s.includes`) |
| `npx eslint src/components/features/GestaoEdificios.js` | 0 errors |
| expandidos not reset in carregarDados | Confirmed — carregarDados only sets edificios/unidades |
| CRUD handlers preserved | Confirmed — handleCriar/handleEditar/handleSalvar/handleDeletar unchanged in logic |
| Server Actions import unchanged | Confirmed — criarEdificio/editarEdificio/deletarEdificio |

---

## Known Stubs

None. The implementation is complete for EDIF-01, EDIF-02, EDIF-03. E2E tests from Plan 01 Wave 0 scaffold should now pass (GREEN phase).

---

## Threat Flags

None. `lockEdificio={true}` is UI-only; `editarUnidade` Server Action validates `proprietario_id` ownership chain (T-20-02 confirmed accepted). Stats are computed from RLS-filtered `getUnidades()` data (T-20-03 confirmed accepted).

---

## Self-Check: PASSED

- [x] `src/components/features/GestaoEdificios.js` modified (309 insertions, 90 deletions)
- [x] Commit `accfecd` exists
- [x] ESLint 0 errors
- [x] All acceptance criteria met: card grid 2-col, stats row 4-cell, OccupationBar, accordion, lockEdificio modal
