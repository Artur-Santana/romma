---
phase: 13-mobile-responsivo
verified: 2026-06-12T06:05:00Z
status: human_needed
score: 3/3
overrides_applied: 0
human_verification:
  - test: "Inspecionar tap targets no Chrome DevTools em viewport 375px"
    expected: "Botões de ação nas abas Contratos, Locatários e Parcelas com height >= 44px"
    why_human: "boundingBox() retorna tamanho lógico; DevTools ou dispositivo físico verifica superfície de toque real"
  - test: "Testar scroll das tabelas em iPhone SE ou Chrome DevTools 375px"
    expected: "Scroll horizontal dentro dos wrappers overflow-x:auto com inércia/momentum natural"
    why_human: "scrollWidth asserts que não há overflow de página — comportamento de scroll suave dentro do wrapper não é verificável via Playwright"
---

# Phase 13: Mobile Responsivo — Verification Report

**Phase Goal:** Proprietário e Locatário podem usar o sistema em celular sem layout quebrado ou navegação inacessível
**Verified:** 2026-06-12T06:05:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Dashboard em 375px exibe MobileTopBar + MobileBottomNav no lugar da sidebar — sidebar não vaza ou sobrepõe o conteúdo | VERIFIED | DashboardShell renders `.romma-desktop-only` + `.romma-mobile-only` as siblings; globals.css `@media (max-width: 768px)` hides `.romma-desktop-only { display: none !important }` and shows `.romma-mobile-only { display: flex ... }`; `.romma-sidebar-wrapper` also `display: none !important` at mobile; data-testid attributes present on both MobileTopBar and MobileBottomNav; E2E UX-02 PASSED |
| 2 | As 4 abas do dashboard (Unidades, Contratos, Parcelas, Locatários) são utilizáveis em 375px — sem overflow horizontal, scroll funciona, botões clicáveis | VERIFIED | Contratos: `overflowX:auto` + `minWidth:680px`; LocatariosDesktop: `overflowX:auto` + `minWidth:700px`, `romma-desktop-only` removed; Parcelas: `overflowX:auto` + `minWidth:580px`; Unidades: card layout, responsive padding `px-4 sm:px-12`; forms collapsed `grid-cols-1 sm:grid-cols-2`; E2E UX-03 (5 tests) all PASSED |
| 3 | Portal do Locatário em 375px exibe contrato ativo e histórico de parcelas sem overflow horizontal | VERIFIED | PortalDashboard: `px-4 sm:px-12 pt-6 sm:pt-12`, h1 `text-[28px] sm:text-[48px]`; ParcelsTable: `overflow-x-auto` wrapper + `min-w-[480px]` inner container; ContratoCard: `grid-cols-1 sm:grid-cols-2` preventing text overflow at 375px; E2E UX-04 PASSED |

**Score:** 3/3 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/ui/DashboardShell.js` | Client Component with CSS render-both shell | VERIFIED | Exists, `"use client"`, 57 lines, imports MobileTopBar/MobileBottomNav/TopStrip/OwnerSidebar, NAV_ITEMS 4 items, ROUTE_TITLES 4 routes, isParcelasRoute logic |
| `src/components/ui/MobileNav.js` | data-testid on MobileTopBar and MobileBottomNav | VERIFIED | `data-testid="mobile-top-bar"` on MobileTopBar root div (line 9), `data-testid="mobile-bottom-nav"` on MobileBottomNav root div (line 46) |
| `src/app/dashboard/layout.js` | Delegates to DashboardShell, stays Server Component | VERIFIED | 5-line file, no `"use client"`, wraps children in `<DashboardShell>` |
| `src/app/globals.css` | `.romma-desktop-only { display: none !important }` in mobile media query | VERIFIED | Lines 358-362: `@media (max-width: 768px)` with `.romma-sidebar-wrapper { display: none !important }`, `.romma-desktop-only { display: none !important }`, `.romma-mobile-only { display: flex; ... }` |
| `src/components/features/Contratos.js` | overflow wrapper + responsive padding | VERIFIED | `overflowX: "auto"` wrapper at line 296, `minWidth: "680px"` inner div at line 297, `px-4 sm:px-12 pt-6 sm:pt-12 pb-20` padding |
| `src/components/features/LocatariosDesktop.js` | overflow wrapper, romma-desktop-only removed | VERIFIED | `overflowX: "auto"` + `minWidth: "700px"` confirmed, no `romma-desktop-only` in file |
| `src/components/features/Parcelas.js` | overflow wrapper + responsive heading | VERIFIED | `overflowX: "auto"` wrapper at line 97, `minWidth: "580px"` inner div, `text-[28px] sm:text-[48px]` heading |
| `src/components/features/Unidades.js` | responsive padding + form grid collapse | VERIFIED | `px-4 sm:px-12 pt-6 sm:pt-12 pb-20` in both SkeletonUnidades and main render (lines 16, 138), `grid-cols-1 sm:grid-cols-2` in form (line 150) |
| `src/components/features/portal/PortalDashboard.js` | responsive padding + responsive h1 | VERIFIED | `px-4 sm:px-12 pt-6 sm:pt-12 pb-20` (line 42), `text-[28px] sm:text-[48px]` (line 47) |
| `src/components/features/portal/ParcelsTable.js` | overflow-x-auto + min-w-[480px] | VERIFIED | `overflow-x-auto` wrapper div (line 8), `min-w-[480px]` inner container (line 9) |
| `src/components/features/portal/ContratoCard.js` | grid-cols-1 sm:grid-cols-2 | VERIFIED | Line 8: `grid-cols-1 sm:grid-cols-2 gap-6 mt-4` |
| `e2e/mobile-responsive.spec.js` | RED specs for UX-02/03/04 | VERIFIED | 89 lines, 3 describes, 7 tests with `viewport: { width: 375, height: 812 }`, scrollWidth assertions, data-testid assertions |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `dashboard/layout.js` | `DashboardShell.js` | import + JSX wrap | VERIFIED | layout.js imports DashboardShell and wraps `{children}` |
| `DashboardShell.js` | `MobileNav.js` | import + render | VERIFIED | imports MobileTopBar/MobileBottomNav, renders them in `.romma-mobile-only` block |
| `DashboardShell.js` | `globals.css` | CSS class binding | VERIFIED | uses `.romma-desktop-only` and `.romma-mobile-only` class names that match globals.css definitions |
| Portal: `PortalDashboard.js` | `ParcelsTable.js` | import + prop | VERIFIED | imports ParcelsTable, passes `parcelas` state prop populated from Supabase query |
| Portal: `PortalDashboard.js` | `ContratoCard.js` | import + prop | VERIFIED | imports ContratoCard, passes `contrato` state populated from Supabase query |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `PortalDashboard.js` | `contrato`, `parcelas` | `getContratoAtivoByLocatario` + `getParcelasPortal` (Supabase queries in useEffect) | Yes — queries Supabase with locatario.id | FLOWING |
| `DashboardShell.js` | `pathname` | `usePathname()` (Next.js router) | Yes — live route | FLOWING |

---

### Behavioral Spot-Checks (E2E)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| UX-02: sidebar hidden, MobileTopBar + MobileBottomNav visible at 375px | `npx playwright test --config=playwright.validation.config.js --grep "UX-02\|UX-03\|UX-04" --project=chromium` | exit 0, `test-results/.last-run.json: {"status":"passed","failedTests":[]}` | PASS |
| UX-03: 5 overflow tests (4 tabs + Parcelas route) all scrollWidth ≤ 375 | (same run) | PASS | PASS |
| UX-04: portal scrollWidth ≤ 375 | (same run) | PASS | PASS |

**E2E run timestamp:** 2026-06-12T06:04:11Z (verified via `test-results/.last-run.json` mtime)
**Total tests:** 7 (1 UX-02 + 5 UX-03 + 1 UX-04)
**Result:** 7/7 passed, 0 failed

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| UX-02 | 13-02 | Dashboard mobile tem sidebar colapsável → MobileTopBar + MobileBottomNav | SATISFIED | DashboardShell + CSS render-both + data-testid + E2E PASSED |
| UX-03 | 13-03 | Todas as 4 abas do dashboard são usáveis em mobile | SATISFIED | overflow wrappers on all 4 tabs, LocatariosDesktop visible on mobile, E2E 5/5 PASSED |
| UX-04 | 13-04 | Portal do Locatário é usável em mobile | SATISFIED | PortalDashboard + ParcelsTable + ContratoCard responsive fixes, E2E PASSED |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No TBD/FIXME/XXX/placeholder markers found in phase-modified files | — | Clean |

---

### Human Verification Required

#### 1. Touch Targets ≥ 44px in Dashboard

**Test:** Open Chrome DevTools, set viewport to 375px width. Navigate to /dashboard/contratos, /dashboard/locatarios, /dashboard/parcelas (via VER → button). Use DevTools inspector to check height of action buttons (Encerrar, Cancelar, Revogar, Pagar).
**Expected:** All interactive buttons have computed height ≥ 44px (py-[10px] applied to 20px font = ~40px minimum, px-3 with border — visually verify tap surface is adequate)
**Why human:** Playwright's `boundingBox()` returns logical/CSS pixels. Real touch target adequacy on iOS/Android involves device pixel ratios, touch hit-testing APIs, and physical mm dimensions that differ from CSS px — only DevTools or a device confirms this.

#### 2. Horizontal Scroll Behavior Inside Table Wrappers

**Test:** Open Chrome DevTools in responsive mode at 375px. Navigate to /dashboard/contratos and /dashboard/locatarios. Swipe horizontally inside the table areas.
**Expected:** Tables scroll horizontally within their `overflow-x:auto` wrappers with smooth momentum scrolling; the page itself does not scroll horizontally.
**Why human:** E2E confirms `scrollWidth ≤ 375` (no page overflow). It does not verify that the inner wrapper scrolls correctly or that the UX is natural on touch — this requires manual interaction in a browser.

---

### Gaps Summary

No automated gaps. All 3 success criteria verified. E2E suite (7/7 tests) passed with exit 0.

Two manual-only behaviors remain unverified by automation — these are deliberate limitations documented in `13-VALIDATION.md` (Manual-Only Verifications section). They do not represent failures but require human confirmation before this phase can be closed as fully verified.

---

_Verified: 2026-06-12T06:05:00Z_
_Verifier: Claude (gsd-verifier)_
