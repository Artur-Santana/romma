---
phase: 18-acesso-login-cadastro-redefinir
plan: "03"
subsystem: auth
tags: [auth, login, signup, split-panel, validation, phone-mask, shared-components]

# Dependency graph
requires:
  - phase: 18-acesso-login-cadastro-redefinir
    plan: "01"
    provides: "6 shared auth components under src/components/auth/"
  - phase: 18-acesso-login-cadastro-redefinir
    plan: "02"
    provides: "maskPhone, soDigitos, validarCadastro, validarSenha in src/lib/auth-form.js"
provides:
  - "Redesigned /login: AuthFrame split-panel, show/hide password, manter-sessão checkbox, forgot-password navigation, 3-state SubmitButton, role-aware redirect"
  - "Redesigned /signup: 6 fields with phone mask, inline validation via validarCadastro, digits-only telefone to cadastrarProprietario, success banner + form hide"
affects: [login, signup, auth/reset-password]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AuthFrame consumption: pages no longer define inline TopStrip/LeftPanel/BottomMeta — one-line AuthFrame wrapper"
    - "validarCadastro gate pattern: const erro = validarCadastro(form); if (erro) { setErroLocal(erro); return } — before Server Action call"
    - "soDigitos call at submit boundary: telefone: soDigitos(form.telefone) — mask used only for display, digits-only sent to DB"

key-files:
  modified:
    - src/app/login/page.js
    - src/app/signup/page.js

key-decisions:
  - "showConfirmar state added for confirmar-senha toggle (not in plan's state shape listing but required by the extra= prop pattern for CONFIRMAR SENHA field)"
  - "useRouter imported in signup/page.js even though there's no redirect in signup — removed (no router needed; cross-link is plain <a> href)"
  - "Status badge marginBottom 44px desktop (spec) applied as inline style; r-dot used matching shared TopStrip pattern"
  - "EyebrowRail defined inline in each page rather than imported — matches existing codebase pattern where EyebrowRail is a local helper"

requirements-completed: [ACESSO-01, ACESSO-02, ACESSO-03]

# Metrics
duration: ~20min
completed: 2026-06-14
---

# Phase 18 Plan 03: /login + /signup Redesign Summary

Redesigned `src/app/login/page.js` onto shared split-panel components (AuthFrame/AuthField/AuthBanner/SubmitButton) and extended `src/app/signup/page.js` from 2 fields to 6 with phone masking, inline validation gate, and email-sent success state.

## Performance

- **Duration:** ~20 min
- **Started:** 2026-06-14T06:10:00Z
- **Completed:** 2026-06-14T06:30:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Rewrote `login/page.js`: removed 344-line inline-everything file; now 148-line clean consumer of `AuthFrame`, `AuthField`, `AuthBanner`, `SubmitButton` from `@/components/auth/`. Forgot-password now navigates to `/auth/reset-password` with `router.push` instead of inlining `resetPasswordForEmail`. Role-aware redirect `rpc('is_proprietario')` preserved. r-fade entrance, status badge, show/hide password toggle, cosmetic manter-sessão checkbox all wired.
- Rewrote `signup/page.js`: extended from 2 fields (email + senha) to 6 fields (nome, sobrenome, email, telefone, senha, confirmarSenha). `validarCadastro(form)` gates submit before calling Server Action. `soDigitos(form.telefone)` strips mask at submit boundary. Telefone field onChange uses `maskPhone`. Nome+sobrenome render in a 2-col grid. SENHA field carries `hint` prop for password policy. On `email_sent`: success AuthBanner visible and entire field/button block hidden via `{!isEmailSent && (...)}`.

## Task Commits

1. **Task 1: Redesign /login onto shared components** - `1ee7281` (feat)
2. **Task 2: Extend + redesign /signup to 6 fields with validation and metadata submit** - `0f86f50` (feat)

## Files Created/Modified

- `src/app/login/page.js` — Redesigned: AuthFrame shell, shared components, navigation-based forgot-password, role-aware redirect preserved
- `src/app/signup/page.js` — Extended: 6-field form, phone mask, validarCadastro gate, soDigitos at submit, success banner + form hide

## Decisions Made

- Added `showConfirmar` boolean state for the CONFIRMAR SENHA show/hide toggle (plan's state shape only listed `showSenha` for the SENHA field, but the CONFIRMAR SENHA field requires its own toggle per UI-SPEC)
- `useRouter` removed from signup page on review — no router.push needed there; cross-link uses plain `<a href>` per the existing codebase's link pattern
- `EyebrowRail` kept as a local helper in each page rather than a shared component — matches the existing codebase's pattern (login/page.js also defined it inline) and the plan doesn't direct extraction

## Deviations from Plan

None — plan executed exactly as written. The `showConfirmar` state addition is an implementation detail required by the spec's show/hide toggle on both password fields, not a deviation.

## Verification

```
npm run test:unit
Test Files  7 passed (7)
     Tests  120 passed (120)

npm run build
✓ Compiled successfully
✓ Generating static pages (15/15)

npx eslint src/app/login/page.js src/app/signup/page.js --max-warnings=0
ESLint: No issues found (both files)
```

## Known Stubs

None — both pages are fully wired. Login calls Supabase auth and redirects. Signup calls `cadastrarProprietario` Server Action with all 6 fields. No placeholder copy or empty data sources.

## Threat Flags

None — no new network endpoints introduced. Both pages consume existing auth paths (signInWithPassword, cadastrarProprietario Server Action). T-18-07 mitigated: generic error copy `Credenciais inválidas` (no user-enumeration signal). T-18-09 mitigated: `validarCadastro` blocks invalid submit; `soDigitos` ensures only digits reach DB. T-18-10 mitigated: signup page imports only the Server Action, never supabaseAdmin.

## Self-Check: PASSED

- `src/app/login/page.js` — FOUND ✓
- `src/app/signup/page.js` — FOUND ✓
- Task 1 commit `1ee7281` — FOUND ✓
- Task 2 commit `0f86f50` — FOUND ✓
- `@/components/auth` import in login/page.js — FOUND ✓
- `router.push("/auth/reset-password")` in login/page.js — FOUND ✓
- `@/lib/auth-form` import in signup/page.js — FOUND ✓
- `soDigitos(form.telefone)` in signup/page.js — FOUND ✓
- `npm run test:unit` — exits 0, 120 tests ✓
- `npm run build` — exits 0 ✓
- ESLint both files — exits 0 ✓
