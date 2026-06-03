# Phase 07: Ajustes Finais Pré-Banca — Research

**Researched:** 2026-06-01
**Domain:** Supabase Auth (invite flow), Next.js Route Handlers, shadcn/ui Skeleton, Sidebar UI
**Confidence:** HIGH (exceto itens FIX-01 marcados como MEDIUM — ver seção de Open Questions)

---

## Summary

Esta fase tem 4 itens de escopo fechado: (1) rota `/auth/confirm` para completar o fluxo de convite do Supabase, (2) botão de logout no sidebar do proprietário, (3) skeleton loading nas 4 abas do dashboard + portal, e (4) remoção de link inútil no sidebar.

**Ponto crítico descoberto na pesquisa:** A decisão D-01 do CONTEXT.md especifica `exchangeCodeForSession` para `/auth/confirm`, mas o flow de `inviteUserByEmail` do Supabase **não usa PKCE** e **não envia `?code=`** no link do email. Ele envia `?token_hash=&type=invite`. O método correto é `supabase.auth.verifyOtp({ type, token_hash })`. Esta distinção é confirmada pela documentação oficial do Supabase: "PKCE is not supported when using `invite_user_by_email`, because the browser initiating the invite is often different from the browser accepting the invite." Usar `exchangeCodeForSession` resultaria em falha silenciosa ou erro de sessão inválida.

**Segundo ponto crítico:** D-02 especifica redirecionar para `/portal` após `/auth/confirm`, mas **não existe rota `/portal`** no projeto — apenas `/portal/dashboard` e `/portal/layout.js`. O `proxy.js` guarda `/portal` mas não redireciona `/portal` para `/portal/dashboard`. O destino correto é `/portal/dashboard`, alinhado com o comportamento do `login/page.js` (linha 176: `router.push(isProprietario ? '/dashboard' : '/portal/dashboard')`).

**Terceiro ponto crítico (UX-02):** As 4 abas do dashboard têm mecanismos de loading diferentes — não é uniforme. Ver seção Skeleton Loading Strategy abaixo.

**Recomendação primária:** Implementar `/auth/confirm` com `verifyOtp({ type, token_hash })`. Confirmar com o planner antes de alterar `exchangeCodeForSession`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Criar `src/app/auth/confirm/route.js` como Route Handler (server-side). Usa `supabase.auth.exchangeCodeForSession(code)` para trocar o authorization code do PKCE flow. **[ATENÇÃO: pesquisa indica que o método correto para invite é `verifyOtp` — ver Open Questions]**
- **D-02:** Após troca bem-sucedida, redirecionar para `/portal`. O proxy decide o destino final. **[ATENÇÃO: `/portal` não tem página — ver Open Questions]**
- **D-03:** Atualizar `redirectTo` em `src/actions/locatarios.js` linha 20: de `${siteUrl}/dashboard` para `${siteUrl}/auth/confirm`.
- **D-04:** `/auth/confirm` deve ser pública. Confirmado — matcher do proxy não inclui `/auth/*`.
- **D-05:** Criar `src/app/auth/reset-password/page.js` como page cliente. Usa `supabase.auth.updateUser({ password })`. Redireciona para `/portal` após sucesso. Estilo visual consistente com `/portal/login`.
- **D-06:** Adicionar `LogoutButton` no footer de `src/components/ui/OwnerSidebar.js`, abaixo do email do proprietário. Reutilizar `src/components/ui/LogoutButton.js` sem modificações.
- **D-07:** Comportamento idêntico ao do portal: `signOut()` → `router.push("/login")`.
- **D-08:** Usar o componente `Skeleton` do shadcn/ui. Adicionar se não instalado: `npx shadcn@latest add skeleton`.
- **D-09:** Cobertura: 4 abas do dashboard + `PortalDashboard.js`.
- **D-10:** Granularidade: enquanto `loading === true`, renderizar skeleton no lugar do conteúdo principal.
- **D-11:** Remover `<Link href="/portal" ...>→ Acessar como Locatário</Link>` do footer de `OwnerSidebar.js`. Sem link substituto.

### Claude's Discretion

- Estrutura exata dos skeletons (quantas linhas, proporções) — seguir o layout visual de cada componente
- Tratamento de erro no `/auth/confirm` (token inválido/expirado) — redirecionar para `/portal/login` com parâmetro de erro

### Deferred Ideas (OUT OF SCOPE)

- WR-01: Tratamento de erro nas queries de verificação do `seed-prod-demo.mjs`
- WR-02: Race condition estrutural no seed
- Botão "Mudar senha" no portal do Locatário (pós-banca)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Descrição | Suporte da Pesquisa |
|----|-----------|---------------------|
| FIX-01 | `/auth/confirm` existe e troca o token do email de convite — fluxo completo sem intervenção manual | `verifyOtp({ type, token_hash })` é o método correto; `exchangeCodeForSession` é para OAuth/PKCE, não para invite |
| UX-01 | Proprietário tem botão de logout no sidebar que redireciona para `/login` | `LogoutButton.js` já existe e funciona; importar no footer de `OwnerSidebar.js` |
| UX-02 | Todas as 4 abas do dashboard + portal exibem skeleton loading | Estratégia diferente por superfície — ver tabela abaixo |
| UX-03 | Link "Acessar como Locatário" removido do sidebar | Remoção cirúrgica de 4 linhas em `OwnerSidebar.js` |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Auth confirm route | API / Backend (Route Handler) | — | Troca de token é server-side; cookies set no servidor |
| Reset password page | Browser / Client | — | `updateUser()` pode ser client-side; form interativo |
| Sidebar logout | Browser / Client | — | `signOut()` e router.push são client-side; OwnerSidebar já é `"use client"` |
| Skeleton loading | Browser / Client (maioria) | Frontend Server (SSR pages) | Abas client: `useState(loading)`; abas SSR: `loading.js` |
| Remover link sidebar | Browser / Client | — | Edição de componente client existente |

---

## Standard Stack

### Core (já instalado no projeto)

| Biblioteca | Versão | Propósito | Status |
|------------|--------|-----------|--------|
| `@supabase/supabase-js` | 2.99.2 | Auth: `verifyOtp`, `signOut`, `updateUser` | [VERIFIED: package.json] |
| `@supabase/ssr` | ^0.9.0 | `createServerClient` para Route Handler | [VERIFIED: package.json] |
| `next` | ^16.2.4 | `NextResponse.redirect`, Route Handler, `loading.js` | [VERIFIED: package.json] |

### A Instalar

| Biblioteca | Versão | Propósito | Comando |
|------------|--------|-----------|---------|
| `shadcn/ui Skeleton` | componente shadcn | Skeleton loading visual | `npx shadcn@latest add skeleton` |

**Skeleton não está instalado:** Verificado — não há arquivo `skeleton.*` em `src/components/ui/` e o componente não consta no `package.json`.

---

## Package Legitimacy Audit

Apenas `shadcn/ui Skeleton` precisa ser adicionado — é um componente do shadcn CLI, não um pacote npm externo. O `npx shadcn@latest add skeleton` instala apenas via o CLI oficial do shadcn/ui já presente no projeto (via `components.json`). Nenhum pacote npm novo é adicionado ao `package.json`.

| Pacote | Registry | Mecanismo | slopcheck | Disposição |
|--------|----------|-----------|-----------|------------|
| shadcn skeleton component | shadcn CLI | `npx shadcn@latest add skeleton` — gera arquivo local | N/A (não é pacote npm) | Aprovado |

**Pacotes removidos:** nenhum
**Pacotes suspeitos:** nenhum

---

## FIX-01: Auth Confirm — Análise Detalhada

### Fluxo Real do Invite Supabase

O `inviteUserByEmail` envia um email cujo link tem formato:
```
https://projeto.supabase.co/auth/v1/verify?token=<hash>&type=invite&redirect_to=<redirectTo>
```

Quando `redirectTo` é configurado, o Supabase redireciona para:
```
https://seusite.com/auth/confirm?token_hash=<hash>&type=invite
```

**Parâmetros recebidos pelo Route Handler:**
- `token_hash` — hash do token de convite
- `type` — valor `"invite"` (EmailOtpType)

### Método Correto

```javascript
// src/app/auth/confirm/route.js
// Source: supabase.com/docs/guides/auth/server-side/nextjs + supabase.com/docs/reference/javascript/auth-verifyotp
import { NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase-server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')  // 'invite' para convites

  if (token_hash && type) {
    const supabase = await createServer()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) {
      // Redirecionar para /portal/dashboard (não /portal — sem rota index)
      return NextResponse.redirect(new URL('/portal/dashboard', request.url))
    }
  }

  // Token inválido/expirado — redirecionar com erro
  return NextResponse.redirect(new URL('/login?error=invite_invalid', request.url))
}
```

[ASSUMED] — Estrutura exata verificada via múltiplas fontes mas não testada no ambiente de produção desta instância.

### Por que NÃO usar `exchangeCodeForSession`

- `exchangeCodeForSession` é para PKCE OAuth flow — requer `code_verifier` cookie no browser do usuário
- Invite emails são abertos em browsers diferentes do que iniciou o convite (admin no desktop, locatário no celular) — PKCE falha por design
- Documentação Supabase confirma: "PKCE is not supported when using `invite_user_by_email`" [CITED: supabase.com/docs/guides/auth/sessions/pkce-flow]

### Redirect Destination

D-02 especifica `/portal`, mas `/portal` não tem página no projeto — confirmado por `find`:
```
/src/app/portal/dashboard/page.js   ← existe
/src/app/portal/layout.js           ← existe
/src/app/portal/page.js             ← NÃO existe
```

`proxy.js` guarda `/portal` mas não redireciona para `/portal/dashboard`. Destino correto: `/portal/dashboard`.

### Estado Runtime: Email Template do Supabase

O `redirectTo` configurado em `inviteUserByEmail` determina para onde o Supabase redireciona após verificar o token. Após alterar D-03 para `${siteUrl}/auth/confirm`, o fluxo funciona desde que:

1. `SITE_URL` no env aponte para o domínio correto (Vercel: `romma-alpha.vercel.app`)
2. O domínio esteja na lista de "Redirect URLs" permitidas no Supabase Dashboard (Authentication > URL Configuration)

[ASSUMED] — Configuração do Supabase Dashboard deve ser verificada manualmente.

---

## Skeleton Loading Strategy (UX-02)

### Análise por Superfície

As 4 abas do dashboard têm arquiteturas diferentes — **D-10 não se aplica uniformemente**.

| Superfície | Arquivo | Tipo de Componente | `loading` state? | Estratégia para Skeleton |
|------------|---------|-------------------|-----------------|--------------------------|
| Visão Geral | `src/app/dashboard/page.js` | **Server Component** (async) | Não — renderiza server-side | Criar `src/app/dashboard/loading.js` (Next.js Suspense boundary automático) |
| Unidades | `src/components/features/Unidades.js` | Client Component | `useState(false)` — **apenas mutations** — `useEffect` sem setLoading | Adicionar `loadingInicial` flag: `useState(true)` → `setLoadingInicial(false)` no useEffect |
| Contratos | `src/components/features/Contratos.js` | Client Component | `useState(false)` — **apenas mutations** — `useEffect` sem setLoading | Mesma estratégia: flag de initial load separada |
| Locatários | `src/app/dashboard/locatarios/page.js` → `LocatariosDesktop` | **Server Component** (page) + Client Component (desktop) | Dados chegam via props SSR; `loading` é apenas para mutations | Criar `src/app/dashboard/locatarios/loading.js` |
| Portal | `src/components/features/portal/PortalDashboard.js` | Client Component | `useState(true)` — **inicial** | D-10 aplica diretamente: `if (loading) return <Skeleton />` |

### Estratégias Detalhadas

#### Visão Geral e Locatários — `loading.js` (Suspense)

```javascript
// src/app/dashboard/loading.js  (e duplicar para /locatarios/loading.js)
// Source: nextjs.org/docs/app/api-reference/file-conventions/loading
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="romma-page p-12 bg-background min-h-full">
      <Skeleton className="h-6 w-48 mb-2" />
      <Skeleton className="h-12 w-64 mb-12" />
      <div className="grid grid-cols-4 gap-0 border border-border-3 mb-12">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-7">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-12 w-32" />
          </div>
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
```

#### Unidades e Contratos — Flag de Initial Load

```javascript
// Padrão para Unidades.js e Contratos.js
// Adicionar estado separado para initial load:
const [loadingInicial, setLoadingInicial] = useState(true)

useEffect(() => {
  async function fetchDados() {
    // ... fetch existente ...
    setLoadingInicial(false)  // só após primeiro fetch
  }
  fetchDados();
}, []);

// No render:
if (loadingInicial) return <SkeletonUnidades />  // ou SkeletonContratos
```

**Por que não usar o `loading` existente:** O `loading` atual em Unidades e Contratos é `useState(false)` e só é `true` durante mutations (criar/editar). Nunca é `true` na carga inicial — o useEffect não chama `setLoading(true)` antes do fetch.

#### Portal Dashboard — Aplicação Direta (D-10)

`PortalDashboard.js` já tem `useState(true)` inicial. Substituir o texto "Carregando..." por skeleton:

```javascript
// Linha 55 atual:
loading ? <div className="mt-8 font-mono text-[12px] text-fg-4">Carregando...</div>
// Substituir por:
loading ? <SkeletonPortal />
```

---

## Architecture Patterns

### Route Handler (FIX-01)

```
Invite email link clicado
    ↓
GET /auth/confirm?token_hash=xxx&type=invite
    ↓ (src/app/auth/confirm/route.js)
createServer() → verifyOtp({ type, token_hash })
    ↓ sucesso
NextResponse.redirect('/portal/dashboard')
    ↓ proxy.js guarda /portal/dashboard
    ↓ is_proprietario() == false → permite acesso
PortalDashboard renderiza
```

### Proxy Já Correto (D-04 confirmado)

```javascript
// src/proxy.js — matcher atual:
matcher: ['/dashboard', '/dashboard/:path*', '/portal', '/portal/:path*']
// /auth/* não está no matcher → já é pública por omissão ✓
```

---

## Don't Hand-Roll

| Problema | Não Construir | Usar em Vez | Por quê |
|----------|--------------|-------------|---------|
| Token invite exchange | Handler HTTP manual | `supabase.auth.verifyOtp()` | Gerencia cookies de sessão, refresh token, PKCE ausência |
| Logout | Limpar cookies manual | `supabase.auth.signOut()` + `LogoutButton.js` (já existe) | Já testado no portal |
| Skeleton | CSS pulse manual | `shadcn/ui Skeleton` | Consistência visual, acessibilidade |
| Loading SSR pages | Client wrapper artificial | `loading.js` Next.js | Mecanismo nativo do App Router para Suspense boundaries |

---

## Common Pitfalls

### Pitfall 1: `exchangeCodeForSession` falha silenciosa no invite
**O que dá errado:** Handler chama `exchangeCodeForSession(code)` mas o URL do email não tem `?code=`, tem `?token_hash=`. `code` é `null`. Supabase retorna erro de "missing code". Locatário vê 500 ou loop de redirect.
**Por que acontece:** Confusão entre PKCE OAuth flow e email token flow.
**Como evitar:** Usar `verifyOtp({ type, token_hash })`. Checar `searchParams.get('token_hash')` — não `searchParams.get('code')`.

### Pitfall 2: Redirect para `/portal` em vez de `/portal/dashboard`
**O que dá errado:** `NextResponse.redirect('/portal')` cai num 404 — não existe `src/app/portal/page.js`.
**Como evitar:** Redirecionar para `/portal/dashboard` diretamente.
**Evidência:** `find /src/app/portal` — só `dashboard/page.js` e `layout.js`.

### Pitfall 3: `loading.js` não existe para rotas SSR — sem skeleton
**O que dá errado:** `/dashboard` e `/dashboard/locatarios` são Server Components. Nenhum `loading.js`. Enquanto o servidor processa, o usuário vê tela em branco.
**Como evitar:** Criar `src/app/dashboard/loading.js` e `src/app/dashboard/locatarios/loading.js`.

### Pitfall 4: `loading` em Unidades e Contratos nunca é `true` no initial load
**O que dá errado:** Código adiciona `if (loading) return <Skeleton />` mas `loading` começa como `false` e nunca muda para `true` antes do primeiro fetch. Skeleton nunca aparece.
**Como evitar:** Criar estado separado `loadingInicial = useState(true)` ou mudar `loading` inicial para `true` e garantir que o useEffect o defina como `false` ao terminar.

### Pitfall 5: `createServer()` em Route Handler pode diferir de Server Action
**O que dá errado:** `createServer()` usa `cookies()` do `next/headers` — em Route Handlers, a API de cookies funciona de forma levemente diferente em Next.js 16 vs versões anteriores.
**Como evitar:** Usar exatamente `createServer()` de `@/lib/supabase-server.js` como documentado — já funciona em Server Actions do projeto.

---

## Code Examples

### FIX-01 — Route Handler `/auth/confirm`

```javascript
// src/app/auth/confirm/route.js
// Source: supabase.com/docs/guides/auth/server-side/nextjs
//         supabase.com/docs/reference/javascript/auth-verifyotp
import { NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase-server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')  // 'invite' para convites

  if (token_hash && type) {
    const supabase = await createServer()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) {
      return NextResponse.redirect(new URL('/portal/dashboard', request.url))
    }
  }

  // Token inválido, expirado ou parâmetros ausentes
  return NextResponse.redirect(new URL('/login?error=invite_invalid', request.url))
}
```

### FIX-01 — Atualizar `redirectTo` em `locatarios.js`

```javascript
// src/actions/locatarios.js linha 19-21 — ANTES:
const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/dashboard`
})

// DEPOIS:
const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm`
})
```

### UX-01 — LogoutButton no OwnerSidebar

```javascript
// src/components/ui/OwnerSidebar.js — adicionar import e componente no footer
import LogoutButton from "@/components/ui/LogoutButton"

// No footer, após o email do proprietário — ANTES:
{email && (
  <span className="font-mono text-[10px] text-fg-5 mt-2 tracking-[0.5px]">
    {email}
  </span>
)}

// DEPOIS:
{email && (
  <span className="font-mono text-[10px] text-fg-5 mt-2 tracking-[0.5px]">
    {email}
  </span>
)}
<LogoutButton />
```

### UX-03 — Remover link do OwnerSidebar

```javascript
// src/components/ui/OwnerSidebar.js — REMOVER estas 4 linhas:
<Link
  href="/portal"
  className="font-mono text-[11px] text-fg-3 no-underline tracking-[0.5px]"
>
  → Acessar como Locatário
</Link>
```

### UX-02 — Skeleton para PortalDashboard (aplicação direta)

```javascript
// src/components/features/portal/PortalDashboard.js
import { Skeleton } from "@/components/ui/skeleton"

// Substituir "Carregando..." por:
loading ? (
  <div className="mt-8 flex flex-col gap-4">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
)
```

---

## State of the Art

| Abordagem Antiga | Abordagem Atual | Quando Mudou | Impacto |
|-----------------|-----------------|-------------|---------|
| `auth-helpers-nextjs` `createServerSupabaseClient` | `@supabase/ssr` `createServerClient` | Supabase 2.x | Padrão atual no projeto ✓ |
| `createRouteHandlerClient` | `createServerClient` com cookies manual | Supabase SSR v0.9 | Padrão atual — `supabase-server.js` usa isso ✓ |
| `exchangeCodeForSession` para todos os flows | `verifyOtp` para email links, `exchangeCodeForSession` para OAuth PKCE | Supabase auth v2 | FIX-01 deve usar `verifyOtp` |

---

## Assumptions Log

| # | Claim | Seção | Risco se Errado |
|---|-------|-------|----------------|
| A1 | Convite Supabase envia `?token_hash=&type=invite` (não `?code=`) no redirectTo | FIX-01 | Handler retorna erro/loop — fluxo de convite quebra em produção |
| A2 | `/portal` não tem rota index — redirect deve ser para `/portal/dashboard` | FIX-01 | 404 para locatário recém-autenticado |
| A3 | Domínio `romma-alpha.vercel.app` está na lista de Redirect URLs do Supabase Dashboard | FIX-01 runtime | Supabase bloqueia redirect → convite nunca chega ao `/auth/confirm` |
| A4 | `createServer()` funciona em Route Handler da mesma forma que em Server Actions | FIX-01 | Cookies não são setados; sessão não persiste após redirect |

---

## Open Questions (RESOLVED 2026-06-02)

1. **`exchangeCodeForSession` vs `verifyOtp` — qual método está correto para este projeto?**
   - **RESOLVED:** `verifyOtp({ token_hash, type: 'invite' })` é o método correto. Fontes primárias Supabase confirmam que email invite links usam `token_hash`. `exchangeCodeForSession` é para PKCE/OAuth. Implementar handler defensivo: primário `verifyOtp`, fallback `exchangeCodeForSession` se `code` presente.

2. **Rota de destino após confirm — `/portal/dashboard` ou outra?**
   - **RESOLVED:** `/portal/dashboard`. `src/app/portal/page.js` não existe (404). `/portal/dashboard` é a rota real do portal do locatário. Ratificado pelo desenvolvedor em 2026-06-02.

3. **`/auth/reset-password` redireciona para `/portal` ou `/portal/dashboard`?**
   - **RESOLVED:** `/portal/dashboard`. Mesma decisão da questão 2 por consistência. Ratificado pelo desenvolvedor em 2026-06-02.

---

## Environment Availability

| Dependência | Requerido Por | Disponível | Versão | Fallback |
|-------------|--------------|------------|--------|----------|
| `@supabase/supabase-js` | FIX-01, UX-01 | ✓ | 2.99.2 | — |
| `@supabase/ssr` | FIX-01 (Route Handler) | ✓ | ^0.9.0 | — |
| `shadcn/ui Skeleton` | UX-02 | ✗ | — | `npx shadcn@latest add skeleton` |
| Supabase Redirect URLs config | FIX-01 produção | [ASSUMED] presente | — | Adicionar no Dashboard |
| `src/app/portal/page.js` | D-02 redirect destino | ✗ NÃO EXISTE | — | Usar `/portal/dashboard` |

**Dependências ausentes sem fallback:**
- `src/app/portal/page.js` — não existe; redirecionar para `/portal/dashboard`

**Dependências ausentes com fallback:**
- `shadcn/ui Skeleton` — instalar via CLI shadcn (1 comando)

---

## Validation Architecture

### Test Framework

| Propriedade | Valor |
|-------------|-------|
| Framework | Playwright 1.60.0 |
| Config file | `playwright.config.js` |
| Quick run command | `npx playwright test e2e/auth-redirect.spec.js` |
| Full suite command | `npm run test:e2e` |

### Phase Requirements → Test Map

| Req ID | Comportamento | Tipo de Teste | Comando Automatizado | Arquivo Existe? |
|--------|--------------|--------------|---------------------|-----------------|
| FIX-01 | `/auth/confirm` aceita token_hash e cria sessão | Manual (requer email real de convite) | N/A — adicionar smoke test de rota pública | ✗ — nota abaixo |
| UX-01 | Botão "Sair" aparece no sidebar do dashboard | E2E smoke | `npx playwright test e2e/dashboard-smoke.spec.js` | ✅ (extender) |
| UX-02 | Skeleton aparece antes dos dados carregarem | Manual / visual | — | N/A |
| UX-03 | Link "Acessar como Locatário" não existe no sidebar | E2E smoke | `npx playwright test e2e/dashboard-smoke.spec.js` | ✅ (extender) |

**Nota FIX-01:** Teste automatizado de invite flow requer envio de email real. Verificação manual em produção é obrigatória (DEPL-02). O planner deve incluir passo de verificação manual explícito. Pode-se adicionar smoke test para verificar que `GET /auth/confirm?token_hash=invalid&type=invite` retorna redirect (não 500).

### Wave 0 Gaps

- [ ] `e2e/dashboard-smoke.spec.js` — extender com: (a) verificar ausência de "Acessar como Locatário", (b) verificar presença do botão "Sair"
- [ ] `e2e/auth-confirm.spec.js` — smoke test básico: GET `/auth/confirm` sem params → redirect para `/login`, não 500

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Aplica | Controle Padrão |
|---------------|--------|-----------------|
| V2 Authentication | Sim — troca de token | `supabase.auth.verifyOtp()` — não hand-rolled |
| V3 Session Management | Sim — cookie set pelo Route Handler | `createServer()` gerencia cookies via `@supabase/ssr` |
| V4 Access Control | Sim — proxy protege `/portal` | `proxy.js` matcher existente — sem mudanças |
| V5 Input Validation | Parcial | `token_hash` e `type` são passados ao Supabase sem sanitização adicional — OK pois Supabase valida |
| V6 Cryptography | Não se aplica | Token hash gerado pelo Supabase — não gerido pelo app |

### Known Threat Patterns

| Padrão | STRIDE | Mitigação Padrão |
|--------|--------|-----------------|
| Token replay (token_hash reutilizado) | Elevation of Privilege | Supabase invalida token após primeiro uso bem-sucedido |
| Redirect aberto (open redirect) | Spoofing | Redirect hardcoded para `/portal/dashboard` — não parametrizado por `?next=` |
| Token expirado tratado como sucesso | Tampering | Verificar `error` antes de redirecionar — não ignorar erro do `verifyOtp` |

---

## Sources

### Primary (HIGH confidence)
- [supabase.com/docs/guides/auth/sessions/pkce-flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow) — confirmação de que PKCE não é suportado em `inviteUserByEmail`
- [supabase.com/docs/reference/javascript/auth-verifyotp](https://supabase.com/docs/reference/javascript/auth-verifyotp) — API `verifyOtp` com `token_hash`
- [supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail) — parâmetros do callback URL
- Codebase: `src/proxy.js`, `src/app/portal/`, `src/components/features/*.js` — inspecionados diretamente

### Secondary (MEDIUM confidence)
- [supabase.com/docs/guides/auth/auth-email-templates](https://supabase.com/docs/guides/auth/auth-email-templates) — formato do ConfirmationURL com `token_hash`
- [supabase.com/docs/guides/auth/server-side/nextjs](https://supabase.com/docs/guides/auth/server-side/nextjs) — padrão de Route Handler com `createServer()`
- WebSearch: múltiplos exemplos de `verifyOtp` + `token_hash` + Route Handler em Next.js App Router

### Tertiary (LOW confidence)
- Estrutura exata do email template deste projeto Supabase — não verificada nesta sessão (requer acesso ao Dashboard)

---

## Metadata

**Confidence breakdown:**
- FIX-01 (`verifyOtp` vs `exchangeCodeForSession`): MEDIUM — múltiplas fontes concordam mas template email não foi verificado
- FIX-01 (redirect destination `/portal/dashboard`): HIGH — confirmado por ausência de `/portal/page.js` no codebase
- UX-01 (logout): HIGH — componente existe, import direto
- UX-02 (skeleton strategy): HIGH — arquitetura verificada em todos os arquivos-alvo
- UX-03 (remover link): HIGH — localização exata verificada no código
- Skeleton Supabase: HIGH — componente shadcn padrão, instalação via CLI

**Research date:** 2026-06-01
**Valid until:** 2026-06-15 (estável — bibliotecas estabelecidas, sem fast-moving)
