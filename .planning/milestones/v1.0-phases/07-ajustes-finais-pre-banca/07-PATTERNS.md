# Phase 07: Ajustes Finais Pré-Banca — Pattern Map

**Mapped:** 2026-06-02
**Files analyzed:** 10 (3 new, 7 modified)
**Analogs found:** 9 / 10 (1 file sem analog — ver seção No Analog Found)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/auth/confirm/route.js` (**NEW**) | route-handler | request-response | `src/proxy.js` (NextResponse.redirect shape) + `src/lib/supabase-server.js` (createServer) | partial — sem route handler existente no projeto |
| `src/app/auth/reset-password/page.js` (**NEW**) | component (client page) | request-response | `src/app/login/page.js` (SignInForm pattern) | role-match |
| `src/app/dashboard/loading.js` (**NEW**) | loading boundary | transform | — | no-analog — primeiro loading.js do projeto |
| `src/app/dashboard/locatarios/loading.js` (**NEW**) | loading boundary | transform | `src/app/dashboard/loading.js` (a criar acima) | structural copy |
| `src/components/ui/OwnerSidebar.js` (modify) | component (client) | request-response | próprio arquivo — modificação cirúrgica | exact |
| `src/actions/locatarios.js` (modify) | server action | request-response | próprio arquivo — 1 linha | exact |
| `src/components/features/Unidades.js` (modify) | component (client) | CRUD | próprio arquivo + padrão de `PortalDashboard.js` (loading state) | role-match |
| `src/components/features/Contratos.js` (modify) | component (client) | CRUD | próprio arquivo + padrão de `PortalDashboard.js` (loading state) | role-match |
| `src/components/features/portal/PortalDashboard.js` (modify) | component (client) | request-response | próprio arquivo — substituição de texto por skeleton | exact |
| `src/components/ui/skeleton.js` (**install via CLI**) | ui primitive | — | shadcn/ui — instalar: `npx shadcn@latest add skeleton` | N/A |

---

## Pattern Assignments

### `src/app/auth/confirm/route.js` (route-handler, request-response)

**Status:** Arquivo novo. Nenhum Route Handler (`route.js`) existe no projeto — o arquivo `src/proxy.js` é o único análogo para `NextResponse.redirect` e o setup de `createServerClient`. A decisão sobre qual método de troca de token usar (D-01 vs RESEARCH) é uma **Open Question não resolvida** — ver nota crítica abaixo.

**NOTA CRITICA — Metodo de troca de token (planner deve resolver antes de implementar):**
- D-01 (CONTEXT.md) especifica `supabase.auth.exchangeCodeForSession(code)`
- RESEARCH.md (com fontes primárias do Supabase) indica que o método correto para `inviteUserByEmail` é `supabase.auth.verifyOtp({ type, token_hash })`, pois PKCE não é suportado em invite flow
- O template de email no Supabase Dashboard deste projeto não foi verificado — se usar `{{ .ConfirmationURL }}`, o link conterá `?token_hash=`; se usar `{{ .Code }}`, conterá `?code=`
- Planner deve verificar o email template em Authentication > Email Templates > Invite no Supabase Dashboard antes de decidir o método

**NOTA CRITICA — Destino do redirect (planner deve resolver):**
- D-02 especifica redirect para `/portal`
- `/portal/page.js` não existe no projeto (confirmado por `ls`) — apenas `/portal/dashboard/page.js` e `/portal/layout.js`
- `src/proxy.js` guarda `/portal` mas não redireciona para `/portal/dashboard`
- Destino seguro: `/portal/dashboard`

**Analog de imports** (`src/lib/supabase-server.js`, linhas 1-4 e `src/proxy.js`, linhas 1-2):
```javascript
import { NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase-server'
```

**Analog de NextResponse.redirect** (`src/proxy.js`, linhas 32-38):
```javascript
// Padrão de redirect com URL absoluta (copia do proxy.js):
return NextResponse.redirect(new URL('/login', request.url))
// Para /auth/confirm, usar:
return NextResponse.redirect(new URL('/portal/dashboard', request.url))
```

**Padrão de createServer em server-side** (`src/lib/supabase-server.js`, linhas 5-22):
```javascript
// createServer() retorna Promise — sempre await:
const supabase = await createServer()
const { error } = await supabase.auth.verifyOtp({ type, token_hash })
// OU (se template usa ?code=):
const { error } = await supabase.auth.exchangeCodeForSession(code)
```

**Estrutura do Route Handler (sem analog no projeto — usar padrão Next.js 16):**
```javascript
// src/app/auth/confirm/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  // ... extrair params, chamar supabase, retornar NextResponse.redirect
}
```

**Tratamento de erro (Claude's Discretion — CONTEXT.md):**
```javascript
// Erro ou params ausentes: redirecionar para /login?error=invite_invalid
// NAO para /portal/login — essa rota nao existe (ver nota abaixo)
return NextResponse.redirect(new URL('/login?error=invite_invalid', request.url))
```

---

### `src/app/auth/reset-password/page.js` (component client page, request-response)

**Analog:** `src/app/login/page.js` — SignInForm (linhas 155-300)

**NOTA — Referencia visual do CONTEXT.md desatualizada:**
- CONTEXT D-05 e canonical_refs referenciam `src/app/portal/login/page.js` como referencia visual
- Essa rota **nao existe** no projeto (confirmado: `ls /src/app/portal/` retorna apenas `dashboard/` e `layout.js`)
- Analog correto: `src/app/login/page.js` (SignInForm)

**Imports pattern** (`src/app/login/page.js`, linhas 1-8):
```javascript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from '@/lib/supabase-browser'
import { cn } from "@/lib/utils"

const supabase = createClient()
```

**Form state pattern — single useState object** (`src/app/login/page.js`, linhas 155-162):
```javascript
// login/page.js usa estados separados para email/password — excecao documentada
// Para reset-password, usar o padrao canonico de estado unico (CLAUDE.md):
const [form, setForm] = useState({ password: "", confirmPassword: "" })
const [status, setStatus] = useState("idle") // "idle" | "loading" | "success" | "error"
const [erro, setErro] = useState(null)
```

**Submit handler pattern** (`src/app/login/page.js`, linhas 165-177):
```javascript
async function handleSubmit(e) {
  e.preventDefault()
  setStatus("loading")
  const { error } = await supabase.auth.updateUser({ password: form.password })
  if (error) {
    setErro(error.message)
    setStatus("error")
    return
  }
  setStatus("success")
  router.push('/portal/dashboard')  // NAO /portal — ver nota acima
}
```

**Error display pattern** (`src/app/login/page.js`, linhas 77-93):
```javascript
// Padrao de banner de erro com CSS vars do projeto:
{erro && (
  <div className="bg-[rgba(147,0,10,0.22)] border-l-2 border-danger-fg px-4 py-3">
    <div className="font-mono text-[12px] text-danger-fg">{erro}</div>
  </div>
)}
```

**Button pattern — style={{ all: "unset" }}** (CLAUDE.md convencao + `src/components/ui/LogoutButton.js`, linha 29):
```javascript
<button
  type="submit"
  style={{ all: "unset", cursor: "pointer" }}
  disabled={status === "loading"}
>
  {status === "loading" ? "Salvando..." : "Definir senha"}
</button>
```

**Layout visual** — consistente com `src/app/login/page.js`. Usar CSS vars `--fg-1..5`, `--border-1..3`, `--surface`, `font-mono`, `font-display`, `font-body`. Componente full-page simples (sem two-column layout — é acesso do locatario, nao do proprietario).

---

### `src/app/dashboard/loading.js` (loading boundary, transform)

**Analog:** Nenhum — primeiro `loading.js` do projeto. Referencia de layout: `src/app/dashboard/page.js` (estrutura visual da Visao Geral).

**Pattern Next.js 16 loading.js** (sem analog local — padrao nativo do App Router):
```javascript
// src/app/dashboard/loading.js
// Next.js usa este arquivo como Suspense boundary automatico para /dashboard
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="romma-page p-12 bg-background min-h-full">
      {/* estrutura visual deve espelhar o layout de dashboard/page.js */}
    </div>
  )
}
```

**Uso do componente Skeleton (apos instalar via `npx shadcn@latest add skeleton`):**
```javascript
// Proporções seguem o layout visual real de dashboard/page.js
<Skeleton className="h-6 w-48 mb-2" />   // eyebrow
<Skeleton className="h-12 w-64 mb-12" /> // título
// Cards de métricas (grid de 4 colunas — ver dashboard/page.js para referência visual)
<div className="grid grid-cols-4 gap-0 border border-[var(--border-1)] mb-12">
  {[...Array(4)].map((_, i) => (
    <div key={i} className="p-7">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-12 w-32" />
    </div>
  ))}
</div>
<Skeleton className="h-64 w-full" /> // tabela/lista
```

---

### `src/app/dashboard/locatarios/loading.js` (loading boundary, transform)

**Analog:** `src/app/dashboard/loading.js` (a criar acima) — copiar estrutura, ajustar proporcoes para o layout de Locatarios.

**Referencia de layout:** `src/app/dashboard/locatarios/page.js` (linha 1-16) delega para `LocatariosDesktop` — o skeleton deve espelhar o layout de tabela de `LocatariosDesktop.js`.

---

### `src/components/ui/OwnerSidebar.js` — UX-01 + UX-03 (modificacao cirurgica)

**Arquivo a modificar:** `src/components/ui/OwnerSidebar.js`

**UX-03 — REMOVER** (linhas 78-83 do arquivo atual):
```javascript
// REMOVER estas 4 linhas (o bloco Link completo):
<Link
  href="/portal"
  className="font-mono text-[11px] text-fg-3 no-underline tracking-[0.5px]"
>
  → Acessar como Locatário
</Link>
```

**UX-01 — ADICIONAR import** (no bloco de imports, apos linha 7):
```javascript
import LogoutButton from "@/components/ui/LogoutButton"
```

**UX-01 — ADICIONAR componente** (no footer, apos o bloco do email — atualmente linha 84-88, apos a remocao de UX-03):
```javascript
// Estado atual do footer apos UX-03 (linhas 71-89):
<div className="border-t border-[var(--border-1)] px-8 pt-6 pb-8 flex flex-col gap-[10px]">
  <Link href="/" className="font-mono text-[11px] text-fg-3 no-underline tracking-[0.5px]">
    → Ver Página Pública
  </Link>
  {/* Link "Acessar como Locatário" removido aqui */}
  {email && (
    <span className="font-mono text-[10px] text-fg-5 mt-2 tracking-[0.5px]">
      {email}
    </span>
  )}
  <LogoutButton />  {/* INSERIR AQUI */}
</div>
```

**LogoutButton — NAO modificar** (`src/components/ui/LogoutButton.js`). Importar diretamente. O componente ja implementa `signOut() → router.push('/login')` (linhas 14-23).

---

### `src/actions/locatarios.js` — FIX-01 redirectTo (modificacao 1 linha)

**Modificacao:** linha 20 do arquivo atual.

**Antes** (linha 20):
```javascript
    redirectTo: `${siteUrl}/dashboard`
```

**Depois:**
```javascript
    redirectTo: `${siteUrl}/auth/confirm`
```

**Contexto circundante** (linhas 19-21 — nao modificar):
```javascript
const { data, error} = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm`  // <-- unica mudanca
})
```

---

### `src/components/features/Unidades.js` (modificacao — adicionar skeleton de initial load)

**Analog de loading state:** `src/components/features/portal/PortalDashboard.js` (linhas 16-17, 19-26) — padrao `useState(true)` para initial load.

**PROBLEMA:** O `loading` atual em `Unidades.js` (linha 19) e `useState(false)` e so muda para `true` durante mutations — nunca durante o fetch inicial do `useEffect`. Skeleton adicionado sobre `loading` nunca apareceria.

**Solucao (flag separada):**

Estado atual (linha 19 de Unidades.js):
```javascript
const [loading, setLoading] = useState(false)
```

Adicionar estado separado apos linha 19:
```javascript
const [loadingInicial, setLoadingInicial] = useState(true)
```

Funcao `carregarDados` (linha 38-41) — adicionar `setLoadingInicial(false)` apos as queries:
```javascript
async function carregarDados() {
  setListaEdificios(await getEdificios() ?? []);
  setUnidades(await getUnidades() ?? []);
  setLoadingInicial(false)  // ADICIONAR
}
```

No render (antes do return principal), inserir guard de skeleton:
```javascript
if (loadingInicial) return <SkeletonUnidades />
```

**Padrao do componente Skeleton local** (baseado no RESEARCH.md — estrutura segue o layout de cards de Unidades.js):
```javascript
// Definir inline ou como funcao local antes do return:
function SkeletonUnidades() {
  return (
    <div className="romma-page">
      {/* Estrutura espelha o PageHeader + grid de UnidadeCard */}
      <Skeleton className="h-8 w-48 mb-8" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
      </div>
    </div>
  )
}
```

---

### `src/components/features/Contratos.js` (modificacao — mesma estrategia de Unidades.js)

**Analog:** Mesmo padrao de `Unidades.js` acima + `PortalDashboard.js` (linhas 16-17).

**PROBLEMA identico:** `loading` em `Contratos.js` (linha 43) e `useState(false)` — usado apenas para mutations. O `useEffect` (linhas 45-54) nao chama `setLoading(true)` antes do fetch.

**Solucao identica:**

Adicionar apos linha 43:
```javascript
const [loadingInicial, setLoadingInicial] = useState(true)
```

Na funcao `carregar` (linha 46), adicionar ao final (apos as setagens):
```javascript
async function carregar() {
  const [u, l, c, e] = await Promise.all([...])
  setUnidades(u ?? [])
  setLocatarios(l ?? [])
  setContratos(c ?? [])
  setEdificios(e ?? [])
  setLoadingInicial(false)  // ADICIONAR
}
```

Guard de skeleton (antes do return principal):
```javascript
if (loadingInicial) return <SkeletonContratos />
```

---

### `src/components/features/portal/PortalDashboard.js` (modificacao — skeleton direto)

**Analog:** Proprio arquivo — ja tem o padrao correto `useState(true)` e `loading ? ... : ...`.

**Linha 16** — estado ja correto:
```javascript
const [loading, setLoading] = useState(true)  // NAO MODIFICAR
```

**Linha 55** (unica modificacao):
```javascript
// ANTES:
loading ? <div className="mt-8 font-mono text-[12px] text-fg-4">Carregando...</div>

// DEPOIS:
loading ? (
  <div className="mt-8 flex flex-col gap-4">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
)
```

**Import a adicionar** (apos as imports existentes, linha 8):
```javascript
import { Skeleton } from "@/components/ui/skeleton"
```

---

## Shared Patterns

### Skeleton import (aplicar a todos os componentes com skeleton)
**Fonte:** shadcn/ui Skeleton (instalar com `npx shadcn@latest add skeleton`)
**Aplicar a:** `PortalDashboard.js`, `Unidades.js`, `Contratos.js`, `dashboard/loading.js`, `dashboard/locatarios/loading.js`
```javascript
import { Skeleton } from "@/components/ui/skeleton"
```

### createServer() para server-side
**Fonte:** `src/lib/supabase-server.js` (linhas 5-22)
**Aplicar a:** `src/app/auth/confirm/route.js`
```javascript
import { createServer } from '@/lib/supabase-server'
// Sempre await:
const supabase = await createServer()
```

### NextResponse.redirect com URL absoluta
**Fonte:** `src/proxy.js` (linha 32-38)
**Aplicar a:** `src/app/auth/confirm/route.js`
```javascript
return NextResponse.redirect(new URL('/destino', request.url))
// Nao usar string relativa — usar new URL() com request.url como base
```

### Padrao de erro com CSS vars (banner de erro)
**Fonte:** `src/app/login/page.js` (linhas 77-93)
**Aplicar a:** `src/app/auth/reset-password/page.js`
```javascript
{erro && (
  <div className="bg-[rgba(147,0,10,0.22)] border-l-2 border-danger-fg px-4 py-3 font-mono text-[12px] text-danger-fg">
    {erro}
  </div>
)}
```

### Button reset pattern
**Fonte:** `src/components/ui/LogoutButton.js` (linha 29) + CLAUDE.md
**Aplicar a:** `src/app/auth/reset-password/page.js`
```javascript
<button style={{ all: "unset", cursor: "pointer" }}>...</button>
```

### Estado de loading — nomenclatura
**Fonte:** CLAUDE.md + `PortalDashboard.js` (linha 16)
- Estado de carregamento inicial: `const [loading, setLoading] = useState(true)` (nome `loading`)
- Para nao quebrar `loading` existente de mutations: adicionar `const [loadingInicial, setLoadingInicial] = useState(true)`
- Estado de erro: `const [erro, setErro] = useState(null)` (portugues, nao `error`)

---

## No Analog Found

| File | Role | Data Flow | Razao |
|---|---|---|---|
| `src/app/dashboard/loading.js` | loading boundary | transform | Nenhum `loading.js` existe no projeto (confirmado por `find`) — usar padrao nativo Next.js App Router |

---

## Alertas para o Planner

| ID | Alerta | Impacto se ignorado |
|---|---|---|
| ALT-01 | Metodo de troca de token em `/auth/confirm` nao resolvido: `verifyOtp` (RESEARCH) vs `exchangeCodeForSession` (D-01). Verificar email template no Supabase Dashboard antes de implementar. | Route Handler retorna erro silencioso — locatario nao consegue aceitar convite |
| ALT-02 | D-02 e D-05 especificam redirect para `/portal` — essa rota nao existe. Usar `/portal/dashboard`. | 404 para locatario recem-autenticado |
| ALT-03 | CONTEXT canonical_refs menciona `src/app/portal/login/page.js` como referencia visual — essa rota nao existe. Analog correto: `src/app/login/page.js`. | N/A para o planner — apenas informativo |
| ALT-04 | `loading` em `Unidades.js` e `Contratos.js` e `useState(false)` e so muda em mutations. Adicionar `loadingInicial` separado — nao reutilizar o `loading` existente. | Skeleton nunca aparece (Pitfall 4 do RESEARCH) |
| ALT-05 | Os testes E2E mencionados no RESEARCH (extender `dashboard-smoke.spec.js`, criar `auth-confirm.spec.js`) nao constam nas decisoes D-01..D-11. Planner deve decidir se inclui como passos de validacao ou deixa para fora do escopo. | Nao impacta implementacao — impacta verificacao |

---

## Metadata

**Analog search scope:** `src/app/`, `src/components/`, `src/actions/`, `src/lib/`
**Files scanned:** 15
**Pattern extraction date:** 2026-06-02
