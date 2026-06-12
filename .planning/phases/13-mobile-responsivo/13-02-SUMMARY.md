---
phase: 13-mobile-responsivo
plan: "02"
subsystem: ui
tags: [mobile, responsive, dashboard, shell, nextjs, tailwind]

requires:
  - phase: 13-01
    provides: MobileNav.js (MobileTopBar + MobileBottomNav), globals.css breakpoints, mobile spec UX-02

provides:
  - DashboardShell Client Component with CSS render-both desktop/mobile chrome
  - dashboard/layout.js delegating to DashboardShell (Server Component preserved)
  - data-testid attributes on MobileTopBar and MobileBottomNav
  - globals.css !important fix for .romma-desktop-only in mobile media query
  - dashboard/page.js without duplicate mobile chrome

affects:
  - 13-03 (responsive fixes to *Desktop.js components — builds on DashboardShell)
  - 13-04 (portal fixes — unrelated but same phase)

tech-stack:
  added: []
  patterns:
    - "CSS render-both: DashboardShell renders desktop + mobile chrome as siblings; CSS hides wrong block per viewport"
    - "!important on romma-desktop-only media query rule to override inline style={{ display: 'flex' }}"
    - "layout.js stays pure Server Component; DashboardShell is its only Client Component child"

key-files:
  created:
    - src/components/ui/DashboardShell.js
  modified:
    - src/app/dashboard/layout.js
    - src/app/globals.css
    - src/components/ui/MobileNav.js
    - src/app/dashboard/page.js

key-decisions:
  - "CSS render-both over useMediaQuery hook: SSR-safe, no hydration flash, simpler code"
  - "!important required on .romma-desktop-only to override inline style={{ display: 'flex' }} on desktop block"
  - "Remove only chrome (MobileTopBar/MobileBottomNav/h-screen) from page.js; preserve romma-desktop-only and md:hidden content wrappers"

patterns-established:
  - "DashboardShell: two sibling divs (romma-desktop-only + romma-mobile-only) with {children} in both"

requirements-completed: [UX-02]

duration: 12min
completed: 2026-06-12
---

# Phase 13 Plan 02: DashboardShell Summary

**DashboardShell Client Component with CSS render-both pattern wires dashboard layout to mobile chrome (MobileTopBar + MobileBottomNav) via globals.css visibility classes, eliminating double chrome from dashboard/page.js**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-12T03:54:00Z
- **Completed:** 2026-06-12T04:06:19Z
- **Tasks:** 2
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments

- Created `DashboardShell.js` as Client Component with render-both approach: desktop chrome (TopStrip + OwnerSidebar) in `romma-desktop-only` div, mobile chrome (MobileTopBar + MobileBottomNav) in `romma-mobile-only` div, both receiving `{children}`
- Updated `dashboard/layout.js` to delegate entirely to DashboardShell while remaining a pure Server Component (no `"use client"` directive)
- Added `data-testid="mobile-top-bar"` and `data-testid="mobile-bottom-nav"` to MobileNav.js for Playwright UX-02 spec
- Added `!important` to `.romma-desktop-only { display: none; }` in mobile media query — necessary to override the inline `style={{ display: "flex" }}` on the desktop block
- Removed duplicate MobileTopBar/MobileBottomNav chrome from both setup-state and normal-state blocks in `dashboard/page.js`, preserving all content wrappers (`romma-desktop-only` x2, `md:hidden` x2, `romma-mobile-pane` x2)

## Task Commits

1. **Task 1: DashboardShell + layout + data-testid + globals.css** - `b9d746a` (feat)
2. **Task 2: Remove duplicate chrome from page.js** - `c3b9c82` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/ui/DashboardShell.js` — New Client Component, CSS render-both shell with NAV_ITEMS, ROUTE_TITLES, isParcelasRoute logic
- `src/app/dashboard/layout.js` — Reduced to 5 lines: imports DashboardShell, wraps children
- `src/app/globals.css` — Added `!important` to `.romma-desktop-only` mobile rule
- `src/components/ui/MobileNav.js` — Added `data-testid` to MobileTopBar and MobileBottomNav root divs
- `src/app/dashboard/page.js` — Removed MobileTopBar/MobileBottomNav chrome, navItems const, and MobileNav import; stripped `h-screen` from md:hidden wrappers

## Decisions Made

- CSS render-both chosen over `useMediaQuery` hook: avoids hydration mismatch, SSR-safe, no flash on load
- The `!important` on `.romma-desktop-only` is essential: DashboardShell's desktop block uses `style={{ display: "flex" }}` inline, which outranks a plain CSS media query rule without `!important`
- Preserved `romma-desktop-only` wrappers in page.js content — they work as content visibility gates when page.js renders inside DashboardShell's mobile block, hiding desktop content via the `!important` rule

## Deviations from Plan

None — plan executed exactly as written. The PATTERNS.md note about removing `romma-desktop-only` from content was correctly flagged as incorrect in the plan's action text; the plan's action was followed (preserve the wrappers).

## Issues Encountered

None.

## Known Stubs

None — no placeholder text or hardcoded empty values introduced.

## Threat Flags

None — purely layout/CSS changes. No new network endpoints, auth paths, or schema changes introduced. Auth guard in layout.js untouched.

## Self-Check: PASSED

- `src/components/ui/DashboardShell.js` — exists, has `"use client"`, MobileTopBar, MobileBottomNav, NAV_ITEMS (4 items), ROUTE_TITLES (4 routes), isParcelasRoute, router.back()
- `src/app/dashboard/layout.js` — no `"use client"`, contains `<DashboardShell>{children}</DashboardShell>`
- `src/components/ui/MobileNav.js` — contains `data-testid="mobile-top-bar"` and `data-testid="mobile-bottom-nav"`
- `src/app/globals.css` — contains `display: none !important` in media query
- `src/app/dashboard/page.js` — 0 MobileBottomNav JSX, 0 `h-screen md:hidden`, 2 `romma-desktop-only`, 2 `md:hidden`, 2 `romma-mobile-pane`
- Commits `b9d746a` and `c3b9c82` present in git log

## Next Phase Readiness

- DashboardShell is live; UX-02 spec (sidebar hidden + mobile nav visible at 375px) should now pass
- /dashboard mobile now shows single top bar + bottom nav from DashboardShell; no double chrome
- Ready for 13-03: responsive fixes to ContratosDesktop, LocatariosDesktop, Unidades, Parcelas

---
*Phase: 13-mobile-responsivo*
*Completed: 2026-06-12*
