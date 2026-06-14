---
phase: 18-acesso-login-cadastro-redefinir
verified: 2026-06-14T07:00:00Z
status: human_needed
score: 8/8 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Visual — split-panel layout at desktop (1280px+): AuthAside visible with hero image, corner brackets, wordmark, headline copy; form panel scrollable on the right"
    expected: "Left panel shows desaturated building photo with gold corner brackets, CONSOLE + ROMMA wordmark at top, 'CONTROLE INABALÁVEL DE CADA.ATIVO' headline; right panel shows form"
    why_human: "AuthAside renders an image and CSS filter — visual fidelity cannot be asserted by grep or unit tests"
  - test: "Visual — mobile (375px): AuthAside hidden (display:none via hidden class), form panel fills screen and scrolls correctly"
    expected: "Left panel absent; only the form panel is visible and scrollable"
    why_human: "Tailwind responsive class 'hidden lg:block' on AuthAside requires viewport-level rendering to confirm"
  - test: "Login flow — real Supabase auth: enter valid Proprietário credentials, submit, confirm role-aware redirect to /dashboard"
    expected: "Status transitions idle → autenticando → concedido; redirect to /dashboard (not /portal/dashboard)"
    why_human: "Requires live Supabase session; cannot be asserted without a running server and real credentials"
  - test: "Signup flow — complete happy path: fill 6 fields (valid data), submit, confirm 'Verifique seu e-mail' success banner appears and form disappears"
    expected: "Banner tone=success with code 'VERIFIQUE SEU E-MAIL · 200' visible; all input fields hidden; no redirect"
    why_human: "Requires live Supabase signUp call returning status 200; cannot be mocked without a running server"
  - test: "Email confirmation flow: click link from inbox, confirm redirect to /dashboard and that a proprietarios row is created with nome/sobrenome/telefone populated"
    expected: "Browser lands on /dashboard; Supabase proprietarios table has a row for the user with non-null nome, sobrenome, telefone"
    why_human: "Requires real email delivery and live /auth/confirm route handler; cannot be unit-tested"
  - test: "Password reset request flow: enter email on reset-password, submit, confirm 'E-MAIL_ENVIADO · 200' banner; no unconditional redirect"
    expected: "Success banner appears, form hidden, user stays on reset-password page"
    why_human: "Requires live resetPasswordForEmail call; success/error depends on Supabase SMTP config"
  - test: "Password reset define flow: arrive at /auth/reset-password via recovery email link; confirm define-new-password sub-flow is shown (not request-email sub-flow); update password; confirm role-aware redirect"
    expected: "Two password fields visible (not the email request form); after valid submit redirect goes to /dashboard for Proprietário"
    why_human: "Requires CR-02 cookie propagation to work end-to-end; session must exist at /auth/reset-password on arrival — cannot verify without real email round-trip"
  - test: "3-state bracket button transitions: submit login form → button shows [···] AUTENTICANDO → on success [OK] ACESSO CONCEDIDO before redirect"
    expected: "Visual transition through all three states in sequence; rBar progress bar animation visible during loading"
    why_human: "State machine timing requires live async auth call in a browser; unit tests cover pure logic only"
---

# Phase 18: Acesso (Login / Cadastro / Redefinir) Verification Report

**Phase Goal:** O Proprietário acessa e se cadastra através de telas de Acesso polidas (variante A), com cadastro completo (nome, sobrenome, telefone com máscara, confirmar senha) e fluxo de redefinição de senha.
**Verified:** 2026-06-14T07:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 6 shared auth components exist under src/components/auth/ and export default components | VERIFIED | All 6 files confirmed: AuthFrame, AuthAside, CornerBrackets, AuthField, AuthBanner, SubmitButton; each starts with `"use client"` and has a single default export |
| 2 | cadastrarProprietario accepts nome/sobrenome/telefone and passes them as signUp options.data | VERIFIED | `src/actions/auth.js` line 40: `data: { nome, sobrenome, telefone }` inside options; line 8: guard on all 5 fields; line 32-35: SITE_URL fail-loud (CR-03 fixed) |
| 3 | tentarRegistrarProprietario writes nome/sobrenome/telefone into proprietarios from user_metadata | VERIFIED | `src/app/auth/confirm/route.js` line 34: destructures `{ nome, sobrenome, telefone }` from userMetadata; line 37: INSERT `{ usuario_id: userId, nome, sobrenome, telefone }`; called at token_hash path (line 74) and code path (lines 100-103) |
| 4 | Login renders split-panel layout with show/hide password, manter-sessão checkbox, forgot-password link, and 3-state bracket button | VERIFIED | `src/app/login/page.js` imports `AuthFrame`, `AuthField`, `AuthBanner`, `SubmitButton` from `@/components/auth/`; renders `<AuthFrame>` (line 258); router.push("/auth/reset-password") at line 207; no inline TopStrip/LeftPanel/BottomMeta |
| 5 | Signup renders 6 fields with inline validation blocking invalid submit and a 'Verifique seu e-mail' success banner | VERIFIED | `src/app/signup/page.js` form state has keys `{ nome, sobrenome, email, telefone, senha, confirmarSenha }`; calls `validarCadastro(form)` before submit; `isEmailSent` guards form visibility; success banner with code "VERIFIQUE SEU E-MAIL · 200" |
| 6 | Signup submits digits-only telefone to cadastrarProprietario | VERIFIED | Line 79: `soDigitos(form.telefone)` passed to cadastrarProprietario; maskPhone applied on onChange; `@/lib/auth-form` imported |
| 7 | Reset-password renders split-panel and handles both sub-flows: request-email and define-new-password with role-aware redirect | VERIFIED | Imports `AuthFrame` and `@/components/auth/`; `getSession()` determines `isDefineFlow`; `resetPasswordForEmail` called with `redirectTo` ending `/auth/confirm` (line 76); `validarSenha` gates define-flow; role-aware redirect via `rpc("is_proprietario")` (line 113-114); Suspense preserved (line 411); unconditional `/portal/dashboard` redirect absent |
| 8 | Pure form-logic utilities (maskPhone, soDigitos, validarSenha, validarCadastro) are unit-tested and correct | VERIFIED | `src/lib/auth-form.js` exports all 4 named functions; 121 unit tests pass (7 files); no React/Supabase/use-client imports in module |

**Score: 8/8 truths verified**

---

### Critical Issues Resolved (Code Review findings)

| ID | Finding | Fix Location | Verified |
|----|---------|-------------|---------|
| CR-01 | PKCE code path unconditionally promoted every locatário to Proprietário | `src/app/auth/confirm/route.js` line 95-107: `if (meta.nome)` guard before calling tentarRegistrarProprietario | VERIFIED |
| CR-02 | Recovery session cookie not propagated through NextResponse.redirect() | `src/app/auth/confirm/route.js` lines 60-69: creates redirectRes first, copies all staged cookies from cookieStore onto redirect response | VERIFIED |
| CR-03 | SITE_URL fallback resolved to Supabase API URL | `src/actions/auth.js` lines 32-35: fail-loud return `{ status: 500, erroMessage: "Configuração de servidor incompleta..." }` when SITE_URL absent; NEXT_PUBLIC_SUPABASE_URL fallback removed | VERIFIED |

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/auth/AuthFrame.js` | Split-panel shell: TopStrip + 2-col grid + AuthAside + BottomMeta | VERIFIED | Renders h-screen flex flex-col; lg:grid-cols-[1.05fr_1fr]; imports AuthAside; children in r-scroll panel |
| `src/components/auth/AuthAside.js` | Left photo panel with gradient + CornerBrackets + wordmark | VERIFIED | hidden lg:block; brightness(0.62) filter; imports CornerBrackets; wordmark top:36; copyblock bottom:56 |
| `src/components/auth/CornerBrackets.js` | Four gold L-bracket decorations | VERIFIED | borderColor rgba(201,168,76,0.7); 4 corners at 16px offset; borderWidth 0 base with per-corner 2 sides |
| `src/components/auth/AuthField.js` | Underline input with mono label, refLabel, focus/error/hint | VERIFIED | padding "12px 56px 12px 0"; label color transitions; hint r-meta slot; extra slot for password toggle |
| `src/components/auth/AuthBanner.js` | tone-variant banner (danger/success/warning) | VERIFIED | TONES object with danger/success/warning keys; borderLeft 2px; mark box; code r-label; body mono 12px |
| `src/components/auth/SubmitButton.js` | 3-state bracket button [>]/[···]/[OK] | VERIFIED | padding "17px 22px"; disabled={isLoad \|\| isSuccess} (WR-02 fix applied); rBar animation; 3 bracket states |
| `src/actions/auth.js` | cadastrarProprietario extended signature | VERIFIED | Destructures { email, senha, nome, sobrenome, telefone }; guard on all 5; options.data = { nome, sobrenome, telefone }; SITE_URL fail-loud |
| `src/app/auth/confirm/route.js` | metadata persistence + role guards | VERIFIED | tentarRegistrarProprietario(userId, userMetadata) with INSERT 4 cols; CR-01 meta.nome guard in code path; CR-02 cookie copy for recovery |
| `src/lib/auth-form.js` | Pure form utilities: maskPhone, soDigitos, validarSenha, validarCadastro | VERIFIED | 4 named exports; no framework dependencies; correct validation order (phone before password) |
| `src/app/login/page.js` | Redesigned login (ACESSO-01/02) | VERIFIED | AuthFrame + AuthField + SubmitButton; router.push /auth/reset-password; rpc is_proprietario redirect; no inline layout components |
| `src/app/signup/page.js` | Extended signup 6 fields (ACESSO-03) | VERIFIED | All 6 fields; maskPhone onChange; validarCadastro gate; soDigitos(form.telefone) on submit; isEmailSent banner |
| `src/app/auth/reset-password/page.js` | Dual sub-flow reset (ACESSO-01/04) | VERIFIED | AuthFrame; getSession detection; request-email + define-new-password sub-flows; validarSenha; role-aware redirect; Suspense |
| `e2e/auth-screens.spec.js` | Playwright coverage of 3 auth screens | VERIFIED | 13 tests covering login/signup/reset-password layout + interaction (confirmed from plan SUMMARY: 13 passed) |
| `test/unit/auth-form.test.js` | Vitest unit coverage | VERIFIED | 152 lines; imports all 4 exports from @/lib/auth-form; 121 tests pass |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/actions/auth.js` | `supabase.auth.signUp options.data` | `data: { nome, sobrenome, telefone }` | WIRED | Line 40 confirmed |
| `src/app/auth/confirm/route.js` | `proprietarios.insert` | `insert({ usuario_id: userId, nome, sobrenome, telefone })` | WIRED | Line 37 confirmed; called at both token_hash (line 74) and code (line 102) paths |
| `src/app/login/page.js` | `src/components/auth/*` | import shared components | WIRED | Lines 7-10: AuthFrame, AuthField, AuthBanner, SubmitButton imported |
| `src/app/signup/page.js` | `src/lib/auth-form.js` | maskPhone + validarCadastro + soDigitos | WIRED | Line 6 import; maskPhone on onChange; validarCadastro in handleSubmit; soDigitos in submit payload |
| `src/app/signup/page.js` | `cadastrarProprietario` | Server Action with nome/sobrenome/telefone | WIRED | Line 7 import; line 74-80: called with all 6 fields |
| `src/app/auth/reset-password/page.js` | `src/components/auth/*` | import shared components | WIRED | Lines 7-10 confirmed |
| `src/app/auth/reset-password/page.js` | `supabase.rpc("is_proprietario")` | role-aware redirect after updateUser | WIRED | Line 113 confirmed; ternary at line 114 |
| `src/app/auth/reset-password/page.js` | `src/lib/auth-form.js` | validarSenha for new-password policy | WIRED | Line 6 import; line 92 call in handleDefinirSenha |

---

### Data-Flow Trace (Level 4)

Auth screens do not render dynamic data fetched from the database (they are input-only forms leading to Supabase auth calls). Level 4 data-flow trace is not applicable — no component renders a list or record fetched from a data store.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All unit tests pass | `npm run test:unit` | 121 passed (7 files) | PASS |
| auth-form exports are correct pure functions | `grep -n "export function" src/lib/auth-form.js` | 4 exports: maskPhone, soDigitos, validarSenha, validarCadastro | PASS |
| SITE_URL fail-loud present | `grep "status: 500, erroMessage" src/actions/auth.js` | Line 34: return { status: 500, erroMessage: "Configuração de servidor incompleta..." } | PASS |
| CR-01 meta.nome guard present | `grep "meta.nome" src/app/auth/confirm/route.js` | Line 101: `if (meta.nome)` | PASS |
| CR-02 cookie copy present | `grep "cookieStore.getAll\|redirectRes.cookies.set" src/app/auth/confirm/route.js` | Lines 65-67 confirmed | PASS |
| No unconditional /portal/dashboard in reset-password | `grep "push.*portal/dashboard" src/app/auth/reset-password/page.js` | Only inside `isProprietario ? "/dashboard" : "/portal/dashboard"` ternary | PASS |
| No TBD/FIXME/XXX debt markers | `grep -r "TBD\|FIXME\|XXX" src/components/auth/ src/actions/auth.js src/app/auth/ src/lib/auth-form.js` | 0 matches | PASS |

---

### Probe Execution

No probe scripts declared or present in this phase. Step 7c: SKIPPED (no probe-*.sh files).

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ACESSO-01 | Plans 01, 03, 04 | Split-panel layout (variante A): photo panel + form panel; mobile stack (form only) | SATISFIED | AuthFrame + AuthAside in all 3 screens; AuthAside hidden lg:block; login/signup/reset-password all render `<AuthFrame>` |
| ACESSO-02 | Plan 03 | Login: show/hide password, manter sessão, esqueci minha senha, 3-state bracket button | SATISFIED | Password toggle in AuthField extra slot; custom checkbox; router.push("/auth/reset-password"); SubmitButton 3 states |
| ACESSO-03 | Plans 01, 02, 03 | Signup: 6 fields with validation, phone mask, confirmar senha, success banner | SATISFIED | All 6 fields in signup/page.js; validarCadastro gate; maskPhone; soDigitos; email_sent banner; nome/sobrenome/telefone in signUp options.data |
| ACESSO-04 | Plan 04 | Reset-password: request-email sub-flow + success confirmation | SATISFIED | resetPasswordForEmail called; E-MAIL_ENVIADO · 200 banner; define-new-password sub-flow with validarSenha and role-aware redirect |

All 4 requirements declared for Phase 18 are SATISFIED. No orphaned requirements found (REQUIREMENTS.md traceability table maps ACESSO-01..04 exclusively to Phase 18, all marked Complete).

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|---------|--------|
| (none) | — | No TBD/FIXME/XXX, no stubs, no hardcoded empty data | — | — |

No anti-patterns found in Phase 18 files. The WR-02 double-submit fix (SubmitButton `disabled={isLoad || isSuccess}`) confirmed applied.

---

### Human Verification Required

#### 1. Split-Panel Visual Fidelity (Desktop)

**Test:** Open `/login`, `/signup`, `/auth/reset-password` at 1280px+ viewport width in a browser.
**Expected:** Left panel visible with desaturated hero building photo, gold corner brackets, CONSOLE + ROMMA wordmark, and the "CONTROLE INABALÁVEL DE CADA.ATIVO" headline. Right panel shows form.
**Why human:** CSS filter, image rendering, and pixel-level visual alignment cannot be verified by grep or unit tests.

#### 2. Split-Panel Mobile Stack (375px)

**Test:** Resize browser to 375px width or use Chrome DevTools mobile emulation.
**Expected:** Left photo panel is absent (hidden); only the form panel is visible and scrollable without overflow.
**Why human:** Tailwind `hidden lg:block` and responsive scroll behavior require viewport-level rendering.

#### 3. Login Happy Path — Real Supabase Auth

**Test:** On `/login`, enter valid Proprietário email and password, submit.
**Expected:** Button shows `[···] AUTENTICANDO`, then `[OK] ACESSO CONCEDIDO`, then redirect to `/dashboard` (not `/portal/dashboard`).
**Why human:** Requires live Supabase session and real credentials.

#### 4. Signup Complete Happy Path

**Test:** On `/signup`, fill all 6 fields with valid data (name, valid email, phone with 11 digits, password meeting policy, matching confirmar). Submit.
**Expected:** Success banner `VERIFIQUE SEU E-MAIL · 200` appears; all form fields hidden. No redirect.
**Why human:** Requires live Supabase signUp call returning status 200.

#### 5. Email Confirmation + proprietarios Row Population

**Test:** Click the verification link from the signup confirmation email. Check the `proprietarios` Supabase table.
**Expected:** Browser redirects to `/dashboard`; `proprietarios` row has non-null `nome`, `sobrenome`, `telefone` from signup metadata.
**Why human:** Requires real email delivery and live `/auth/confirm` route handler execution.

#### 6. Password Reset Request Flow

**Test:** On `/auth/reset-password` (without a recovery session), enter a valid email, submit ENVIAR LINK.
**Expected:** `E-MAIL_ENVIADO · 200` success banner appears; form hidden. User stays on page.
**Why human:** Requires live `resetPasswordForEmail` call with Supabase SMTP configured.

#### 7. Password Reset Define Flow (End-to-End, CR-02 Validation)

**Test:** Click the reset-password link from the recovery email. Verify `/auth/reset-password` shows the define-new-password form (not the request-email form). Enter new password meeting policy, submit.
**Expected:** Recovery session cookie present (CR-02 fix); define-new-password sub-flow active; on success, role-aware redirect to `/dashboard` for Proprietário.
**Why human:** Validates CR-02 cookie propagation end-to-end; requires real email round-trip and live session.

#### 8. 3-State Bracket Button Visual Transition

**Test:** Submit a valid login (or observe any form submission in progress).
**Expected:** `[>] ACESSAR SISTEMA` → `[···] AUTENTICANDO` with rBar animation → `[OK] ACESSO CONCEDIDO`.
**Why human:** State machine timing and CSS animation require live async call in a browser.

---

### Gaps Summary

None — all 8 must-have truths are VERIFIED. All 3 critical review findings (CR-01, CR-02, CR-03) are confirmed fixed in code. All 4 requirements (ACESSO-01 through ACESSO-04) are satisfied. No stub artifacts or missing wiring found.

The human verification items are not code gaps — they are behavioral assertions that require a live browser + real Supabase environment (visual fidelity, real auth flows, email delivery, end-to-end CR-02 cookie validation). The code is correctly authored; these items cannot be resolved by further code inspection.

---

_Verified: 2026-06-14T07:00:00Z_
_Verifier: Claude (gsd-verifier)_
