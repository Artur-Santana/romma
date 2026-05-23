# Phase 2: Portal do Locatário — Pattern Map

**Mapped:** 2026-05-22
**Files analyzed:** 12 (7 new, 5 modified)
**Analogs found:** 12 / 12

---

## File Classification

| Arquivo Novo/Modificado | Role | Data Flow | Analog mais próximo | Match |
|-------------------------|------|-----------|---------------------|-------|
| `src/proxy.js` (modify) | middleware | request-response | `src/proxy.js` linhas 28–37 | exact (espelhar bloco guard) |
| `src/app/login/page.js` (modify) | component | request-response | `src/app/login/page.js` linhas 165–176 | exact (inserir RPC entre linhas 172–173) |
| `src/app/portal/layout.js` (modify) | layout | request-response | `src/app/login/page.js` linhas 329–340 | role-match (shell `h-screen flex flex-col`) |
| `src/app/portal/dashboard/page.js` (new) | page (thin shell) | — | `src/app/dashboard/contratos/page.js` | exact |
| `src/components/features/portal/PortalDashboard.js` (new) | component | request-response | `src/components/features/Parcelas.js` linhas 22–47 | role-match |
| `src/components/features/portal/ContratoCard.js` (new) | component | — | Composto — ver abaixo | partial |
| `src/components/features/portal/ParcelsTable.js` (new) | component | — | `src/components/features/Parcelas.js` linhas 96–161 | role-match |
| `src/lib/queries-client.js` (modify) | utility | CRUD | `src/lib/queries-client.js` linhas 68–92 | exact |
| `e2e/seed.mjs` (modify) | test infra | — | `e2e/seed.mjs` linhas 1–23 | exact (admin client + upsertUser) |
| `e2e/global-teardown.js` (new) | test infra | — | `e2e/seed.mjs` linhas 1–10 | role-match |
| `e2e/portal.spec.js` (new) | test | — | `e2e/auth-redirect.spec.js` + `e2e/dashboard.spec.js` | role-match |
| `e2e/auth-redirect.spec.js` (modify) | test | — | `e2e/auth-redirect.spec.js` linha 16 | exact (one-line change) |
| `playwright.config.js` (modify) | config | — | `playwright.config.js` linha 24 | exact (adicionar `globalTeardown`) |

---

## Pattern Assignments

### `src/proxy.js` (middleware, request-response)

**Analog:** `src/proxy.js` — espelhar o bloco dashboard existente para `/portal`.

**Core guard pattern** (linhas 28–37 atuais — referência para o bloco novo):
```javascript
// EXISTENTE — não alterar
if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
  return NextResponse.redirect(new URL('/login', request.url))
}
if (request.nextUrl.pathname.startsWith('/dashboard') && user) {
  const { data: perm } = await supabase.rpc('is_proprietario')
  if (!perm) {
    return NextResponse.redirect(new URL('/', request.url))
  }
}
```

**Bloco novo a inserir após o bloco /dashboard (D-04, D-05):**
```javascript
// NOVO — guard /portal
if (request.nextUrl.pathname.startsWith('/portal') && !user) {
  return NextResponse.redirect(new URL('/login', request.url))
}
if (request.nextUrl.pathname.startsWith('/portal') && user) {
  const { data: perm } = await supabase.rpc('is_proprietario')
  if (perm) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}
```

**Matcher a atualizar** (linha 43 atual):
```javascript
// ANTES:
export const config = { matcher: ['/dashboard/:path*'] }
// DEPOIS:
export const config = { matcher: ['/dashboard/:path*', '/portal/:path*'] }
```

**Nota de RPC:** O bloco de `/portal` chama `is_proprietario()` de forma independente do bloco `/dashboard`. Para um request que bate apenas em `/portal`, o RPC é chamado apenas uma vez. Simplidade > micro-otimização em sistema MVP.

---

### `src/app/login/page.js` (component, request-response)

**Analog:** `src/app/login/page.js` — modificação cirúrgica de `handleSubmit`.

**handleSubmit atual** (linhas 165–176 — estado exato antes da modificação):
```javascript
async function handleSubmit(e) {
  e.preventDefault()
  setStatus("loading")
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    setStatus("error")
    return
  }
  setStatus("success")
  await new Promise(resolve => setTimeout(resolve, 500))
  router.push("/dashboard")
}
```

**handleSubmit modificado (D-01, D-02):**
```javascript
async function handleSubmit(e) {
  e.preventDefault()
  setStatus("loading")                                          // estado "AUTENTICANDO"
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    setStatus("error")
    return
  }
  // D-02: status permanece "loading" durante toda a sequência RPC + redirect
  const { data: isProprietario } = await supabase.rpc('is_proprietario')
  setStatus("success")
  await new Promise(resolve => setTimeout(resolve, 500))
  router.push(isProprietario ? '/dashboard' : '/portal/dashboard')
}
```

**Atenção D-11:** O componente `Field` em `login/page.js` usa `style={{...}}` inline (linhas 135–148). D-11 aplica-se apenas a código novo adicionado — `Field` já existente permanece como está. NÃO migrar `Field` para Tailwind nesta fase.

---

### `src/app/portal/layout.js` (layout, Server Component)

**Analog:** `src/app/login/page.js` linhas 329–340 — estrutura shell `h-screen flex flex-col`.

**Estado atual do layout (com inline styles a migrar):**
```javascript
// ANTES — inline styles violam D-11
<div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
  <TopStrip />
  <main style={{ flex: 1, overflow: "auto", background: "var(--background)" }}>
    {children}
  </main>
</div>
```

**Padrão de referência — estrutura shell do login** (`login/page.js` linha 331):
```javascript
// login usa: className="h-screen flex flex-col bg-background overflow-hidden"
// portal adapta para: className="flex flex-col h-screen bg-background"
```

**Layout migrado (D-12 — Tailwind v4 exclusivo):**
```javascript
import { redirect } from "next/navigation"
import { createServer } from "@/lib/supabase-server"
import TopStrip from "@/components/ui/TopStrip"

export default async function PortalLayout({ children }) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopStrip />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
```

---

### `src/app/portal/dashboard/page.js` (page, thin shell — novo)

**Analog:** `src/app/dashboard/contratos/page.js` — correspondência exata.

**Analog completo** (arquivo inteiro, 5 linhas):
```javascript
import Contratos from "@/components/features/Contratos";

export default function ContratosPage() {
  return <Contratos />;
}
```

**Padrão para `portal/dashboard/page.js`:**
```javascript
import PortalDashboard from "@/components/features/portal/PortalDashboard"

export default function PortalDashboardPage() {
  return <PortalDashboard />
}
```

**Regras críticas:**
- Server Component por padrão (sem `'use client'`)
- NÃO passar props de dados — Client Component faz próprio fetch (ver CONTEXT.md linha 102)
- NÃO importar supabase aqui — apenas importar o componente

---

### `src/components/features/portal/PortalDashboard.js` (component, Client Component — novo)

**Analog:** `src/components/features/Parcelas.js` linhas 22–47 + `src/components/features/GestaoEdificios.js` linhas 8–29.

**Imports pattern** (baseado em `Parcelas.js` linhas 1–10):
```javascript
"use client"

import { useEffect, useState } from "react"
import { createClient } from '@/lib/supabase-browser'
import { getLocatarioByUserId, getContratoAtivoByLocatario, getParcelasPortal } from "@/lib/queries-client"
import ContratoCard from "./ContratoCard"
import ParcelsTable from "./ParcelsTable"

const supabase = createClient()
```

**State pattern** (baseado em `Parcelas.js` linhas 24–28 + convenções CLAUDE.md):
```javascript
export default function PortalDashboard() {
  const [locatario, setLocatario] = useState(null)
  const [contrato, setContrato] = useState(null)
  const [parcelas, setParcelas] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)   // "erro" — não "error" (convenção do projeto)
```

**useEffect + data fetch chain** (adaptado de `Parcelas.js` linhas 30–47):
```javascript
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const loc = await getLocatarioByUserId(user.id)
        setLocatario(loc)
        if (!loc) { setLoading(false); return }      // empty state: sem locatario
        const ct = await getContratoAtivoByLocatario(loc.id)
        setContrato(ct)
        if (!ct) { setLoading(false); return }       // empty state: sem contrato ativo
        const parc = await getParcelasPortal(ct.id)
        setParcelas(parc)
      } catch (e) {
        setErro(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])
```

**Error banner pattern** (baseado em `Parcelas.js` linhas 90–93 — Tailwind, sem inline):
```javascript
{erro && (
  <div className="px-4 py-[10px] mb-6 bg-[var(--danger-bg2)] border border-danger-fg font-mono text-[12px] text-danger-fg">
    {erro}
  </div>
)}
```

**Wrapper de página** (baseado em `Parcelas.js` linha 63):
```javascript
<div className="romma-page bg-background min-h-full px-12 pt-12 pb-20">
```

---

### `src/components/features/portal/ContratoCard.js` (component — novo)

**Analog:** Composto — sem analog direto. Combinar dois padrões:
1. Dados exibidos: `src/app/dashboard/page.js` linhas 251–265 (campos locatário/unidade/valor/status em grid)
2. Visual card com label+valor: `src/app/dashboard/page.js` linhas 183–196 (metric tile: label mono + valor display + sub)

**Para estrutura e campos**, ver `.planning/phases/02-portal-do-locat-rio/02-UI-SPEC.md` — é o contrato visual autoritativo para `ContratoCard`.

**Padrões de formatação a reutilizar** (`src/lib/utils.js`):
```javascript
import { fmtBRL, fmtData } from "@/lib/utils"
// fmtBRL(contrato.unidades.valor_mensal)  → "R$ 2.500"
// fmtData(contrato.data_inicio)           → "01 jan. 2026" / "—" se null
```

**StatusBadge** (`src/components/ui/StatusBadge.js`):
```javascript
import StatusBadge from "@/components/ui/StatusBadge"
// <StatusBadge status={contrato.status} />  → suporta "ativo", "encerrado", "cancelado"
```

**Tipografia e classes de referência** (padrão dashboard):
```javascript
// Label mono: className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase"
// Valor display: className="font-display font-bold text-[48px] leading-none tracking-[-2.4px] text-fg-1"
// Sub: className="font-mono text-[11px] text-fg-4"
// Eyebrow: className="eyebrow eyebrow--indigo"
// Card container: className="border border-border-3 bg-surface p-7"
```

**D-11:** ContratoCard é arquivo novo — ZERO inline styles. Tailwind v4 exclusivamente.

---

### `src/components/features/portal/ParcelsTable.js` (component — novo)

**Analog:** `src/components/features/Parcelas.js` linhas 96–161 — correspondência de data shape. Copiar estrutura de grid e padrão de StatusBadge, mas converter inline styles para Tailwind.

**ALERTA D-11 — não copiar este padrão de Parcelas.js:**
```javascript
// PROIBIDO em arquivo novo — Parcelas.js linhas 11–12
const COL = "60px 1fr 1fr 1fr 1.2fr 120px"
const gridStyle = { gridTemplateColumns: COL }
// ...
<div style={gridStyle} className="grid ...">   // NÃO COPIAR
```

**Padrão correto para ParcelsTable (Tailwind arbitrary value):**
```javascript
// Colunas do portal: numero + vencimento + pagamento + status (sem "Ação")
// Tailwind v4: grid grid-cols-[60px_1fr_1fr_1.2fr]
<div className="grid grid-cols-[60px_1fr_1fr_1.2fr] bg-[oklch(0.26_0_0)] border-b border-border-3">
```

**Header cell pattern** (baseado em `Parcelas.js` linhas 13–19):
```javascript
function HeaderCell({ children }) {
  return (
    <div className="px-5 py-3 font-mono text-[10px] font-bold tracking-[1.4px] uppercase text-fg-4">
      {children}
    </div>
  )
}
```

**Row data pattern** (baseado em `Parcelas.js` linhas 113–158 — sem a coluna "Ação"):
```javascript
{parcelas.map((parcela, i) => (
  <div
    key={parcela.id}
    className={cn("grid grid-cols-[60px_1fr_1fr_1.2fr] items-center", i > 0 ? "border-t border-border-3" : "")}
  >
    <div className="px-5 py-[14px]">
      <span className="font-mono text-[12px] text-fg-2 font-bold">
        {String(parcela.numero).padStart(2, "0")}
      </span>
    </div>
    <div className="px-5 py-[14px]">
      <span className={cn("font-mono text-[11px]", parcela.status === "vencida" ? "text-danger-fg" : "text-fg-3")}>
        {fmtData(parcela.data_vencimento)}
      </span>
    </div>
    <div className="px-5 py-[14px]">
      <span className={cn("font-mono text-[11px]", parcela.data_pagamento ? "text-success" : "text-fg-5")}>
        {parcela.data_pagamento ? fmtData(parcela.data_pagamento) : "—"}
      </span>
    </div>
    <div className="px-5 py-[14px]">
      <StatusBadge status={parcela.status} />
    </div>
  </div>
))}
```

**Empty state** (baseado em `Parcelas.js` linha 107–110):
```javascript
{parcelas.length === 0 && (
  <div className="px-5 py-12 text-center font-mono text-[12px] text-fg-4 tracking-[0.5px]">
    Nenhuma parcela encontrada.
  </div>
)}
```

**StatusBadge reutilizado** — `StatusBadge.js` já existe e usa inline styles internamente. Ele NÃO é arquivo novo/modificado — não se aplica D-11. Importar e usar diretamente.

**Colunas na ordem da UI-SPEC:** `#` · `Vencimento` · `Pagamento` · `Status` (sem "Ação" — portal é read-only).

---

### `src/lib/queries-client.js` (utility, CRUD — modificar)

**Analog:** `src/lib/queries-client.js` — espelhar funções existentes sem tocar nas existentes.

**Padrão de referência: `getLocatarioByUserId`** (linhas 85–92 — usa `maybeSingle()`):
```javascript
export async function getLocatarioByUserId(userId) {
    const { data } = await supabase
        .from('locatarios')
        .select('id, usuario_id, nome_razao_social, tipo, documento, email, telefone')
        .eq('usuario_id', userId)
        .maybeSingle()     // ← não lança erro se não encontrar
    return data
}
```

**Padrão de referência: `getParcelasByContrato`** (linhas 68–75 — query simples com order):
```javascript
export async function getParcelasByContrato(contratoId) {
    const { data } = await supabase
        .from('parcelas')
        .select('id, numero, data_fechamento, data_vencimento, data_pagamento, status')
        .eq('contrato_id', contratoId)
        .order('numero', { ascending: true })
    return data
}
```

**Funções novas a adicionar (D-06, D-07) — copiar o estilo das existentes:**
```javascript
// NOVA — D-06
export async function getContratoAtivoByLocatario(locatarioId) {
  const { data } = await supabase
    .from('contratos')
    .select('id, data_inicio, data_fim, status, observacoes, unidades(nome, valor_mensal)')
    .eq('locatario_id', locatarioId)
    .eq('status', 'ativo')
    .maybeSingle()   // locatário pode ter 0 contratos ativos — não lança erro
  return data
}

// NOVA — D-07
export async function getParcelasPortal(contratoId) {
  const { data } = await supabase
    .from('parcelas')
    .select('id, numero, data_vencimento, data_pagamento, status')
    .eq('contrato_id', contratoId)
    .neq('status', 'futura')              // filtro na query, não no componente
    .order('data_vencimento', { ascending: false })   // DESC conforme UI-SPEC
  return data ?? []   // null safety: ?? []
}
```

**Regra crítica:** Não alterar `getParcelasByContrato` nem `getContratosByLocatario` existentes (D-06, D-07).

---

### `e2e/seed.mjs` (test infra — modificar)

**Analog:** `e2e/seed.mjs` linhas 1–23 — admin client + `upsertUser` como building blocks.

**Admin client bootstrap** (linhas 1–10 — reutilizar sem alterar):
```javascript
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.test' })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
```

**upsertUser** (linhas 12–23 — reutilizar como está):
```javascript
async function upsertUser(email, password) {
  const { data: list } = await admin.auth.admin.listUsers()
  const existing = list.users.find(u => u.email === email)
  if (existing) return existing
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,   // obrigatório — sem isso login retorna "Email not confirmed"
  })
  if (error) throw error
  return data.user
}
```

**Expansão da função `seed()` (D-08):** Adicionar após `await upsertUser('locatario@test.romma.local', 'Test1234!')` (linha 32 atual). Ver RESEARCH.md Pattern 5 (linhas 336–376) para o código completo da cadeia FK: edificio → unidade → locatario → contrato → parcelas.

**Nota sobre `status_convite`:** A tabela `locatarios` tem coluna `status_convite` (visível em `getLocatarios`, linha 16 de queries-client.js). O upsert do seed deve incluir `status_convite: 'aceito'` como precaução contra possíveis RLS que filtrem por este campo.

---

### `e2e/global-teardown.js` (test infra — novo)

**Analog:** `e2e/seed.mjs` linhas 1–10 — reutilizar admin client bootstrap identicamente.

**Ordem de deleção obrigatória (FK constraints):**
```
parcelas → contratos → locatarios → unidades → edificios
```
Violação desta ordem produz erro `23503 foreign key violation`.

**Estrutura e código completo:** Ver RESEARCH.md Pattern 5 (linhas 378–421) — código pronto para copiar.

**Exports pattern** (baseado em `e2e/global-setup.js`):
```javascript
export default async function globalTeardown() {
  // ...
}
```

---

### `e2e/portal.spec.js` (test — novo)

**Analog:** `e2e/auth-redirect.spec.js` + `e2e/dashboard.spec.js`.

**Imports pattern** (baseado em `auth-redirect.spec.js` linhas 1–3):
```javascript
import { test, expect } from '@playwright/test'
import { login } from './helpers.js'
import { LOCATARIO } from './fixtures.js'
```

**beforeEach pattern** (baseado em `dashboard.spec.js` linhas 17–22):
```javascript
test.beforeEach(async ({ page }) => {
  await login(page, LOCATARIO)
  await page.waitForURL('**/portal/dashboard', { timeout: 15_000 })
})
```

**waitForURL pattern** (baseado em `auth-redirect.spec.js` linhas 8–10):
```javascript
// PORT-01
await login(page, LOCATARIO)
await page.waitForURL('**/portal/dashboard', { timeout: 10_000 })
expect(page.url()).toContain('/portal/dashboard')
```

**Asserções de visibilidade** (baseado em `auth-redirect.spec.js` linha 27):
```javascript
await expect(page.getByText('...')).toBeVisible({ timeout: 10_000 })
```

**Cobertura obrigatória:**
- PORT-01: Locatário loga e chega em `/portal/dashboard`
- PORT-02: ContratoCard visível com dados do contrato (unidade, valor_mensal, data_inicio, data_fim, status)
- PORT-03: ParcelsTable exibe paga/pendente/vencida; status "futura" ausente

---

### `e2e/auth-redirect.spec.js` (test — modificar uma linha)

**Analog:** `e2e/auth-redirect.spec.js` linha 16 — única alteração necessária.

**Antes (linha 16):**
```javascript
await page.waitForURL('http://localhost:3000/', { timeout: 10_000 })
expect(page.url()).toBe('http://localhost:3000/')
```

**Depois (D-01 muda redirect de Locatário de `/` para `/portal/dashboard`):**
```javascript
await page.waitForURL('**/portal/dashboard', { timeout: 10_000 })
expect(page.url()).toContain('/portal/dashboard')
```

Apenas o teste `1.2 — não-proprietário loga e é redirecionado` precisa mudar. Os demais testes (1.1, 1.3, 1.4, 1.5) permanecem intactos.

---

### `playwright.config.js` (config — modificar uma linha)

**Analog:** `playwright.config.js` linha 24 — espelhar `globalSetup` para `globalTeardown`.

**Antes (linha 24):**
```javascript
globalSetup: './e2e/global-setup.js',
```

**Depois:**
```javascript
globalSetup: './e2e/global-setup.js',
globalTeardown: './e2e/global-teardown.js',
```

---

## Shared Patterns

### `'use client'` + supabase-browser (todos os Client Components)

**Source:** `src/app/login/page.js` linhas 1, 6–9
**Apply to:** `PortalDashboard.js`, `ContratoCard.js`, `ParcelsTable.js`
```javascript
"use client"
import { createClient } from '@/lib/supabase-browser'
const supabase = createClient()
```

### Error state em português (`erro`)

**Source:** `src/components/features/Parcelas.js` linha 28 / CLAUDE.md convenções
**Apply to:** `PortalDashboard.js`
```javascript
const [erro, setErro] = useState(null)   // "erro" — não "error"
```

### Null safety em arrays

**Source:** `src/lib/queries-client.js` linhas 65, 82 / CLAUDE.md convenções
**Apply to:** `getParcelasPortal` + qualquer array return
```javascript
return data ?? []   // sempre ?? [] em retornos de array
```

### Eyebrow + título display

**Source:** `src/components/features/Parcelas.js` linhas 76–79
**Apply to:** `PortalDashboard.js` e sub-componentes
```javascript
<span className="eyebrow eyebrow--indigo">PORTAL.01 · CONTRATO</span>
<h2 className="font-display font-bold text-[48px] leading-none tracking-[-2.4px] text-fg-1 m-0">
  Seu Contrato.
</h2>
```

### romma-page wrapper

**Source:** `src/components/features/Parcelas.js` linha 63
**Apply to:** `PortalDashboard.js` (wrapper raiz)
```javascript
<div className="romma-page bg-background min-h-full px-12 pt-12 pb-20">
```

### Admin client em arquivos de teste/seed

**Source:** `e2e/seed.mjs` linhas 1–10
**Apply to:** `e2e/global-teardown.js`
```javascript
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.test' })
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
```

---

## Arquivos sem Analog Direto

| Arquivo | Role | Razão |
|---------|------|-------|
| `src/components/features/portal/ContratoCard.js` | component | Nenhum componente de "card read-only de entidade única" existe — mais próximo é a metric tile do dashboard, mas shape é diferente. **UI-SPEC.md é a referência autoritativa para o layout.** |

---

## Anti-Patterns a Evitar (referência rápida para o planner)

| Anti-pattern | Por quê | Fonte |
|---|---|---|
| Copiar `style={gridStyle}` de `Parcelas.js` | D-11 proíbe inline styles em arquivos novos | CONTEXT.md D-11 |
| Importar `supabaseAdmin` em `PortalDashboard.js` | Admin key em Client Component — violação de segurança | CLAUDE.md + RESEARCH.md |
| Usar `single()` em `getContratoAtivoByLocatario` | Locatário pode ter 0 contratos — `single()` lança erro | CONTEXT.md Decisions |
| Criar `/portal/login` separado | D-01 usa `/login` existente com routing por role | CONTEXT.md D-01 |
| Criar `middleware.js` | Next.js 16 neste projeto usa `proxy.js` | CLAUDE.md |
| Passar props de dados de `page.js` para `PortalDashboard` | Thin-shell: Client Component faz próprio fetch | CONTEXT.md linha 102 |
| Migrar `Field` de `login/page.js` para Tailwind | D-11 aplica só ao código novo; `Field` existente permanece | RESEARCH.md Assumption A3 |

---

## Metadata

**Escopo de busca:** `src/app/`, `src/components/features/`, `src/lib/`, `e2e/`, raiz do projeto
**Arquivos lidos:** 16
**Data do mapeamento:** 2026-05-22
