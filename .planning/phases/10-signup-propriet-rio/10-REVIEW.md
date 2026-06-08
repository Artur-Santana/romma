---
phase: 10-signup-proprietario
reviewed: 2026-06-08T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - e2e/signup.spec.js
  - src/actions/auth.js
  - src/app/signup/page.js
  - src/proxy.js
  - src/app/auth/confirm/route.js
findings:
  critical: 2
  warning: 3
  info: 2
  total: 7
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-06-08T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the Proprietário signup flow: Server Action guard, signup client component, proxy/middleware redirects, email-confirm route handler, and the E2E scaffold. The overall structure is sound and the happy-path logic is clear. Two security BLOCKERs were found in `src/app/auth/confirm/route.js`: a privilege escalation that allows an invited Locatário to silently become Proprietário under a specific but realistic condition, and a TOCTOU race that allows two concurrent signups to both claim Proprietário status. Three warnings cover cookie loss on redirect, an open signup path, and fragile test state management.

---

## Critical Issues

### CR-01: Invited Locatário can be promoted to Proprietário (privilege escalation)

**File:** `src/app/auth/confirm/route.js:67`

**Issue:** `tentarRegistrarProprietario` is called for **every** confirmation type — including `type === "invite"`. The in-code security invariant (`count === 0` implies Proprietário) only holds when the `proprietarios` table is permanently non-empty once configured. This breaks under two realistic conditions:

1. The AUTH-01 E2E test itself deletes all rows from `proprietarios` in `beforeAll` and does not guarantee restore if the run crashes mid-flight. If a Locatário then clicks a pre-existing invite link while the table is empty, `tentarRegistrarProprietario` returns `true` and that Locatário is redirected to `/dashboard` with Proprietário privileges.
2. Any manual maintenance operation that drops and re-seeds the `proprietarios` row (without also revoking pending invite tokens) opens the same window.

The `type === "signup"` path is the only legitimate Proprietário self-registration path; invite-type tokens must never trigger promotion.

**Fix:**
```js
// route.js — in the token_hash branch (around line 66-75)
if (data?.user) {
  // Only promote on self-signup confirmation, never on invite
  if (type === "signup") {
    const viroupProprietario = await tentarRegistrarProprietario(data.user.id)
    if (viroupProprietario) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  } else if (type === "invite") {
    await atualizarStatusConvite(data.user.id, data.user.email)
  }
}
return NextResponse.redirect(new URL("/portal/dashboard", request.url))
```

---

### CR-02: TOCTOU race allows two concurrent signups to both become Proprietário

**File:** `src/app/auth/confirm/route.js:27-42`

**Issue:** `tentarRegistrarProprietario` executes a `COUNT` query followed by an `INSERT` as two separate statements — not inside a transaction or under a serializable lock. The code comment ("Se INSERT falhar por constraint UNIQUE — race") only handles the case where the **same** `usuario_id` is inserted twice. The `proprietarios` schema enforces `UNIQUE(usuario_id)` but has **no single-row constraint** (no unique index on a constant, no trigger limiting row count, no `CHECK(...)` on the table).

If two different users submit the signup form and both click their confirmation links within a short window, both read `count === 0`, both pass the `if (count === 0)` guard, and both successfully insert rows with different `usuario_id` values. The UNIQUE constraint on `usuario_id` does not prevent this. The system ends up with two Proprietários, violating the documented "único por instância" invariant and corrupting all downstream RLS checks that assume a single owner.

**Fix (application layer):** Use a Postgres advisory lock or serializable transaction in a Supabase Edge Function / RPC, or add a DB-level single-row constraint:

```sql
-- Migration: enforce single-row invariant at DB level
CREATE UNIQUE INDEX proprietarios_single_row
  ON public.proprietarios ((true));
```

Then in `tentarRegistrarProprietario`, the comment is still accurate: the unique index fires on the second concurrent INSERT and `insertError` is set, returning `false` as intended. Without this constraint, the race is undetected.

---

## Warnings

### WR-01: Refreshed auth cookies lost on redirect (proxy.js:33-34)

**File:** `src/proxy.js:33`

**Issue:** `supabase.auth.getUser()` (line 26) may silently refresh the session token and call `setAll`, which writes new cookies onto the local `response` object. However, the redirect branches at lines 33-44 return new `NextResponse.redirect(...)` instances that never copy those updated cookies. If the token was refreshed and a redirect fires, the browser never receives the new session cookie — the old (expired) cookie persists, and the next request triggers another refresh cycle or an auth loop.

This is the documented Supabase SSR proxy pitfall. The `supabase.auth.getUser()` call is required for security, but the response carrying refreshed cookies must be the one that reaches the browser.

**Fix:**
```js
// For each redirect branch, copy cookies from `response` to the redirect response
if (onSignup && user) {
  const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url))
  response.cookies.getAll().forEach(cookie => {
    redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
  })
  return redirectResponse
}
```
Apply the same pattern to the other two redirect branches.

---

### WR-02: No server-side gate prevents orphan auth account creation

**File:** `src/app/signup/page.js:204-208`

**Issue:** The pre-submit `checkProprietarioExiste` call (line 204) sets UI state only; it does not abort account creation at a level the server enforces. A user can bypass the client-side guard (dev tools, direct `fetch` to Supabase Auth, or simply disabling JavaScript) and call `supabase.auth.signUp` directly when the instance is already configured. This creates an orphan `auth.users` entry — the subsequent email confirmation flow will call `tentarRegistrarProprietario`, which returns `false` (count > 0), and redirect the user to `/portal/dashboard` where they have no `locatarios` row, resulting in a broken session.

This also means the instance ends up with dangling unverified accounts that consume an auth.users slot and can be used for credential stuffing or enumeration via the signUp response.

**Fix:** Add a Server Action for the actual signup call that re-checks `proprietarios` server-side before invoking `supabase.auth.signUp` (using `supabaseAdmin` for the guard). Return `{ status: 409 }` if already configured, and call `supabase.auth.signUp` only from within that Server Action.

---

### WR-03: E2E test leaves database in corrupted state on mid-run crash

**File:** `e2e/signup.spec.js:38-52`

**Issue:** `AUTH-01.beforeAll` deletes all rows from the `proprietarios` table (line 49-51) and saves them for restore in `afterAll`. If the test process crashes, is killed, or the test is aborted (e.g., CI timeout) after `beforeAll` but before `afterAll`, the `proprietarios` table is left permanently empty in the shared test database. This breaks every other test suite that depends on the seeded Proprietário row existing — including AUTH-02, which checks for a populated `proprietarios` table.

The save/restore pattern is fragile by design because it requires `afterAll` to run. A safer approach is to use a dedicated test Proprietário (a separate auth user created only for this test) or reset via `upsert` atomically inside `beforeAll` rather than delete-then-restore.

**Fix:** Instead of deleting the seed Proprietário row, create a fresh `auth.users` entry for the test Proprietário and insert a matching `proprietarios` row in `beforeAll`. Clean up the test-specific user+row in `afterAll`. This leaves the seed data untouched.

---

## Info

### IN-01: Error banner hardcodes "· 409" regardless of actual error

**File:** `src/app/signup/page.js:264`

**Issue:** The generic error state banner (line 264) displays `ERRO_AUTH · 409` even though the Supabase `signUp` error may be a network error (503), rate-limit (429), or validation error (422). The hardcoded `409` is misleading during debugging and in production.

**Fix:** Capture the error object from `supabase.auth.signUp` and pass its `status` or a generic label to `ErrorBanner`:
```js
const { error } = await supabase.auth.signUp(...)
if (error) {
  setErroLocal(error.message) // already shown via erroLocal, or pass status
  setStatus("error")
  return
}
```

---

### IN-02: `atualizarStatusConvite` called unconditionally in `code` branch but gated in `token_hash` branch

**File:** `src/app/auth/confirm/route.js:73,89`

**Issue:** In the `token_hash` path (line 72-74), `atualizarStatusConvite` is only called when `type === "invite"`. In the `code` path (line 89), it is called unconditionally for any confirmed user regardless of whether that user is a Locatário or a Proprietário. This means a Proprietário confirming via the PKCE/code flow would trigger an `UPDATE` to the `locatarios` table by their `usuario_id` and email — which would be a no-op in practice (no matching row) but indicates an inconsistency that could break silently if business logic changes.

**Fix:** Mirror the `token_hash` guard in the `code` branch. Since the `code` flow does not carry a `type` parameter, use the result of `tentarRegistrarProprietario` to decide:
```js
if (data?.user) {
  const viroupProprietario = await tentarRegistrarProprietario(data.user.id)
  if (viroupProprietario) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }
  // Only update locatario status if not a new Proprietário
  await atualizarStatusConvite(data.user.id, data.user.email)
}
```

---

_Reviewed: 2026-06-08T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
