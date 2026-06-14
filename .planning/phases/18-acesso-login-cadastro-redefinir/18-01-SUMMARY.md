---
phase: 18-acesso-login-cadastro-redefinir
plan: "01"
subsystem: auth
tags: [supabase-auth, next-js, react-components, user-metadata, tdd, vitest]

# Dependency graph
requires:
  - phase: 17-fundacao-tokens-mobile-modal-infra
    provides: "proprietarios.nome/sobrenome/telefone columns + --rd-*/--rt-* CSS tokens + .r-* utility classes"
provides:
  - "6 shared auth components under src/components/auth/ (AuthFrame, AuthAside, CornerBrackets, AuthField, AuthBanner, SubmitButton)"
  - "cadastrarProprietario extended to accept nome/sobrenome/telefone and pass via signUp options.data"
  - "tentarRegistrarProprietario extended to INSERT nome/sobrenome/telefone from user_metadata at both call sites"
affects: [18-02, 18-03, 18-04, signup, login, reset-password]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared auth component extraction: split-panel shell (AuthFrame) + panel (AuthAside) + decoration (CornerBrackets) + form primitives (AuthField, AuthBanner, SubmitButton)"
    - "Supabase signUp options.data → user_metadata → /auth/confirm INSERT pipeline"
    - "TDD RED/GREEN on Server Action extension with vitest mocks"

key-files:
  created:
    - src/components/auth/AuthFrame.js
    - src/components/auth/AuthAside.js
    - src/components/auth/CornerBrackets.js
    - src/components/auth/AuthField.js
    - src/components/auth/AuthBanner.js
    - src/components/auth/SubmitButton.js
  modified:
    - src/actions/auth.js
    - src/app/auth/confirm/route.js
    - test/unit/actions/auth.test.js

key-decisions:
  - "UI-SPEC Key Deltas applied verbatim: brightness(0.62), padding 12px 56px 12px 0, SubmitButton padding 17px 22px, CornerBrackets 16px offset, border-2 for idle input, primary-hover for focused label"
  - "Single INSERT with all fields (no INSERT+UPDATE) in tentarRegistrarProprietario; UNIQUE 23505 guard preserved for idempotency"
  - "Phone mask and page redesign deferred to Plans 03/04 as intended"

patterns-established:
  - "AuthFrame receives children prop — form panels rendered inside without knowing frame structure"
  - "AuthBanner TONES object with danger/success/warning keys — all tone-specific values in one place"
  - "AuthField hint prop for static password policy text (.r-meta below field)"

requirements-completed: [ACESSO-01, ACESSO-03]

# Metrics
duration: 35min
completed: 2026-06-14
---

# Phase 18 Plan 01: Shared Auth Components + Metadata Backend Summary

**6 reusable split-panel auth components extracted to src/components/auth/, plus signUp options.data pipeline wiring nome/sobrenome/telefone through email confirmation into proprietarios**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-06-14T00:00:00Z
- **Completed:** 2026-06-14T00:35:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Created 6 `'use client'` auth components under `src/components/auth/` with UI-SPEC delta values applied (brightness 0.62, 12px field padding, 17px/22px button padding, 16px corner offsets)
- Extended `cadastrarProprietario` signature to accept `{ email, senha, nome, sobrenome, telefone }` with 5-field guard and `options.data` pass-through to signUp
- Extended `tentarRegistrarProprietario` to accept `(userId, userMetadata)` and INSERT all 4 columns in a single atomic call; both call sites in route.js updated
- TDD RED/GREEN cycle: 7 unit tests all passing; existing E2E auth-confirm (3/3) stays green

## Task Commits

1. **Task 1: Extract 6 shared auth components** - `7b17ac8` (feat)
2. **Task 2 RED: Failing tests for extended signature** - `bd2a8e0` (test)
3. **Task 2 GREEN: Extend cadastrarProprietario + tentarRegistrarProprietario** - `5f7fe9f` (feat)

## Files Created/Modified
- `src/components/auth/AuthFrame.js` - Full-height shell: TopStrip + 2-col grid + BottomMeta; accepts children
- `src/components/auth/AuthAside.js` - Left panel with hero image (brightness 0.62 filter), gradient, CornerBrackets, wordmark, copyblock
- `src/components/auth/CornerBrackets.js` - Four 22×22px gold L-bracket decorations at 16px inset
- `src/components/auth/AuthField.js` - Underline input with mono label, refLabel, focus/error/hint states; padding 12px 56px 12px 0
- `src/components/auth/AuthBanner.js` - TONES map (danger/success/warning) tone-variant banner
- `src/components/auth/SubmitButton.js` - 3-state bracket button [>]/[···]/[OK] with 17px 22px padding and rBar animation
- `src/actions/auth.js` - Extended `cadastrarProprietario` signature + options.data
- `src/app/auth/confirm/route.js` - Extended `tentarRegistrarProprietario` + both call sites updated
- `test/unit/actions/auth.test.js` - 7 unit tests covering extended signature, options.data, per-field guard, erroMessage spelling

## Decisions Made
- Applied UI-SPEC Key Deltas strictly: did not copy pixel values verbatim from existing analogs (brightness 0.7 → 0.62, padding 14px → 12px, etc.)
- Single INSERT pattern in `tentarRegistrarProprietario` (no INSERT then UPDATE) — columns are nullable so re-confirmation with empty metadata does not crash

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Port 3000 was in use when running E2E — killed the stale next-server process before running `playwright test`. Tests passed 3/3 after freeing port.

## Known Stubs

None — this plan creates shared components only. No pages wire data to them yet (that is the work of Plans 03/04 which consume these components).

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced beyond what the threat model in PLAN.md already covers. supabaseAdmin remains server-only in route.js.

## Next Phase Readiness
- Plans 03/04 can import from `@/components/auth/` for all auth screen redesigns
- `cadastrarProprietario` is ready to receive 6-field form submission from redesigned signup page
- `tentarRegistrarProprietario` will persist metadata for all new signups going forward

---
*Phase: 18-acesso-login-cadastro-redefinir*
*Completed: 2026-06-14*
