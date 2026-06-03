---
phase: 07-ajustes-finais-pre-banca
reviewed: 2026-06-02T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - src/app/auth/confirm/route.js
  - src/app/auth/reset-password/page.js
  - e2e/auth-confirm.spec.js
  - src/actions/locatarios.js
  - src/components/ui/OwnerSidebar.js
  - e2e/dashboard-smoke.spec.js
  - src/components/ui/skeleton.js
  - src/app/dashboard/loading.js
  - src/app/dashboard/locatarios/loading.js
  - src/components/features/Unidades.js
  - src/components/features/Contratos.js
  - src/components/features/portal/PortalDashboard.js
findings:
  critical: 4
  warning: 4
  info: 3
  total: 11
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-06-02T00:00:00Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

This phase covers the auth flow (invite confirm route + reset-password page), skeleton loading UIs, the sidebar refactor, Server Actions for locatarios management, and the portal dashboard component. The auth confirm route handles two distinct token types correctly in the happy path but has a critical gap for the password-reset recovery flow. The `deletarLocatario` action deletes the `locatarios` row but never calls `deleteUser`, orphaning auth credentials. `revogarConvite` silently swallows a `deleteUser` error. The reset-password form imposes no minimum password length, allowing empty-string passwords through Supabase. The Contratos component performs a client-side string comparison against `new Date()` ISO output that produces incorrect results around DST boundaries and causes a logic fault when both `expiring` and `vencido` can be simultaneously true. Several quality/maintainability issues round out the findings.

---

## Critical Issues

### CR-01: `deletarLocatario` orphans auth user — deletes locatarios row but never calls `deleteUser`

**File:** `src/actions/locatarios.js:62-70`

**Issue:** `deletarLocatario` deletes the row from `locatarios` but does not call `supabaseAdmin.auth.admin.deleteUser(usuario_id)`. The locatário's auth account remains active. They can continue to call `supabase.auth.getUser()` successfully, and if a new locatário is later invited with the same email address, `inviteUserByEmail` may silently re-use or conflict with the orphaned auth entry. This is a data integrity violation and a latent access-control gap.

Compare `revogarConvite` (lines 83-85) which correctly deletes both the row and the auth user — `deletarLocatario` is missing the same cleanup.

**Fix:**
```js
export async function deletarLocatario(id) {
    const supabase = await createServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { status: 401, erroMessage: 'Não autenticado.' }
    if (!await isProprietario(supabase)) return { status: 403, erroMessage: 'Sem permissão.' }
    if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }

    // Fetch usuario_id before deleting the row
    const { data: loc, error: fetchErr } = await supabaseAdmin
        .from('locatarios').select('usuario_id').eq('id', id).single()
    if (fetchErr || !loc) return { status: 404, erroMessage: 'Locatário não encontrado.' }

    const { error } = await supabaseAdmin.from('locatarios').delete().eq('id', id)
    if (error) return { status: 500, erroMessage: error.message }

    await supabaseAdmin.auth.admin.deleteUser(loc.usuario_id)
    return { status: 200 }
}
```

---

### CR-02: `resetPasswordForEmail` has no `redirectTo` — password-reset link lands on wrong page

**File:** `src/app/login/page.js:186` (called from the login page reviewed for context) / `src/app/auth/confirm/route.js:1-32`

**Issue:** `supabase.auth.resetPasswordForEmail(email)` is called without a `redirectTo` parameter. Supabase will redirect the user to the project's Site URL (the Supabase dashboard default, likely `http://localhost:3000` or the raw project URL) rather than to `/auth/reset-password`. The `/auth/confirm` route correctly handles `type=invite` but does NOT handle `type=recovery` — the token type Supabase sends for password reset links.

When a user clicks a password-reset email link, Supabase appends `?token_hash=...&type=recovery`. The confirm route only handles `type=invite` semantically; while `verifyOtp` itself will accept any valid type, the user is redirected to `/portal/dashboard` — not to `/auth/reset-password`. This means the password-reset flow is broken end-to-end: users who click "Esqueci minha senha" will be redirected to the portal, not to the page where they can actually set a new password.

**Fix:**

In `login/page.js`, add the `redirectTo`:
```js
const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/confirm?next=/auth/reset-password`
})
```

In `src/app/auth/confirm/route.js`, split the redirect by token type:
```js
if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (error) {
        return NextResponse.redirect(new URL("/login?error=invite_invalid", request.url))
    }
    // For recovery (password reset), redirect to the reset-password page
    if (type === "recovery") {
        return NextResponse.redirect(new URL("/auth/reset-password", request.url))
    }
    return NextResponse.redirect(new URL("/portal/dashboard", request.url))
}
```

---

### CR-03: Empty password accepted — no minimum length validation in reset-password form

**File:** `src/app/auth/reset-password/page.js:126-146`

**Issue:** `handleSubmit` only checks that `form.password === form.confirmPassword`. It does not validate that the password is non-empty or meets a minimum length. A user can submit two empty strings and `supabase.auth.updateUser({ password: "" })` will be called. Supabase will likely reject an empty string but with a generic error message that the current `ERRO_SUPABASE` banner does not explain — more critically, a very short (1-2 character) password may succeed depending on Supabase's server-side policy, and the form offers no feedback to the user about the requirement.

**Fix:**
```js
async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)

    if (!form.password || form.password.length < 8) {
        setErro("SENHA_CURTA")
        return
    }
    if (form.password !== form.confirmPassword) {
        setErro("SENHAS_DIVERGENTES")
        return
    }
    // ... rest of handler
}
```

Add the corresponding error banner case:
```jsx
{erro === "SENHA_CURTA" && (
    <ErrorBanner
        title="ERRO · SENHA_INVÁLIDA"
        body="A senha deve ter pelo menos 8 caracteres."
    />
)}
```

---

### CR-04: `revogarConvite` ignores `deleteUser` error — silent partial rollback

**File:** `src/actions/locatarios.js:85`

**Issue:** After successfully deleting the `locatarios` row, `revogarConvite` calls `deleteUser` but does not `await` the error response or handle failure. If `deleteUser` fails (network issue, already-deleted user, etc.), the function silently returns `{ status: 200 }` even though the auth account was not removed. The locatário row is gone but the auth user persists — inverted orphan scenario from CR-01.

**Fix:**
```js
const { error: delErr } = await supabaseAdmin.from('locatarios').delete().eq('id', id)
if (delErr) return { status: 500, erroMessage: delErr.message }

const { error: authDelErr } = await supabaseAdmin.auth.admin.deleteUser(loc.usuario_id)
if (authDelErr) return { status: 500, erroMessage: authDelErr.message }

return { status: 200 }
```

---

## Warnings

### WR-01: Contratos — `vencido` logic uses string comparison that produces incorrect results

**File:** `src/components/features/Contratos.js:314`

**Issue:**
```js
const vencido = isAtivo && contrato.data_fim < new Date().toISOString().split("T")[0]
```

`new Date().toISOString()` returns UTC time. In Brazil (UTC-3), before 3 AM local time, `toISOString().split("T")[0]` still returns yesterday's UTC date. This means a contract that expires today (local time) will not show the "ENC" (encerrar) button until after midnight UTC (3 AM local). This is a logic error that affects the contract management workflow during a 3-hour window every day.

Additionally, note that when `data_fim` equals today, `isExpiring` (line 36-39) returns true (diff=0, within 0..7 range) AND `vencido` returns false (strict `<`, not `<=`). This is consistent but means a contract expiring today shows as "vencendo" with a "CANC" button rather than as "vencido" with an "ENC" button — potentially correct by design but worth confirming.

**Fix:** Use local date comparison:
```js
function getTodayLocal() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const vencido = isAtivo && contrato.data_fim < getTodayLocal()
```

---

### WR-02: `convidarLocatario` does not validate email format or sanitize input

**File:** `src/actions/locatarios.js:9-11`

**Issue:** The action only checks for truthiness of `email` — it does not validate that it is a valid email address format. `documento` (CPF/CNPJ) is accepted as any truthy string with no digit-only or length validation against the schema comment ("só dígitos"). Malformed inputs will pass the guard and be forwarded to `inviteUserByEmail`, which will return a Supabase error — but the error is surfaced as a generic `erroMessage` with no contextual hint for the user.

**Fix:** Add minimal format validation:
```js
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!EMAIL_RE.test(email)) {
    return { status: 400, erroMessage: 'E-mail inválido.' }
}
const DOCUMENTO_RE = /^\d{11}$|^\d{14}$/  // CPF or CNPJ digits only
if (!DOCUMENTO_RE.test(documento)) {
    return { status: 400, erroMessage: 'Documento inválido. Use apenas dígitos (CPF: 11, CNPJ: 14).' }
}
```

---

### WR-03: `PortalDashboard` instantiates Supabase client at module level

**File:** `src/components/features/portal/PortalDashboard.js:11`

**Issue:**
```js
const supabase = createClient()
```

This is declared at module scope (outside the component), not inside a `useEffect` or the component function. In Next.js 16 with React 19, module-level state can be shared across requests in certain server environments or hot-reload scenarios. The `createClient()` from `supabase-browser` depends on `localStorage` for session management — creating it outside the component means it is instantiated before hydration is guaranteed, and the client instance is shared across all component renders during hot module replacement in dev, which can cause stale session issues during development and may cache a stale auth state.

**Fix:** Move instantiation inside the component or into the `useEffect`:
```js
export default function PortalDashboard() {
    const supabase = createClient() // or moved inside useEffect
    // ...
}
```

---

### WR-04: `Contratos.js` — "Ver Arquivo" button has no `onClick` handler

**File:** `src/components/features/Contratos.js:401-407`

**Issue:**
```jsx
<Button
    variant="ghost"
    className="..."
>
    Ver Arquivo →
</Button>
```

This button has no `onClick` handler and no `href`. It is rendered as a non-functional interactive element — a button that does nothing when clicked. If this is an intentional placeholder, it should at minimum be visually disabled or replaced with a `<span>` to avoid presenting a clickable element that silently fails. For a banca demo, clicking this and getting no response is noticeable.

**Fix:** Either wire up the handler or disable the element:
```jsx
<Button
    variant="ghost"
    disabled
    className="... opacity-50 cursor-not-allowed"
>
    Ver Arquivo →
</Button>
```

---

## Info

### IN-01: `auth-confirm.spec.js` — no positive test case for `code` (PKCE) flow

**File:** `e2e/auth-confirm.spec.js`

**Issue:** The spec file only tests error paths (no params, invalid token). It has no test — even a structural one — for the `code` query parameter branch in `route.js:21-28`. That branch exists specifically as a fallback for customized email templates using `{{ .Code }}`. Lack of any coverage means a regression in that path would go undetected.

**Fix:** Add a test that sends an invalid `code` param and asserts the redirect to `/login?error=invite_invalid`, mirroring test 2.2 for the `token_hash` path:
```js
test('2.3 — GET /auth/confirm com code inválido redireciona para /login', async ({ page }) => {
    await page.goto('/auth/confirm?code=invalid_code')
    await page.waitForURL(url => url.includes('/login') && url.includes('error=invite_invalid'), { timeout: 10_000 })
    expect(page.url()).toContain('error=invite_invalid')
})
```

---

### IN-02: `Unidades.js` — `carregarDados` function is defined but never called

**File:** `src/components/features/Unidades.js:56-59`

**Issue:**
```js
async function carregarDados() {
    setListaEdificios(await getEdificios() ?? []);
    setUnidades(await getUnidades() ?? []);
}
```

This function is defined but never invoked. The actual data loading is done inline inside `useEffect` > `fetchDados` (lines 103-110). `carregarDados` is dead code. It does not match the `resetForm` / `resetFormEdit` naming pattern — it appears to be a leftover from a refactor where the intent was to reuse it after mutations (currently handled by inlining `getUnidades()` calls directly in each handler).

**Fix:** Remove the unused `carregarDados` function. If the intent was to deduplicate the `getUnidades()` + `getEdificios()` calls across handlers, implement a `recarregar()` pattern that can be called from `useEffect` and from post-mutation handlers.

---

### IN-03: `dashboard-smoke.spec.js` — label for `unidades`, `contratos`, and `locatarios` routes is the path itself

**File:** `e2e/dashboard-smoke.spec.js:6-9`

**Issue:**
```js
const routes = [
    { path: '/dashboard',            label: 'Visão Geral' },
    { path: '/dashboard/unidades',   label: '/dashboard/unidades' },   // label = path
    { path: '/dashboard/contratos',  label: '/dashboard/contratos' },  // label = path
    { path: '/dashboard/locatarios', label: '/dashboard/locatarios' }, // label = path
]
```

The `label` field is only used in the test name string (`4.x — ${path} carrega sem erro`) and is not actually referenced elsewhere in the generated tests — `label` is unused in the loop body. The initial intent was likely to have human-readable labels, but three of the four are copy-pasted paths. This is minor but makes the `label` field misleading when reading the test suite.

**Fix:** Either remove `label` from the `routes` array entirely, or populate it consistently:
```js
{ path: '/dashboard/unidades',   label: 'Unidades' },
{ path: '/dashboard/contratos',  label: 'Contratos' },
{ path: '/dashboard/locatarios', label: 'Locatários' },
```

---

_Reviewed: 2026-06-02T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
