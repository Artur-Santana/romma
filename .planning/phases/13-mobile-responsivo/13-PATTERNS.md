# Phase 13: Mobile Responsivo - Pattern Map

**Mapped:** 2026-06-12
**Files analyzed:** 12
**Analogs found:** 12 / 12

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/ui/DashboardShell.js` | component (shell/layout) | request-response | `src/app/dashboard/page.js` (mobile chrome, lines 138-154, 334-442) | role-match |
| `src/app/dashboard/layout.js` | layout (Server Component) | request-response | Current `src/app/dashboard/layout.js` (itself) | exact |
| `src/app/dashboard/page.js` | page (Server Component) | request-response | Same file (remove chrome wrappers, keep content) | exact |
| `src/app/globals.css` | config (CSS) | — | Same file, line 359 `.romma-sidebar-wrapper { display: none !important }` | exact |
| `src/components/ui/MobileNav.js` | component (UI) | request-response | `e2e/tema.spec.js` data-testid pattern | role-match |
| `src/components/features/Contratos.js` | component (feature) | CRUD | `src/components/features/Parcelas.js` (same COL grid pattern) | exact |
| `src/components/features/LocatariosDesktop.js` | component (feature) | CRUD | `src/components/features/Contratos.js` (same inline grid + romma-page) | exact |
| `src/components/features/Unidades.js` | component (feature) | CRUD | `src/components/features/Contratos.js` (same romma-page + form grid-cols-2) | role-match |
| `src/components/features/Parcelas.js` | component (feature) | CRUD | `src/components/features/Contratos.js` (same grid + COL pattern) | exact |
| `src/components/features/portal/PortalDashboard.js` | component (feature) | request-response | `src/components/features/Parcelas.js` (same Tailwind px/pt pattern) | role-match |
| `src/components/features/portal/ParcelsTable.js` | component (feature) | request-response | `src/components/features/Contratos.js` (overflow fix pattern) | role-match |
| `src/components/features/portal/ContratoCard.js` | component (feature) | request-response | `src/components/features/Contratos.js` (form grid-cols-2 pattern) | role-match |
| `e2e/mobile-responsive.spec.js` | test (E2E) | request-response | `e2e/tema.spec.js` + `e2e/portal.spec.js` | role-match |

> Note: `ContratoCard.js` and `e2e/mobile-responsive.spec.js` are the 12th and 13th entries; the "12" count in the header excludes the test file, which has no codebase analog to discover — only structural patterns.

---

## Pattern Assignments

### `src/components/ui/DashboardShell.js` (NEW — Client Component shell)

**Analog:** `src/app/dashboard/page.js` (lines 138–154 for mobile chrome); `src/app/dashboard/layout.js` (lines 1–20 for desktop chrome); `src/components/ui/MobileNav.js` (lines 1–81 for component API)

**Imports pattern** — from `src/app/dashboard/layout.js` lines 1–2 + `src/components/ui/MobileNav.js` lines 1–6:
```jsx
"use client"

import { usePathname, useRouter } from "next/navigation"
import { MobileTopBar, MobileBottomNav } from "@/components/ui/MobileNav"
import TopStrip from "@/components/ui/TopStrip"
import OwnerSidebar from "@/components/ui/OwnerSidebar"
```

**Desktop chrome pattern** — from `src/app/dashboard/layout.js` lines 4–20 (entire current layout body becomes the desktop block), wrapped in `romma-desktop-only` with inline `display: flex` override:
```jsx
{/* Desktop — romma-desktop-only default is display:block; override to flex inline.
    The media query rule must have !important (globals.css fix) to hide even with inline style. */}
<div className="romma-desktop-only" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
  <TopStrip />
  <div style={{ display: "flex", height: "calc(100vh - 24px)" }}>
    <div className="romma-sidebar-wrapper">
      <OwnerSidebar badges={{}} />
    </div>
    <main style={{ flex: 1, overflow: "auto", background: "var(--background)" }}>
      <div style={{ maxWidth: "1570px", margin: "0 auto", padding: "0 24px" }}>
        {children}
      </div>
    </main>
  </div>
</div>
```

**Mobile chrome pattern** — from `src/app/dashboard/page.js` lines 138–154 / 334–335 (the manual chrome blocks removed from page.js, now owned by the shell):
```jsx
{/* Mobile — romma-mobile-only sets display:flex flex-col h-screen via globals.css */}
<div className="romma-mobile-only">
  <MobileTopBar title={title} onBack={onBack} />
  <main style={{ flex: 1, overflow: "auto", background: "var(--background)" }}>
    {children}
  </main>
  <MobileBottomNav items={NAV_ITEMS} />
</div>
```

**Route-to-title mapping** — D-02/D-03 spec, using `usePathname` (same hook used internally by `MobileBottomNav`, `src/components/ui/MobileNav.js` line 42):
```jsx
const NAV_ITEMS = [
  { href: "/dashboard",              label: "Início",     code: "OVW" },
  { href: "/dashboard/unidades",     label: "Unidades",   code: "UNI" },
  { href: "/dashboard/contratos",    label: "Contratos",  code: "CTR" },
  { href: "/dashboard/locatarios",   label: "Locatários", code: "LOC" },
]

const ROUTE_TITLES = {
  "/dashboard":             "Dashboard",
  "/dashboard/unidades":    "Unidades",
  "/dashboard/contratos":   "Contratos",
  "/dashboard/locatarios":  "Locatários",
}

// Inside component:
const pathname = usePathname()
const router = useRouter()
const isParcelasRoute = pathname.startsWith("/dashboard/contratos/") && pathname !== "/dashboard/contratos"
const title = isParcelasRoute ? "Parcelas" : (ROUTE_TITLES[pathname] ?? "Dashboard")
const onBack = isParcelasRoute ? () => router.back() : undefined
```

---

### `src/app/dashboard/layout.js` (MODIFY — Server Component, import DashboardShell)

**Analog:** Current `src/app/dashboard/layout.js` (lines 1–20 — entire file)

**Current structure** (lines 1–20):
```jsx
import TopStrip from "@/components/ui/TopStrip"
import OwnerSidebar from "@/components/ui/OwnerSidebar"

export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TopStrip />
      <div style={{ display: "flex", height: "calc(100vh - 24px)" }}>
        <div className="romma-sidebar-wrapper">
          <OwnerSidebar badges={{}} />
        </div>
        <main style={{ flex: 1, overflow: "auto", background: "var(--background)" }}>
          <div style={{ maxWidth: "1570px", margin: "0 auto", padding: "0 24px" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
```

**Target structure** — entire body replaced by DashboardShell import + thin delegation. NO `"use client"` directive (must stay Server Component):
```jsx
import DashboardShell from "@/components/ui/DashboardShell"

export default function DashboardLayout({ children }) {
  return <DashboardShell>{children}</DashboardShell>
}
```

---

### `src/app/dashboard/page.js` (MODIFY — remove manual mobile chrome, keep content)

**Analog:** Same file — the two manual chrome blocks identified in RESEARCH.md §Pitfall 1

**Setup-state chrome block to remove** (lines ~138–154):
```jsx
// REMOVE the wrapper div and nav components — keep interior setup content:
// Before:
<div className="flex flex-col h-screen md:hidden">
  <MobileTopBar title="Visão Geral" subtitle="CONSOLE.OS" />
  <div className="romma-mobile-pane flex-1 overflow-auto p-5">
    {/* setup content */}
  </div>
  <MobileBottomNav items={navItems} />
</div>

// After — content direct, chrome stripped:
<div className="flex flex-col md:hidden">
  <div className="romma-mobile-pane flex-1 overflow-auto p-5">
    {/* setup content — unchanged */}
  </div>
</div>
```

**Normal-state mobile chrome block to remove** (lines ~334–335 and ~438–442):
```jsx
// REMOVE the outer wrapper, MobileTopBar, and MobileBottomNav — keep inner content blocks:
// Before:
<div className="flex flex-col h-screen md:hidden">
  <MobileTopBar title="Visão Geral" subtitle="CONSOLE.OS" right={<RealtimeDot label="" />} />
  <div className="romma-mobile-pane flex-1 overflow-auto">
    {/* stats cards, contratos mobile, quick actions */}
  </div>
  <MobileBottomNav items={navItems} />
</div>

// After — content direct:
<div className="flex flex-col md:hidden">
  <div className="romma-mobile-pane flex-1 overflow-auto">
    {/* stats cards, contratos mobile, quick actions — ALL unchanged */}
  </div>
</div>
```

**Desktop wrapper to remove** (lines ~164–165):
```jsx
// REMOVE the romma-desktop-only wrapper div only — keep interior content:
// Before:
<div className="romma-desktop-only">
  <div className="romma-page p-12 pb-20 bg-background min-h-full">
    {/* metrics grid, recent contratos, quick actions */}
  </div>
</div>

// After:
<div className="romma-page p-12 pb-20 bg-background min-h-full">
  {/* metrics grid, recent contratos, quick actions — unchanged */}
</div>
```

---

### `src/app/globals.css` (MODIFY — add !important to romma-desktop-only mobile rule)

**Analog:** Same file, line 359: `.romma-sidebar-wrapper { display: none !important; }` — already uses `!important`. The adjacent rule on line 360 does not.

**Current rule** (lines 355–362):
```css
.romma-desktop-only { display: block; }
.romma-mobile-only  { display: none; }

@media (max-width: 768px) {
  .romma-sidebar-wrapper { display: none !important; }
  .romma-desktop-only    { display: none; }
  .romma-mobile-only     { display: flex; flex-direction: column; height: 100vh; }
}
```

**Fix** — add `!important` to override inline `style={{ display: "flex" }}` from DashboardShell desktop block:
```css
@media (max-width: 768px) {
  .romma-sidebar-wrapper { display: none !important; }
  .romma-desktop-only    { display: none !important; }  /* ← added !important */
  .romma-mobile-only     { display: flex; flex-direction: column; height: 100vh; }
}
```

---

### `src/components/ui/MobileNav.js` (MODIFY — add data-testid attributes)

**Analog:** `e2e/tema.spec.js` line 21 (`data-testid="theme-toggle"` usage pattern)

**Change 1 — MobileTopBar** (line 9, the outer `div`):
```jsx
// Before (line 9):
<div className="bg-background border-b border-[var(--border-2)] px-5 pt-5 pb-4 flex items-center gap-3 shrink-0">
// After:
<div data-testid="mobile-top-bar" className="bg-background border-b border-[var(--border-2)] px-5 pt-5 pb-4 flex items-center gap-3 shrink-0">
```

**Change 2 — MobileBottomNav** (line 46, the outer `div`):
```jsx
// Before (line 46):
<div className="bg-background border-t border-[var(--border-2)] flex shrink-0">
// After:
<div data-testid="mobile-bottom-nav" className="bg-background border-t border-[var(--border-2)] flex shrink-0">
```

These are the only changes to `MobileNav.js` — the component logic is not altered.

---

### `src/components/features/Contratos.js` (MODIFY — overflow-x fix on table + responsive padding + form collapse)

**Analog:** `src/components/features/Parcelas.js` (identical COL pattern)

**Grid const** (lines 46–47):
```jsx
const COL = "116px 1.6fr 1.6fr 1fr 1fr 1.2fr 96px"
const COL_STYLE = { gridTemplateColumns: COL }
```

**Table overflow fix** — wrap the outer `border border-border-3 bg-surface mb-8` container (line 296) with an overflow div and add `minWidth` to the border container:
```jsx
{/* overflow wrapper — NEW outer div */}
<div style={{ overflowX: "auto" }}>
  <div className="border border-border-3 bg-surface mb-8" style={{ minWidth: "680px" }}>
    <div style={COL_STYLE} className="grid bg-[var(--surface-hi)] border-b border-border-3">
      {/* header cells — unchanged */}
    </div>
    {/* row divs — unchanged */}
  </div>
</div>
```

**Form responsive collapse** (line 188):
```jsx
{/* Before: */}
<div className="grid grid-cols-2 gap-4 mb-4">
{/* After: */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
```

**Page padding fix** (lines 18 and 174 — `SkeletonContratos` and main render):
```jsx
{/* Before: */}
<div className="romma-page px-12 pt-12 pb-20 bg-background min-h-full">
{/* After: */}
<div className="romma-page px-4 sm:px-12 pt-6 sm:pt-12 pb-20 bg-background min-h-full">
```

---

### `src/components/features/LocatariosDesktop.js` (MODIFY — remove romma-desktop-only, overflow fix, tap targets)

**Analog:** `src/components/features/Contratos.js` (same inline grid + romma-page pattern)

**Root element fix** (line 104) — RESEARCH §Pitfall 2 — removing `romma-desktop-only` makes the component visible in mobile:
```jsx
{/* Before (line 104): */}
<div className="romma-desktop-only romma-page p-12 bg-background min-h-full">
{/* After — remove romma-desktop-only, make padding responsive: */}
<div className="romma-page px-4 sm:px-12 pt-6 sm:pt-12 pb-20 bg-background min-h-full">
```

**Grid const** (line 101):
```jsx
const GRID = "1.8fr 0.5fr 1.2fr 1.2fr 0.8fr 1.4fr 80px"
```

**Table overflow fix** — wrap `bg-surface border border-border-3` container (line 113) with overflow wrapper + minWidth:
```jsx
<div style={{ overflowX: "auto" }}>
  <div className="bg-surface border border-border-3" style={{ minWidth: "700px" }}>
    <div style={{ display: "grid", gridTemplateColumns: GRID }} className="px-5 py-3 bg-[var(--surface-hi)]">
      {/* header cells — unchanged */}
    </div>
    {/* row divs — unchanged */}
  </div>
</div>
```

**Tap target fix** (RESEARCH §Pitfall 4) — action buttons with `p-0 h-auto` must have a minimum touch height. Pattern reference: `Parcelas.js` line 69 (a correct `py-[10px]` button):
```jsx
{/* Reference for minimum touch target — from Parcelas.js line 69: */}
className="... h-auto py-[10px] px-5"
{/* Replace p-0 h-auto with py-[10px] px-3 minimum on action buttons */}
```

**Invite form collapse** (any `grid-cols-2` in the invite form):
```jsx
{/* Before: */}
<div className="grid grid-cols-2 gap-4">
{/* After: */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
```

---

### `src/components/features/Unidades.js` (MODIFY — padding + form collapse)

**Analog:** `src/components/features/Contratos.js` (same romma-page + form grid-cols-2)

**Page padding fix** (lines 16 and 138 — `SkeletonUnidades` and main render):
```jsx
{/* Before (lines 16 and 138): */}
<div className="romma-page p-12 bg-background min-h-full">
{/* After: */}
<div className="romma-page px-4 sm:px-12 pt-6 sm:pt-12 pb-20 bg-background min-h-full">
```

**Form responsive collapse** (line 150):
```jsx
{/* Before (line 150): */}
<div className="grid grid-cols-2 gap-4 mb-4">
{/* After: */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
```

Note: `Unidades.js` uses `UnidadeCard` for the list (card layout, not grid table) — no overflow fix needed on the list. Only the form needs the collapse.

---

### `src/components/features/Parcelas.js` (MODIFY — overflow-x fix, heading responsive, padding)

**Analog:** `src/components/features/Contratos.js` (identical fix pattern)

**Grid const** (lines 11–12):
```jsx
const COL = "72px 1fr 1fr 1fr 1.2fr 120px"
const gridStyle = { gridTemplateColumns: COL }
```

**Table overflow fix** — wrap `border border-border-3 bg-surface mb-8` container (line 97):
```jsx
<div style={{ overflowX: "auto" }}>
  <div className="border border-border-3 bg-surface mb-8" style={{ minWidth: "580px" }}>
    <div style={gridStyle} className="grid bg-[var(--surface-hi)] border-b border-border-3">
      {/* unchanged */}
    </div>
    {/* row divs — unchanged */}
  </div>
</div>
```

**Heading responsive fix** (line 77):
```jsx
{/* Before (line 77): */}
<h2 className="font-display font-bold text-[48px] leading-none tracking-[-2.4px] text-fg-1 m-0">
{/* After: */}
<h2 className="font-display font-bold text-[28px] sm:text-[48px] leading-none tracking-[-2.4px] text-fg-1 m-0">
```

**Page padding fix** (line 63):
```jsx
{/* Before: */}
<div className="romma-page bg-background min-h-full px-12 pt-12 pb-20">
{/* After: */}
<div className="romma-page bg-background min-h-full px-4 sm:px-12 pt-6 sm:pt-12 pb-20">
```

---

### `src/components/features/portal/PortalDashboard.js` (MODIFY — responsive padding/typography)

**Analog:** `src/components/features/Parcelas.js` (same Tailwind px/pt + heading size pattern)

**Current structure** (lines 42–47):
```jsx
<div className="romma-page bg-background min-h-full px-12 pt-12 pb-20">
  ...
  <h1 className="font-display font-bold text-[48px] leading-none tracking-[-2.4px] text-fg-1 m-0">Seu Contrato.</h1>
```

**Fix** — D-05 spec, Tailwind responsive classes:
```jsx
{/* Before (line 42): */}
<div className="romma-page bg-background min-h-full px-12 pt-12 pb-20">
{/* After: */}
<div className="romma-page bg-background min-h-full px-4 sm:px-12 pt-6 sm:pt-12 pb-20">

{/* Before (line 47): */}
<h1 className="font-display font-bold text-[48px] leading-none tracking-[-2.4px] text-fg-1 m-0">
{/* After: */}
<h1 className="font-display font-bold text-[28px] sm:text-[48px] leading-none tracking-[-2.4px] text-fg-1 m-0">
```

---

### `src/components/features/portal/ParcelsTable.js` (MODIFY — overflow-x fix)

**Analog:** `src/components/features/Contratos.js` overflow fix pattern (but ParcelsTable is pure Tailwind, so use Tailwind min-w)

**Current structure** (lines 6–14):
```jsx
<section data-testid="parcelas-table" aria-label="HISTÓRICO DE PARCELAS" className="mt-10">
  <span className="eyebrow eyebrow--indigo">HISTÓRICO DE PARCELAS</span>
  <div className="mt-4 border border-border-3 bg-surface">
    <div className="grid grid-cols-[60px_1fr_1fr_1.2fr] border-b border-border-3 bg-[oklch(0.26_0_0)]">
```

**Fix** — RESEARCH §Code Examples, Tailwind overflow wrapper + min-w:
```jsx
{/* Before (line 8): */}
<div className="mt-4 border border-border-3 bg-surface">
{/* After: */}
<div className="mt-4 overflow-x-auto">
  <div className="border border-border-3 bg-surface min-w-[480px]">
    {/* all existing content, header div, and row divs — unchanged */}
  </div>
</div>  {/* ← close new overflow wrapper at end of section */}
```

---

### `src/components/features/portal/ContratoCard.js` (VERIFY/MODIFY — grid-cols-2)

**Analog:** `src/components/features/Contratos.js` form grid-cols-2 responsive pattern

**Current structure** (line 8):
```jsx
<div className="grid grid-cols-2 gap-6 mt-4">
```

This renders 4 info blocks (unidade, valor, início, fim, status) in a 2-column layout. At 375px viewport, each column is ~175px wide — likely adequate for `text-[24px]` labels. Visually verify at 375px; apply fix only if content overflows:
```jsx
{/* Fix if needed: */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
```

---

### `e2e/mobile-responsive.spec.js` (NEW — Playwright E2E spec)

**Analog:** `e2e/tema.spec.js` (full 33-line file — `describe` + `beforeEach` + `test.use(viewport)` pattern); `e2e/portal.spec.js` (full 34-line file — LOCATARIO login + portal assertions); `e2e/crud.spec.js` line 33 (viewport override)

**File header + imports** — copy from `e2e/tema.spec.js` lines 1–9:
```js
/**
 * Phase 13 — Mobile Responsivo
 * UX-02: Dashboard sidebar oculta em 375px; MobileTopBar e MobileBottomNav visíveis
 * UX-03: 4 abas do dashboard sem overflow horizontal em 375px
 * UX-04: Portal do Locatário sem overflow horizontal em 375px
 */
import { test, expect } from '@playwright/test'
import { login } from './helpers.js'
import { PROPRIETARIO, LOCATARIO } from './fixtures.js'
```

**Viewport override pattern** — from `e2e/crud.spec.js` line 33:
```js
test.describe('LABEL', () => {
  test.use({ viewport: { width: 375, height: 812 } })
  // ...
})
```

**Login + navigation pattern** — from `e2e/tema.spec.js` lines 16–19 (PROPRIETARIO) and `e2e/portal.spec.js` lines 13–15 (LOCATARIO):
```js
test.beforeEach(async ({ page }) => {
  await login(page, PROPRIETARIO)
  await page.waitForURL('**/dashboard', { timeout: 10_000 })
})
```

**UX-02 assertions** — from RESEARCH §Validation Architecture, using data-testid attributes added to `MobileNav.js`:
```js
test('UX-02 — sidebar oculta; MobileTopBar e MobileBottomNav visíveis', async ({ page }) => {
  await expect(page.locator('.romma-sidebar-wrapper')).toBeHidden()
  await expect(page.locator('[data-testid="mobile-top-bar"]')).toBeVisible()
  await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible()
})
```

**UX-03 scrollWidth pattern** — from RESEARCH §Validation Architecture:
```js
test('UX-03 — /dashboard/contratos sem overflow horizontal', async ({ page }) => {
  await page.goto('/dashboard/contratos')
  await page.waitForLoadState('networkidle')
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(375)
})
```

**UX-04 portal test** — from `e2e/portal.spec.js` full structure, with LOCATARIO login:
```js
test.describe('UX-04 — Portal mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } })
  test.beforeEach(async ({ page }) => {
    await login(page, LOCATARIO)
    await page.waitForURL('**/portal/dashboard', { timeout: 15_000 })
  })
  test('UX-04 — portal sem overflow horizontal', async ({ page }) => {
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(375)
  })
})
```

---

## Shared Patterns

### CSS Visibility Classes
**Source:** `src/app/globals.css` lines 355–362
**Apply to:** `DashboardShell.js` (uses both classes for the two render blocks), `globals.css` (gets the `!important` fix)
```css
/* Default (desktop): */
.romma-desktop-only { display: block; }   /* DashboardShell overrides inline to flex */
.romma-mobile-only  { display: none; }

/* Mobile (max-width: 768px) — after fix: */
.romma-desktop-only { display: none !important; }  /* !important needed to beat inline style */
.romma-mobile-only  { display: flex; flex-direction: column; height: 100vh; }
```

### Responsive Padding (Tailwind)
**Source:** RESEARCH.md §D-05 and `src/components/features/PortalDashboard.js` lines 42/47
**Apply to:** `Contratos.js`, `LocatariosDesktop.js`, `Unidades.js`, `Parcelas.js`, `PortalDashboard.js`
```jsx
// Fixed padding → responsive:
// "px-12 pt-12"  →  "px-4 sm:px-12 pt-6 sm:pt-12"
// "p-12"         →  "px-4 sm:px-12 pt-6 sm:pt-12 pb-20"
```

### Responsive Heading (Tailwind)
**Source:** `src/components/features/Parcelas.js` line 77
**Apply to:** `Parcelas.js`, `PortalDashboard.js`
```jsx
// "text-[48px]"  →  "text-[28px] sm:text-[48px]"
```

### Grid Table Overflow Fix (inline style)
**Source:** RESEARCH.md §Pattern 2 and §Pitfall 3; `src/components/features/Contratos.js` COL pattern
**Apply to:** `Contratos.js`, `LocatariosDesktop.js`, `Parcelas.js`
```jsx
// Wrapper gets overflowX:auto; grid container gets minWidth (NOT the wrapper):
<div style={{ overflowX: "auto" }}>
  <div className="border border-border-3 bg-surface" style={{ minWidth: "NNNpx" }}>
    <div style={{ display: "grid", gridTemplateColumns: COL }}>
```
**minWidth values by file:**
- `Contratos.js` → `680px`
- `LocatariosDesktop.js` → `700px`
- `Parcelas.js` → `580px`
- `ParcelsTable.js` (Tailwind) → `min-w-[480px]` class on inner container

### Grid Form Responsive Collapse (Tailwind)
**Source:** `src/components/features/Contratos.js` line 188
**Apply to:** `Contratos.js`, `LocatariosDesktop.js`, `Unidades.js`, `ContratoCard.js` (if needed)
```jsx
// "grid-cols-2"  →  "grid-cols-1 sm:grid-cols-2"
```

### Playwright E2E Test Structure
**Source:** `e2e/tema.spec.js` (33 lines); `e2e/portal.spec.js` (34 lines); `e2e/crud.spec.js` line 33 (viewport override)
**Apply to:** `e2e/mobile-responsive.spec.js`
```js
// Pattern: describe → use(viewport) → beforeEach(login+waitForURL) → test(assertion)
test.describe('LABEL', () => {
  test.use({ viewport: { width: 375, height: 812 } })
  test.beforeEach(async ({ page }) => {
    await login(page, USER)
    await page.waitForURL('**/route', { timeout: 10_000 })
  })
  test('ID — description', async ({ page }) => { /* assertion */ })
})
```

---

## No Analog Found

All files have analogs. No entries.

---

## Metadata

**Analog search scope:** `src/components/features/`, `src/components/ui/`, `src/app/dashboard/`, `src/app/globals.css`, `e2e/`
**Files scanned:** 14 source files + 10 E2E spec/helper files
**Pattern extraction date:** 2026-06-12
