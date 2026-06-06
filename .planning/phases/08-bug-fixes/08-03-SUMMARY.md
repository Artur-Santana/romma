---
plan: 08-03
phase: 08-bug-fixes
status: complete
executor: orchestrator-inline
completed: 2026-06-06
---

# Plan 08-03 Summary — BUG-02: Split Erro + BUG-04: Link Voltar

## What Was Built

Fixed BUG-02 (shared error state split) and BUG-04 (← Voltar link on public /unidades page).

## Files Changed

- `src/components/features/Unidades.js` — Replaced single `erro` state with `erroDelete` (list level) and `erroEdit` (card prop)
- `src/components/features/UnidadesPublicas.js` — Added Link import, replaced "Unidades Disponíveis" span with `← Voltar` link to /

## Key Details

### Task 1 — Unidades.js (BUG-02)
- Single `[erro, setErro]` replaced by `[erroDelete, setErroDelete]` and `[erroEdit, setErroEdit]`
- `handleDeletarUnidade`: clears both states at start, sets `erroDelete` on failure
- `handleSalvarUnidade`: clears both states at start, sets `erroEdit` on failure
- `handleEditarUnidade`: clears `erroDelete` at start (prevents stale delete error showing in card)
- `insertUnidade`: clears both states at start, sets `erroEdit` on failure (creation form is "edit-like")
- `erroDelete` rendered above the cards list with `bg-[var(--danger-bg2)]` classes
- `erroEdit` rendered inside form (creation) and passed as prop to `UnidadeCard`
- `UnidadeCard` receives `erro={erroEdit}` (never erroDelete)
- `UnidadeCard.js` was NOT modified

### Task 2 — UnidadesPublicas.js (BUG-04)
- Added `import Link from 'next/link'`
- Replaced `<span>Unidades Disponíveis</span>` with `<Link href="/" className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase hover:text-fg-2 transition-colors">← Voltar</Link>`
- `<RealtimeDot />` remains unchanged on the right side
- The `<h1>Unidades Disponíveis.</h1>` title is preserved

## Self-Check

- [x] `erroDelete` and `erroEdit` states exist in Unidades.js
- [x] Single `[erro, setErro]` removed
- [x] `UnidadeCard` receives `erro={erroEdit}` not erroDelete
- [x] erroDelete block is above the cards list div
- [x] `import Link from 'next/link'` in UnidadesPublicas.js
- [x] "← Voltar" text present with `href="/"`
- [x] eyebrow class NOT used on the link
- [x] UnidadeCard.js NOT modified

## Issues / Deviations

None.
