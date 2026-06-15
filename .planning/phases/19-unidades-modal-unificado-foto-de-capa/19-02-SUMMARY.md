---
phase: 19
plan: "02"
subsystem: e2e-tests
tags: [e2e, wave-0, scaffold, unidades, modal, cover-photo]
dependency_graph:
  requires: []
  provides: [e2e/crud-unidades.spec.js, e2e/toast-unidades.spec.js, public/images/unidade-exemplo.jpg]
  affects: [19-03-PLAN.md, 19-04-PLAN.md]
tech_stack:
  added: []
  patterns: [romma-modal-backdrop, page.selectOption native select, ConfirmDialog confirm-before-toast, Wave-0 RED scaffold]
key_files:
  created:
    - public/images/unidade-exemplo.jpg
  modified:
    - e2e/crud-unidades.spec.js
    - e2e/toast-unidades.spec.js
decisions:
  - "Used ffmpeg to convert existing hero-building.png to JPEG (ImageMagick unavailable) — same source image, JPEG format, 400x400px, 34.5 KB"
  - "BUG-02 test updated: ConfirmDialog confirm step added before FK-error trigger (Sala 101 delete attempt must go through modal now)"
  - "New tests organized into named test.describe blocks by requirement (UNID-01, UNID-02, UNID-05) for clarity and filtering"
metrics:
  duration: "~4 minutes"
  completed: "2026-06-14"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 3
---

# Phase 19 Plan 02: Wave-0 E2E Scaffold + Cover-Photo Asset Summary

Wave-0 test scaffolding — updated E2E specs to target UnifiedUnidadeModal flow and added static JPEG placeholder asset for "usar foto de exemplo" (D-09).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create static example cover-photo asset | e7f9388 | public/images/unidade-exemplo.jpg |
| 2 | Update crud-unidades.spec.js to modal flow + add métricas/busca/ConfirmDialog specs | df758bc | e2e/crud-unidades.spec.js |
| 3 | Update toast-unidades.spec.js delete flow to confirm via ConfirmDialog | ac7eb8c | e2e/toast-unidades.spec.js |

## What Was Built

**Task 1 — Static asset `public/images/unidade-exemplo.jpg`:**
Valid JPEG (SOI marker FF D8 confirmed), 34.5 KB, 400×400px. Converted from existing `public/hero-building.png` via `ffmpeg`. Serves at `/images/unidade-exemplo.jpg` as a static public asset for the CoverPhotoField "usar foto de exemplo" button (D-09, UI-SPEC). File has no PII (generic building placeholder, intentionally public per T-19-05 accept disposition).

**Task 2 — `e2e/crud-unidades.spec.js` modal-flow migration:**
- Create flow: `Nova Unidade` → await `.romma-modal-backdrop` → `page.selectOption('select', ...)` for edificio (native FSelect) → fill `placeholder="Ex: Sala 1208"` → click `Criar Unidade`
- Edit flow: `Editar` → await `.romma-modal-backdrop` → scope nome input to `.romma-modal-backdrop input[placeholder="Ex: Sala 1208"]` → click `Salvar Alterações`
- Delete flow: `Remover` → await `.romma-modal-backdrop` → click `Remover Unidade`
- New test (UNID-01): asserts `Área total`, `MRR realizado`, `Potencial em aberto`, `Valores ocultos` visible
- New test (UNID-02): fills `Buscar unidade...` with `E2E-`, asserts `/resultado/i` count visible
- New test (UNID-05): clicks `Remover`, asserts backdrop + `Remover unidade?` visible, clicks `Cancelar`, asserts backdrop hidden
- BUG-02 test updated: now goes through ConfirmDialog confirm before triggering FK-error on `Sala 101`
- Total: 7 tests discoverable via `--list`, no parse errors

**Task 3 — `e2e/toast-unidades.spec.js` ConfirmDialog step:**
After `row.getByRole('button', { name: 'Remover' }).click()`, inserts: await `.romma-modal-backdrop` visible → click `Remover Unidade`. Toast assertion `Unidade removida` retained with 10s timeout.

## Deviations from Plan

### Auto-fixed Issues

None.

### Planned Deviations

**1. [Context - Asset Creation] Used ffmpeg instead of ImageMagick**
- **Found during:** Task 1
- **Issue:** `convert` (ImageMagick) not installed. Plan listed ffmpeg as an alternative.
- **Fix:** `ffmpeg -y -i public/hero-building.png -vf "scale=400:400" -frames:v 1 -q:v 5 public/images/unidade-exemplo.jpg` — reused existing building PNG, produced valid JPEG 34.5 KB
- **Files modified:** `public/images/unidade-exemplo.jpg`
- **Commit:** e7f9388

**2. [Context - BUG-02 Test] ConfirmDialog step added to BUG-02 scenario**
- **Found during:** Task 2
- **Issue:** BUG-02 test previously clicked `Remover` on `Sala 101` directly (old inline-delete flow). With the new modal flow, a ConfirmDialog confirmation step is required before the FK error fires.
- **Fix:** Added `await expect(page.locator('.romma-modal-backdrop')).toBeVisible()` + `await page.getByRole('button', { name: 'Remover Unidade' }).click()` in BUG-02 scenario before the `page.waitForTimeout(2_000)`.
- **Files modified:** `e2e/crud-unidades.spec.js`
- **Commit:** df758bc

## Known Stubs

None. This plan creates E2E scaffolding and a static asset only — no UI stubs introduced.

## Threat Flags

None. No new network endpoints, auth paths, or schema changes introduced. Static public asset (T-19-05) and E2E test data isolation (T-19-06) as documented in plan threat model.

## Self-Check: PASSED

- [x] `public/images/unidade-exemplo.jpg` exists (34.5 KB, FF D8 SOI marker confirmed)
- [x] Commit e7f9388 exists
- [x] `e2e/crud-unidades.spec.js` contains all required selectors (romma-modal-backdrop, Ex: Sala 1208, Salvar Alterações, Remover Unidade, Buscar unidade..., Remover unidade?, Área total)
- [x] Commit df758bc exists
- [x] `e2e/toast-unidades.spec.js` contains `Remover Unidade` and `Unidade removida`
- [x] Commit ac7eb8c exists
- [x] `npx playwright test e2e/crud-unidades.spec.js --list` enumerates 7 tests, no parse error
- [x] `npx playwright test e2e/toast-unidades.spec.js --list` enumerates 1 test, no parse error
