---
phase: 14-anima-es-feedback
reviewed: 2026-06-12T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/app/layout.js
  - src/components/features/Contratos.js
  - src/components/features/Unidades.js
  - src/components/features/Parcelas.js
  - src/components/features/LocatariosDesktop.js
  - src/components/features/Locatarios.js
  - e2e/toast-feedback.spec.js
findings:
  critical: 1
  warning: 1
  info: 1
  total: 3
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-06-12
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Phase 14 adds Sonner toasts and exit animations (opacity + scale, 200ms) to the five main dashboard mutations. The implementation is mostly sound: `removingIds` rollback on error is correct in every handler (D-09), functional `prev =>` updates prevent stale-closure clobbers in every `setTimeout`, toast strings match D-08 exactly, the single `<Toaster>` mount in `layout.js` stays a Server Component, and the `UnidadeCard` wrapper div moves `key` correctly.

Three issues were found: one critical (the phase-gate E2E test will fail against a correct implementation due to a wrong button selector), one warning (stale `encerrados` count in the subtitle after encerrar), and one info (missing `?? []` guard on one `setParcelas` call).

## Critical Issues

### CR-01: ANIM-03.5 E2E test uses wrong button selector — will timeout on working code

**File:** `e2e/toast-feedback.spec.js:334`

**Issue:** The test locates the "Marcar Paga" button with `getByRole('button', { name: 'Pagar' })`. Playwright's `name` filter is a case-insensitive *substring* match. "pagar" is **not** a substring of "Marcar Paga" — the button text ends in "paga" (no trailing "r"). The locator returns zero elements, `toBeVisible()` times out, and the test reports failure against a fully correct implementation. Since this test is the ANIM-03 phase gate, a false-RED here blocks the phase from shipping green.

The actual button label in `Parcelas.js:157` is "Marcar Paga":
```jsx
<Button ... onClick={() => marcarComoPaga(parcela)}>
  Marcar Paga
</Button>
```

**Fix:** Change the selector to match the rendered text:
```javascript
// Before (line 334):
const pagarBtn = page.getByRole('button', { name: 'Pagar' }).first()

// After:
const pagarBtn = page.getByRole('button', { name: 'Marcar Paga' }).first()
```

---

## Warnings

### WR-01: `encerrados` subtitle count is stale after encerrar contrato

**File:** `src/components/features/Contratos.js:177-199`

**Issue:** The subtitle `"${ativos} ativos · ${encerrados} encerrados"` is derived from local state (lines 176-178). When `confirmarEncerramento` runs, it removes the row from state via `prev.filter(c => c.id !== contrato.id)` (line 170) — correct for the animation. However, the row's status is never flipped to `"encerrado"` in local state before removal, so `encerrados` (which counts `status === "encerrado"`) stays at its pre-action value. After encerrar: `ativos` drops by 1 (correct), `encerrados` stays flat (wrong — should increment by 1). The correct total is only restored on a full page reload that re-fetches from DB. The quirk is acknowledged in 14-PATTERNS.md but produces a visibly wrong count.

`cancelarContrato` does not have this problem because `cancelado` is not counted in the subtitle at all.

**Fix — two options:**

Option A (minimal, no re-fetch): update the subtitle count derivation to account for removed rows:
```javascript
// After either optimistic removal, add a "pendingRemovalCount" offset, or
// track encerrados separately before filter. Simplest: count ativos directly
// from contratosAtivos (already derived):
const ativos = contratosAtivos.length  // already correct after filter
// For encerrados, derive from full contratos OR maintain a separate counter.
```

Option B (cleaner, adds one re-fetch): inside the `setTimeout` in `confirmarEncerramento`, also re-fetch contratos (safe because the row is now `status='encerrado'` in DB, not `ativo`, so filtering to `contratosAtivos` will exclude it):
```javascript
setTimeout(() => {
  getContratos().then(c => setContratos(c ?? []))  // encerrados count now accurate
  getUnidades().then(u => setUnidades(u ?? []))
  setRemovingIds(prev => { const n = new Set(prev); n.delete(contrato.id); return n })
}, 200)
```
Note: Option B is safe here (unlike cancelar at the time of D-07 design) because `contratosAtivos` filters the displayed list — the re-fetched encerrado row will not reappear in the table.

---

## Info

### IN-01: Missing `?? []` null-safety guard in `marcarComoPaga` re-fetch

**File:** `src/components/features/Parcelas.js:55`

**Issue:** `setParcelas(await getParcelasByContrato(contratoId))` has no `?? []` fallback. If `getParcelasByContrato` returns `null` or `undefined` (network error, empty result), `parcelas` becomes `null` and the subsequent `.filter()`, `.length`, and `.map()` calls in the render crash. The initial load at line 39 correctly uses `?? []`. The project convention (CLAUDE.md: "always `?? []` on array returns") is not applied here.

**Fix:**
```javascript
// Before (line 55):
setParcelas(await getParcelasByContrato(contratoId))

// After:
setParcelas(await getParcelasByContrato(contratoId) ?? [])
```

---

## Confirmed Clean (focus areas verified)

- **D-09 rollback**: All five handlers (`confirmarCancelamento`, `confirmarEncerramento`, `handleDeletarUnidade`, `handleRevogar`, `handleDeletarLocatario`) add the id to `removingIds` before `await` and delete it on `status !== 200`. No row is ever left invisible-but-present.
- **Functional setState in setTimeout**: Every `setTimeout` callback uses `prev =>` functional updates — no stale-closure clobber risk.
- **Toast strings**: All six match D-08 exactly: "Contrato criado", "Contrato cancelado", "Contrato encerrado", "Unidade removida", "Acesso revogado", "Parcela marcada como paga".
- **Single `<Toaster>` mount**: Only in `layout.js`; feature components import only `{ toast }`. `layout.js` remains a Server Component (importing/rendering a client component is correct and does not require `'use client'`).
- **Unidades wrapper div**: `key` moved from `<UnidadeCard>` to the wrapper `<div>` — no duplicate-key issue, React reconciliation is correct.
- **D-07 optimistic filter**: `contratosAtivos` filters to `status === 'ativo'` for the displayed table. `getContratos()` is NOT re-fetched after cancelar/encerrar — the cancelled/encerrado row cannot resurrect.
- **erroMessage spelling**: Correct throughout (Portuguese convention preserved).
- **`setlocatarios` lowercase**: Preserved in `Locatarios.js` per the known inconsistency.
- **ANIM-03.3 selector**: `UnidadeCard.js:164` renders `<Button>Remover</Button>` — matches the spec's `getByRole('button', { name: 'Remover' })` exactly.
- **D-04 Parcelas**: No `removingIds`, no `setTimeout`, no exit animation — toast-only as specified.

---

_Reviewed: 2026-06-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
