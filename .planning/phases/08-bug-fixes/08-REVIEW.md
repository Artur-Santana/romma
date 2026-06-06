---
phase: 08-bug-fixes
status: clean
depth: standard
reviewed_files: 8
critical: 0
warnings: 1
info: 2
reviewed_at: 2026-06-06
---

# Code Review — Phase 08: Bug Fixes

## Summary

8 files reviewed at standard depth. **0 critical bugs, 1 warning, 2 info items.** The 4 bug fixes are correctly implemented with sound security boundaries.

## Files Reviewed

- `src/app/auth/confirm/route.js`
- `src/actions/locatarios.js`
- `src/components/features/LocatariosDesktop.js`
- `src/components/features/Unidades.js`
- `src/components/features/UnidadesPublicas.js`
- `e2e/crud.spec.js`
- `e2e/dashboard-smoke.spec.js`
- `e2e/auth-confirm.spec.js`

---

## Findings

### Warning

**W-01 — Unused variable `revogarButtons` in crud.spec.js**

File: `e2e/crud.spec.js`, line ~329

```js
const revogarButtons = page.getByRole('button', { name: 'REVOGAR' })
// Encontrar o botão na linha do locatário FK
await page.getByText('E2E-Locatário FK').locator('../..').locator('../..').getByRole('button', { name: 'REVOGAR' }).click()
```

`revogarButtons` is declared but never used — the locator chain on the next line is used instead for the click. This is dead code that could confuse future maintainers. Should be removed.

**Fix:** Remove `const revogarButtons = page.getByRole('button', { name: 'REVOGAR' })` from the BUG-01 FK error test.

---

### Info

**I-01 — `atualizarStatusConvite` silently swallows DB errors**

File: `src/app/auth/confirm/route.js`, lines 5-19

The `atualizarStatusConvite` helper does not handle errors returned by supabaseAdmin. If the UPDATE fails (e.g., network error, schema mismatch), the function silently proceeds and the redirect still happens with `status_convite` unchanged.

This is a deliberate trade-off (user UX should not break for a tracking field update failure), but a `console.error` log would improve observability in production without impacting the user:

```js
async function atualizarStatusConvite(userId, userEmail) {
  const { data: rows, error: errPrimary } = await supabaseAdmin
    .from("locatarios")
    .update({ status_convite: "aceito" })
    .eq("usuario_id", userId)
    .select("id")
  if (errPrimary) console.error("BUG-03 UPDATE primary failed:", errPrimary.message)
  if (!rows || rows.length === 0) {
    const { error: errFallback } = await supabaseAdmin
      .from("locatarios")
      .update({ status_convite: "aceito", usuario_id: userId })
      .eq("email", userEmail)
    if (errFallback) console.error("BUG-03 UPDATE fallback failed:", errFallback.message)
  }
}
```

**Priority:** Low — non-blocking for demo. Useful for production observability.

---

**I-02 — Missing blank line before `shortenName` function in UnidadesPublicas.js**

File: `src/components/features/UnidadesPublicas.js`, line 9

`import Link from 'next/link'` was inserted without a trailing blank line before `function shortenName`. Minor style inconsistency; no functional impact.

---

## Security Assessment

| Area | Finding |
|------|---------|
| `route.js` supabaseAdmin import | Correct — `server-only` guard prevents client import |
| `revogarConvite` FK check | UPDATE scoped by `usuario_id` from verified session, not client input |
| `atualizarStatusConvite` | Both UPDATE paths use `data.user` from verified OTP/exchange — not query params |
| `locatarios.js` UUID guard | `UUID_RE.test(id)` present before any DB query |

No new security issues introduced.

---

## Verdict

**Clean** — one warning (unused variable, easy fix) and two informational items. The bug fixes are implemented correctly and securely. No blocking issues.
