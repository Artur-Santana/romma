# Phase 3: Refatoração e Qualidade - Pattern Map

**Mapped:** 2026-05-24
**Files analyzed:** 6 (5 modificados, 1 novo)
**Analogs found:** 6 / 6

---

## File Classification

| Arquivo Novo/Modificado | Role | Data Flow | Analog Mais Próximo | Qualidade |
|-------------------------|------|-----------|---------------------|-----------|
| `src/actions/contratos.js` | server-action | request-response | `src/actions/locatarios.js` (revogarConvite) | exact |
| `src/actions/locatarios.js` | server-action | request-response | `src/actions/contratos.js` (criarContrato) | exact |
| `src/components/features/GestaoEdificios.js` | feature-component | request-response | `src/components/features/Contratos.js` | role-match |
| `src/components/features/Unidades.js` | feature-component | request-response | `src/components/features/Contratos.js` | role-match |
| `src/components/features/Contratos.js` | feature-component | request-response | — (call site update, sem novo padrão) | n/a |
| `src/components/ui/LogoutButton.js` | ui-component | event-driven | `src/app/login/page.js` (SignInForm) | role-match |

---

## Pattern Assignments

### `src/actions/contratos.js` — D-04: cancelarContrato e encerrarContrato (server-action, request-response)

**Modificação:** Remover `unidade_id` como parâmetro; derivar server-side via query antes de qualquer update.

**Analog canônico:** `src/actions/locatarios.js` linhas 78–84 (`revogarConvite`) — já implementa o padrão "SELECT first, then mutate" com `.single()` + 404 handling no mesmo projeto.

**Padrão SELECT-first** (locatarios.js:78-84):
```javascript
const { data: loc, error: fetchErr } = await supabaseAdmin
    .from('locatarios').select('usuario_id, status_convite').eq('id', id).single()
if (fetchErr || !loc) return { status: 404, erroMessage: 'Locatário não encontrado.' }
```

**Padrão authGuard** (contratos.js:11-17 — manter exatamente):
```javascript
async function authGuard() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { err: { status: 401, erroMessage: 'Não autenticado.' } }
  if (!await isProprietario(supabase)) return { err: { status: 403, erroMessage: 'Sem permissão.' } }
  return {}
}
```

**Assinatura atual a ser alterada** (contratos.js:58 e 87):
```javascript
// ANTES — aceita unidade_id do cliente (IDOR)
export async function cancelarContrato(id, unidade_id) {
export async function encerrarContrato(id, unidade_id) {

// DEPOIS — apenas id; unidade_id derivado server-side
export async function cancelarContrato(id) {
export async function encerrarContrato(id) {
```

**Padrão de update em cadeia** (contratos.js:65-83 — preservar; apenas adicionar o SELECT antes):
```javascript
const { error } = await supabaseAdmin
  .from('contratos')
  .update({ status: 'cancelado' })
  .eq('id', id)
if (error) return { status: 500, erroMessage: error.message }

const { error: errUnidade } = await supabaseAdmin
  .from('unidades')
  .update({ status: 'disponivel' })
  .eq('id', unidade_id)           // ← usar contrato.unidade_id derivado server-side
if (errUnidade) return { status: 500, erroMessage: errUnidade.message }
```

**Retorno padrão** (contratos.js:84):
```javascript
return { status: 200 }
```

---

### `src/actions/locatarios.js` — D-05: editarLocatario (server-action, request-response)

**Modificação:** Substituir `.update(form)` por destructure explícito + allowlist dos campos permitidos.

**Analog canônico:** `src/actions/contratos.js` linhas 23 e 32 (`criarContrato`) — já usa destructure-then-insert com apenas os campos do schema.

**Padrão destructure allowlist** (contratos.js:23 e 30-33):
```javascript
const { data_inicio, data_fim, status, observacoes, unidade_id, locatario_id } = form
// ... validações ...
.insert({ data_inicio, data_fim, status: status ?? 'ativo', observacoes, unidade_id, locatario_id })
```

**Código atual de editarLocatario a ser alterado** (locatarios.js:50-58):
```javascript
// ANTES — raw form passado diretamente (mass assignment)
export async function editarLocatario(id, form) {
    // ... auth inline existente (manter, não converter para authGuard) ...
    if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
    const { error } = await supabaseAdmin.from('locatarios').update(form).eq('id', id)

// DEPOIS — allowlist explícita
    if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
    const { nome_razao_social, tipo, documento, email, telefone } = form
    const { error } = await supabaseAdmin
        .from('locatarios')
        .update({ nome_razao_social, tipo, documento, email, telefone })
        .eq('id', id)
```

**AVISO:** `editarLocatario` usa auth inline (não usa o helper `authGuard()`). Preservar o estilo inline — não converter para `authGuard()`. Ver locatarios.js:51-54 como referência do padrão inline existente:
```javascript
const supabase = await createServer()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { status: 401, erroMessage: 'Não autenticado.' }
if (!await isProprietario(supabase)) return { status: 403, erroMessage: 'Sem permissão.' }
```

---

### `src/components/features/GestaoEdificios.js` — D-01: fix set-state-in-effect (feature-component, request-response)

**Modificação:** `useEffect` na linha 27-29 chama `carregarEdificios()` definida fora do effect — ESLint `react-hooks/set-state-in-effect` dispara. Corrigir inlinando função async nomeada dentro do body do effect.

**Analog canônico (padrão que silencia a regra):** `src/components/features/Contratos.js` linhas 45-54 — função nomeada declarada e chamada dentro do useEffect, zero erros de lint.

**Padrão correto** (Contratos.js:45-54):
```javascript
useEffect(() => {
  async function carregar() {
    const [u, l, c, e] = await Promise.all([getUnidades(), getLocatarios(), getContratos(), getEdificios()])
    setUnidades(u ?? [])
    setLocatarios(l ?? [])
    setContratos(c ?? [])
    setEdificios(e ?? [])
  }
  carregar()
}, [])
```

**Código atual a ser alterado** (GestaoEdificios.js:27-29):
```javascript
// ANTES — indireção externa que dispara o lint error
useEffect(() => {
  carregarEdificios();
}, []);

// DEPOIS — função nomeada declarada dentro do effect
useEffect(() => {
  async function fetchDados() {
    setEdificios(await getEdificios());
  }
  fetchDados()
}, []);
```

**IMPORTANTE:** A função `carregarEdificios()` (GestaoEdificios.js:23-25) deve ser **mantida** — ela é usada nos handlers de evento `insertEdificio` (linha 37), `handleDeletar` (linha 47), `handleSalvar` (linha 63). Apenas o `useEffect` muda.

---

### `src/components/features/Unidades.js` — D-01: fix set-state-in-effect (feature-component, request-response)

**Modificação:** Mesmo problema de GestaoEdificios.js — `useEffect` nas linhas 85-87 chama `carregarDados()` definida fora do effect.

**Analog canônico:** Mesmo padrão de Contratos.js:45-54 (ver acima).

**Código atual a ser alterado** (Unidades.js:85-87):
```javascript
// ANTES
useEffect(() => {
  carregarDados();
}, []);

// DEPOIS
useEffect(() => {
  async function fetchDados() {
    setListaEdificios(await getEdificios());
    setUnidades(await getUnidades());
  }
  fetchDados()
}, []);
```

**IMPORTANTE:** A função `carregarDados()` (Unidades.js:38-41) é usada em `handleDeletarUnidade` (linha 67) e `handleSalvarUnidade` (linha 79). **Manter a função**; apenas o `useEffect` muda. Verificar também se `carregarDados` pode ser chamada em `insertUnidade` diretamente ou se usa `getUnidades()` separado (linha 97) — preservar o comportamento existente.

---

### `src/components/features/Contratos.js` — D-04: atualizar call sites (feature-component, request-response)

**Modificação:** Remover segundo argumento `contrato.unidade_id` das chamadas a `cancelarContrato` e `encerrarContrato`. Sem novo padrão a copiar — é remoção de argumento.

**Linhas a alterar:**

Linha 108 (função `confirmarCancelamento`):
```javascript
// ANTES
const result = await cancelarContrato(contrato.id, contrato.unidade_id)

// DEPOIS
const result = await cancelarContrato(contrato.id)
```

Linha 118 (função `confirmarEncerramento`):
```javascript
// ANTES
const res = await encerrarContrato(contrato.id, contrato.unidade_id)

// DEPOIS
const res = await encerrarContrato(contrato.id)
```

---

### `src/components/ui/LogoutButton.js` — D-06: novo Client Component (ui-component, event-driven)

**Arquivo novo.** Não existe análogo direto de logout no projeto.

**Analog mais próximo:** `src/app/login/page.js` — `SignInForm` componente interno — usa o mesmo stack: `createClient()` de `supabase-browser`, `useRouter` de `next/navigation`, `supabase.auth.*` + `router.push()`. É o inverso semântico exato do logout.

**Padrão de imports e supabase client** (login/page.js:6-9):
```javascript
"use client"

import { useRouter } from "next/navigation"
import { createClient } from '@/lib/supabase-browser'

const supabase = createClient()
```

**Padrão auth client + router.push** (login/page.js:163-177 — SignInForm):
```javascript
const router = useRouter()

async function handleSubmit(e) {
  e.preventDefault()
  // ...
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  // ...
  router.push(isProprietario ? '/dashboard' : '/portal/dashboard')
}
```

**LogoutButton.js a criar** — copiar estrutura mínima desse padrão invertido:
```javascript
"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-browser"

const supabase = createClient()

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // render: botão com style={{ all: "unset", cursor: "pointer" }} — padrão button reset do projeto
}
```

**Padrão button reset** (CLAUDE.md — Conventions):
```javascript
style={{ all: "unset", cursor: "pointer", ... }}
```

**Onde injetar:** `src/components/features/portal/PortalDashboard.js` — já é `'use client'`, já tem `supabase = createClient()` no topo (linha 9). Alternativa válida: importar `LogoutButton` lá e reutilizar a instância de supabase via prop ou criar nova instância local no LogoutButton (ambas funcionam com `@supabase/ssr`).

---

## Shared Patterns

### authGuard() em Server Actions
**Fonte:** `src/actions/contratos.js` linhas 11-17
**Aplicar a:** modificações em `contratos.js` (cancelarContrato, encerrarContrato usam o helper)
```javascript
async function authGuard() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { err: { status: 401, erroMessage: 'Não autenticado.' } }
  if (!await isProprietario(supabase)) return { err: { status: 403, erroMessage: 'Sem permissão.' } }
  return {}
}
// Uso: const { err } = await authGuard(); if (err) return err
```

### Auth inline em Server Actions (estilo locatarios.js)
**Fonte:** `src/actions/locatarios.js` linhas 51-54
**Aplicar a:** `editarLocatario` — NÃO converter para authGuard; manter estilo inline existente
```javascript
const supabase = await createServer()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { status: 401, erroMessage: 'Não autenticado.' }
if (!await isProprietario(supabase)) return { status: 403, erroMessage: 'Sem permissão.' }
```

### Retorno de Server Action
**Fonte:** todos os arquivos em `src/actions/`
**Aplicar a:** todos os Server Actions modificados
```javascript
return { status: 200 }                                   // sucesso
return { status: 400, erroMessage: 'Mensagem.' }         // erro cliente
return { status: 404, erroMessage: 'Não encontrado.' }   // not found
return { status: 500, erroMessage: error.message }       // erro servidor
// ATENÇÃO: 'erroMessage' (não 'errorMessage') — convenção estabelecida no projeto
```

### UUID validation em Server Actions
**Fonte:** `src/actions/contratos.js` linhas 9, 62-63
**Aplicar a:** manter validação UUID em cancelarContrato/encerrarContrato após remover o parâmetro unidade_id
```javascript
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// ...
if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
// Remover: if (!UUID_RE.test(unidade_id)) ... — unidade_id não é mais parâmetro
```

### useEffect com função nomeada interna (padrão que silencia react-hooks/set-state-in-effect)
**Fonte:** `src/components/features/Contratos.js` linhas 45-54 (confirmado: zero erros de lint)
**Também em:** `src/components/features/portal/PortalDashboard.js` linhas 18-38 (confirmado: zero erros de lint)
**Aplicar a:** GestaoEdificios.js e Unidades.js
```javascript
useEffect(() => {
  async function fetchDados() {
    // setState calls dentro do body do effect (não indireção externa)
  }
  fetchDados()
}, [])
```

---

## No Analog Found

Nenhum arquivo sem analog — todos os padrões existem no codebase.

---

## Notas de Implementação

### Pitfall documentado: call sites em JS não falham por arity
Em JavaScript, passar argumento extra para função que não o declara mais **não gera erro de runtime**. A remoção de `unidade_id` de `cancelarContrato`/`encerrarContrato` e a atualização dos call sites em Contratos.js:108,118 devem acontecer **na mesma task** — não separado.

### Pitfall documentado: carregarDados/carregarEdificios deve ser mantida
O fix do `set-state-in-effect` muda apenas o `useEffect` de montagem. As funções `carregarEdificios()` e `carregarDados()` são usadas em handlers de evento (após insert/delete/save) e devem ser mantidas intactas.

### Pitfall documentado: LogoutButton não pode estar em Server Component
`portal/layout.js` é Server Component — não pode ter `onClick`. O `LogoutButton` precisa de `'use client'`. Injetar via `PortalDashboard.js` (já é client) ou criar componente separado com `'use client'` que é importado pelo layout (Next.js permite importar Client Components em Server Components).

---

## Metadata

**Escopo de busca de analogs:** `src/actions/`, `src/components/features/`, `src/components/ui/`, `src/app/login/`, `src/app/portal/`
**Arquivos lidos:** 8 (contratos.js, locatarios.js, GestaoEdificios.js, Unidades.js, Contratos.js, PortalDashboard.js, portal/layout.js, TopStrip.js, login/page.js)
**Data de mapeamento:** 2026-05-24
