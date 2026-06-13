---
phase: 10-signup-proprietario
verified: 2026-06-08T21:00:00Z
status: passed
human_verification_resolved: "Signup fluxo verificado no app live (romma-alpha) + AUTH-01 E2E verde. AUTH-02 form-guard deferido (STATE deferred). 2026-06-13"
score: 4/4 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Registrar Proprietário ponta a ponta via email real"
    expected: "Após preencher /signup, e-mail de confirmação chega na caixa de entrada; clicar no link redireciona para /dashboard; row inserida em public.proprietarios"
    why_human: "Requer template de email Supabase configurado corretamente (ConfirmationURL), URL allow-list no projeto Supabase, e servidor rodando — não testável por grep ou static check"
  - test: "Segundo signup bloqueado após instância configurada (fluxo real)"
    expected: "Navegar para /signup com Proprietário já registrado exibe banner INSTANCIA_BLOQUEADA, sem formulário, com link para /login"
    why_human: "E2E (signup.spec.js) requer .env.test (gitignored), servidor ativo e conexão com banco real — não executável neste verificador"
---

# Phase 10: Signup Proprietário — Verification Report

**Phase Goal:** Implementar o fluxo completo de signup do Proprietário (AUTH-01, AUTH-02) — rota /signup com guard de instância única, email de confirmação via Supabase, e handler /auth/confirm que registra o primeiro usuário como Proprietário e redireciona para /dashboard.
**Verified:** 2026-06-08T21:00:00Z
**Status:** human_needed
**Re-verification:** Não — verificação inicial

---

## Contexto

Não existem arquivos PLAN.md para esta fase — apenas SUMMARYs e um REVIEW.md. Os must-haves foram derivados diretamente das quatro cláusulas do goal e dos IDs de requisito AUTH-01/AUTH-02 mapeados no REQUIREMENTS.md.

O `10-REVIEW.md` foi gerado no estado intermediário do código (após commit `52dd8fa`). Commits subsequentes (`405bd9e`, `5034e66`, `65cf79e`, `9406a53`, `0a8cc38`, `77d248d`) corrigiram todos os criticals e warnings identificados pelo review. **O código atual é a fonte de verdade — o REVIEW está desatualizado em relação ao HEAD da branch.**

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Rota `/signup` existe, exibe formulário e guard de instância única | VERIFIED | `src/app/signup/page.js` — 375 linhas, state machine com estados `empty/loading/email_sent/locked/error`; `useEffect` chama `checkProprietarioExiste()` no mount e seta `locked` se instância já configurada |
| 2 | `/auth/confirm` registra o primeiro usuário confirmado como Proprietário | VERIFIED | `src/app/auth/confirm/route.js` — função `tentarRegistrarProprietario` com count→insert; gateada em `type === "signup"` (commit `405bd9e`); constraint single-row em migration `20260608000000_proprietarios_single_row_constraint.sql` (commit `5034e66`) previne race CR-02 |
| 3 | `/auth/confirm` redireciona Proprietário confirmado para `/dashboard` | VERIFIED | `route.js:71` — `return NextResponse.redirect(new URL("/dashboard", request.url))` quando `viroupProprietario === true`; preservado nos dois ramos (`token_hash` e `code`) |
| 4 | Segunda tentativa de signup é bloqueada com mensagem clara (AUTH-02) | VERIFIED | `src/app/signup/page.js:244-257` — banner `INSTANCIA_BLOQUEADA · 409` com corpo "Esta instância já possui um Proprietário configurado." e link `Ir para login →` href="/login"; guard server-side em `cadastrarProprietario` (commit `65cf79e`) retorna 409 antes de chamar `signUp` |

**Score:** 4/4 truths verified

---

### Deferred Items

Nenhum.

---

### Required Artifacts

| Artifact | Expected | Status | Detalhes |
|----------|----------|--------|----------|
| `src/actions/auth.js` | Server Action `checkProprietarioExiste` (guard) + `cadastrarProprietario` (signup com guard server-side) | VERIFIED | Ambas as funções presentes; `cadastrarProprietario` adicionada em commit `65cf79e` como correção de WR-02 |
| `src/app/signup/page.js` | Página `/signup` com state machine e guard de instância | VERIFIED | 375 linhas, `'use client'`, state machine com 5 estados, campos com `id`/`htmlFor` para Playwright |
| `src/proxy.js` | Redirecionar autenticado de `/signup` para `/dashboard` | VERIFIED | Branch `onSignup && user → redirectWithCookies('/dashboard')`; matcher inclui `/signup`; helper `redirectWithCookies` copia cookies refreshados (WR-01 corrigido em commit `9406a53`) |
| `src/app/auth/confirm/route.js` | Branch aditivo que registra Proprietário e redireciona para `/dashboard` | VERIFIED | `tentarRegistrarProprietario` gateada em `type === "signup"` (CR-01 corrigido em `405bd9e`) |
| `supabase/migrations/20260608000000_proprietarios_single_row_constraint.sql` | Constraint single-row em `proprietarios` para prevenir race (CR-02) | VERIFIED | `CREATE UNIQUE INDEX proprietarios_single_row ON public.proprietarios ((true))` presente |
| `e2e/signup.spec.js` | Suite E2E RED para AUTH-01 e AUTH-02 | VERIFIED (existência) | 2 describes com `beforeAll/afterAll` idempotentes; seed/teardown isolado; não executável neste verificador (`.env.test` gitignored) |

---

### Key Link Verification

| From | To | Via | Status | Detalhes |
|------|----|-----|--------|----------|
| `signup/page.js` | `actions/auth.js:checkProprietarioExiste` | import + useEffect mount | WIRED | Linha 6 importa; `useEffect` chama no mount; pré-check no submit |
| `signup/page.js` | `actions/auth.js:cadastrarProprietario` | import + onSubmit handler | WIRED | Linha 6 importa; `handleSubmit` chama em vez de `supabase.auth.signUp` diretamente (WR-02 corrigido) |
| `proxy.js` | `/signup` route | config.matcher + onSignup branch | WIRED | Matcher inclui `/signup`; branch `onSignup && user → /dashboard` na linha 44 |
| `auth/confirm/route.js` | `proprietarios` table | `tentarRegistrarProprietario` | WIRED | `supabaseAdmin.from("proprietarios").select + insert` com `count === 0` |
| `auth/confirm/route.js` | `/dashboard` redirect | `viroupProprietario === true` | WIRED | `NextResponse.redirect("/dashboard")` em ambos os ramos (token_hash e code) |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produz Dados Reais | Status |
|----------|---------------|--------|--------------------|--------|
| `signup/page.js` | `status` (estado da state machine) | `checkProprietarioExiste` → `supabaseAdmin.from("proprietarios").select count` | Sim — query real ao banco | FLOWING |
| `signup/page.js` | resultado do signup | `cadastrarProprietario` → `supabase.auth.signUp` via Server Action | Sim — chama Supabase Auth real | FLOWING |
| `auth/confirm/route.js` | `viroupProprietario` | `tentarRegistrarProprietario` → count + insert em `proprietarios` | Sim — queries admin reais | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Resultado | Status |
|----------|-----------|--------|
| `checkProprietarioExiste` existe e conta `proprietarios` | Presente em `src/actions/auth.js:7-17`; usa `supabaseAdmin` com `count: "exact", head: true` | PASS |
| `cadastrarProprietario` tem guard server-side (re-verifica antes de signUp) | Presente em `src/actions/auth.js:23-75`; count > 0 retorna 409 antes de chamar `supabase.auth.signUp` | PASS |
| `/auth/confirm` não promove locatário a Proprietário (type !== "signup") | `route.js:68` — `if (type === "signup")` gatea `tentarRegistrarProprietario` | PASS |
| Constraint single-row na migration | `20260608000000_proprietarios_single_row_constraint.sql` — `CREATE UNIQUE INDEX ... ((true))` | PASS |
| E2E suite lista os 2 testes | SKIP — requer `.env.test` e conexão com banco; não executável neste verificador |

---

### Probe Execution

Não aplicável — nenhuma probe declarada nos SUMMARYs.

---

### Requirements Coverage

| Req ID | Fase | Descrição | Status | Evidência |
|--------|------|-----------|--------|-----------|
| AUTH-01 | Phase 10 | Proprietário pode criar conta via tela de signup em `/signup` (email + senha, instância única) | SATISFIED | `/signup` existe com formulário, guard, `cadastrarProprietario` server action + email via Supabase, `/auth/confirm` registra Proprietário e redireciona para `/dashboard` |
| AUTH-02 | Phase 10 | Segunda tentativa de signup é bloqueada com mensagem clara ("Instância já configurada") | SATISFIED | Banner `INSTANCIA_BLOQUEADA · 409` exibido no mount via `checkProprietarioExiste`; guard server-side em `cadastrarProprietario` retorna 409 impedindo criação de conta órfã |

---

### Anti-Patterns Found

| Arquivo | Linha | Pattern | Severidade | Impacto |
|---------|-------|---------|------------|---------|
| `e2e/signup.spec.js` | 58 | Comentário documenta limitação de durabilidade no `afterAll` se o processo for morto | Info | Risco de estado corrompido no DB de teste em crash de CI (documentado como WR-03 no REVIEW; commit `0a8cc38` adicionou `try/finally` — risco residual documentado, não bloqueante) |

Sem TBD, FIXME ou XXX não referenciados em arquivos modificados pela fase.

---

### Estado do Code Review (10-REVIEW.md)

O `10-REVIEW.md` foi gerado após o commit `52dd8fa` (último da execução original). Commits pós-review fecharam todos os criticals e warnings:

| Finding | Commit de Fix | Estado Atual |
|---------|---------------|--------------|
| CR-01: locatário podia virar Proprietário via `type=invite` | `405bd9e` | FECHADO — `type === "signup"` gatea `tentarRegistrarProprietario` |
| CR-02: race TOCTOU sem constraint single-row | `5034e66` | FECHADO — migration `proprietarios_single_row` adicionada |
| WR-01: cookies refreshados perdidos no redirect | `9406a53` | FECHADO — helper `redirectWithCookies` em todos os branches do proxy |
| WR-02: bypass client-side criava conta órfã | `65cf79e` | FECHADO — `cadastrarProprietario` Server Action re-verifica no servidor |
| WR-03: afterAll frágil em crash | `0a8cc38` | FECHADO (parcialmente) — `try/finally` adicionado; risco residual de SIGKILL documentado |
| IN-01: "· 409" hardcoded no banner de erro genérico | `77d248d` | FECHADO |
| IN-02: `atualizarStatusConvite` incondicional no ramo `code` | Não commitado separadamente | PENDENTE — ramo `code` ainda chama `atualizarStatusConvite` incondicionalmente (linha 91); porém não é bloqueante pois locatários chegam via `token_hash+type=invite`, não via `code`; é no-op em prática |

**IN-02 residual:** o ramo `code` (PKCE) chama `atualizarStatusConvite` para qualquer usuário confirmado sem distinguir se é Proprietário. Na prática é no-op (nenhuma row em `locatarios` com esse `usuario_id`) porque o Proprietário foi criado via `signUp` nativo, não via convite. Documentado como inconsistência, não como bloqueante.

---

### Human Verification Required

#### 1. Round-trip de confirmação de email real

**Test:** Com servidor em execução, preencher `/signup` com email válido, aguardar o email de confirmação do Supabase, clicar no link.
**Expected:** Link de confirmação redireciona para `/auth/confirm?token_hash=...&type=signup`, `tentarRegistrarProprietario` insere row em `proprietarios`, redirect final para `/dashboard` com sessão ativa.
**Why human:** Requer configuração de template de email no Supabase Dashboard (`{{ .ConfirmationURL }}`) e URL allow-list com `{origin}/auth/confirm` — dependências externas não verificáveis por análise estática.

#### 2. Guard AUTH-02 em browser real

**Test:** Com Proprietário já cadastrado, navegar para `/signup`.
**Expected:** Banner `INSTANCIA_BLOQUEADA · 409` visível imediatamente, sem formulário, com link "Ir para login →" funcional.
**Why human:** O comportamento de mount + fetch da Server Action não é testável sem servidor ativo.

#### 3. Suite E2E Playwright

**Test:** `npx playwright test e2e/signup.spec.js --project=chromium` com `.env.test` configurado e servidor em execução.
**Expected:** 2/2 testes passam (AUTH-01 email_sent, AUTH-02 banner locked).
**Why human:** `.env.test` está em `.gitignore` e não existe no worktree de verificação; requer conexão real com Supabase.

---

### Gaps Summary

Nenhum gap bloqueante. Todos os must-haves verificados em código. O status `human_needed` reflete dependências de infraestrutura (template de email Supabase, allow-list de URLs, servidor ativo) que não são verificáveis por análise estática. O IN-02 residual (ramo `code` sem gate de tipo) é uma inconsistência de baixo risco documentada.

---

_Verified: 2026-06-08T21:00:00Z_
_Verifier: Claude (gsd-verifier)_
