---
phase: 18-acesso-login-cadastro-redefinir
plan: "04"
subsystem: auth
tags: [auth, reset-password, split-panel, dual-subflow, role-aware-redirect, bug-fix, e2e, playwright]

# Dependency graph
requires:
  - phase: 18-acesso-login-cadastro-redefinir
    plan: "01"
    provides: "6 shared auth components under src/components/auth/"
  - phase: 18-acesso-login-cadastro-redefinir
    plan: "02"
    provides: "validarSenha in src/lib/auth-form.js"
provides:
  - "Redesigned /auth/reset-password: AuthFrame split-panel + dual sub-flow (request-email + define-new-password) + role-aware redirect bug-fix"
  - "e2e/auth-screens.spec.js: 13 Playwright tests covering login/signup/reset-password layout + interaction"
affects: [auth/reset-password, e2e coverage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Session-based sub-flow detection: supabase.auth.getSession() on mount → isDefineFlow boolean"
    - "Role-aware redirect post-password-reset: rpc('is_proprietario') branch (same pattern as login)"
    - "AuthBanner TONES used for all 4 error states (SENHA_INVALIDA, SENHAS_DIVERGENTES, ERRO_SUPABASE, ERRO_ENVIO) + 2 success states (E-MAIL_ENVIADO, SENHA_DEFINIDA)"

key-files:
  modified:
    - src/app/auth/reset-password/page.js
  created:
    - e2e/auth-screens.spec.js

key-decisions:
  - "Sub-flow detection via getSession() on mount (not query params) — recovery session is set by /auth/confirm before redirect; no token_hash needed at this stage"
  - "DEFINE-NEW-PASSWORD uses showConfirmar state (separate from showSenha) — each password field needs its own toggle per UI-SPEC"
  - "Skeleton render (empty div) during session detection to prevent layout flash before isDefineFlow resolves"

requirements-completed: [ACESSO-01, ACESSO-04]

# Metrics
duration: ~30min
completed: 2026-06-14
tasks_completed: 2
files_modified: 1
files_created: 1
---

# Phase 18 Plan 04: Reset-Password Redesign + E2E Auth Screens Summary

Redesigned `src/app/auth/reset-password/page.js` onto shared split-panel components with dual sub-flow (request-email + define-new-password), password policy enforcement via `validarSenha`, and role-aware redirect bug-fix; added `e2e/auth-screens.spec.js` with 13 passing Playwright tests covering the three auth screens.

## Performance

- **Duration:** ~30 min
- **Completed:** 2026-06-14
- **Tasks:** 2/2
- **Files modified:** 1
- **Files created:** 1

## Accomplishments

- **Task 1:** Rewrote `reset-password/page.js` from a single-flow define-password screen to a dual sub-flow screen using shared `AuthFrame`/`AuthField`/`AuthBanner`/`SubmitButton` components. Session-based sub-flow detection (`supabase.auth.getSession()` on mount) determines which form to render. REQUEST-EMAIL sub-flow: single email field, `resetPasswordForEmail` with `/auth/confirm` redirectTo, `E-MAIL_ENVIADO · 200` success banner, ← LOGIN back button. DEFINE-NEW-PASSWORD sub-flow: two password fields with show/hide toggles, `validarSenha` gate, policy hint, `SENHA_DEFINIDA · 200` success banner, role-aware redirect via `rpc("is_proprietario")` (bug-fix: removes unconditional `/portal/dashboard` from original line 150).

- **Task 2:** Created `e2e/auth-screens.spec.js` with 13 Playwright tests (chromium) covering layout + interaction surface without live email/DB round-trips. Login suite: aside visibility at desktop/mobile, EXIBIR toggle (type change), forgot-password navigation. Signup suite: 6 field labels, password hint text, client-side ERRO_VALIDAÇÃO banner on empty submit, URL stays on /signup. Reset-password suite: default request-email view, REDEFINIR heading, ← LOGIN back navigation. All 13 pass.

## Task Commits

1. **Task 1: Redesign reset-password with dual sub-flow, password policy, role-aware redirect** - `fcd5960` (feat)
2. **Task 2: Add e2e/auth-screens.spec.js covering three auth screens** - `8bc7532` (feat)

## Files Created/Modified

- `src/app/auth/reset-password/page.js` — Redesigned: AuthFrame shell, dual sub-flow, validarSenha, rpc("is_proprietario") redirect (bug-fix), Suspense preserved
- `e2e/auth-screens.spec.js` — 13 Playwright tests: login (6) + signup (4) + reset-password (3)

## Decisions Made

- Sub-flow detection uses `getSession()` on mount (not a query param). The existing `/auth/confirm` route handler already redirects recovery tokens to `/auth/reset-password` and sets the session — so a live session at page load reliably indicates the define-new-password flow.
- Added `showConfirmar` state alongside `showSenha` — both password fields need independent show/hide toggles per UI-SPEC.
- Brief skeleton div while session is being detected prevents layout flash between sub-flow renders.
- Used `getByText(..., { exact: true })` in E2E to avoid strict-mode violation (NOME substring match would also match SOBRENOME).
- Used `getByRole('heading', { name: /REDEFINIR/i })` for headline assertion to avoid multiple matches when SENHA appears in both heading and subtext.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Two E2E tests failed on first run due to strict-mode violations**
- **Found during:** Task 2 execution
- **Issue:** `getByText('NOME')` matched both NOME label and SOBRENOME (which contains "NOME"). `getByText('SENHA')` matched both the h2 heading and subtext paragraph.
- **Fix:** Changed to `getByText('NOME', { exact: true })` for all 6 field labels; changed headline assertion to `getByRole('heading', { name: /REDEFINIR/i })`.
- **Files modified:** `e2e/auth-screens.spec.js`
- **Commit:** `8bc7532`

## Verification

```
npm run build
✓ Compiled successfully in 5.6s
✓ Generating static pages (15/15)

npx eslint src/app/auth/reset-password/page.js --max-warnings=0
ESLint: No issues found

rtk proxy npx playwright test e2e/auth-screens.spec.js --project=chromium --reporter=line
  13 passed (15.7s)
```

Grep checks:
- `@/components/auth` import: FOUND
- `rpc("is_proprietario")`: FOUND
- Unconditional `router.push("/portal/dashboard")$`: ABSENT

## Known Stubs

None — both sub-flows are fully wired. Request-email calls `resetPasswordForEmail` with the correct `redirectTo`. Define-new-password calls `updateUser` and redirects role-aware. No placeholder copy or empty data sources.

## Threat Flags

None — this plan closes threat T-18-12 (Elevation of Privilege: wrong-role redirect after reset) by replacing unconditional `/portal/dashboard` with `rpc("is_proprietario")` branch. No new network endpoints or auth paths introduced beyond what the threat model covers.

## Self-Check: PASSED

- `src/app/auth/reset-password/page.js` — FOUND ✓
- `e2e/auth-screens.spec.js` — FOUND ✓
- Task 1 commit `fcd5960` — verified
- Task 2 commit `8bc7532` — verified
- `@/components/auth` import in reset-password — FOUND ✓
- `rpc("is_proprietario")` in reset-password — FOUND ✓
- Unconditional `/portal/dashboard` redirect — ABSENT ✓
- `npm run build` — exits 0 ✓
- ESLint reset-password/page.js — exits 0 ✓
- `playwright test auth-screens.spec.js` — 13/13 passed ✓

---
*Phase: 18-acesso-login-cadastro-redefinir*
*Completed: 2026-06-14*
