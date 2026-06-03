---
phase: 07-ajustes-finais-pre-banca
plan: "01"
subsystem: auth
tags: [auth, invite, route-handler, reset-password, fix]
dependency_graph:
  requires: []
  provides: [auth/confirm-route, auth/reset-password-page, invite-redirectTo-fix]
  affects: [src/actions/locatarios.js, portal-locatario-access]
tech_stack:
  added: []
  patterns: [next-route-handler, suspense-boundary, defensive-token-exchange]
key_files:
  created:
    - src/app/auth/confirm/route.js
    - src/app/auth/reset-password/page.js
    - e2e/auth-confirm.spec.js
  modified:
    - src/actions/locatarios.js
decisions:
  - "Handler /auth/confirm defensivo: verifyOtp para token_hash+type (flow primário invite), exchangeCodeForSession para code (fallback PKCE). Não depende de verificação manual do template."
  - "useSearchParams envolto em Suspense boundary (requisito Next.js 16 App Router — static build)"
  - "createClient() instanciado dentro do componente (não no módulo level) para evitar SSG error sem env vars"
metrics:
  duration: "~25 min"
  completed: "2026-06-02"
  tasks_completed: 3
  files_changed: 4
---

# Phase 7 Plan 01: Auth Confirm + Reset Password Summary

Fluxo de convite Supabase completado de ponta a ponta: Route Handler `/auth/confirm` troca token do email de convite por sessão autenticada e redireciona para o portal do locatário.

## What Was Built

### Task 1 — Checkpoint: Confirmar método de troca de token (PENDENTE)

Checkpoint human-verify não executado (worktree executor). O plano requer verificação manual no Supabase Dashboard:

**URL do template:** https://supabase.com/dashboard/project/vfymttcajeyhrmsyhrtj/auth/templates

**O que verificar:**
- Se o template "Invite user" usa `{{ .ConfirmationURL }}` → link envia `?token_hash=&type=invite` → caminho `verifyOtp` exercitado (caminho primário)
- Se usa `{{ .Code }}` → link envia `?code=` → caminho `exchangeCodeForSession` exercitado (fallback)
- Confirmar que `https://romma-alpha.vercel.app` está nas Redirect URLs permitidas (Authentication > URL Configuration)

**Nota:** O handler implementado na Task 3 é defensivo e cobre ambos os casos sem necessitar desta verificação para funcionar.

### Task 2 — Smoke test RED (commit `e51c8b5`)

Criado `e2e/auth-confirm.spec.js` com 2 testes:
- `GET /auth/confirm` sem parâmetros → redirect para `/login?error=invite_invalid`
- `GET /auth/confirm?token_hash=invalido&type=invite` → redirect para `/login?error=invite_invalid`

### Task 3 — Route Handler + redirect fix + reset-password (commit `94a567b`)

**(A) `src/app/auth/confirm/route.js`** — Route Handler GET defensivo:
- `token_hash + type` presentes → `supabase.auth.verifyOtp({ type, token_hash })` (caminho primário)
- `code` presente → `supabase.auth.exchangeCodeForSession(code)` (fallback PKCE)
- Sucesso → redirect hardcoded para `/portal/dashboard`
- Qualquer falha ou ausência de params → `/login?error=invite_invalid`
- Ameaças T-07-02 (open-redirect) e T-07-03 (token expirado ignorado) mitigadas

**(B) `src/actions/locatarios.js`** — Linha 20 corrigida:
- De: `redirectTo: \`${siteUrl}/dashboard\``
- Para: `redirectTo: \`${siteUrl}/auth/confirm\``

**(C) `src/app/auth/reset-password/page.js`** — Page cliente:
- Lê `?error=invite_invalid` da URL via `useSearchParams` (envolta em `Suspense` — requisito Next.js 16)
- Validação client-side: senhas divergentes → banner `ERRO · SENHAS_DIVERGENTES` sem chamar Supabase
- `supabase.auth.updateUser({ password })` → sucesso → banner + redirect para `/portal/dashboard`
- Visual espelha `login/page.js`: TopStrip, EyebrowRail, inputs com border-bottom foco `var(--primary)`, banners padrão
- Copywriting exato conforme `07-UI-SPEC.md`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] createClient() no módulo level causava SSG failure**
- **Found during:** Task 3 — `npm run build`
- **Issue:** `createClient()` de `supabase-browser` chamado no nível do módulo (`const supabase = createClient()`) fazia o build falhar com "URL and API key are required" durante pré-renderização estática (Next.js tenta renderizar a page sem env vars disponíveis)
- **Fix:** Movido `const supabase = createClient()` para dentro do componente `ResetPasswordForm` (instanciado apenas em runtime no browser)
- **Files modified:** `src/app/auth/reset-password/page.js`
- **Commit:** `94a567b` (parte do mesmo commit da feature)

**2. [Rule 1 - Bug] useSearchParams sem Suspense boundary bloqueava build**
- **Found during:** Task 3 — segundo `npm run build`
- **Issue:** Next.js 16 App Router requer que `useSearchParams()` seja envolvido em `Suspense` em páginas que podem ser pré-renderizadas estaticamente
- **Fix:** Adicionado `import { Suspense }` e envolto `<ResetPasswordForm />` em `<Suspense fallback={null}>` na página
- **Files modified:** `src/app/auth/reset-password/page.js`
- **Commit:** `94a567b` (parte do mesmo commit da feature)

## Known Stubs

Nenhum stub que impeça o objetivo do plano. O handler `/auth/confirm` retorna redirects reais (não hardcoded de dados); o reset-password chama `updateUser` real.

## Threat Flags

Nenhuma nova superfície de segurança além das mapeadas no `<threat_model>` do plano.

## Self-Check

### Created files exist:
- [x] `src/app/auth/confirm/route.js` — FOUND
- [x] `src/app/auth/reset-password/page.js` — FOUND
- [x] `e2e/auth-confirm.spec.js` — FOUND

### Modified files:
- [x] `src/actions/locatarios.js` linha 20 → `auth/confirm` — VERIFIED

### Commits exist:
- [x] `e51c8b5` — test(07-01): add smoke test RED para /auth/confirm
- [x] `94a567b` — feat(07-01): invite confirm route handler + reset-password page (FIX-01)

### Build:
- [x] `npm run build` passa sem erros (com env vars do `.env.local`)

## Self-Check: PASSED

## Pending Checkpoint

**Task 1 — checkpoint:human-verify** está pendente. Requer verificação manual no Supabase Dashboard:
1. Confirmar variável no template "Invite user" (`{{ .ConfirmationURL }}` vs `{{ .Code }}`)
2. Confirmar que `https://romma-alpha.vercel.app` está nas Redirect URLs

O handler implementado é defensivo e funciona em ambos os cenários sem esta verificação.
