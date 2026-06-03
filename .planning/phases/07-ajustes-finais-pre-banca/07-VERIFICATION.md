---
phase: 07-ajustes-finais-pre-banca
verified: 2026-06-02T21:00:00Z
status: human_needed
score: 8/8 must-haves verified (code-level)
overrides_applied: 0
human_verification:
  - test: "Confirmar template do email de convite no Supabase Dashboard"
    expected: "O template 'Invite user' usa {{ .ConfirmationURL }} → envia token_hash+type=invite; OR {{ .Code }} → envia code. Confirmar que romma-alpha.vercel.app está nas Redirect URLs (Authentication > URL Configuration)"
    why_human: "Não é possível verificar o conteúdo do template Supabase sem acesso ao Dashboard. Esta verificação determina qual branch do handler defensivo é exercitado em produção."

  - test: "Verificar fluxo completo do convite em produção — em especial o type do token"
    expected: "Locatário convidado recebe email, clica no link, é redirecionado para /portal/dashboard (type=invite) OU /auth/reset-password (type=recovery). Se type=invite, o locatário chega autenticado mas SEM ter definido senha — verificar se o Supabase autentica via magic-link sem requerir senha no invite flow, ou se o handler deveria redirecionar para /auth/reset-password para todos os invites."
    why_human: "A semântica exata de type=invite vs type=recovery no flow inviteUserByEmail do Supabase só pode ser confirmada com um envio de email real. Se type=invite redireciona para /portal/dashboard sem definição de senha, o locatário não conseguirá fazer login por email/senha posteriormente (PORT-01). Esta é a verificação de maior risco para a demo."

  - test: "Verificar skeleton loading visualmente nas 5 superfícies (Task 4 do Plano 03 — checkpoint:human-verify bloqueante)"
    expected: "Com throttling de rede (Chrome DevTools → Slow 3G): /dashboard exibe grid de 4 KPI cards em skeleton antes dos dados; /dashboard/locatarios exibe tabela em skeleton; /dashboard/unidades exibe grid de 3 cards em skeleton; /dashboard/contratos exibe cabeçalho + linhas de tabela em skeleton; /portal/dashboard exibe 1 card + 4 linhas de skeleton. Todos com cantos retos (rounded-none). Skeleton some quando dados carregam."
    why_human: "Comportamento visual e de timing — não verificável por grep. Task 4 do Plano 03 era checkpoint:human-verify bloqueante e não foi executado (SUMMARY: 'aguarda verificação visual')."

  - test: "Verificar botão Sair no sidebar do dashboard em produção"
    expected: "Logar como Proprietário em /dashboard, ver botão 'Sair' no footer do sidebar, clicar, confirmar redirect para /login e sessão encerrada."
    why_human: "Comportamento de runtime (signOut + redirect) não verificável por análise estática. Requer navegador autenticado."
---

# Phase 7: Ajustes Finais Pré-Banca — Verification Report

**Phase Goal:** Corrigir gaps de auth e UX identificados na Fase 6 — fluxo de convite completo em produção, logout no dashboard, skeleton loading e limpeza do sidebar
**Verified:** 2026-06-02T21:00:00Z
**Status:** HUMAN_NEEDED
**Re-verification:** Não — verificação inicial

---

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `/auth/confirm` existe e troca o token do email de convite — Locatário convidado consegue acessar o portal sem intervenção manual de admin | ✓ VERIFIED (código) / ? HUMAN (live) | `src/app/auth/confirm/route.js` exporta `GET`, chama `verifyOtp`/`exchangeCodeForSession`, redireciona para `/portal/dashboard` no sucesso e `/login?error=invite_invalid` na falha. Fluxo em produção com token real requer verificação humana. |
| 2 | Proprietário tem botão de logout no sidebar do dashboard que redireciona para `/login` | ✓ VERIFIED (código) / ? HUMAN (comportamento runtime) | `OwnerSidebar.js` importa e renderiza `<LogoutButton />`. `LogoutButton.js` chama `supabase.auth.signOut()` → `router.push("/login")`. Comportamento de runtime requer verificação em navegador. |
| 3 | Todas as 4 abas do dashboard e o portal do Locatário exibem skeleton loading durante carregamento de dados | ✓ VERIFIED (código) / ? HUMAN (visual) | `loading.js` criados para /dashboard e /dashboard/locatarios; `loadingInicial` flag + guards em Unidades.js e Contratos.js; Skeleton substitui "Carregando..." no PortalDashboard. Aparência visual requer verificação com throttling. |
| 4 | Link "Acessar como Locatário" removido do sidebar — sem links inúteis para proprietário | ✓ VERIFIED | Grep confirma 0 ocorrências de "Acessar como Locatário" e 0 ocorrências de `href="/portal"` em `OwnerSidebar.js`. Link "Ver Página Pública" preservado. |

**Score de código: 8/8 must-haves verificados a nível de artefato**

---

### Must-Haves por Plano (Verificação Detalhada)

#### Plano 01 — FIX-01: Fluxo de Convite Supabase

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Locatário convidado que clica no link do email chega autenticado no portal sem intervenção manual | ✓ código / ? live | Handler implementado e wired; requer token real para confirmar |
| 2 | GET /auth/confirm sem parâmetros redireciona para /login?error=invite_invalid (não 500) | ✓ VERIFIED | `route.js` linha 34-35: sem params → redirect hardcoded. E2E test `auth-confirm.spec.js` test 2.1 cobre este caso. |
| 3 | GET /auth/confirm com token válido cria sessão e redireciona para /portal/dashboard | ? HUMAN | Requer token real de convite Supabase — não testável sem email real. |
| 4 | Locatário consegue definir nova senha em /auth/reset-password e é redirecionado para /portal/dashboard | ✓ VERIFIED | `reset-password/page.js` chama `supabase.auth.updateUser({ password })` e `router.push('/portal/dashboard')` no sucesso. Validação SENHAS_DIVERGENTES sem chamar Supabase confirmada. |
| 5 | O convite gerado em convidarLocatario aponta redirectTo para /auth/confirm (não /dashboard) | ✓ VERIFIED | `locatarios.js` linha 28: `redirectTo: \`${siteUrl}/auth/confirm\`` — grep confirma 0 ocorrências de "/dashboard" e 1 ocorrência de "auth/confirm". |

#### Plano 02 — UX-01 + UX-03: Sidebar

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Proprietário vê um botão 'Sair' no footer do sidebar do dashboard | ✓ VERIFIED | `OwnerSidebar.js` linha 84: `<LogoutButton />` renderizado no footer. LogoutButton exibe texto "Sair". |
| 2 | Clicar em 'Sair' executa signOut e redireciona para /login | ✓ código / ? runtime | `LogoutButton.js` linhas 16-23: `signOut()` → `router.push("/login")`. Runtime requer navegador. |
| 3 | O link '→ Acessar como Locatário' não existe mais no sidebar | ✓ VERIFIED | 0 ocorrências de "Acessar como Locatário" e 0 ocorrências de `href="/portal"` em `OwnerSidebar.js`. |
| 4 | O link '→ Ver Página Pública' continua presente no sidebar | ✓ VERIFIED | Linha 77: `→ Ver Página Pública` presente com `href="/"`. |

#### Plano 03 — UX-02: Skeleton Loading

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | /dashboard exibe skeleton durante carregamento server-side | ✓ VERIFIED | `src/app/dashboard/loading.js` existe, exporta default `Loading()`, importa Skeleton, contém grid de 4 KPI cards com `rounded-none`. |
| 2 | /dashboard/locatarios exibe skeleton durante carregamento server-side | ✓ VERIFIED | `src/app/dashboard/locatarios/loading.js` existe, exporta default `Loading()`, importa Skeleton. |
| 3 | /dashboard/unidades exibe skeleton durante carregamento inicial | ✓ VERIFIED | `Unidades.js`: `loadingInicial` declarado (linha 37), `setLoadingInicial(false)` no fetch do mount (linha 107), guard `if (loadingInicial) return <SkeletonUnidades />` (linha 131). |
| 4 | /dashboard/contratos exibe skeleton durante carregamento inicial | ✓ VERIFIED | `Contratos.js`: `loadingInicial` declarado (linha 68), `setLoadingInicial(false)` após `carregar()` (linha 78), guard `if (loadingInicial) return <SkeletonContratos />` (linha 160). |
| 5 | Portal do Locatário exibe skeleton no lugar do texto 'Carregando...' | ✓ VERIFIED | `PortalDashboard.js`: Skeleton importado (linha 9), ramo `loading ? <div class="...flex-col gap-4"><Skeleton .../> ×5</div>` (linhas 54-61). Grep confirma 0 ocorrências de "Carregando..." no arquivo. |

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/auth/confirm/route.js` | Route Handler GET que troca token | ✓ VERIFIED | Exporta `GET`, contém `verifyOtp`, `createServer` (com `await`), redirects hardcoded |
| `src/app/auth/reset-password/page.js` | Page cliente para definir senha | ✓ VERIFIED | `"use client"`, contém `updateUser`, `router.push('/portal/dashboard')`, `Suspense` wrapping |
| `e2e/auth-confirm.spec.js` | Smoke test do Route Handler | ✓ VERIFIED | 2 testes: sem params e com token inválido — ambos asseveram redirect para `/login?error=invite_invalid` |
| `src/components/ui/OwnerSidebar.js` | Sidebar com LogoutButton e sem link inútil | ✓ VERIFIED | Import + render de `LogoutButton`; href="/portal" ausente; "Ver Página Pública" preservado |
| `src/components/ui/skeleton.js` | Componente Skeleton shadcn/ui | ✓ VERIFIED | Exporta `Skeleton`, usa `animate-pulse`, `rounded-none` já no default className |
| `src/app/dashboard/loading.js` | Suspense boundary Visão Geral | ✓ VERIFIED | Grid de 4 KPI cards com `rounded-none` em todos os Skeleton |
| `src/app/dashboard/locatarios/loading.js` | Suspense boundary Locatários | ✓ VERIFIED | Eyebrow + título + tabela com `rounded-none` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/actions/locatarios.js` | `/auth/confirm` | `redirectTo` no `inviteUserByEmail` | ✓ WIRED | Linha 28: `redirectTo: \`${siteUrl}/auth/confirm\`` — "dashboard" ausente |
| `src/app/auth/confirm/route.js` | `src/lib/supabase-server.js` | `createServer()` para set de cookies server-side | ✓ WIRED | Linha 2: import; linha 10: `const supabase = await createServer()` |
| `src/components/ui/OwnerSidebar.js` | `src/components/ui/LogoutButton.js` | import e render no footer | ✓ WIRED | Linha 8: import; linha 84: `<LogoutButton />` renderizado |
| `src/components/features/Unidades.js` | `loadingInicial` state | guard de render que mostra skeleton no primeiro fetch | ✓ WIRED | `setLoadingInicial(false)` em `fetchDados` (mount path, não em `carregarDados`) — bug corrigido conforme SUMMARY |
| `src/components/features/portal/PortalDashboard.js` | `src/components/ui/skeleton.js` | import Skeleton substituindo "Carregando..." | ✓ WIRED | Import linha 9; uso nas linhas 56-60 dentro do ramo `loading ? ...` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `OwnerSidebar.js` | `email` | `supabase.auth.getUser()` no `useEffect` | Sim — auth API real | ✓ FLOWING |
| `PortalDashboard.js` | `contrato`, `parcelas` | `getContratoAtivoByLocatario`, `getParcelasPortal` no useEffect | Sim — queries Supabase reais | ✓ FLOWING |
| `Unidades.js` | `unidades` | `fetchDados` (useEffect mount) | Sim — query Supabase | ✓ FLOWING |
| `Contratos.js` | `contratos` | `carregar` (useEffect mount) | Sim — query Supabase | ✓ FLOWING |
| `dashboard/loading.js` | N/A — puramente visual (skeleton) | N/A | N/A — nenhum dado | ✓ FLOWING (sem dados por design) |

---

### Behavioral Spot-Checks

Testes Playwright não executados nesta verificação — requerem servidor rodando e env vars Supabase (confirmado no SUMMARY do Plano 02: worktree sem `.env.local` causa erro de prerendering no `npm run build`). Verificação via inspeção de código.

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| GET /auth/confirm sem params → redirect /login | Código: linha 34-35 em route.js | Redirect hardcoded presente | ✓ VERIFIED (código) |
| GET /auth/confirm token inválido → redirect /login | Código: linhas 15-17 verificam `error` antes de redirecionar | Error check presente, não ignora erro | ✓ VERIFIED (código) |
| SENHAS_DIVERGENTES sem chamar Supabase | Código: linhas 135-138 em reset-password/page.js | Guard antes de `updateUser` | ✓ VERIFIED (código) |
| "Acessar como Locatário" ausente do DOM | Grep: 0 ocorrências em OwnerSidebar.js | Texto e href ausentes no source | ✓ VERIFIED |

---

### Requirements Coverage

| Requirement | Source | Description | Status | Evidence |
|-------------|--------|-------------|--------|---------|
| FIX-01 | ROADMAP.md Phase 7 | Fluxo de convite Supabase completo — `/auth/confirm` troca token | ✓ código / ? live | Route Handler implementado e wired; live requer token real |
| UX-01 | ROADMAP.md Phase 7 | Logout no sidebar do dashboard | ✓ código / ? runtime | LogoutButton importado e renderizado no OwnerSidebar |
| UX-02 | ROADMAP.md Phase 7 | Skeleton loading nas 5 superfícies | ✓ código / ? visual | Todos os artifacts de skeleton criados e wired |
| UX-03 | ROADMAP.md Phase 7 | Remover link "Acessar como Locatário" do sidebar | ✓ VERIFIED | 0 ocorrências do link em OwnerSidebar.js |

**Nota sobre REQUIREMENTS.md:** FIX-01, UX-01, UX-02, UX-03 não constam na lista v1 de REQUIREMENTS.md (21 requisitos) — são "gap-closure requirements" adicionados durante a Phase 7 e mapeados exclusivamente via ROADMAP.md. Isso é consistente com a cobertura documentada no ROADMAP: "21/21 v1 + 4/4 gap-closure mapped". Não são ORPHANED.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| Nenhum | — | — | — | Sem debt markers (TBD/FIXME/XXX), stubs, ou retornos hardcoded vazios encontrados nos arquivos modificados |

---

### Human Verification Required

**Status: HUMAN_NEEDED — 4 itens requerem verificação em ambiente real**

---

#### 1. Template do email de convite Supabase (Plan 01, Task 1 — checkpoint:human-verify pendente)

**Teste:** Abrir https://supabase.com/dashboard/project/vfymttcajeyhrmsyhrtj/auth/templates, selecionar "Invite user", verificar qual variável o link usa.
**Esperado:** `{{ .ConfirmationURL }}` → envia `?token_hash=&type=invite` (caminho `verifyOtp`). `{{ .Code }}` → envia `?code=` (caminho `exchangeCodeForSession`). Confirmar também que `https://romma-alpha.vercel.app` está nas Redirect URLs.
**Por que humano:** Conteúdo do template Supabase não é verificável por acesso ao repositório.

---

#### 2. Fluxo completo do convite em produção + verificação do type do token (risco mais alto para a banca)

**Teste:** Enviar convite real a um email de teste via dashboard do Proprietário. Clicar no link do email. Observar para onde redireciona.
**Esperado:** Locatário chega autenticado em `/portal/dashboard` (se `type=invite` autentica diretamente via magic-link) OU é direcionado para `/auth/reset-password` para definir senha (se `type=recovery`).

**Ponto crítico a confirmar:** O handler atual roteia `type === "recovery"` → `/auth/reset-password` e `type === "invite"` → diretamente para `/portal/dashboard`. Se o Supabase envia `type=invite` e o locatário chega no portal sem nunca ter definido senha, ele não conseguirá fazer login por email/senha em sessões futuras (PORT-01). Verificar se o Supabase trata o invite como magic-link (sessão sem senha) ou se o locatário precisa definir senha — e se o redirect para `/auth/reset-password` deveria ser aplicado também para `type=invite`.

**Por que humano:** Semântica de `type=invite` vs `type=recovery` no flow `inviteUserByEmail` do Supabase só pode ser confirmada com email real. Este é o item de maior risco para a demonstração na banca.

---

#### 3. Verificação visual dos skeletons nas 5 superfícies (Plan 03, Task 4 — checkpoint:human-verify bloqueante)

**Teste:** Rodar `npm run dev`, logar como Proprietário, aplicar throttling "Slow 3G" no DevTools, navegar entre /dashboard, /dashboard/unidades, /dashboard/contratos, /dashboard/locatarios. Logar como Locatário e acessar /portal/dashboard.
**Esperado:** Cada superfície exibe skeleton estruturado (não tela em branco, não "Carregando...") durante o fetch. O skeleton some quando os dados carregam. Todos os skeletons têm cantos retos.
**Por que humano:** Comportamento visual e de timing não verificável por análise estática.

---

#### 4. Botão Sair funcional em produção (runtime)

**Teste:** Logar como Proprietário, ver botão "Sair" no footer do sidebar, clicar, confirmar redirect para /login e que a sessão foi encerrada (acessar /dashboard e confirmar redirect para /login).
**Esperado:** Redirect para /login após clique; sessão encerrada no Supabase.
**Por que humano:** Comportamento de signOut + redirect requer navegador autenticado.

---

### Gaps Summary

Nenhum gap técnico encontrado. Todos os artefatos existem, são substantivos e estão wired corretamente. Os 4 itens acima são verificações de comportamento em runtime que as ferramentas estáticas não conseguem resolver.

---

*Verified: 2026-06-02T21:00:00Z*
*Verifier: Claude (gsd-verifier)*
