---
phase: 19-unidades-modal-unificado-foto-de-capa
plan: "04"
subsystem: unidades
tags: [unidades, modal, metrics, filters, card-variant-b, signed-url, confirm-dialog]
dependency_graph:
  requires: ["19-01", "19-03"]
  provides: ["Unidades screen Variant-B with metrics+filters+modal+ConfirmDialog delete"]
  affects: ["src/components/features/Unidades.js", "src/components/ui/UnidadeCard.js"]
tech_stack:
  added: []
  patterns:
    - "useFotoSignedUrl inline hook (createSignedUrl 3600s, static-path short-circuit)"
    - "Client-side metrics derivation from full unidades list"
    - "Live client-side filtering (query + fStatus + fEd)"
    - "UnifiedUnidadeModal wired for create+edit via modal state { mode, initial }"
    - "ConfirmDialog gates delete; best-effort Storage cleanup before deletarUnidade"
    - "Exit animation on removingIds (opacity+scale 220ms)"
key_files:
  created: []
  modified:
    - src/components/ui/UnidadeCard.js
    - src/components/features/Unidades.js
decisions:
  - "Enrich unidade objects in Unidades.js with edificios.nome (lookup from listaEdificios) so UnidadeCard subtitle works without a DB join change"
  - "useFotoSignedUrl uses useState initializer for /public paths to avoid react-hooks/set-state-in-effect error"
  - "<img> element retained (not next/image) for signed URLs — consistent with UnifiedUnidadeModal; remotePatterns already configured in next.config.mjs"
metrics:
  duration_minutes: 35
  tasks_completed: 3
  tasks_total: 3
  files_modified: 2
  completed_date: "2026-06-14"
---

# Phase 19 Plan 04: Unidades Screen Wiring — Summary

**One-liner:** Refactored Unidades screen to Variant-B card grid with 4-cell metrics bar, live search/filters, UnifiedUnidadeModal for create/edit, and ConfirmDialog-gated delete with best-effort Storage cleanup.

## What Was Built

**Task 1 — UnidadeCard Variant-B with signed-URL cover photo**

Rewrote `UnidadeCard.js` to accept `{ unidade, onEditar, onDeletar }` — removing all inline-edit props. Added a local `useFotoSignedUrl(fotoUrl)` hook that short-circuits for `/public` static paths (seeded via `useState` initializer to avoid the `react-hooks/set-state-in-effect` lint error) and calls `createSignedUrl(fotoUrl, 3600)` for storage paths. Card renders Variant-B layout: optional cover photo at top, name line (`r-subhead` + `r-meta` edifício·área) with `StatusBadge` (Disponível = success, Alugada = primary/blue opaque), 1px divider, value line (`r-data` valor_mensal + `/mês`) with micro action buttons "Editar" (fg-3) and "Remover" (danger-fg). Inline styles + CSS vars only.

**Task 2 — Unidades.js: metrics bar, live filters, modal wiring, ConfirmDialog delete**

Replaced the old `showForm`/`editandoId` inline-form/per-card-edit architecture with:
- `modal` state (`null | { mode, initial }`) + `confirmDelete` state (`null | unidade`)
- `query`/`fStatus`/`fEd` filter state
- `carregarDados()` enriches each unidade with `edificios: { nome }` from the loaded edifício list
- 4-cell metrics bar: Área total (sum area_m2), MRR realizado (sum valor_mensal where alugada), Potencial em aberto in `var(--highlight)` (sum valor_mensal where disponivel), Valores ocultos (count valor_visivel === false)
- Filter bar: search input (⌕ icon, 240px), status toggles (Todos/Disponível/Alugada), edifício FSelect, result counter shown only when filter active
- Card grid `repeat(auto-fill, minmax(300px, 1fr))` with exit animation on `removingIds`
- `UnifiedUnidadeModal` rendered when `modal` is set; `onSaved` calls `carregarDados() + setModal(null)`
- `ConfirmDialog` with `danger=true`, exact copy per UI-SPEC; `handleDeletarUnidade` runs best-effort `storage.remove([unidade.foto_url])` before `deletarUnidade`
- Empty states: "Nenhuma unidade cadastrada..." vs "Nenhuma unidade corresponde aos filtros."

**Task 3 — Human verification checkpoint (auto-approved in AUTO_MODE)**

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Edificio name not available on unidade objects from getUnidades query**
- **Found during:** Task 2 implementation
- **Issue:** `getUnidades()` SELECT does not include an `edificios(nome)` join, so `unidade.edificios?.nome` was always undefined in UnidadeCard subtitle
- **Fix:** `carregarDados()` in Unidades.js enriches each unidade object with `edificios: { nome }` via a client-side lookup against `listaEdificios`
- **Files modified:** `src/components/features/Unidades.js`
- **Commit:** fd4797f

**2. [Rule 1 - Bug] react-hooks/set-state-in-effect ESLint error in useFotoSignedUrl**
- **Found during:** Task 1 ESLint check
- **Issue:** Synchronous `setSignedUrl(null)` and `setSignedUrl(fotoUrl)` calls in useEffect body triggered the error
- **Fix:** Used `useState(() => ...)` initializer to seed the value for static `/` paths; effect only fires for storage paths (async)
- **Files modified:** `src/components/ui/UnidadeCard.js`
- **Commit:** 8784095

## Self-Check

**Created files:**
- `src/components/ui/UnidadeCard.js` — ✓ exists (modified)
- `src/components/features/Unidades.js` — ✓ exists (modified)

**Commits:**
- `8784095` — feat(19-04): update UnidadeCard to Variant-B with signed-URL cover photo
- `fd4797f` — feat(19-04): refactor Unidades.js — metrics bar, live filters, modal wiring, ConfirmDialog delete

## Self-Check: PASSED

All required tokens and patterns verified (automated assertion + ESLint clean). Both commits present in git log.

## Known Stubs

None — metrics are derived from real database data; no hardcoded empty values.

## Threat Flags

No new trust boundaries introduced. All surfaces covered by the plan's threat model (T-19-11/12/13).
