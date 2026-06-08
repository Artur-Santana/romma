---
phase: 10-signup-proprietario
plan: "02"
subsystem: auth
tags: [signup, guard, server-action, proxy, auth]
dependency_graph:
  requires: [10-01]
  provides: [src/actions/auth.js, src/app/signup/page.js, src/proxy.js]
  affects: [e2e/signup.spec.js]
tech_stack:
  added: []
  patterns: [Server Action guard idempotente, state machine client-side, supabase.auth.signUp Opção A, proxy redirect autenticado]
key_files:
  created:
    - src/actions/auth.js
    - src/app/signup/page.js
  modified:
    - src/proxy.js
decisions:
  - Opção A confirmada (Q-01): signUp client-side via anon key; guard é server-only e read-only
  - emailRedirectTo obrigatório em signUp para rotear para /auth/confirm no plano 03
  - Estado locked é terminal — inputs ocultos, nenhum retry possível
  - Campos com htmlFor/id explícito para compatibilidade com getByLabel do Playwright
  - signup adicionado ao matcher do proxy como ramo independente (não interfere com guards existentes)
metrics:
  duration: "~25min"
  completed: "2026-06-08"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 3
---

# Phase 10 Plan 02: /signup + guard + proxy — Summary

**One-liner:** Rota /signup com SignUpForm Opção A (signUp client-side), guard de instância única via checkProprietarioExiste e redirect de autenticado via proxy.js.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Server Action checkProprietarioExiste — guard idempotente | d3bc27d | src/actions/auth.js (criado) |
| 2 | Página /signup — SignUpForm com estados email_sent/locked/error | 55d7f40 | src/app/signup/page.js (criado) |
| 3 | proxy.js — redirecionar autenticado de /signup para /dashboard | eb79ab3 | src/proxy.js (modificado) |

---

## What Was Built

### src/actions/auth.js

Server Action `checkProprietarioExiste` — conta rows em `public.proprietarios` com `{ count: "exact", head: true }`. Retorna `{ status: 200, existe: bool }` ou `{ status: 500, erroMessage }`. Nenhum efeito colateral. Conta EXCLUSIVAMENTE `public.proprietarios` (não `auth.users`) para evitar falso positivo com locatários cadastrados.

### src/app/signup/page.js

SignUpForm client-side espelhando o login (TopStrip, LeftPanel, EyebrowRail, Field, BottomMeta, RightPanel duplicados inline conforme D-06). State machine com 5 estados:

- **empty** → formulário vazio, aguardando input
- **loading** → validação + guard + signUp em andamento
- **email_sent** → EmailSentBanner verde com "VERIFIQUE SEU EMAIL · 200" (D-05: sem redirect)
- **locked** → banner terminal "INSTANCIA_BLOQUEADA · 409" com link "Ir para login →" href="/login" (AUTH-02)
- **error** → ErrorBanner "ERRO_AUTH · 409"

onMount: `checkProprietarioExiste()` — se instância já configurada, entra em `locked` sem exibir form. Submit: validação D-07 client-side → pre-check defensivo → `supabase.auth.signUp({ email, password, options: { emailRedirectTo: '/auth/confirm' } })` → `email_sent`. Sem redirect, sem `signInWithPassword`, sem `supabaseAdmin`.

Campos com `id` + `<label htmlFor>` para compatibilidade com `page.getByLabel()` do Playwright.

### src/proxy.js

Adicionado `/signup` ao matcher e novo ramo independente: `if (onSignup && user) → redirect /dashboard`. Visitante anônimo passa direto para o form. Guards de `/dashboard` e `/portal` preservados intactos.

---

## Deviations from Plan

Nenhuma — plano executado exatamente como escrito. Decisão de adicionar `id`/`htmlFor` nos campos Field foi necessária para que o E2E `page.getByLabel(/e-mail/i)` funcione (identificada pela leitura do spec antes de escrever a UI, não foi uma correção posterior).

---

## Verification Results

| Check | Result |
|-------|--------|
| `node -e` static check — auth.js | OK (checkProprietarioExiste, from("proprietarios"), sem admin.createUser, sem errorMessage) |
| `node -e` static check — signup/page.js | STATIC_OK (use client, sem supabaseAdmin, auth.signUp, sem signInWithPassword, sem router.push('/dashboard'), email_sent, INSTANCIA_BLOQUEADA, emailRedirectTo) |
| `node -e` static check — proxy.js | OK (signup, /dashboard, /portal, sem middleware) |
| `npx next build` | Errors: 0 \| Warnings: 2 (não relacionados ao código deste plano) |
| src/app/signup/page.js tem >= 200 linhas | 375 linhas |

---

## Known Stubs

Nenhum. A página /signup está totalmente conectada — `checkProprietarioExiste` consulta o banco real, `supabase.auth.signUp` invoca o Supabase Auth real. O único comportamento pendente é a inserção em `public.proprietarios` após confirmação de email, que é responsabilidade do plano 03 (/auth/confirm).

---

## Threat Flags

Nenhuma superfície nova além do especificado no threat model do plano:
- T-10-03 mitigado: `checkProprietarioExiste` conta `proprietarios`, não `auth.users`
- T-10-04 mitigado: sem `supabaseAdmin` em componente client (verificado estaticamente)
- T-10-05 mitigado: guard no submit + constraint DB no plano 03
- T-10-06 mitigado: proxy.js redireciona autenticado de /signup para /dashboard
- T-10-SC: nenhum pacote novo instalado

---

## Self-Check: PASSED

- `src/actions/auth.js` existe: FOUND
- `src/app/signup/page.js` existe: FOUND
- `src/proxy.js` modificado existe: FOUND
- Commit `d3bc27d` (Task 1): FOUND
- Commit `55d7f40` (Task 2): FOUND
- Commit `eb79ab3` (Task 3): FOUND
