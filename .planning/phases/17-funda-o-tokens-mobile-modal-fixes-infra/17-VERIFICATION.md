---
phase: 17-funda-o-tokens-mobile-modal-fixes-infra
verified: 2026-06-13T23:00:00Z
status: passed
score: 5/5 must-haves verified (source-level + human UAT confirmed)
overrides_applied: 0
human_uat_result: "PASSED 2026-06-13. Item 1 (remote migration) confirmed via `supabase migration list` — 20260601000000 applied on vfymttcajeyhrmsyhrtj. Item 2 (scroll 375px + navbar) OK. Item 3 (modal mobile) exposed a pre-existing width/button-overflow gap against SC3 — fixed in commits b38252a/66681b8/4a8c94c (responsive panel w-full max-w-[480px], backdrop padding, p-6 mobile padding, full-width stacked buttons). Item 4 (print) low-risk, accepted. NOTE: confirm-on-revoke is OUT OF SCOPE for Phase 17 — it is LOC-05, scheduled for Phase 23. Phase 17 only retrofitted the existing ConfirmDialog (Contratos) to the backdrop utility."
human_verification:
  - test: "Confirm supabase migration 20260601000000 is applied on remote project vfymttcajeyhrmsyhrtj"
    expected: "supabase migration list shows 20260601000000 with a remote applied timestamp; unidades.foto_url, proprietarios.nome/sobrenome/telefone columns accessible; unidades-fotos bucket exists with public=false"
    why_human: "Remote Supabase state cannot be queried from the local codebase. The SUMMARY documents supabase db push + REST verification output, but the verifier has no live Supabase connection to independently confirm."
  - test: "Verify mobile scroll at 375px: dashboard, portal, /unidades"
    expected: "Content in each shell scrolls vertically without the page getting stuck or the layout overflowing horizontally at 375px viewport width"
    why_human: "min-height:0 chain correctness depends on the full rendered flex tree at runtime; cannot be confirmed by static code inspection alone."
  - test: "Verify modal centering on mobile: LocatariosDesktop (2 modals) + ConfirmDialog"
    expected: "Modals appear centered in the viewport (not clipped at top) on a 375px device or emulator"
    why_human: "romma-modal-backdrop uses position:fixed + flexbox center; actual centering depends on CSS cascade and browser rendering, not statically verifiable."
  - test: "Verify @media print guard suppresses animation in print preview"
    expected: ".romma-page and .r-fade produce no visible animation in browser print preview"
    why_human: "Print behavior requires a browser print preview to confirm; cannot be tested with grep."
---

# Phase 17: Fundacao — Tokens, Mobile/Modal Fixes & Infra Verification Report

**Phase Goal:** A base de design e infraestrutura está pronta para todas as telas — tokens tipográficos e de densidade em globals.css (aditivo, zero regressão), fixes cross-cutting de scroll/modal/animação nas cascas, e schema + Storage + next.config suportam as features novas.
**Verified:** 2026-06-13T23:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 9 `--rt-*` type tokens + 9 `--rd-*` density tokens in globals.css, var()-consumable, no `[data-density]` selectors | VERIFIED | globals.css lines 384–403; `data-density` grep: 0 matches; Vitest 47/47 pass |
| 2 | Scroll fix in 3 layout shells — min-height:0 chain present | VERIFIED | DashboardShell.js line 45 (inline `minHeight: 0`), line 46 (inner div `minHeight: 0`); portal/layout.js line 13 (`min-h-0`); UnidadesPublicas.js line 123 (`min-h-0`) |
| 3 | Modals use romma-modal-backdrop; LocatariosDesktop 2 modals + ConfirmDialog (z-[100]); UnidadeDetailSheet untouched | VERIFIED | LocatariosDesktop.js lines 240, 337; ConfirmDialog.js line 23 (`romma-modal-backdrop z-[100]`); UnidadeDetailSheet.js line 9 still uses `fixed inset-0 ... flex items-end` (bottom-sheet, unchanged) |
| 4 | .romma-page uses rFade (transform-only), no fill:both; @media print + prefers-reduced-motion guards present | VERIFIED | globals.css line 350 (`animation: rFade 320ms var(--ease-crisp)`); line 466 (reduced-motion guard); line 467 (print guard); fill:both absent from .romma-page; Vitest REFINO-05 + fill-mode guard blocks pass |
| 5 | Migration SQL written with correct columns, private bucket, SECURITY DEFINER RLS, storage_unidade_owned_by_auth function; next.config.mjs remotePatterns with no search key | VERIFIED (source) | `20260601000000_v15_foundation.sql` exists with all required DDL; next.config.mjs lines 4–14 with correct hostname and pathname; remote application: human confirmation required |

**Score:** 5/5 truths verified at source level

---

### SC1 Note — Token Count

The success criterion states "8 type tokens" but the implementation contains 9 `--rt-*` tokens (adding `--rt-title-sm: 24px`). This is not a regression — 9 is a strict superset of 8. The Vitest test covers all 9 explicitly. No `.r-title-sm` helper class exists (only the token), which is consistent with the design handoff (`.r-title` maps to `--rt-title`; `--rt-title-sm` is available for direct `var()` use by consumer components in later phases).

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/globals.css` | v1.5 token block, .r-* helpers, .romma-modal-backdrop, rFade keyframe, animation retrofit | VERIFIED | Lines 377–467; all tokens and classes present |
| `test/unit/globals/v15-tokens.test.js` | 47-assertion Vitest source test | VERIFIED | File exists; `npx vitest run` exits 0, 47 pass, 0 fail |
| `src/components/ui/DashboardShell.js` | minHeight:0 on main + inner div | VERIFIED | Line 45: `minHeight: 0` in main style; line 46: `minHeight: 0` in inner div style |
| `src/app/portal/layout.js` | min-h-0 on main | VERIFIED | Line 13: `className="flex-1 overflow-auto min-h-0"` |
| `src/components/features/UnidadesPublicas.js` | min-h-0 on scroll div | VERIFIED | Line 123: `className="flex-1 overflow-auto min-h-0"` |
| `src/components/features/LocatariosDesktop.js` | romma-modal-backdrop on both modals | VERIFIED | Lines 240, 337: `className="romma-modal-backdrop"` |
| `src/components/ui/ConfirmDialog.js` | romma-modal-backdrop z-[100] | VERIFIED | Line 23: `className="romma-modal-backdrop z-[100]"` |
| `supabase/migrations/20260601000000_v15_foundation.sql` | Schema + private bucket + SECURITY DEFINER RLS | VERIFIED (source) | Full DDL present; remote apply documented in SUMMARY |
| `next.config.mjs` | remotePatterns for vfymttcajeyhrmsyhrtj.supabase.co, no search key | VERIFIED | Lines 4–14: correct hostname, pathname `/storage/v1/object/**`, search key omitted |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `.romma-page` (globals.css) | `rFade` keyframe | `animation:` property | VERIFIED | Line 350 uses `rFade`; keyframe at line 457; no `rommaFadeIn both` in .romma-page |
| `LocatariosDesktop.js` modals | `.romma-modal-backdrop` | `className=` | VERIFIED | Lines 240, 337 |
| `ConfirmDialog.js` | `.romma-modal-backdrop z-[100]` | `className=` | VERIFIED | Line 23; z-index escalation preserved |
| `UnidadeDetailSheet.js` | unchanged (items-end) | negative check | VERIFIED | No `romma-modal-backdrop` in UnidadeDetailSheet; line 9 keeps `fixed inset-0 ... flex items-end` |
| `storage.objects` RLS policies | `storage_unidade_owned_by_auth` function | SQL `USING`/`WITH CHECK` | VERIFIED (source) | Migration SQL has all 3 policies calling the helper function |
| `next/image` | `vfymttcajeyhrmsyhrtj.supabase.co` | `remotePatterns` | VERIFIED | next.config.mjs line 8 |

---

### Data-Flow Trace (Level 4)

Not applicable. This phase delivers CSS infrastructure, SQL migration, and config only — no UI components that render dynamic data were created or modified in a way that requires data-flow tracing.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Vitest source assertions (47) | `npx vitest run test/unit/globals/v15-tokens.test.js` | PASS (47) FAIL (0) | PASS |
| data-density absent from globals.css | `grep 'data-density' src/app/globals.css` | 0 matches | PASS |
| fill:both absent from .romma-page | `grep 'rommaFadeIn.*both' src/app/globals.css` | 0 matches | PASS |
| UnidadeDetailSheet not using romma-modal-backdrop | `grep 'romma-modal-backdrop' .../UnidadeDetailSheet.js` | 0 matches | PASS |
| next.config.mjs has no search key in remotePatterns | file inspection | search key absent, comment explains intent | PASS |

---

### Probe Execution

No probes declared for this phase. Step 7c: SKIPPED (no probe-*.sh files for phase 17).

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| REFINO-01 | 17-01 | Type scale tokens --rt-* | SATISFIED | 9 tokens in globals.css; Vitest REFINO-01 block passes |
| REFINO-02 | 17-01 | Density tokens --rd-* (regular only) | SATISFIED | 9 tokens in globals.css; Vitest REFINO-02 block passes |
| REFINO-03 | 17-02 | Mobile scroll fix (min-height:0 chain) | SATISFIED | 3 shells fixed (DashboardShell, portal/layout, UnidadesPublicas) |
| REFINO-04 | 17-01, 17-02 | Modal backdrop consolidation (.romma-modal-backdrop) | SATISFIED | Utility in globals.css; applied in LocatariosDesktop (2x) and ConfirmDialog |
| REFINO-05 | 17-01 | Animation retrofit (.romma-page → rFade, guards) | SATISFIED | globals.css line 350; print + reduced-motion guards at lines 466–467 |

All 5 declared requirements satisfied at source level.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None found | — | — |

No TBD/FIXME/XXX markers, no return null stubs, no hardcoded empty arrays in any of the 7 modified files. CSS infrastructure phase: no dynamic data rendering introduced.

---

### Human Verification Required

#### 1. Remote Migration Confirmation

**Test:** Run `supabase migration list` against project `vfymttcajeyhrmsyhrtj` and verify migration `20260601000000` shows a remote applied timestamp. Additionally confirm via Supabase dashboard or REST that `unidades.foto_url`, `proprietarios.nome/sobrenome/telefone` columns exist, and that the `unidades-fotos` bucket has `public: false`.
**Expected:** Migration listed as applied; 4 new columns accessible; storage bucket exists with private setting.
**Why human:** Verifier has no live Supabase connection. The SUMMARY documents `supabase db push` output and REST verification but these are claims from the executor process, not independently confirmed.

#### 2. Mobile Scroll at 375px

**Test:** Open the dashboard (`/dashboard`), portal (`/portal`), and public unidades page (`/unidades`) in a browser with DevTools set to 375px × 812px (iPhone SE/13 equivalent). Scroll through each page.
**Expected:** Content scrolls vertically without layout overflow, stuck scroll, or clipped content.
**Why human:** The `min-height:0` chain correctness in a flex tree requires runtime rendering; static code inspection confirmed the properties exist but cannot confirm the chain is complete end-to-end.

#### 3. Modal Centering on Mobile (375px)

**Test:** On a 375px viewport, open the "Novo Locatário" modal in LocatariosDesktop, the edit modal, and the ConfirmDialog. Verify each modal is visible and centered in the viewport.
**Expected:** Modals appear viewport-centered, not clipped at the top edge or shifted.
**Why human:** `position:fixed` + flexbox centering is visually verified; CSS z-index stacking (z-50 vs z-[100]) requires visual confirmation that ConfirmDialog renders above LocatariosDesktop modals.

#### 4. Print Preview Animation Guard

**Test:** Open any page that uses `.romma-page` (e.g. `/dashboard`), open browser print preview.
**Expected:** No animation artifact — page content appears at its final rendered position immediately.
**Why human:** `@media print { animation: none }` is confirmed in source but print-preview behavior requires a browser environment to validate.

---

### Gaps Summary

No blocking gaps identified. All 5 success criteria are verified at source level:

- SC1: 9 `--rt-*` + 9 `--rd-*` tokens present, no `[data-density]`, Vitest 47/47 pass. (SC wording said "8 type tokens" — implementation has 9, a superset, not a regression.)
- SC2: `min-height:0` applied on the correct flex children in all 3 layout shells.
- SC3: `.romma-modal-backdrop` utility applied to LocatariosDesktop (2 modals, z-50) and ConfirmDialog (z-[100]); UnidadeDetailSheet uses `items-end` and was not modified.
- SC4: `.romma-page` uses `rFade` (transform-only); `fill:both` and `rommaFadeIn` absent from the rule; `@media print` and `@media (prefers-reduced-motion: reduce)` guards both present.
- SC5: Migration SQL is complete and correct; next.config.mjs remotePatterns is wired with no search key. Remote application is documented in SUMMARY but needs human confirmation as the one open item.

Status is `human_needed` solely because: (a) remote Supabase state cannot be confirmed from the local filesystem, and (b) visual scroll/modal behaviors require a browser. The codebase is structurally complete.

---

_Verified: 2026-06-13T23:00:00Z_
_Verifier: Claude (gsd-verifier)_
