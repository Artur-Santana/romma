# Phase 2: Portal do Locatário — Research

**Pesquisado:** 2026-05-22
**Domínio:** Next.js 16 App Router · Supabase Auth (RPC role check) · Playwright E2E
**Confiança:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Modificar `/login/page.js` existente — após `signInWithPassword` com sucesso, chamar `supabase.rpc('is_proprietario')`. Se true → `router.push('/dashboard')`. Se false → `router.push('/portal/dashboard')`.
- **D-02:** Estado `AUTENTICANDO` mantido durante toda a sequência: auth + RPC + redirect. Spinner/label não muda até redirect acontecer.
- **D-03:** Eyebrow label do /login permanece o mesmo para ambos os roles — não há como detectar role pré-auth.
- **D-04:** Adicionar `/portal/:path*` ao matcher do `proxy.js`. Guard duplo: proxy.js barra unauthenticated antes de renderizar (consistente com /dashboard); layout.js vira defense-in-depth.
- **D-05:** Se Proprietário autenticado acessar `/portal/**` manualmente → proxy.js checa `is_proprietario()` true → redirect para `/dashboard`.
- **D-06:** Nova função `getContratoAtivoByLocatario(locatarioId)` em `queries-client.js`. Busca contrato com `status='ativo'`, inclui join `unidades(nome, valor_mensal)`. Não toca em `getContratosByLocatario` existente.
- **D-07:** Nova função `getParcelasPortal(contratoId)` em `queries-client.js`. Filtra `status != 'futura'` via `.neq('status', 'futura')`. Não toca em `getParcelasByContrato` existente.
- **D-08:** `seed.mjs` cria dados de teste para o locatário: registro em `locatarios` vinculado ao `usuario_id` de `locatario@test.romma.local`, unidade + edifício, contrato ativo, e parcelas (mix de paga/pendente/vencida).
- **D-09:** `global-teardown.js` (novo) apaga os dados de domínio após testes: parcelas, contrato, locatário (tabela `locatarios`), unidade, edifício. Usuários em `auth.users` são preservados.
- **D-10:** Testes PORT-01/02/03 usam credenciais `LOCATARIO` já declaradas em `e2e/fixtures.js` (`locatario@test.romma.local` / `Test1234!`).
- **D-11:** Sem inline styles em nenhum arquivo novo ou modificado — Tailwind v4 exclusivamente.
- **D-12:** `portal/layout.js` migrado para Tailwind (`flex flex-col h-screen`, `flex-1 overflow-auto bg-background`).

### Claude's Discretion

- Estrutura exata do `global-teardown.js` e ordem de deleção (respeitar FK constraints: parcelas antes de contratos, contratos antes de locatários/unidades).
- Escolha entre `maybeSingle()` vs `single()` em `getContratoAtivoByLocatario` (recomendado `maybeSingle()` — locatário pode não ter contrato ativo).
- Ordem das colunas na `ParcelsTable` (numero, data_vencimento, data_pagamento, status — conforme UI-SPEC).

### Deferred Ideas (OUT OF SCOPE)

- Notificação push/email para Locatário quando parcela vence — pós-TCC.
- Logout visível no portal — implementar em Fase 3 ou polimento.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Descrição | Suporte da Pesquisa |
|----|-----------|---------------------|
| PORT-01 | Locatário faz login com email/senha do convite enviado pelo Proprietário | Login page existente modificada com RPC check pós-auth (D-01); proxy.js expandido (D-04) |
| PORT-02 | Locatário visualiza o contrato ativo (unidade, valor mensal, data início/fim, status) | `getContratoAtivoByLocatario` (D-06) com join `unidades`; ContratoCard renderiza via `fmtBRL`/`fmtData` |
| PORT-03 | Locatário visualiza histórico de parcelas (pagas, pendentes, vencidas — futuras não exibidas) | `getParcelasPortal` (D-07) com `.neq('status', 'futura')`; ParcelsTable reutiliza StatusBadge |
| VIS-03 | Portal exibe design Obsidian Blueprint consistente com o restante do sistema | CSS vars de `globals.css` + Tailwind v4 sem inline styles (D-11); fontes Hanken Grotesk / Space Grotesk / JetBrains Mono (ver nota de discrepância abaixo) |
| TEST-03 | Testes E2E cobrem login via convite, contrato ativo, histórico de parcelas | `e2e/portal.spec.js` (novo); seed.mjs expandido (D-08); global-teardown.js (D-09) |
</phase_requirements>

---

## Summary

A Fase 2 é principalmente trabalho de integração sobre base já existente — não introduz novas bibliotecas e não requer novos padrões de arquitetura além dos já estabelecidos na Fase 1. A estrutura é: (1) modificar o fluxo de autenticação para fazer routing por role pós-login; (2) adicionar guard de autenticação para `/portal/**` no `proxy.js`; (3) criar o portal read-only com três componentes novos (`PortalDashboard`, `ContratoCard`, `ParcelsTable`) e duas funções de query novas; (4) expandir a infraestrutura de testes E2E com seed de dados do locatário e teardown.

Todos os padrões de implementação têm análogos diretos e funcionais no codebase: o guard do dashboard no `proxy.js` é o modelo para o guard do portal; o `PortalDashboard` segue o mesmo padrão de Client Component com `useEffect` → queries-client que os componentes de dashboard; os testes seguem o padrão de `auth-redirect.spec.js` e `dashboard.spec.js`. Nenhum padrão precisa ser inventado.

Atenção a três riscos concretos: (a) o teste `auth-redirect.spec.js` teste 1.2 quebra com D-01 (atualmente espera redirect para `/`, passará a esperar `/portal/dashboard`); (b) a sequência RPC post-auth no login deve manter o estado `AUTENTICANDO` ativo durante toda a resolução ou o spinner para no meio; (c) o teardown do Playwright deve respeitar FK constraints na ordem correta — parcelas → contratos → locatarios → unidades → edificios.

**Recomendação primária:** Implementar na ordem — proxy.js → login routing → queries → componentes portal → seed/teardown → testes. Cada etapa é testável isoladamente.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Auth guard (unauthenticated) | Node.js proxy (`proxy.js`) | layout.js (defense-in-depth) | proxy.js barra antes de renderizar — padrão existente do /dashboard |
| Role routing pós-auth | Client Component (`login/page.js`) | — | RPC `is_proprietario()` via supabase-browser após signInWithPassword bem-sucedido |
| Redirect Proprietário em /portal | Node.js proxy (`proxy.js`) | — | RPC server-side antes de renderizar (D-05) |
| Data fetching contrato/parcelas | Client Component (`PortalDashboard.js`) | queries-client.js | Padrão estabelecido: useEffect → funções puras em queries-client |
| Lógica de negócio (filtrar futuras) | Query layer (`queries-client.js`) | — | Filtro `.neq('status', 'futura')` na query, não no componente |
| Auth layout shell | Server Component (`portal/layout.js`) | — | Auth guard via supabase-server; não tem estado |
| Formatação de moeda/data | Utilitário (`utils.js`) | — | `fmtBRL()` e `fmtData()` já existem |
| Status visual | Componente reutilizável (`StatusBadge.js`) | — | Já suporta paga/pendente/vencida |

---

## Standard Stack

### Core (sem novas instalações)

Todos os pacotes já estão instalados. A Fase 2 não instala nenhuma dependência nova.

| Biblioteca | Versão atual | Propósito na Fase 2 |
|------------|-------------|---------------------|
| `@supabase/supabase-js` | ^2.99.2 | Queries de contrato e parcelas via supabase-browser |
| `@supabase/ssr` | ^0.9.0 | `createServerClient` no proxy.js para guard de portal |
| `next` | ^16.2.4 | App Router, Server Components, proxy.js |
| `react` | 19.2.4 | Client Components do portal |
| `tailwindcss` | ^4 | Styling exclusivo (D-11) |

[VERIFIED: codebase `package.json`]

### Utilitários existentes relevantes

| Asset | Localização | Uso na Fase 2 |
|-------|-------------|---------------|
| `getLocatarioByUserId(userId)` | `src/lib/queries-client.js:85` | Entry point: user → locatario |
| `fmtBRL(v)` | `src/lib/utils.js` | Formatar `valor_mensal` em ContratoCard |
| `fmtData(d)` | `src/lib/utils.js` | Formatar `data_inicio`/`data_fim` em ContratoCard |
| `StatusBadge` | `src/components/ui/StatusBadge.js` | Badges paga/pendente/vencida em ParcelsTable |
| `TopStrip` | `src/components/ui/TopStrip.js` | Já wired em `portal/layout.js` |
| `PageHeader` | `src/components/ui/PageHeader.js` | Header do portal dashboard |
| `login()` helper | `e2e/helpers.js` | Reutilizado nos testes PORT-01/02/03 |
| `LOCATARIO` fixture | `e2e/fixtures.js` | Credenciais do locatário de teste |

[VERIFIED: codebase direto]

---

## Package Legitimacy Audit

**Pacotes removidos por slopcheck [SLOP]:** nenhum
**Pacotes suspeitos [SUS]:** nenhum

Fase 2 não instala nenhum pacote externo novo. Todos os pacotes utilizados já estão presentes no `package.json` e foram validados em fases anteriores. Esta seção não se aplica.

---

## Architecture Patterns

### System Architecture Diagram

```
/login (Client Component — 'use client')
   │
   ├─ supabase.auth.signInWithPassword(email, password)
   │       │ erro → setStatus("error"), return
   │       │ ok ↓
   ├─ supabase.rpc('is_proprietario')   ← manter AUTENTICANDO durante toda esta sequência
   │       │ true  → router.push('/dashboard')
   │       └ false → router.push('/portal/dashboard')
   │
   ↓
proxy.js (Node runtime — src/proxy.js)
   matcher: ['/dashboard/:path*', '/portal/:path*']
   │
   ├─ /dashboard: sem user → /login; com user e !is_proprietario → /
   └─ /portal:    sem user → /login; com user e is_proprietario → /dashboard
   │
   ↓
/portal/layout.js (Server Component — defense-in-depth)
   └─ auth.getUser() → sem user → redirect('/login')
   │
   ↓
/portal/dashboard/page.js (Server Component — thin shell)
   └─ importa <PortalDashboard /> sem props de dados
   │
   ↓
PortalDashboard.js ('use client')
   ├─ useEffect → auth.getUser() → getLocatarioByUserId(user.id)
   ├─ useEffect → getContratoAtivoByLocatario(locatario.id)  [maybeSingle]
   ├─ useEffect → getParcelasPortal(contrato.id)             [.neq('status','futura')]
   │
   ├─ loading → skeletons
   ├─ sem contrato → empty state
   ├─ erro → error banner
   └─ dados → <ContratoCard> + <ParcelsTable>
```

### Recommended Project Structure

```
src/
├── app/
│   ├── login/page.js          # MODIFICAR — adicionar RPC check pós-auth (D-01, D-02)
│   └── portal/
│       ├── layout.js          # MODIFICAR — migrar inline styles para Tailwind (D-12)
│       └── dashboard/
│           └── page.js        # CRIAR — Server Component thin shell
├── components/features/portal/
│   ├── PortalDashboard.js     # CRIAR — Client Component, data fetching + state
│   ├── ContratoCard.js        # CRIAR — exibe dados do contrato ativo
│   └── ParcelsTable.js        # CRIAR — tabela de parcelas com StatusBadge
├── lib/
│   └── queries-client.js      # MODIFICAR — adicionar getContratoAtivoByLocatario, getParcelasPortal
├── proxy.js                   # MODIFICAR — adicionar /portal/:path* ao matcher + guard
e2e/
├── seed.mjs                   # MODIFICAR — adicionar seed de dados do locatário (D-08)
├── global-teardown.js         # CRIAR — cleanup FK-aware (D-09)
├── portal.spec.js             # CRIAR — PORT-01, PORT-02, PORT-03
├── auth-redirect.spec.js      # MODIFICAR — atualizar teste 1.2 (ver Pitfall 2)
playwright.config.js           # MODIFICAR — adicionar globalTeardown (D-09)
```

### Pattern 1: Auth Guard no proxy.js

Extensão direta do guard existente do `/dashboard`. Adicionar `/portal/:path*` ao matcher e implementar guard duplo.

```javascript
// src/proxy.js — padrão existente (guard do dashboard) para referência
// Source: codebase verificado

export async function proxy(request) {
  // ... setup createServerClient (não alterar) ...

  const { data: { user } } = await supabase.auth.getUser()

  // Guard /dashboard (existente — não alterar)
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (request.nextUrl.pathname.startsWith('/dashboard') && user) {
    const { data: perm } = await supabase.rpc('is_proprietario')
    if (!perm) return NextResponse.redirect(new URL('/', request.url))
  }

  // Guard /portal (NOVO — D-04 e D-05)
  if (request.nextUrl.pathname.startsWith('/portal') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (request.nextUrl.pathname.startsWith('/portal') && user) {
    const { data: perm } = await supabase.rpc('is_proprietario')
    if (perm) return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*'],  // ATUALIZAR
}
```

**Atenção ao custo de RPC:** Para `/portal`, o `is_proprietario()` só é chamado quando o usuário está autenticado. Locatários normais passam pela verificação e prosseguem — apenas Proprietários são redirecionados. O custo de 1 RPC por request no `/portal` é aceitável para um sistema MVP com usuário único.

### Pattern 2: Login routing por role (D-01, D-02)

```javascript
// src/app/login/page.js — SignInForm.handleSubmit (modificar)
// Source: codebase verificado + D-01

async function handleSubmit(e) {
  e.preventDefault()
  setStatus("loading")  // → "AUTENTICANDO" (mantém até redirect)
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    setStatus("error")
    return
  }
  // D-02: status permanece "loading" durante toda a sequência
  const { data: isProprietario } = await supabase.rpc('is_proprietario')
  setStatus("success")
  await new Promise(resolve => setTimeout(resolve, 500))
  router.push(isProprietario ? '/dashboard' : '/portal/dashboard')
}
```

**Nota D-11:** O componente `Field` em `login/page.js` usa `style={{...}}` inline. D-11 proíbe inline styles em arquivos novos ou modificados. Interpretação conservadora e correta: a modificação de `handleSubmit` (lógica JS) não torna obrigatória a migração de Tailwind de `Field`. Apenas código novo adicionado ao arquivo não pode usar inline styles. O Field já existente permanece como está. O planner não deve incluir migração de `Field` como parte desta fase.

### Pattern 3: Client Component com data fetching (PortalDashboard)

```javascript
// src/components/features/portal/PortalDashboard.js
// Source: padrão estabelecido em dashboard (Contratos.js, Parcelas.js)
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { getLocatarioByUserId, getContratoAtivoByLocatario, getParcelasPortal } from '@/lib/queries-client'

const supabase = createClient()

export default function PortalDashboard() {
  const [locatario, setLocatario] = useState(null)
  const [contrato, setContrato] = useState(null)
  const [parcelas, setParcelas] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const loc = await getLocatarioByUserId(user.id)
        setLocatario(loc)
        if (!loc) { setLoading(false); return }

        const ct = await getContratoAtivoByLocatario(loc.id)
        setContrato(ct)
        if (!ct) { setLoading(false); return }

        const parc = await getParcelasPortal(ct.id)
        setParcelas(parc)
      } catch (e) {
        setErro(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // ... render loading / empty / error / data states
}
```

### Pattern 4: Queries do portal (D-06, D-07)

```javascript
// Adicionar a src/lib/queries-client.js — não alterar funções existentes
// Source: D-06 e D-07 (CONTEXT.md)

export async function getContratoAtivoByLocatario(locatarioId) {
  const { data } = await supabase
    .from('contratos')
    .select('id, data_inicio, data_fim, status, observacoes, unidades(nome, valor_mensal)')
    .eq('locatario_id', locatarioId)
    .eq('status', 'ativo')
    .maybeSingle()   // locatário pode ter 0 contratos ativos — não lança erro
  return data
}

export async function getParcelasPortal(contratoId) {
  const { data } = await supabase
    .from('parcelas')
    .select('id, numero, data_vencimento, data_pagamento, status')
    .eq('contrato_id', contratoId)
    .neq('status', 'futura')
    .order('data_vencimento', { ascending: false })  // DESC conforme UI-SPEC
  return data ?? []
}
```

### Pattern 5: Seed e teardown para testes E2E (D-08, D-09)

```javascript
// e2e/seed.mjs — extensão da função seed() existente
// FK chain: edificio → unidade → locatario → contrato → parcelas

// Adicionar após upsertUser do locatário:
const locatarioUser = await upsertUser('locatario@test.romma.local', 'Test1234!')

// 1. Edifício de teste
const { data: edificio } = await admin.from('edificios')
  .insert({ nome: 'Edifício Teste E2E', endereco: 'Rua Teste, 1' })
  .select().single()

// 2. Unidade de teste
const { data: unidade } = await admin.from('unidades')
  .insert({ edificio_id: edificio.id, nome: 'Sala 101', area_m2: 40,
            valor_mensal: 2500, valor_visivel: true, status: 'alugada' })
  .select().single()

// 3. Locatário de teste (tabela locatarios, não auth.users)
const { data: locatario } = await admin.from('locatarios')
  .upsert({ usuario_id: locatarioUser.id, nome_razao_social: 'Locatário Teste',
            tipo: 'pf', documento: '12345678901', email: locatarioUser.email,
            telefone: '11999999999' }, { onConflict: 'usuario_id' })
  .select().single()

// 4. Contrato ativo
const dataInicio = new Date().toISOString().split('T')[0]
const dataFim = new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
const { data: contrato } = await admin.from('contratos')
  .insert({ unidade_id: unidade.id, locatario_id: locatario.id,
            data_inicio: dataInicio, data_fim: dataFim, status: 'ativo' })
  .select().single()

// 5. Parcelas (mix paga/pendente/vencida — sem futura)
const ontem = new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0]
await admin.from('parcelas').insert([
  { contrato_id: contrato.id, numero: 1, data_fechamento: ontem,
    data_vencimento: ontem, data_pagamento: ontem, status: 'paga' },
  { contrato_id: contrato.id, numero: 2, data_fechamento: ontem,
    data_vencimento: ontem, data_pagamento: null, status: 'vencida' },
  { contrato_id: contrato.id, numero: 3, data_fechamento: dataInicio,
    data_vencimento: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
    data_pagamento: null, status: 'pendente' },
])
```

```javascript
// e2e/global-teardown.js — CRIAR (D-09)
// Ordem respeita FK: parcelas → contratos → locatarios → unidades → edificios
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.test' })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function globalTeardown() {
  // Buscar o usuario_id do locatário de teste
  const { data: list } = await admin.auth.admin.listUsers()
  const locatarioUser = list.users.find(u => u.email === 'locatario@test.romma.local')
  if (!locatarioUser) return

  const { data: locatario } = await admin.from('locatarios')
    .select('id').eq('usuario_id', locatarioUser.id).maybeSingle()
  if (!locatario) return

  const { data: contratos } = await admin.from('contratos')
    .select('id').eq('locatario_id', locatario.id)
  const contratoIds = contratos?.map(c => c.id) ?? []

  if (contratoIds.length) {
    await admin.from('parcelas').delete().in('contrato_id', contratoIds)
    await admin.from('contratos').delete().in('id', contratoIds)
  }
  await admin.from('locatarios').delete().eq('id', locatario.id)

  // Limpar unidades e edificios criados pelo seed
  // (identificados pelo nome único de teste)
  const { data: unidades } = await admin.from('unidades')
    .select('id, edificio_id').eq('nome', 'Sala 101')
  if (unidades?.length) {
    const edificioId = unidades[0].edificio_id
    await admin.from('unidades').delete().in('id', unidades.map(u => u.id))
    await admin.from('edificios').delete().eq('id', edificioId)
  }
}
```

### Anti-Patterns a Evitar

- **Criar `/portal/login`:** ROADMAP success criteria #1 menciona `/portal/login` mas CONTEXT.md D-01/D-03 e UI-SPEC confirmam o reuso de `/login`. Não criar rota separada.
- **Importar `supabaseAdmin` em Client Components:** Apenas em Server Actions. Portal é read-only e usa supabase-browser.
- **Usar `single()` em `getContratoAtivoByLocatario`:** Locatário pode ter 0 contratos ativos — `single()` lançaria erro. Usar `maybeSingle()`.
- **Renderizar parcelas `futura`:** Filtrar na query (`.neq('status', 'futura')`), não no componente.
- **Criar `middleware.js`:** Next.js 16 neste projeto usa `proxy.js`. Nunca criar `middleware.js`.
- **Inline styles em arquivos novos:** D-11 proíbe. Usar Tailwind v4 exclusivamente nos arquivos novos.
- **Passar dados como props do Server Component para o Client Component:** Portal segue o padrão thin-shell — `page.js` importa `<PortalDashboard />` sem props de dados. O Client Component faz o próprio fetch.

---

## Don't Hand-Roll

| Problema | Não construir | Usar em vez disso | Por quê |
|----------|---------------|-------------------|---------|
| Formatação de moeda BRL | Formatador customizado | `fmtBRL()` em `utils.js` | Já testado em prod, lida com null (retorna "R$ 0") |
| Formatação de datas PT-BR | Date.toLocaleDateString inline | `fmtData()` em `utils.js` | Normaliza timezone (adiciona T00:00:00), retorna "—" para null |
| Badge de status de parcela | `<span>` customizado | `<StatusBadge status="paga|pendente|vencida" />` | Já tem paga/pendente/vencida mapeados corretamente |
| Busca do locatário por user | Query inline no componente | `getLocatarioByUserId(userId)` | Já existe em queries-client.js, testado |
| Login helper em E2E | `page.fill()` inline nos testes | `login(page, LOCATARIO)` em helpers.js | Já existe, reutilizado em todos os specs existentes |
| Credenciais de teste | Hardcoded nos specs | `LOCATARIO` de fixtures.js | DRY, centralizado |

---

## Common Pitfalls

### Pitfall 1: Estado AUTENTICANDO piscando antes do redirect

**O que acontece:** `setStatus("success")` é chamado antes do `supabase.rpc('is_proprietario')` resolver, fazendo o botão mudar para "ACESSO CONCEDIDO" por uma fração de segundo antes do redirect, ou o estado muda para "success" enquanto RPC ainda processa.

**Por que acontece:** Inserir RPC call entre auth e redirect sem manter o estado `loading`.

**Como evitar:** Chamar `setStatus("success")` somente após o RPC resolver. Estado `loading` cobre: signInWithPassword + rpc('is_proprietario') + await 500ms + router.push. Conforme D-02.

**Sinais de alerta:** Botão muda para "ACESSO CONCEDIDO" antes do redirect aparecer no teste E2E.

### Pitfall 2: Teste `auth-redirect.spec.js` teste 1.2 quebra com D-01

**O que acontece:** O teste `1.2 — não-proprietário loga e é redirecionado para /` atualmente espera `http://localhost:3000/`. Com D-01, o Locatário será redirecionado para `/portal/dashboard`, não para `/`. O teste falha.

**Por que acontece:** D-01 muda o comportamento do login para Locatários — antes o proxy.js redirecionava não-proprietários de `/dashboard` para `/`, agora o login direciona para `/portal/dashboard`.

**Como evitar:** O plano deve incluir uma task de atualizar `e2e/auth-redirect.spec.js` teste 1.2 para esperar `**/portal/dashboard` em vez de `/`. Esta é uma modificação obrigatória, não opcional.

**Sinais de alerta:** CI falha em auth-redirect.spec.js após a modificação do login.

### Pitfall 3: FK constraint violation no teardown

**O que acontece:** `global-teardown.js` tenta deletar `locatarios` antes de deletar `contratos` (que tem FK para `locatarios`), ou deleta `unidades` antes de deletar `contratos`.

**Por que acontece:** Ordem de deleção não respeita FK constraints do schema.

**Como evitar:** Ordem obrigatória: `parcelas` → `contratos` → `locatarios` → `unidades` → `edificios`. Ver Pattern 5 acima.

**Sinais de alerta:** Erro `23503 foreign key violation` no teardown do Playwright.

### Pitfall 4: proxy.js — RPC duplicada para /portal

**O que acontece:** O proxy.js chama `is_proprietario()` para `/dashboard` E depois para `/portal` no mesmo request se alguém acessa um path que matching os dois blocos. Não acontece neste caso (paths distintos), mas se a lógica for estruturada com um único `await supabase.rpc()` no início, ambos os guards podem reusar o resultado.

**Por que acontece:** Chamar RPC duas vezes por request é desnecessário.

**Como evitar:** Buscar o resultado do RPC uma vez e reutilizar em ambos os guards. Ou, mais simples, manter os blocos independentes (cada um chama RPC) — a simplidade do código justifica o custo extra de RPC em sistema de usuário único.

### Pitfall 5: Discrepância de fontes em VIS-03

**O que acontece:** `REQUIREMENTS.md` e `ROADMAP.md` mencionam "Manrope/Noto Sans" (ou "Noto Serif") como fontes do design Obsidian Blueprint. O codebase real usa Hanken Grotesk / Space Grotesk / JetBrains Mono.

**Por que acontece:** Documentação de requisitos escrita antes da implementação real do design system.

**Como evitar:** Usar as fontes do codebase real (Hanken Grotesk, Space Grotesk, JetBrains Mono). Os requisitos VIS-03 referem-se à consistência visual do sistema — a referência correta é `globals.css` e `UI-SPEC.md`, não os nomes de fonte em REQUIREMENTS.md. [ASSUMED: os nomes de fonte em REQUIREMENTS.md estão desatualizados — o planner não deve "corrigir" as fontes do sistema para Manrope/Noto]

### Pitfall 6: `status_convite` do locatário de teste

**O que acontece:** A tabela `locatarios` tem coluna `status_convite` (visível em `getLocatarios` query). O seed cria um locatário com `upsert` mas não define `status_convite`. Se houver RLS ou lógica de negócio que verifica `status_convite = 'aceito'` para permitir acesso ao portal, o locatário de teste pode ter o acesso bloqueado.

**Por que acontece:** CONTEXT.md não menciona `status_convite` nas queries do portal (D-06, D-07). Pode ser que o portal não filtre por `status_convite`, ou pode ser que precise.

**Como evitar:** O planner deve verificar se há política RLS na tabela `locatarios` que filtra por `status_convite`, e se o seed deve setar `status_convite = 'aceito'` explicitamente. [ASSUMED: `status_convite` não afeta queries do portal — mas é uma decisão de discretion do planner]

---

## Assumptions Log

| # | Claim | Seção | Risco se errado |
|---|-------|-------|-----------------|
| A1 | Nomes de fonte em REQUIREMENTS.md (Manrope/Noto Sans/Noto Serif) estão desatualizados; o sistema real usa Hanken Grotesk/Space Grotesk/JetBrains Mono | VIS-03 em Phase Requirements, Pitfall 5 | Implementação tentaria instalar fontes que não existem no projeto |
| A2 | `status_convite` não afeta as queries do portal (D-06, D-07) — sem filtro necessário | Pitfall 6, Seed pattern | Locatário de teste sem `status_convite='aceito'` pode ter RLS bloqueando queries |
| A3 | D-11 "sem inline styles em arquivos modificados" aplica-se apenas a código novo adicionado, não ao componente `Field` já existente em `login/page.js` | Pattern 2, Pitfall | Se interpretação mais rígida: Field precisa ser migrado para Tailwind — escopo adicional |

---

## Open Questions (RESOLVED)

1. **`status_convite` no seed** — RESOLVED
   - O que sabemos: tabela `locatarios` tem coluna `status_convite` (vista em `getLocatarios`)
   - O que não está claro: se há RLS que exige `status_convite = 'aceito'` para SELECT na tabela, e se o seed deve setá-lo
   - Recomendação: o planner deve incluir `status_convite: 'aceito'` no upsert do seed como precaução, ou verificar as policies RLS da tabela

2. **Escopo do D-11 em `login/page.js`** — RESOLVED
   - O que sabemos: D-11 proíbe inline styles em arquivos novos ou modificados
   - O que não está claro: se "modificado" implica migrar o componente `Field` inteiro para Tailwind
   - Recomendação: tratar como "código novo adicionado não usa inline styles; código existente permanece" — o planner confirma

---

## Validation Architecture

### Test Framework

| Propriedade | Valor |
|-------------|-------|
| Framework | Playwright ^1.60.0 |
| Config file | `playwright.config.js` |
| Quick run command | `npx playwright test e2e/portal.spec.js` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Arquivo existe? |
|--------|----------|-----------|-------------------|-----------------|
| PORT-01 | Locatário loga e chega em /portal/dashboard | E2E | `npx playwright test e2e/portal.spec.js -g "PORT-01"` | ❌ Wave 0 |
| PORT-02 | Locatário logado vê ContratoCard com dados do contrato ativo | E2E | `npx playwright test e2e/portal.spec.js -g "PORT-02"` | ❌ Wave 0 |
| PORT-03 | ParcelsTable exibe paga/pendente/vencida; futura não aparece | E2E | `npx playwright test e2e/portal.spec.js -g "PORT-03"` | ❌ Wave 0 |
| VIS-03 | Portal usa design Obsidian Blueprint | Manual (visual) | — | manual-only |
| TEST-03 | Testes E2E passam (meta-requisito) | E2E | `npx playwright test e2e/portal.spec.js` | ❌ Wave 0 |

### Modificação obrigatória em teste existente

| Arquivo | Teste | Mudança necessária | Por quê |
|---------|----|-----------|---------|
| `e2e/auth-redirect.spec.js` | `1.2 — não-proprietário loga e é redirecionado para /` | Atualizar `waitForURL` de `/` para `**/portal/dashboard` | D-01 muda o redirect de Locatários de `/` para `/portal/dashboard` |

### Wave 0 Gaps

- [ ] `e2e/portal.spec.js` — cobre PORT-01, PORT-02, PORT-03
- [ ] `e2e/global-teardown.js` — cleanup FK-aware
- [ ] `e2e/seed.mjs` — expandir com dados do locatário
- [ ] `playwright.config.js` — adicionar `globalTeardown: './e2e/global-teardown.js'`
- [ ] `e2e/auth-redirect.spec.js` — atualizar teste 1.2

### Sampling Rate

- **Por task commit:** `npx playwright test e2e/portal.spec.js` (roda só os testes do portal)
- **Por wave merge:** `npx playwright test` (suite completa)
- **Phase gate:** Suite completa verde antes de `/gsd:verify-work`

**Nota de performance:** `playwright.config.js` usa `npm run build && npm run start` no webServer — cada run do Playwright é lento (2-3 min de build). O planner deve agrupar asserções dentro de cada spec para minimizar rebuilds durante desenvolvimento.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth — `signInWithPassword`, `getUser()` |
| V3 Session Management | yes | `@supabase/ssr` + cookies httpOnly gerenciados automaticamente |
| V4 Access Control | yes | proxy.js guard + layout.js defense-in-depth + RLS no Supabase |
| V5 Input Validation | no | Portal é read-only — sem input do usuário além do login já existente |
| V6 Cryptography | no | Gerenciado pelo Supabase — sem implementação manual |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Locatário acessa dados de outro locatário | Spoofing/Information Disclosure | RLS no Supabase + query filtrada por `locatario_id` derivado do `auth.uid()` |
| Proprietário acessa portal diretamente | Elevation of Privilege | proxy.js guard D-05 + RPC `is_proprietario()` server-side |
| Unauthenticated access ao portal | Spoofing | proxy.js guard D-04 + layout.js defense-in-depth |
| `supabaseAdmin` em Client Component | Elevation of Privilege | Portal usa apenas `supabase-browser` (anon key) — admin importado só em Server Actions |

---

## Sources

### Primary (HIGH confidence — codebase verificado diretamente)

- `src/proxy.js` — padrão existente de guard de autenticação
- `src/app/login/page.js` — implementação atual do login com estados
- `src/app/portal/layout.js` — layout existente com inline styles a migrar
- `src/lib/queries-client.js` — funções existentes reutilizáveis
- `src/lib/utils.js` — `fmtBRL()`, `fmtData()`
- `src/components/ui/StatusBadge.js` — status map completo
- `src/components/ui/PageHeader.js` — componente reutilizável
- `src/app/globals.css` — tokens CSS vars e tema Obsidian Blueprint
- `e2e/seed.mjs`, `e2e/fixtures.js`, `e2e/helpers.js`, `playwright.config.js` — infraestrutura E2E existente
- `e2e/auth-redirect.spec.js` — teste existente que quebra com D-01

### Secondary (MEDIUM confidence — documentação do projeto)

- `.planning/phases/02-portal-do-locat-rio/02-CONTEXT.md` — decisões locked e discretion
- `.planning/phases/02-portal-do-locat-rio/02-UI-SPEC.md` — contrato visual
- `.planning/REQUIREMENTS.md` — definições formais PORT-01..TEST-03
- `.planning/ROADMAP.md` — success criteria

---

## Environment Availability

Step 2.6: SKIPPED — Fase 2 é trabalho de código/configuração puro. Todas as dependências externas (Supabase, Node.js, npm) já estão em uso pela infraestrutura existente da Fase 1.

---

## Metadata

**Breakdown de confiança:**
- Standard stack: HIGH — verificado diretamente no codebase; sem novas instalações
- Architecture: HIGH — padrões análogos existentes e funcionais no codebase
- Pitfalls: HIGH — identificados por leitura direta do código e dos testes existentes
- Testes E2E: HIGH — infraestrutura existente compreendida; gaps identificados

**Data da pesquisa:** 2026-05-22
**Válido até:** 2026-06-18 (deadline do TCC — stack estável)
