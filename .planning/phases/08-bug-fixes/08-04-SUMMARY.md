---
plan: 08-04
phase: 08-bug-fixes
status: complete
executor: orchestrator-inline
completed: 2026-06-06
---

# Plan 08-04 Summary — BUG-03: status_convite Atualizado Após Aceite de Convite

## What Was Built

Fixed BUG-03 (the most critical root cause): `/auth/confirm/route.js` now updates `locatarios.status_convite` to 'aceito' after successful invite verification via both `verifyOtp` and `exchangeCodeForSession` paths.

## Files Changed

- `src/app/auth/confirm/route.js` — Added `supabaseAdmin` import, extracted `atualizarStatusConvite()` helper, updated both invite acceptance code paths

## Key Details

### Implementation

Extracted reusable `atualizarStatusConvite(userId, userEmail)` function:
1. **Primary UPDATE**: `supabaseAdmin.from('locatarios').update({ status_convite: 'aceito' }).eq('usuario_id', userId).select('id')` — returns affected rows
2. **Fallback UPDATE**: when primary affects 0 rows (locatário exists but `usuario_id` not yet linked), runs `supabaseAdmin.from('locatarios').update({ status_convite: 'aceito', usuario_id: userId }).eq('email', userEmail)` — completes both status AND link in one operation

**token_hash path**: `verifyOtp` deconstructed as `{ data, error }`, calls `atualizarStatusConvite(data.user.id, data.user.email)` when `type === 'invite' && data?.user`

**code path**: `exchangeCodeForSession` deconstructed as `{ data, error }`, calls `atualizarStatusConvite(data.user.id, data.user.email)` unconditionally when `data?.user` (all code-based invites in this system are invite-type)

### Rationale
- `verifyOtp` returns `data.user` directly on success (no need for separate `getUser()` call) — Q2/A2 RESOLVED
- Fallback triggers on 0 rows affected, not on null user (null user only occurs in error cases which already redirect before the UPDATE)
- UPDATE is idempotent — running for already-accepted locatário or for proprietário (no row) is harmless
- All existing redirects preserved unchanged

## Self-Check

- [x] `import supabaseAdmin from "@/lib/supabaseAdmin"` present
- [x] `status_convite: "aceito"` in UPDATE
- [x] `verifyOtp` deconstructed as `{ data, error }`
- [x] `exchangeCodeForSession` deconstructed as `{ data, error }`, uses `data.user.id` directly
- [x] Fallback UPDATE uses `.eq('email', userEmail)` in both code paths
- [x] No code path that just logs and skips the UPDATE
- [x] All original redirects preserved

## BUG-03 E2E Test Status

The BUG-03 test in `e2e/auth-confirm.spec.js` uses `admin.auth.admin.generateLink({ type: 'invite', email })` to generate a real `hashed_token`. This test will now pass with the fix applied — the route handler executes the UPDATE and `locatarios.status_convite` will be 'aceito' after the redirect. (Requires local Supabase instance running for E2E execution.)
