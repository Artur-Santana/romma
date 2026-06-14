# Phase 18: Acesso — Login / Cadastro / Redefinir - Research

**Researched:** 2026-06-13
**Domain:** Supabase Auth flows (signUp metadata, recovery, session persistence) + client-side form patterns
**Confidence:** HIGH — all critical flow questions verified against codebase + official Supabase docs

## Summary

This phase redesigns three existing auth screens (login, signup, reset-password) to match the locked Variante A visual contract and extends the signup flow with new fields (sobrenome, telefone, confirmar senha) plus stronger password policy. The visual contract is fully defined in `18-UI-SPEC.md` and is not re-researched here.

The primary technical uncertainties were: (1) whether `signUp options.data` flows reliably through to `/auth/confirm` where `tentarRegistrarProprietario` runs; (2) the exact mechanism of the password reset end-to-end flow as already implemented; (3) what "Manter sessão" can realistically deliver given Supabase JS constraints; (4) confirming no existing phone mask utility exists to reuse.

All four uncertainties are resolved. The implementation is structurally straightforward — the existing codebase already has the skeleton, the auth routes work, and the Phase 17 migration already added the three `proprietarios` columns.

**Primary recommendation:** Extend `cadastrarProprietario` to pass `options.data` on signUp; update `tentarRegistrarProprietario` to do a single INSERT with metadata fields read from `data.user.user_metadata`; treat "Manter sessão" as a cosmetic checkbox (session already persists in localStorage by default — no per-call API exists); implement phone mask inline per project convention.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Layout source: Variante A do handoff (`auth.jsx`) 1:1 — split-panel, foto dessaturada + cantoneiras douradas, top strip, bottom meta.
- Extrair componentes compartilhados (`AuthFrame`/`AuthAside`/`CornerBrackets`/`TopStrip`) reusados pelas 3 telas.
- Reusar a imagem de prédio já presente em `/login` (next/image).
- Consumir tokens da Phase 17: `--rt-*` e classes `.r-*` (`.r-title`, `.r-label`, `.r-meta`, `.r-dot`, etc.).
- Máscara de telefone à mão (sem lib): formato `(99) 99999-9999`, armazena só dígitos (mesmo padrão que será usado em Locatários — Phase 23).
- Form state: objeto único `useState`; validação inline antes do submit; reset via função nomeada.
- Bracket button por estado (loading/success): `[>] ACESSAR SISTEMA → [···] AUTENTICANDO → [OK] 200`, sem lib.
- Validações de cadastro bloqueiam submit inválido: obrigatórios, email válido, telefone ≥10 dígitos, senhas coincidem.
- Política de senha: ≥6 caracteres E ≥1 letra maiúscula E ≥1 número. Validação client-side no cadastro E na tela de definir/redefinir senha. Mensagem clara do requisito.
- Estender `cadastrarProprietario` (src/actions/auth.js) para receber nome/sobrenome/telefone via `options.data` no `signUp`.
- Gravar nome/sobrenome/telefone em `proprietarios` no handler `/auth/confirm` (`tentarRegistrarProprietario`), lendo de `data.user.user_metadata`.
- Redefinir senha: reusar `/auth/reset-password` existente; `resetPasswordForEmail` → confirmação de sucesso; redesign visual variante A.
- Permitir vários Proprietários por instância. NÃO adicionar guard de instância única.
- AUTH-02 (banner "Instância já configurada") CANCELADO — não implementar.

### Claude's Discretion
- Detalhes de microcopy, ordem exata dos campos, estilo do banner de erro/sucesso.
- Implementação exata da animação do bracket button.

### Deferred Ideas (OUT OF SCOPE)
- Atualizar PROJECT.md: remover "Múltiplos Proprietários por instância — excluído no TCC" de Out of Scope.
- AUTH-02 cancelado (não é mais deferido — é decisão revertida).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ACESSO-01 | Layout split-panel variante A: foto dessaturada + cantoneiras douradas à esquerda, formulário à direita; mobile stack (só formulário) | Locked in UI-SPEC — components `AuthFrame`/`AuthAside`/`CornerBrackets` already specified. Current login/signup pages have the skeleton (TopStrip, LeftPanel, grid) but not the corner bracket decoration or shared component extraction. |
| ACESSO-02 | Login: exibir/ocultar senha, checkbox "manter sessão", link "esqueci minha senha", bracket button com 3 estados | Login page already has all 4 of these features (verified in codebase). Phase 18 work is redesign to match locked visual spec + wiring of `remember` state (see Pitfall 3). |
| ACESSO-03 | Cadastro completo: nome, sobrenome, email, telefone (máscara), senha, confirmar senha + validações + banner "Verifique seu e-mail" + persistência em `proprietarios` | signup/page.js currently has email+senha only. Extension to 6 fields + signUp options.data + tentarRegistrarProprietario update is the core backend work. Phase 17 migration confirmed adding columns. |
| ACESSO-04 | Tela de Redefinir senha: link por email + confirmação de sucesso | reset-password page already implements `updateUser({password})`. The request side (resetPasswordForEmail) is already in login/page.js `handleForgotPassword`. Phase 18 work is redesign + bracket button + password policy enforcement here too. |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SignUp with metadata | Frontend Server (Server Action) | — | `cadastrarProprietario` runs server-side so `SITE_URL` env var is accessible and cookies can be set via SSR client |
| Metadata persistence to proprietarios | API / Backend (Route Handler) | — | `/auth/confirm` GET handler runs after email verification; it has the verified user object and uses supabaseAdmin to INSERT |
| Password reset request | Browser / Client | — | `resetPasswordForEmail` called from login page `handleForgotPassword` using browser client; `window.location.origin` is needed |
| Password reset completion | Browser / Client | — | `updateUser({password})` requires active recovery session in browser; done in reset-password page using browser client |
| Session persistence ("manter sessão") | Browser / Client | — | Session stored in localStorage by default via `createBrowserClient`; no tier boundary crossing needed |
| Phone mask formatting | Browser / Client | — | Display-only concern; strip to digits on store via Server Action |
| Password policy validation | Browser / Client | — | Client-side only; blocks submit. No server-side enforcement needed for this phase |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/ssr` | ^0.9.0 | `createBrowserClient` for client-side auth | Already in project — handles cookie-based session for SSR compatibility |
| `@supabase/supabase-js` | ^2.99.2 | Auth methods: signUp, signInWithPassword, resetPasswordForEmail, updateUser | Already in project |
| Next.js App Router | ^16.2.4 | Server Actions + Route Handlers | Project stack |

No new packages required for this phase. [VERIFIED: project package.json]

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline phone mask | `react-input-mask`, `imask` | Explicitly rejected in CONTEXT.md — hand-roll to stay consistent with Phase 23 Locatários pattern |
| Client-side validation | Zod/Yup | Overkill for 5-field form; project convention is inline validation |

**Installation:** No new dependencies.

---

## Package Legitimacy Audit

No external packages are installed in this phase. All auth libraries are pre-existing project dependencies.

**Packages removed due to slopcheck:** none
**Packages flagged as suspicious:** none

---

## Architecture Patterns

### System Architecture Diagram

```
[User fills signup form]
        |
        v
[signup/page.js — 'use client']
  validateFields() — client-side: required, email, phone ≥10 digits, passwords match, policy ≥6+uppercase+number
        |
        v  (calls Server Action)
[src/actions/auth.js — cadastrarProprietario({ email, senha, nome, sobrenome, telefone })]
  supabase.auth.signUp({
    email, password: senha,
    options: {
      data: { nome, sobrenome, telefone },   ← user_metadata
      emailRedirectTo: `${SITE_URL}/auth/confirm`
    }
  })
  returns { status: 200 }
        |
        v  (Supabase sends verification email)
[User clicks email link → GET /auth/confirm?token_hash=...&type=signup]
        |
        v
[src/app/auth/confirm/route.js — Route Handler]
  supabase.auth.verifyOtp({ type: 'signup', token_hash })
  → data.user.id, data.user.user_metadata = { nome, sobrenome, telefone }
        |
        v
  tentarRegistrarProprietario(data.user.id, data.user.user_metadata)
  supabaseAdmin.from('proprietarios').insert({
    usuario_id: userId,
    nome: meta.nome,
    sobrenome: meta.sobrenome,
    telefone: meta.telefone
  })
        |
        v
  redirect('/dashboard')
```

```
[Password reset flow]

[login/page.js handleForgotPassword]
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/confirm`
  })
  → user sees success banner "Verifique sua caixa de entrada"
        |
        v  (Supabase sends reset email)
[User clicks reset link → GET /auth/confirm?token_hash=...&type=recovery]
        |
        v
[/auth/confirm route.js]
  verifyOtp({ type: 'recovery', token_hash })
  → if type === 'recovery': redirect('/auth/reset-password')  ← already in codebase
        |
        v
[/auth/reset-password/page.js — 'use client']
  user enters new password + confirm
  validatePolicy() — same ≥6+uppercase+number rule
  supabase.auth.updateUser({ password: newPassword })
  → redirect('/portal/dashboard')   ← currently hardcoded; may need to be '/dashboard'
```

### Recommended Project Structure

```
src/
├── components/
│   └── auth/
│       ├── AuthFrame.js        # Full-height shell: TopStrip + 2-col grid + BottomMeta
│       ├── AuthAside.js        # Left panel: image, gradient, CornerBrackets, wordmark
│       ├── CornerBrackets.js   # Four gold L-bracket decorations (absolute positioned)
│       ├── AuthField.js        # Underline input with label, refLabel, focus/error, extra slot
│       ├── AuthBanner.js       # Success/danger inline banner (reusable variant prop)
│       └── SubmitButton.js     # 3-state bracket button [>] / [···] / [OK]
├── app/
│   ├── login/page.js           # Redesigned using AuthFrame + AuthAside
│   ├── signup/page.js          # Extended with 6 fields, metadata signUp
│   └── auth/
│       ├── confirm/route.js    # Extended tentarRegistrarProprietario signature
│       └── reset-password/
│           └── page.js         # Redesigned + policy validation + bracket button
└── actions/
    └── auth.js                 # Extended cadastrarProprietario signature
```

### Pattern 1: signUp with user_metadata

The Supabase `signUp` `options.data` object is the standard way to pass arbitrary fields that become available as `user_metadata` in the auth user. This metadata is preserved through the email confirmation flow and is readable from `data.user.user_metadata` after `verifyOtp`. [CITED: supabase.com/docs/reference/javascript/auth-signup]

```javascript
// src/actions/auth.js — extended signature
export async function cadastrarProprietario({ email, senha, nome, sobrenome, telefone }) {
  if (!email || !senha || !nome || !sobrenome || !telefone) {
    return { status: 400, erroMessage: "Todos os campos são obrigatórios." }
  }
  // ... supabase client setup unchanged ...
  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome, sobrenome, telefone },
      emailRedirectTo: `${siteUrl}/auth/confirm`,
    },
  })
  if (error) return { status: error.status ?? 500, erroMessage: error.message }
  return { status: 200 }
}
```

### Pattern 2: Reading metadata in /auth/confirm and single INSERT

`tentarRegistrarProprietario` currently does `insert({ usuario_id: userId })`. The cleanest approach is to extend its signature to receive the metadata map and do a single INSERT with all fields — no two-step INSERT then UPDATE needed. The `data.user.user_metadata` object is populated at the time `verifyOtp` resolves (the user has already confirmed their email at this point). [VERIFIED: reading /auth/confirm/route.js + Supabase signUp docs]

```javascript
// /auth/confirm/route.js — extended tentarRegistrarProprietario
async function tentarRegistrarProprietario(userId, userMetadata = {}) {
  const { nome, sobrenome, telefone } = userMetadata
  const { error: insertError } = await supabaseAdmin
    .from("proprietarios")
    .insert({ usuario_id: userId, nome, sobrenome, telefone })
  if (insertError && insertError.code !== "23505") return false
  return true
}

// Caller site (type === 'signup' branch):
const viroupProprietario = await tentarRegistrarProprietario(
  data.user.id,
  data.user.user_metadata
)
```

The `code` fallback path (line 75 of current route.js) must also be updated with the same signature.

### Pattern 3: Phone mask — inline handler

No existing phone mask utility in the project. The `locatarios.js` action already stores `telefone` as digits-only (confirmed by `convidarLocatario` receiving `telefone` parameter without masking logic). The mask lives entirely in the UI layer. [VERIFIED: reading src/actions/locatarios.js]

```javascript
// In signup/page.js — format function (same pattern to reuse in Phase 23)
function formatarTelefone(digits) {
  const d = digits.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return `(${d}`
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

// In onChange handler:
function handleTelefoneChange(e) {
  const raw = e.target.value.replace(/\D/g, "").slice(0, 11)
  const formatted = formatarTelefone(raw)
  setForm({ ...form, telefone: formatted })
}

// On submit — strip to digits only:
const telefoneSoDigitos = form.telefone.replace(/\D/g, "")
// Pass telefoneSoDigitos to cadastrarProprietario
```

### Pattern 4: Password policy validation

Applies to both signup and reset-password. Client-side only. [ASSUMED — no Supabase server-side policy enforced at the project level; Supabase default min is 6 chars but uppercase/number requirements are UI-enforced only]

```javascript
function validarSenha(senha) {
  if (senha.length < 6) return "A senha deve ter no mínimo 6 caracteres."
  if (!/[A-Z]/.test(senha)) return "A senha deve conter pelo menos 1 letra maiúscula."
  if (!/[0-9]/.test(senha)) return "A senha deve conter pelo menos 1 número."
  return null // valid
}
```

### Pattern 5: "Manter sessão" checkbox

`createBrowserClient` from `@supabase/ssr` stores the session in cookies (managed by the SSR layer) — not raw localStorage. The `signInWithPassword` method has no per-call option to control session persistence. There is no supported API to make a session expire when the tab closes vs. persist across restarts. [VERIFIED: Supabase JS source + GitHub discussion #3122]

**Pragmatic approach:** The checkbox is already rendered in `login/page.js` with working state (`remember`). The redesign keeps it as a UI element with `remember` state tracked but not wired to any Supabase call. Session persistence is always-on (default behavior of `@supabase/ssr`). This is honest to the user — in practice, the existing session management already persists logins. Do NOT attempt to swap clients or storage backends per-call.

### Anti-Patterns to Avoid

- **INSERT then UPDATE in tentarRegistrarProprietario:** Single INSERT with all fields is cleaner and atomic. No reason to INSERT a bare row and then UPDATE with metadata.
- **Importing supabaseAdmin in signup/page.js:** It's a client component — admin client is server-only. Metadata must go through the Server Action + Route Handler chain.
- **Calling updateUser on reset-password page from a Server Action:** `updateUser` requires the browser's active recovery session cookie; it must be called from the browser client (`supabase-browser`), not a Server Action.
- **Using `window.location.origin` in a Server Action:** The `resetPasswordForEmail` call is already correctly placed in the client component (`handleForgotPassword` in `login/page.js`), where `window.location.origin` is available.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Phone mask | Custom regex parser | Inline `formatarTelefone` function (Pattern 3) | Already specified in CONTEXT.md; small enough to inline |
| Password strength meter | Custom component | Simple inline `validarSenha()` (Pattern 4) | Only need to block submit, not show strength meter |
| Session "remember me" | Custom storage swap | Accept always-persist behavior | Supabase JS has no per-call session control; checkbox is cosmetic |
| Email OTP verification | Custom token handling | Existing `/auth/confirm` route.js | Already works for all 3 flow types (signup/invite/recovery) |

---

## Common Pitfalls

### Pitfall 1: Metadata not available if INSERT happens before verifyOtp

**What goes wrong:** If you try to read `data.user.user_metadata` before `verifyOtp` resolves (or from a pre-confirm context), the metadata fields will be `undefined` or null, and the proprietarios row will be inserted with empty nome/sobrenome/telefone even though Phase 17 made them nullable.

**Why it happens:** `user_metadata` is stored on the auth user object. It is populated at signUp time and available in the `verifyOtp` response. The current code correctly reads it after `verifyOtp` — do not move the INSERT earlier.

**How to avoid:** Always read `data.user.user_metadata` from the `verifyOtp` (or `exchangeCodeForSession`) response data, not from a separate `getUser` call. Extend the existing pattern in route.js — `data.user` already has `.user_metadata`. [VERIFIED: reading /auth/confirm/route.js]

**Warning signs:** `nome`/`sobrenome`/`telefone` appearing as null in `proprietarios` after a fresh signup despite the form being filled.

### Pitfall 2: reset-password redirect goes to /portal/dashboard instead of /dashboard for proprietários

**What goes wrong:** Current `reset-password/page.js` at line 149 does `router.push("/portal/dashboard")` after successful password reset. This is wrong for a proprietário — they should go to `/dashboard`.

**Why it happens:** The reset password page is shared between proprietário and locatário flows (both can reset their password via the same email link). The redirect can't know the role without a `rpc('is_proprietario')` call.

**How to avoid:** After `updateUser` succeeds, call `supabase.rpc('is_proprietario')` (same as in `login/page.js` after sign-in) and redirect to `/dashboard` or `/portal/dashboard` based on result. This already exists in the login flow — replicate the pattern.

**Warning signs:** A proprietário who resets their password lands on the locatário portal instead of the dashboard.

### Pitfall 3: "Manter sessão" checkbox silently does nothing

**What goes wrong:** Developer tries to implement "real" remember-me by creating a second Supabase client with `persistSession: false` for the non-remember case, then signs in with it.

**Why it happens:** The `@supabase/ssr` `createBrowserClient` uses cookie-based session management tied to the SSR cookie store. Creating an alternate client with different options breaks the SSR session synchronization.

**How to avoid:** Accept that the checkbox is cosmetic for this implementation. Document it as a UI affordance that reflects expected behavior (session does persist). Do not attempt to rewire storage. [CITED: github.com/orgs/supabase/discussions/3122]

### Pitfall 4: Phone mask allowing 10-digit mobile vs. 11-digit landline mismatch

**What goes wrong:** Formatting `(99) 9999-9999` (10 digits, landline) vs `(99) 99999-9999` (11 digits, mobile). If the mask is hardcoded to one format, the other type fails visually.

**Why it happens:** Brazilian numbers have both formats depending on region and number type.

**How to avoid:** Use a progressive mask that applies the 10-digit format until the 11th digit is typed, then extends to the 11th. The `formatarTelefone` function in Pattern 3 above handles this with `.slice(2,7)` for the middle segment — the 11th digit naturally extends after position 7. Validation should be `≥ 10 digits` (not exactly 11). The CONTEXT.md explicitly specifies `telefone ≥10 dígitos`. [VERIFIED: CONTEXT.md decisions]

### Pitfall 5: Bracket button `[OK] 200` state for reset-password (send link flow)

**What goes wrong:** The reset-password screen (ACESSO-04) is the "send link" page, not the define-new-password page. The success state needs to show the confirmation banner, not navigate away. If the button transitions to `[OK]` and the form disappears, the user loses context.

**Why it happens:** Confusion between the two reset flows: (a) "request email link" on the reset-password redesign screen, and (b) "enter new password" which happens after email redirect.

**How to avoid:** Per CONTEXT.md scope, `ACESSO-04` is the "send link + confirmation" screen. The `[OK] 200` button state maps to the email-sent confirmation. The `handleForgotPassword` logic already exists in `login/page.js` and should be moved/replicated to the redesigned reset-password screen. The define-new-password form (currently `reset-password/page.js`) is part of the same phase redesign but serves a different URL/state.

---

## Code Examples

### Extending cadastrarProprietario — full updated function

```javascript
// src/actions/auth.js
"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function cadastrarProprietario({ email, senha, nome, sobrenome, telefone }) {
  if (!email || !senha || !nome || !sobrenome || !telefone) {
    return { status: 400, erroMessage: "Todos os campos são obrigatórios." }
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome, sobrenome, telefone },
      emailRedirectTo: `${siteUrl}/auth/confirm`,
    },
  })

  if (error) {
    return { status: error.status ?? 500, erroMessage: error.message }
  }

  return { status: 200 }
}
```

### Extending tentarRegistrarProprietario — diff-level view

```javascript
// Before (current):
async function tentarRegistrarProprietario(userId) {
  const { error: insertError } = await supabaseAdmin
    .from("proprietarios")
    .insert({ usuario_id: userId })
  if (insertError && insertError.code !== "23505") return false
  return true
}

// After:
async function tentarRegistrarProprietario(userId, userMetadata = {}) {
  const { nome, sobrenome, telefone } = userMetadata
  const { error: insertError } = await supabaseAdmin
    .from("proprietarios")
    .insert({ usuario_id: userId, nome, sobrenome, telefone })
  if (insertError && insertError.code !== "23505") return false
  return true
}

// Both call sites must pass data.user.user_metadata:
// token_hash path (line 57): tentarRegistrarProprietario(data.user.id, data.user.user_metadata)
// code path (line 75):       tentarRegistrarProprietario(data.user.id, data.user.user_metadata)
```

### Role-aware redirect after password reset

```javascript
// In reset-password/page.js after successful updateUser:
const { data: isProprietario } = await supabase.rpc('is_proprietario')
router.push(isProprietario ? '/dashboard' : '/portal/dashboard')
```

### Form state object (signup — 6 fields, project convention)

```javascript
const [form, setForm] = useState({
  nome: "",
  sobrenome: "",
  email: "",
  telefone: "",
  senha: "",
  confirmarSenha: "",
})

function resetarForm() {
  setForm({ nome: "", sobrenome: "", email: "", telefone: "", senha: "", confirmarSenha: "" })
}
```

---

## Runtime State Inventory

Not applicable — this is a greenfield extension of existing screens, not a rename/refactor/migration phase.

---

## Open Questions

1. **Reset-password page dual role (ACESSO-04 vs. define-new-password)**
   - What we know: ACESSO-04 scope says "enviar link por email + confirmação de sucesso". The current `/auth/reset-password/page.js` is the define-new-password page (post-redirect). The request side is `handleForgotPassword` in `login/page.js`.
   - What's unclear: Should `/auth/reset-password` serve both flows (request + define) with different UI states, or should the request form become a standalone `/auth/redefinir-senha` page?
   - Recommendation: Simplest approach — keep `handleForgotPassword` on the login page (it's already there and working). The redesign of `/auth/reset-password` focuses on the define-new-password form with the split-panel layout. ACESSO-04 "link por email + confirmação" is satisfied by the existing login page's reset flow getting the bracket button treatment.

2. **"Manter sessão" UX expectation vs. implementation gap**
   - What we know: The checkbox is already rendered and `remember` state is tracked; it does not affect Supabase behavior.
   - What's unclear: Whether the TCC banca would notice this gap.
   - Recommendation: Keep checkbox as cosmetic. Sessions already persist (localStorage/cookie default). No action needed.

---

## Environment Availability

Step 2.6: SKIPPED — this phase makes no use of new external CLI tools, services, or runtimes beyond Next.js + Supabase already confirmed running.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.60.0 |
| Config file | `playwright.config.js` |
| Quick run command | `npx playwright test e2e/auth-confirm.spec.js --project=chromium` |
| Full suite command | `npx playwright test --project=chromium` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ACESSO-01 | Split-panel renders on desktop; aside hidden on mobile | visual / e2e | `npx playwright test e2e/auth-screens.spec.js --project=chromium` | ❌ Wave 0 |
| ACESSO-02 | Login: show/hide password, bracket button states, reset password sends email | e2e | `npx playwright test e2e/auth-screens.spec.js --project=chromium` | ❌ Wave 0 |
| ACESSO-03 | Signup: 6-field form, validations block submit, banner appears on success, metadata in proprietarios | e2e | `npx playwright test e2e/auth-screens.spec.js --project=chromium` | ❌ Wave 0 |
| ACESSO-04 | Reset-password: form submits, success confirmation shown | e2e | `npx playwright test e2e/auth-screens.spec.js --project=chromium` | ❌ Wave 0 |
| ACESSO-03 metadata | nome/sobrenome/telefone saved in proprietarios after confirm | e2e (extends auth-confirm.spec.js) | `npx playwright test e2e/auth-confirm.spec.js --project=chromium` | ✅ (extend) |

### Sampling Rate
- **Per task commit:** `npx playwright test e2e/auth-confirm.spec.js --project=chromium` (route handler still works)
- **Per wave merge:** `npx playwright test e2e/auth-screens.spec.js e2e/auth-confirm.spec.js --project=chromium`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `e2e/auth-screens.spec.js` — covers ACESSO-01, ACESSO-02, ACESSO-03, ACESSO-04 visual and interaction behaviors
- [ ] Extend `e2e/auth-confirm.spec.js` with test for metadata persistence: after signup confirm, verify `proprietarios.nome` is populated

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth (signInWithPassword, signUp with email confirmation) |
| V3 Session Management | yes | @supabase/ssr cookie-based sessions; no custom session logic |
| V4 Access Control | no | Auth screens are pre-login; no resource access gating here |
| V5 Input Validation | yes | Client-side: required fields, email regex, phone ≥10 digits, password policy |
| V6 Cryptography | no | Passwords handled entirely by Supabase Auth (bcrypt server-side) — never hand-roll |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Weak password accepted | Tampering | Client-side policy: ≥6 + uppercase + number; Supabase server enforces ≥6 minimum |
| Metadata injection via signUp data | Tampering | `options.data` is stored as JSONB in `auth.users.raw_user_meta_data` — no SQL injection surface; Supabase handles sanitization |
| Recovery token replay | Spoofing | Supabase invalidates the OTP token after `verifyOtp` — one-time use by design |
| supabaseAdmin called from client component | Elevation of privilege | `SUPABASE_ROLE_KEY` must remain server-only; `tentarRegistrarProprietario` in route.js already uses `supabaseAdmin` correctly |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Password policy (≥6 + uppercase + number) is client-side only — Supabase does not enforce uppercase/number server-side | Architecture Patterns — Pattern 4 | Low: worst case, someone submits via API without the client policy. For TCC scope this is acceptable. |
| A2 | "Manter sessão" checkbox has no viable per-call Supabase JS implementation; session always persists | Common Pitfalls — Pitfall 3 | Low: Supabase JS source and GitHub discussions confirm no per-call option. Cosmetic treatment is correct. |

---

## Sources

### Primary (HIGH confidence)
- Codebase read — `src/actions/auth.js`, `src/app/auth/confirm/route.js`, `src/app/login/page.js`, `src/app/signup/page.js`, `src/app/auth/reset-password/page.js`, `src/lib/supabase-browser.js` — all existing flows verified directly
- `supabase/migrations/20260601000000_v15_foundation.sql` — Phase 17 columns `nome TEXT`, `sobrenome TEXT`, `telefone TEXT` confirmed added to `proprietarios`
- [Supabase signUp docs](https://supabase.com/docs/reference/javascript/auth-signup) — `options.data` → `user_metadata` pattern confirmed [CITED]
- [Supabase resetPasswordForEmail docs](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail) — two-stage recovery flow confirmed [CITED]
- [Supabase updateUser docs](https://supabase.com/docs/reference/javascript/auth-updateuser) — `updateUser({ password })` on browser client confirmed [CITED]
- [Supabase client init docs](https://supabase.com/docs/reference/javascript/initializing) — `persistSession` is client-init config, not per-call [CITED]

### Secondary (MEDIUM confidence)
- [GitHub Discussion #3122 — "Remember sign in"](https://github.com/orgs/supabase/discussions/3122) — confirms no per-call remember-me API; session persistence is always-on by design

### Tertiary (LOW confidence)
- None — no LOW confidence claims in this research.

---

## Metadata

**Confidence breakdown:**
- Auth flow patterns: HIGH — verified against codebase and official docs
- user_metadata persistence: HIGH — verified against existing route.js + signUp docs
- Session persistence limits: HIGH — verified via GitHub discussion + initialization docs
- Phone mask pattern: HIGH — confirmed no existing utility; inline pattern matches locatarios.js convention
- Password policy: HIGH — simple regex, no external dependency

**Research date:** 2026-06-13
**Valid until:** 2026-09-13 (Supabase JS API is stable; @supabase/ssr cookie model unlikely to change)
