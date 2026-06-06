---
phase: 08-bug-fixes
status: human_needed
verified_at: 2026-06-06
must_haves_verified: 4/4
human_verification:
  - BUG-03: accept real invite and confirm badge flips from pendente to aceito (requires live Supabase)
  - E2E suite: run `npx playwright test --project=chromium` with local Supabase running
---

# Phase 08 Verification — Bug Fixes

## Summary

**4/4 must-haves verified** against actual code. All 4 bugs are correctly fixed. 2 items require human/live-environment confirmation.

---

## Must-Have Verification

### SC-1 — Revogar acesso de Locatário completa sem erro

**Status: PASSED**

Code evidence:
- `src/actions/locatarios.js` lines 101-106: FK check on `contratos.locatario_id` before delete (any status, no filter)
- `src/components/features/LocatariosDesktop.js`: `alert()` removed, `setErro(erroMessage)` used instead
- Inline error block with `className="px-5 py-2 font-mono text-[11px] text-danger-fg border-t border-border-3"` renders below table header
- Successful revogar: `setLocatarios(await getLocatarios() ?? [])` removes the row

### SC-2 — Erro de edição de unidade separado do erro de delete

**Status: PASSED**

Code evidence:
- `src/components/features/Unidades.js`: single `[erro, setErro]` replaced by `[erroDelete, setErroDelete]` + `[erroEdit, setErroEdit]`
- `handleDeletarUnidade` → `setErroDelete(result.erroMessage)`
- `handleSalvarUnidade` → `setErroEdit(result.erroMessage)`
- `handleEditarUnidade` → clears `erroDelete` (prevents stale delete error in card)
- `erroDelete` block rendered ABOVE `<div className="flex flex-col gap-0 border border-border-3 bg-surface">`
- `UnidadeCard` receives `erro={erroEdit}` only

### SC-3 — Card de Locatário exibe estado real do convite

**Status: PASSED (code), HUMAN_NEEDED (live flow)**

Code evidence:
- `src/app/auth/confirm/route.js`: `atualizarStatusConvite(data.user.id, data.user.email)` called after:
  - `verifyOtp` success (token_hash path, when `type === 'invite' && data?.user`)
  - `exchangeCodeForSession` success (code path, when `data?.user`)
- Primary UPDATE by `usuario_id` with `.select('id')` to detect rows affected
- Fallback UPDATE by `email` when primary affects 0 rows (also sets `usuario_id`)
- Both updates use `supabaseAdmin` (correct — locatário has no session at this point)

**Human verification needed**: Requires accepting a real invite link in a browser + checking badge in dashboard.

### SC-4 — Visitante em /unidades consegue voltar para /

**Status: PASSED**

Code evidence:
- `src/components/features/UnidadesPublicas.js`: `import Link from 'next/link'` added
- `<span>Unidades Disponíveis</span>` replaced with `<Link href="/" className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase hover:text-fg-2 transition-colors">← Voltar</Link>`
- `<RealtimeDot />` unchanged in same flex row

---

## Requirement Traceability

| Requirement | Plan | Status |
|-------------|------|--------|
| BUG-01 (revogar FK + inline error) | 08-02 | ✓ Verified |
| BUG-02 (split erro delete/edit) | 08-03 | ✓ Verified |
| BUG-03 (status_convite update) | 08-04 | ✓ Code verified, human needed |
| BUG-04 (← Voltar link) | 08-03 | ✓ Verified |

---

## Human Verification Items

1. **BUG-03 live flow**: Accept a real invite email. After redirect to portal, return to Proprietário dashboard → `/dashboard/locatarios`. Confirm the locatário's badge shows "Convite aceito" (not "Convite pendente") and REVOGAR button is absent.

2. **Full E2E suite**: `npx playwright test --project=chromium` with local `supabase start`. All 5 new BUG-test scenarios should pass:
   - `BUG-01 — revogar locatário pendente sem contrato remove a linha`
   - `BUG-01 — erro inline ao revogar locatário com contrato vinculado`
   - `BUG-02 — erro de delete não vaza para o form de edição`
   - `BUG-03 — status_convite vira "aceito" após verifyOtp com token real de invite`
   - `BUG-04 — /unidades tem link "← Voltar" que navega para home`

---

## Build Gate

`npx next build` — **0 errors, 0 warnings** ✓
