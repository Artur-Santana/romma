---
phase: 18-acesso-login-cadastro-redefinir
reviewed: 2026-06-14T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/components/auth/AuthFrame.js
  - src/components/auth/AuthAside.js
  - src/components/auth/CornerBrackets.js
  - src/components/auth/AuthField.js
  - src/components/auth/AuthBanner.js
  - src/components/auth/SubmitButton.js
  - src/lib/auth-form.js
  - src/actions/auth.js
  - src/app/auth/confirm/route.js
  - src/app/login/page.js
  - src/app/signup/page.js
  - src/app/auth/reset-password/page.js
  - e2e/auth-screens.spec.js
  - test/unit/auth-form.test.js
  - test/unit/actions/auth.test.js
findings:
  critical: 3
  warning: 5
  info: 3
  total: 11
status: fixed
fixed_at: 2026-06-14T06:45:00Z
fixes_applied:
  - CR-01: commit 14b4a18
  - CR-02: commit 14b4a18
  - CR-03: commit d21c0ff
  - WR-01: commit 53801c9
  - WR-02: commit 24a83f2
  - WR-03: commit d2a87a1
  - WR-04: commit 0f62145
  - WR-05: commit aa67b87
skipped: []
---

# Phase 18: Code Review Report

**Reviewed:** 2026-06-14
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Phase 18 redesigns three auth screens (login, signup, reset-password) and extends the signup Server Action with metadata fields (nome, sobrenome, telefone). The split-panel layout, bracket button, and shared component extraction are cleanly implemented. The `auth-form.js` utility and its unit tests are solid. Most auth flow wiring is correct.

Three blockers require fixes before ship: (1) the PKCE code fallback path in `/auth/confirm` unconditionally calls `tentarRegistrarProprietario` without checking the auth type, promoting any locatário who uses a PKCE-based invite link to proprietário and redirecting them to the wrong dashboard; (2) the `SITE_URL` fallback silently resolves to the Supabase API base URL, producing email links that point to the wrong domain; (3) the recovery session cookie set by `verifyOtp` in the Route Handler is not attached to the `NextResponse.redirect()` object, so the browser never receives the session and the define-new-password sub-flow can never activate.

Five warnings cover missing input validation, a double-submit race window, error-message opacity, and component duplication. Three info items note cosmetic/minor issues.

---

## Critical Issues

### CR-01: PKCE code fallback promotes every locatário to proprietário

**File:** `src/app/auth/confirm/route.js:69-83`

**Issue:** The `token_hash + type` path (lines 45-67) correctly guards `tentarRegistrarProprietario` behind `if (type === "signup")`. The `code` fallback path has no such guard — it calls `tentarRegistrarProprietario` unconditionally for every user who arrives via a PKCE code. A locatário clicking an invite link that Supabase resolves via the PKCE code flow will be inserted into `proprietarios`, the insert succeeds (no prior UNIQUE violation), `viroupProprietario` returns `true`, and they are redirected to `/dashboard` — completely bypassing the locatário portal. `atualizarStatusConvite` is then also skipped because the early return fires.

**Fix:**
```javascript
if (code) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL("/login?error=invite_invalid", request.url))
  }
  if (data?.user) {
    // type is not available in the code path — infer role from user metadata.
    // Only promote to proprietário if this is clearly a signup (not an invite).
    // Supabase sets app_metadata.provider = "email" for both, but
    // invite users have is_anonymous = false and no user_metadata from our signUp call.
    // Safest heuristic: only promote when user_metadata contains 'nome' (set by cadastrarProprietario).
    const meta = data.user.user_metadata ?? {}
    if (meta.nome) {
      const viroupProprietario = await tentarRegistrarProprietario(data.user.id, meta)
      if (viroupProprietario) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }
    await atualizarStatusConvite(data.user.id, data.user.email)
  }
  return NextResponse.redirect(new URL("/portal/dashboard", request.url))
}
```

Alternatively, set a distinct flag in `options.data` during `signUp` (e.g. `role: "proprietario"`) and check `meta.role` here — that is more explicit.

---

### CR-02: Recovery session cookie not propagated through NextResponse.redirect()

**File:** `src/app/auth/confirm/route.js:52-53`

**Issue:** After `supabase.auth.verifyOtp({ type: "recovery", token_hash })` succeeds, Supabase writes the recovery session cookies via the `setAll` handler in `createServer()`. However, `setAll` calls `cookiesNavegador.set(...)` which, in a Next.js Route Handler, stages cookies to be appended to the **current response**. The current response in this code is `NextResponse.redirect(new URL("/auth/reset-password", request.url))` — a plain redirect constructed independently. The staged cookies never get attached to it.

The practical consequence: the browser arrives at `/auth/reset-password` without a session cookie. `supabase.auth.getSession()` returns `null`. `isDefineFlow` is set to `false`. The user is shown the request-email form instead of the define-new-password form. The password reset flow is completely broken for the `token_hash` path (which is the primary path for Supabase-generated reset emails).

**Fix:** Create the redirect response first, then copy the staged cookies onto it:

```javascript
if (type === "recovery") {
  const redirectRes = NextResponse.redirect(new URL("/auth/reset-password", request.url))
  // Flush cookies staged by verifyOtp onto the redirect response
  const cookieStore = await cookies()
  for (const cookie of cookieStore.getAll()) {
    redirectRes.cookies.set(cookie.name, cookie.value, cookie)
  }
  return redirectRes
}
```

The same issue applies to every other `NextResponse.redirect()` call in this route handler when the Supabase client stages new cookies (e.g., after `verifyOtp` for type=signup). The signup flow may work today only because the confirmation URL embeds the session in a hash fragment (handled client-side) — but this is fragile and should be corrected for all branches.

---

### CR-03: SITE_URL fallback resolves to Supabase API URL, breaking email confirmation links

**File:** `src/actions/auth.js:32`

**Issue:**
```javascript
const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
```

When `SITE_URL` is not set (e.g., on a fresh clone, in CI, or a new Vercel environment), `siteUrl` becomes `https://vfymttcajeyhrmsyhrtj.supabase.co`. The `emailRedirectTo` becomes `https://vfymttcajeyhrmsyhrtj.supabase.co/auth/confirm` — pointing at the Supabase project itself, not the application. The user's verification email contains a link to the wrong domain. Clicking it produces a 404 or an unexpected Supabase response; the user cannot confirm their email.

This fails silently: `signUp` returns `{ error: null }`, the signup page shows "Verifique seu e-mail", and the user is stuck.

**Fix:** Fail loudly at startup, or at call time, if `SITE_URL` is absent:

```javascript
const siteUrl = process.env.SITE_URL
if (!siteUrl) {
  return { status: 500, erroMessage: "Configuração de servidor incompleta. Contate o administrador." }
}
```

Remove the `NEXT_PUBLIC_SUPABASE_URL` fallback entirely — it is never a valid substitute for `SITE_URL`.

---

## Warnings

### WR-01: Password reset "send link" form allows empty email submission

**File:** `src/app/auth/reset-password/page.js:64-77`

**Issue:** `handleEnviarLink` makes no client-side check that `form.email` is non-empty before calling `supabase.auth.resetPasswordForEmail`. `AuthField` does not accept or forward an HTML `required` attribute, so browser-native validation is also absent. An empty submit fires a network request, returns a Supabase error, and shows the generic `ERRO_ENVIO` banner with a misleading "500" code message — confusing the user.

**Fix:**
```javascript
async function handleEnviarLink(e) {
  e.preventDefault()
  setErro(null)
  if (!form.email.trim()) {
    setErro("ERRO_ENVIO") // or a dedicated "EMAIL_VAZIO" code
    setStatus("idle")
    return
  }
  // ... rest unchanged
}
```

Or forward `required` through `AuthField`:
```javascript
// AuthField.js — add to destructured props and input element:
// <input ... required={required} ... />
```

---

### WR-02: Double-submit race on define-new-password form after success

**File:** `src/app/auth/reset-password/page.js:96-107`

**Issue:** After `updateUser` succeeds, `setStatus("success")` is called and a `setTimeout` of 1500 ms fires the RPC + redirect. During this 1500 ms window the `SubmitButton` is rendered with `isLoad={false}` and `isSuccess={true}` — but `disabled` is only set on `isLoad`, not `isSuccess`. The button is visually in success state but still clickable (`type="submit"`). A rapid second click triggers `handleDefinirSenha` again: `validarSenha` passes, `setStatus("loading")` is called (overwriting "success"), and a second `updateUser` fires.

While a second `updateUser` with the same password is harmless in practice, the state mutation (success → loading → idle) causes unexpected UI flicker and the 1500 ms redirect timeout from the first call may fire after the second call resets state, causing a redirect from an unexpected state.

**Fix:** Disable the button when `isSuccess` is true, or guard the handler:

```javascript
// In SubmitButton.js — change disabled line:
disabled={isLoad || isSuccess}

// Or at the top of handleDefinirSenha:
if (status !== "idle") return
```

---

### WR-03: Locatário invite via token_hash type=invite skips atualizarStatusConvite on failed promotion

**File:** `src/app/auth/confirm/route.js:55-66`

**Issue:** The logic is:
```javascript
if (data?.user) {
  if (type === "signup") { ... }
  else if (type === "invite") {
    await atualizarStatusConvite(data.user.id, data.user.email)
  }
}
return NextResponse.redirect(new URL("/portal/dashboard", request.url))
```

This is correct for the invite path. However, if `tentarRegistrarProprietario` in the `type === "signup"` branch returns `false` (INSERT error that is not a UNIQUE violation — e.g., a transient DB error), the function falls through to the final `return NextResponse.redirect(new URL("/portal/dashboard", ...))` without redirecting to `/dashboard`. That case is handled correctly by the fall-through. **But**: if a `type === "signup"` user somehow has a pre-existing locatario row and the UNIQUE constraint is on `proprietarios.usuario_id` only — not on `locatarios` — `atualizarStatusConvite` is never called for a `type === "signup"` case. This is arguably correct (a signup isn't an invite) but means a user who signs up with an email that matches a pending locatario invite remains in `status_convite = "pendente"` forever.

**Fix:** After the signup promotion, if the user was not promoted (INSERT error), also attempt `atualizarStatusConvite` as a fallback to handle edge-case dual-path scenarios. Alternatively, document this explicitly as a known limitation if intentional.

---

### WR-04: validarSenha not called before handleEnviarLink — policy message missing on reset-password request form

**File:** `src/app/auth/reset-password/page.js:64-77` and related

**Issue:** The "request email link" sub-flow collects only an email address — no password field — so this is correct. However, the error code string `"ERRO_ENVIO"` when a Supabase error occurs maps to the banner body "Ocorreu um erro ao enviar o e-mail. Tente novamente." This message is shown for any Supabase error, including cases like rate limiting or account not found (though Supabase returns success for unknown emails by design). If Supabase does return an error (e.g., misconfigured SMTP, rate limit), there is no way for the user to understand the specific cause. The error code in the UI displays "ERRO_AUTH · 500" regardless of the actual HTTP status from Supabase.

**Fix:** Pass the actual Supabase error message (or a mapped user-friendly message) to the banner `body` instead of a static string:

```javascript
if (error) {
  setErroEnvio(error.message || "Ocorreu um erro ao enviar o e-mail.")
  setStatus("idle")
  return
}
```

Or store error details in state and interpolate into the banner body.

---

### WR-05: Locatário invited via PKCE code path also gets atualizarStatusConvite called after tentarRegistrarProprietario returns false — this is already in the code, but atualizarStatusConvite swallows its errors silently

**File:** `src/app/auth/confirm/route.js:7-19`

**Issue:** `atualizarStatusConvite` runs two UPDATE queries but ignores all errors. If the primary UPDATE fails, the fallback UPDATE by email also runs silently. If both fail (e.g., locatario row doesn't exist yet, wrong email, DB connectivity), the function returns nothing and the route handler continues to redirect to `/portal/dashboard`. The locatário invite is silently left in `status_convite = "pendente"` with no logging and no user-visible feedback. The user lands on the portal with an unactivated invite state.

**Fix:** At minimum, log errors from both UPDATE calls. Optionally return `false` and redirect to an error page if critical:

```javascript
const { data: rows, error: errPrimary } = await supabaseAdmin
  .from("locatarios")
  .update({ status_convite: "aceito" })
  .eq("usuario_id", userId)
  .select("id")

if (errPrimary) {
  console.error("[auth/confirm] atualizarStatusConvite primary update error:", errPrimary)
}
if (!rows || rows.length === 0) {
  const { error: errFallback } = await supabaseAdmin
    .from("locatarios")
    .update({ status_convite: "aceito", usuario_id: userId })
    .eq("email", userEmail)
  if (errFallback) {
    console.error("[auth/confirm] atualizarStatusConvite fallback update error:", errFallback)
  }
}
```

---

## Info

### IN-01: EyebrowRail component duplicated across three page files

**File:** `src/app/login/page.js:14`, `src/app/signup/page.js:13`, `src/app/auth/reset-password/page.js:14`

**Issue:** `EyebrowRail` is an identical function in all three files (16 lines each, pixel-identical). Given that `AuthFrame`, `AuthAside`, `AuthField`, `AuthBanner`, and `SubmitButton` were all correctly extracted into `src/components/auth/`, this component was missed.

**Fix:** Extract to `src/components/auth/EyebrowRail.js` and import in all three pages:

```javascript
// src/components/auth/EyebrowRail.js
"use client"
export default function EyebrowRail({ label }) { ... }
```

---

### IN-02: SubmitButton loading progress bar animation has a fixed width of 40% instead of indeterminate

**File:** `src/components/auth/SubmitButton.js:59-66`

**Issue:** The loading progress bar is `width: "40%"` with an `rBar` animation that translates it across the container (`translateX(-100%)` to `translateX(260%)`). While visually functional, the fixed 40% width means the bar always occupies a fixed visual segment during transit — misrepresenting actual progress. This is cosmetic but could be confusing. (Note: `rBar` is defined in globals.css at line 461 — no missing animation.)

**Fix:** Use `width: "30%"` for a more typical indeterminate-bar proportion, or use a full-width bar with opacity pulsing. Low priority — this is an aesthetic call.

---

### IN-03: auth.test.js happy-path uses a weak password that would fail real-world policy

**File:** `test/unit/actions/auth.test.js:30`

**Issue:** The happy-path test passes `senha: 'pass123'` — which has no uppercase letter and would be rejected by `validarCadastro` in the actual signup flow. The Server Action `cadastrarProprietario` intentionally does not re-validate the password (that's the client's job), so the test is internally consistent. However, a future reader could be misled into thinking `pass123` is a valid password for this system.

**Fix:** Use a password that satisfies the policy (`Pass123`) in the happy-path test to avoid the misleading implication:

```javascript
senha: 'Pass123',
```

---

_Reviewed: 2026-06-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
