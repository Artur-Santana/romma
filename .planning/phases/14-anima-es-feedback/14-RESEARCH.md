# Phase 14: Animações & Feedback — Research

**Researched:** 2026-06-12
**Domain:** Toast notifications (sonner) + CSS inline exit animations
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Biblioteca de toast: `sonner` (`npm install sonner`). Montar `<Toaster>` em `src/app/layout.js`.
- **D-02:** Animação de saída: `removingIds` como `Set` em `useState` + CSS inline `opacity: 0, transform: "scale(0.97)", transition: "all 200ms ease"` + `setTimeout(200)`. Sem framer-motion, sem lib adicional.
- **D-03:** Mensagens de toast (locked): `toast.success("Contrato criado")`, `"Contrato encerrado"`, `"Contrato cancelado"`, `"Acesso revogado"`, `"Parcela marcada como paga"`. **Nota: D-05 marca Toast ✅ para deletarUnidade mas D-03 não lista mensagem — ver Open Question Q1.**
- **D-04:** Parcelas: apenas toast, sem exit animation. `marcarComoPaga` muda status, não remove item.
- **D-05:** Componentes a modificar: `Contratos.js`, `Unidades.js`, `LocatariosDesktop.js`, `Locatarios.js`, `Parcelas.js`, `src/app/layout.js`.
- **D-06:** 200ms duration. Toast dispara imediatamente após sucesso, não espera animação terminar.

### Claude's Discretion
- Se `ConfirmDialog` é usado antes da ação, o toast deve aparecer após confirmação + sucesso da Server Action (não antes).
- Verificar se `Locatarios.js` (mobile) e `LocatariosDesktop.js` usam arrays distintos — aplicar `removingIds` no componente que gerencia a lista visível.
- Para `Unidades.js`, verificar se a lista é gerenciada por `UnidadesDesktop.js` — aplicar animação no componente que renderiza os itens.
- Se o componente re-fetches após ação via `useEffect` + query, garantir que o `setTimeout` de 200ms completa antes do re-fetch substituir o array.

### Deferred Ideas (OUT OF SCOPE)
- Toasts de erro
- Animações de entrada de itens
- Animações de página (route transitions)
- Portal do Locatário — animações no portal
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANIM-01 | Ações de encerramento/cancelamento de contrato têm animação de saída do item (fade-out, ~200ms) | `removingIds` Set + CSS inline + **optimistic filter** (não re-fetch) em `Contratos.js` |
| ANIM-02 | Ações de delete/revoke têm animação de saída do item da lista | Mesmo padrão em `Unidades.js`, `LocatariosDesktop.js`, `Locatarios.js` — delete handlers podem re-fetch pois a row some do banco |
| ANIM-03 | Toast Sonner confirma sucesso de ações principais (criar, encerrar, cancelar, revogar, pagar parcela) | `sonner` v2.0.7 + `toast.success()` nos handlers |
</phase_requirements>

---

## Summary

Esta fase adiciona dois mecanismos de feedback visual ao dashboard: (1) exit animations de 200ms via CSS inline quando itens são removidos de listas, e (2) toasts de sucesso via sonner após ações mutativas bem-sucedidas.

A única nova dependência é `sonner` v2.0.7. O `<Toaster>` pode ser importado diretamente em `src/app/layout.js` (Server Component) sem wrapper separado — o pacote sonner inclui `'use client'` internamente; Next.js App Router propaga este boundary automaticamente.

**Distinção crítica entre os dois tipos de exit animation:**

- **Contratos (cancelar/encerrar):** A Server Action usa `.update({ status: 'cancelado'/'encerrado' })` — a row **permanece no banco**. `getContratos()` retorna TODOS os contratos sem filtro de status (verificado em `queries-client.js` linha 20-23). Portanto, re-fetch dentro do setTimeout traria o contrato de volta com novo status, **não** o removeria da lista. A solução correta é **optimistic filter**: `setContratos(prev => prev.filter(c => c.id !== id))` sem re-fetch dos contratos. O `getUnidades()` ainda deve ser re-fetchado para atualizar o status da unidade.

- **DELETE handlers (unidades, locatários):** A Server Action usa `.delete()` — a row **some do banco**. Re-fetch dentro do setTimeout funciona corretamente pois a row não retorna.

**Primary recommendation:** Instalar sonner, montar `<Toaster theme="dark" richColors position="bottom-right" />` em layout.js, e aplicar o padrão `removingIds` + CSS inline em cada componente conforme o mapeamento abaixo — usando optimistic filter para contratos e re-fetch para deletes.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Toast rendering (`<Toaster>`) | Frontend Server (SSR) — root layout | Browser / Client — sonner React component | Montado em layout.js (Server Component), renderizado client-side pelo sonner via `'use client'` interno |
| `toast.success()` calls | Browser / Client | — | Chamados em event handlers de Client Components |
| `removingIds` state | Browser / Client | — | `useState` em Client Components; estado local por componente |
| Exit animation CSS | Browser / Client | — | `style={{}}` inline em itens da lista durante transição |
| Server Actions (mutations) | API / Backend | — | Existentes — não modificados por esta fase |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sonner | 2.0.7 (latest) [VERIFIED: npm registry] | Toast notifications | Especificado em REQUIREMENTS.md (ANIM-03); autor do ecossistema shadcn/ui; padrão Next.js |

### No Additional Libraries
A animação de saída usa apenas CSS inline + `setTimeout` nativo — sem framer-motion, sem nova dependência (D-02 locked).

**Installation:**
```bash
npm install sonner
```

---

## Package Legitimacy Audit

> slopcheck não pôde ser executado (permissão negada pelo ambiente sandbox). Verificação manual abaixo.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| sonner | npm | ~3 anos | ~3M/semana | github.com/emilkowalski/sonner | não executado | Aprovado — autor de identidade pública (Emil Kowalski), repositório verificado [CITED: github.com/emilkowalski/sonner] |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*slopcheck indisponível. `sonner` verificado manualmente: homepage oficial em sonner.emilkowal.ski, repo GitHub com 10k+ stars, maintainer publicamente identificado. [CITED: github.com/emilkowalski/sonner]*

---

## Architecture Patterns

### System Architecture Diagram

```
User clicks "Cancelar Contrato"
         │
         ▼
[ConfirmDialog onConfirm callback]
         │
         ▼
[confirmarCancelamento(contrato)]
   ├─ setConfirmDialog(null)                           — fecha dialog imediatamente
   ├─ setRemovingIds(prev => new Set([...prev, id]))   — inicia CSS fade-out (opacity 1→0)
   ├─ await cancelarContrato(contrato.id)              — Server Action (UPDATE no banco)
   │         │
   │    error│──► setErro(...); rollback removingIds; return
   │         │
   │         ▼ { status: 200 }
   ├─ toast.success("Contrato cancelado")              — dispara imediatamente
   ├─ setTimeout(200ms, () => {
   │     setContratos(prev => prev.filter(c => c.id !== id))  ← OPTIMISTIC (sem re-fetch)
   │     getUnidades().then(u => setUnidades(u ?? []))         ← re-fetch pois status mudou
   │     setRemovingIds(prev => { next.delete(id); return next })
   │  })
   └─ [item some da tela 200ms após confirmação]
```

```
User clicks "Remover" (Unidade)
         │
         ▼
[handleDeletarUnidade(id)]           — sem ConfirmDialog
   ├─ setRemovingIds(prev => new Set([...prev, id]))   — inicia CSS fade-out ANTES do await
   ├─ await deletarUnidade(id)                         — Server Action (DELETE no banco)
   │         │
   │    error│──► setErroDelete(...); rollback removingIds; return
   │         │
   │         ▼ { status: 200 }
   ├─ toast.success(???)                               — ver Open Question Q1
   └─ setTimeout(200ms, () => {
         setUnidades(await getUnidades() ?? [])        ← re-fetch OK (row deletada do banco)
         setRemovingIds(prev => { next.delete(id); return next })
      })
```

### Recommended Project Structure

Nenhuma pasta nova necessária. Modificações in-place nos componentes existentes:

```
src/
├── app/
│   └── layout.js              ← adicionar import { Toaster } + <Toaster> em <body>
└── components/features/
    ├── Contratos.js            ← +removingIds, +toast, +optimistic filter em confirmarCancelamento/confirmarEncerramento, +toast em handleCriarContrato
    ├── Unidades.js             ← +removingIds, +toast(?), +exit anim em handleDeletarUnidade
    ├── LocatariosDesktop.js    ← +removingIds, +toast em handleRevogar
    ├── Locatarios.js           ← +removingIds, +toast em handleDeletarLocatario
    └── Parcelas.js             ← +toast em marcarComoPaga (sem exit anim)
```

### Pattern 1: Toaster em layout.js (Server Component)

**What:** `<Toaster>` de sonner pode ser importado diretamente em um Server Component porque o pacote inclui `'use client'` no topo de `src/index.tsx`. Next.js App Router trata o import como client reference boundary automaticamente.

**Evidence:** `@vercel/speed-insights/next` já em `layout.js` usa o mesmo padrão (componente com `'use client'` interno, importado em Server Component) — funciona no projeto atual.

```javascript
// Source: github.com/emilkowalski/sonner/blob/main/src/index.tsx (has 'use client' at line 1)
// src/app/layout.js — Server Component (sem 'use client')
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "sonner"

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${HankenGrotesks.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster theme="dark" richColors position="bottom-right" />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

**Nota sobre position mobile:** `bottom-right` pode sobrepor a `MobileBottomNav` adicionada na fase 13. Ver Open Question Q2.

### Pattern 2: removingIds + CSS inline — CONTRATOS (optimistic, sem re-fetch de contratos)

**When to use:** Handlers que fazem UPDATE no banco (contrato não é deletado, apenas muda status). `getContratos()` sem filtro de status retornaria o contrato — não pode ser usado para remover o item da lista.

```javascript
// Source: padrão derivado de CONTEXT.md D-02 + análise de queries-client.js
const [removingIds, setRemovingIds] = useState(new Set())

async function confirmarCancelamento(contrato) {
  setConfirmDialog(null)                                              // fecha dialog imediatamente
  setRemovingIds(prev => new Set([...prev, contrato.id]))            // inicia CSS fade-out
  const result = await cancelarContrato(contrato.id)
  if (result.status !== 200) {
    setErro(result.erroMessage)
    setRemovingIds(prev => { const next = new Set(prev); next.delete(contrato.id); return next })
    return
  }
  setErro(null)
  toast.success("Contrato cancelado")                                // toast imediato
  setTimeout(() => {
    // NÃO re-fetchar contratos — getContratos() retorna ALL statuses e traria o item de volta
    setContratos(prev => prev.filter(c => c.id !== contrato.id))    // optimistic remove
    getUnidades().then(u => setUnidades(u ?? []))                    // re-fetch unidades (status mudou)
    setRemovingIds(prev => { const next = new Set(prev); next.delete(contrato.id); return next })
  }, 200)
}
// confirmarEncerramento: idêntico, substituindo "Cancelado" por "Encerrado"
```

### Pattern 3: removingIds + CSS inline — DELETE handlers (re-fetch OK)

**When to use:** Handlers que fazem DELETE no banco (row não retorna no re-fetch).

```javascript
// Source: padrão derivado de CONTEXT.md D-02
async function handleDeletarUnidade(id) {
  setErroDelete(null)
  setErroEdit(null)
  setRemovingIds(prev => new Set([...prev, id]))                    // fade-out antes do await
  const result = await deletarUnidade(id)
  if (result.status !== 200) {
    setErroDelete(result.erroMessage)
    setRemovingIds(prev => { const next = new Set(prev); next.delete(id); return next }) // rollback
    return
  }
  // toast.success(???) — ver Open Question Q1
  setTimeout(() => {
    getUnidades().then(u => setUnidades(u ?? []))                   // re-fetch OK — row deletada
    setRemovingIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }, 200)
}
```

### Pattern 4: Style condicional no item da lista

```javascript
// Source: padrão CSS inline do projeto (CLAUDE.md) + CONTEXT.md D-02
{contratos.map((contrato, i) => {
  const isRemoving = removingIds.has(contrato.id)
  return (
    <div
      key={contrato.id}
      style={{
        ...COL_STYLE,
        opacity: isRemoving ? 0 : 1,
        transform: isRemoving ? "scale(0.97)" : "scale(1)",
        transition: "opacity 200ms ease, transform 200ms ease",
      }}
      className={cn("grid items-center", i > 0 ? "border-t border-border-3" : "")}
    >
      {/* conteúdo do item */}
    </div>
  )
})}
```

### Pattern 5: toast.success() — API sonner v2

```javascript
// Source: sonner.emilkowal.ski — API verificada
import { toast } from "sonner"

toast.success("Contrato cancelado")                    // uso básico desta fase
toast.success("Parcela marcada como paga", { duration: 3000 })  // com duration opcional
```

### Anti-Patterns to Avoid

- **Re-fetch de contratos dentro do setTimeout (cancelar/encerrar):** `getContratos()` retorna contratos de TODOS os status — traria o contrato de volta com novo status, não o removeria. Usar optimistic filter: `setContratos(prev => prev.filter(...))`.
- **Disparar toast antes de `result.status === 200`:** Toast de sucesso somente após confirmar sucesso. Nunca antes do await.
- **Criar wrapper separado para `<Toaster>`:** Desnecessário — sonner tem `'use client'` interno.
- **Mutar o Set existente:** `prev.add(id); return prev` não dispara re-render. Sempre criar novo Set.
- **Nenhum rollback em caso de erro:** Se a action falha, o item ficará invisível (opacity 0) sem voltar. Sempre limpar `removingIds` no path de erro.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | `<div>` animado em portal | `sonner` toast.success() | REQUIREMENTS.md especifica sonner; build manual tem edge cases de stacking, a11y, auto-dismiss |
| CSS exit transition | JS animation loop | CSS `transition` inline + setTimeout | Nativo, zero deps, roda no compositor thread |

---

## Current State of Each Component (EXACT HANDLER CODE)

### `src/app/layout.js` — Estado atual

Server Component puro. Estrutura atual:

```javascript
// ATUAL — sem Toaster
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${HankenGrotesks.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
```

**Mudança:** Adicionar `import { Toaster } from "sonner"` + `<Toaster theme="dark" richColors position="bottom-right" />` dentro de `<body>`.

---

### `src/components/features/Contratos.js` — Estado atual

**Estado de lista:** `const [contratos, setContratos] = useState([])` com re-fetch completo `getContratos()` após mutações.

**`getContratos()` (verificado em queries-client.js linha 20-23):** Retorna TODOS os contratos sem filtro de status. Contratos cancelados/encerrados permanecem na tabela e são incluídos no resultado. Portanto, re-fetch após cancelar/encerrar NÃO remove o item — apenas muda o badge de status.

**Fluxo atual de cancelar/encerrar — via ConfirmDialog:**

```javascript
// ATUAL — confirmarCancelamento (linha 137-145)
async function confirmarCancelamento(contrato) {
  setConfirmDialog(null)
  const result = await cancelarContrato(contrato.id)
  if (result.status !== 200) { setErro(result.erroMessage); return }
  setErro(null)
  const [c, u] = await Promise.all([getContratos(), getUnidades()])
  setContratos(c ?? [])
  setUnidades(u ?? [])
  // SEM toast, SEM animação
}

// ATUAL — confirmarEncerramento (linha 147-155) — idêntico, usa encerrarContrato
```

**Fluxo do ConfirmDialog:** `askCancelar(contrato)` / `askEncerrar(contrato)` → `setConfirmDialog({ ..., onConfirm: () => confirmarCancelamento(contrato) })` → usuário clica "Confirmar" → `onConfirm()` é chamado.

**`handleCriarContrato` (linha 90-111):** Após `parcResult.status === 200`, faz re-fetch de contratos e unidades, fecha o form. Sem toast.

**Mudanças necessárias em `confirmarCancelamento`:**
1. `setRemovingIds(prev => new Set([...prev, contrato.id]))` — logo antes de fechar dialog (ou após, mas antes do await)
2. Após `status === 200`: `toast.success("Contrato cancelado")`
3. Dentro de `setTimeout(200)`: `setContratos(prev => prev.filter(c => c.id !== contrato.id))` (optimistic, NÃO re-fetch), `getUnidades().then(u => setUnidades(u ?? []))`, limpar removingId
4. No path de erro: rollback do removingId

**Mudanças em `confirmarEncerramento`:** Idêntico, com `"Contrato encerrado"`.

**Mudança em `handleCriarContrato`:** Adicionar `toast.success("Contrato criado")` após `parcResult.status === 200`. Sem animação (item entra, não sai).

---

### `src/components/features/Unidades.js` — Estado atual

**Estado de lista:** `const [unidades, setUnidades] = useState([])` com re-fetch `getUnidades()`.

**`handleDeletarUnidade` (linha 83-91):**

```javascript
// ATUAL
async function handleDeletarUnidade(id) {
  setErroDelete(null)
  setErroEdit(null)
  const result = await deletarUnidade(id);
  if (result.status === 200) {
    setUnidades(await getUnidades() ?? []);
    // SEM toast, SEM animação
  } else {
    setErroDelete(result.erroMessage)
  }
}
```

**Renderização:** `Unidades.js` mapeia `unidades.map((unidade) => <UnidadeCard ...>)` diretamente. Não existe `UnidadesDesktop.js` separado — `Unidades.js` é o único componente que renderiza a lista. A animação é aplicada ao wrapper do `UnidadeCard` em `Unidades.js`.

**`UnidadeCard`** chama `onDeletar(unidade.id)` diretamente ao clicar "Remover" — sem ConfirmDialog. A animação começa imediatamente ao clicar.

**`deletarUnidade` é um DELETE:** re-fetch `getUnidades()` dentro do setTimeout funciona corretamente.

**Mudanças necessárias:**
1. Adicionar `const [removingIds, setRemovingIds] = useState(new Set())`
2. Em `handleDeletarUnidade`: `setRemovingIds(...)` ANTES do await; toast após `status === 200`; re-fetch + limpar removingId dentro de `setTimeout(200)`; rollback no path de erro
3. No `unidades.map(...)`: adicionar style condicional baseado em `removingIds.has(unidade.id)`

**D-03/D-05 inconsistência (Open Question Q1):** D-05 marca Toast ✅ para deletarUnidade, mas D-03 não lista mensagem para esta ação. Planner precisa confirmar com usuário.

---

### `src/components/features/LocatariosDesktop.js` — Estado atual

**Estado de lista:** `const [locatarios, setLocatarios] = useState(initialLocatarios ?? [])` com re-fetch `getLocatarios()` após mutações.

**`handleRevogar` (linha 91-99):**

```javascript
// ATUAL
async function handleRevogar(id) {
  setErro("")
  const { status, erroMessage } = await revogarConvite(id)
  if (status === 200) {
    setLocatarios(await getLocatarios() ?? [])
    // SEM toast, SEM animação
  } else {
    setErro(erroMessage ?? "Erro ao revogar convite.")
  }
}
```

**`revogarConvite` é um DELETE** (deleta da tabela `locatarios` + `auth.users`). Re-fetch funciona.

**Renderização:** `locatarios.map((l, i) => <div key={l.id} ...>)` diretamente. Animação aplicada ao `<div>` de cada row.

**Não usa ConfirmDialog** — ação direta ao clicar "REVOGAR".

**`getLocatarios()` (queries-client.js linha 15-18):** Retorna todos os locatários sem filtro. Após DELETE do locatário, ele não retorna no re-fetch — safe.

**Mudanças necessárias:**
1. `const [removingIds, setRemovingIds] = useState(new Set())`
2. Em `handleRevogar`: `setRemovingIds(...)` antes do await; `toast.success("Acesso revogado")` após `status === 200`; re-fetch + limpar dentro de `setTimeout(200)`; rollback no erro
3. No map: style condicional

---

### `src/components/features/Locatarios.js` — Estado atual

**Estado de lista:** `const [locatarios, setlocatarios] = useState([])` (casing: `setlocatarios` com minúscula — inconsistência existente, NÃO corrigir).

**`handleDeletarLocatario` (linha 66-70):**

```javascript
// ATUAL
async function handleDeletarLocatario(id) {
  const { status } = await deletarLocatario(id);
  if (status === 200) {
    setlocatarios(await getLocatarios());
    // SEM toast, SEM animação
  }
}
```

**`deletarLocatario` é um DELETE.** Re-fetch funciona.

**Renderização:** `locatarios.map((locatario) => <div key={locatario.id}>...)`. Sem ConfirmDialog. Sem design system visual — componente mobile antigo com styling básico.

**Mudanças necessárias:**
1. `const [removingIds, setRemovingIds] = useState(new Set())`
2. Em `handleDeletarLocatario`: `setRemovingIds(...)` antes do await; `toast.success("Acesso revogado")` após `status === 200`; re-fetch dentro de `setTimeout(200)`; rollback no erro
3. No map: style condicional (opacity/transform/transition inline)

---

### `src/components/features/Parcelas.js` — Estado atual

**`marcarComoPaga` (linha 49-56):**

```javascript
// ATUAL
async function marcarComoPaga(parcela) {
  const result = await marcarParcelaComoPaga(parcela.id)
  if (result.status === 200) {
    setErro(null)
    setParcelas(await getParcelasByContrato(contratoId))
    // SEM toast
  } else {
    setErro(result.erroMessage)
  }
}
```

**Mudança apenas:** Adicionar `toast.success("Parcela marcada como paga")` após `result.status === 200`. O re-fetch permanece imediato (item muda status no lugar, não sai da lista). Sem `removingIds`.

---

## Common Pitfalls

### Pitfall 1: Re-fetch de contratos apaga a animação de cancelar/encerrar
**What goes wrong:** Chamar `getContratos()` depois de cancelar/encerrar um contrato traz o item de volta (agora com status='cancelado'), pois `getContratos()` não filtra por status. O item que estava fazendo fade-out reaparece abruptamente.
**Why it happens:** Server Action faz `.update()` não `.delete()` — row persiste. `getContratos()` sem filtro a inclui.
**How to avoid:** Para contratos: usar optimistic filter `setContratos(prev => prev.filter(...))` — nunca re-fetch de contratos depois de cancelar/encerrar. Apenas re-fetch `getUnidades()`.
**Warning signs:** O item cancela corretamente no banco mas reaparece na tabela com badge "cancelado" após a animação.

### Pitfall 2: Re-fetch corre antes do setTimeout completar (DELETE handlers)
**What goes wrong:** Para DELETE handlers, se o `await getUnidades()` ou `await getLocatarios()` completar antes dos 200ms do setTimeout, o item some abruptamente.
**Why it happens:** `await` na query pode resolver em <200ms.
**How to avoid:** Mover o re-fetch para DENTRO do callback do `setTimeout(fn, 200)`.

### Pitfall 3: Toast antes de verificar status
**What goes wrong:** `toast.success()` chamado antes do `if (result.status === 200)`.
**How to avoid:** `toast.success()` sempre dentro do bloco `if (result.status === 200)`.

### Pitfall 4: Sem rollback no path de erro (DELETE handlers)
**What goes wrong:** Para DELETE handlers que iniciam a animação ANTES do await (unidades, locatários), se a action falhar, o item fica invisível (opacity 0) permanentemente.
**How to avoid:** No bloco de erro, limpar o ID do Set: `setRemovingIds(prev => { const next = new Set(prev); next.delete(id); return next })`.

### Pitfall 5: Mutação de Set em estado React
**What goes wrong:** `setRemovingIds(prev => { prev.add(id); return prev })` — mutação in-place não dispara re-render.
**How to avoid:** Sempre criar novo Set: `new Set([...prev, id])` para adicionar; `new Set(prev)` + `.delete()` para remover.

### Pitfall 6: `<Toaster>` duplicado
**What goes wrong:** Múltiplos `<Toaster>` montados causam toasts duplicados.
**How to avoid:** `<Toaster>` APENAS em `src/app/layout.js`. Componentes de feature importam apenas `toast` (a função), nunca `Toaster`.

---

## Code Examples

### Confirmar cancelamento — handler completo atualizado

```javascript
// Source: padrão derivado de CONTEXT.md D-02 + análise de getContratos() sem filtro de status
async function confirmarCancelamento(contrato) {
  setConfirmDialog(null)
  setRemovingIds(prev => new Set([...prev, contrato.id]))
  const result = await cancelarContrato(contrato.id)
  if (result.status !== 200) {
    setErro(result.erroMessage)
    setRemovingIds(prev => { const next = new Set(prev); next.delete(contrato.id); return next })
    return
  }
  setErro(null)
  toast.success("Contrato cancelado")
  setTimeout(() => {
    // NÃO re-fetchar contratos — retornaria o item cancelado de volta
    setContratos(prev => prev.filter(c => c.id !== contrato.id))
    getUnidades().then(u => setUnidades(u ?? []))
    setRemovingIds(prev => { const next = new Set(prev); next.delete(contrato.id); return next })
  }, 200)
}
```

### deletarUnidade — handler completo atualizado (ver Q1 para mensagem de toast)

```javascript
// Source: padrão derivado de CONTEXT.md D-02 — deletarUnidade é DELETE, re-fetch OK
async function handleDeletarUnidade(id) {
  setErroDelete(null)
  setErroEdit(null)
  setRemovingIds(prev => new Set([...prev, id]))
  const result = await deletarUnidade(id)
  if (result.status !== 200) {
    setErroDelete(result.erroMessage)
    setRemovingIds(prev => { const next = new Set(prev); next.delete(id); return next })
    return
  }
  // toast.success(???) — planner confirmar mensagem (Q1)
  setTimeout(() => {
    getUnidades().then(u => setUnidades(u ?? []))
    setRemovingIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }, 200)
}
```

### Style condicional de animação (genérico)

```javascript
// Source: padrão CSS inline do projeto (CLAUDE.md)
const isRemoving = removingIds.has(item.id)
<div
  key={item.id}
  style={{
    // ...outros styles do item...
    opacity: isRemoving ? 0 : 1,
    transform: isRemoving ? "scale(0.97)" : "scale(1)",
    transition: "opacity 200ms ease, transform 200ms ease",
  }}
>
```

### layout.js — após inserção do Toaster

```javascript
// Source: sonner.emilkowal.ski + análise do layout.js atual
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "sonner"
// ... imports de fontes existentes ...

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${HankenGrotesks.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster theme="dark" richColors position="bottom-right" />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### Parcelas — marcarComoPaga atualizado

```javascript
// ANIM-03: apenas toast, sem removingIds
async function marcarComoPaga(parcela) {
  const result = await marcarParcelaComoPaga(parcela.id)
  if (result.status === 200) {
    setErro(null)
    toast.success("Parcela marcada como paga")
    setParcelas(await getParcelasByContrato(contratoId))
  } else {
    setErro(result.erroMessage)
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-hot-toast | sonner | ~2023 | API mais simples; `'use client'` interno; padrão shadcn |
| Wrapper `'use client'` obrigatório para Toaster | Import direto em Server Component | sonner v1+ | `'use client'` no pacote propaga boundary automaticamente |
| framer-motion exit animations | CSS transition + setTimeout | 2022+ | Mais leve; zero deps extras; suficiente para 200ms |

**Deprecated/outdated:**
- Padrão de criar `providers.js` separado só para `<Toaster>`: desnecessário com sonner moderno.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `<Toaster>` pode ser importado diretamente em layout.js (Server Component) sem wrapper `'use client'` extra | Standard Stack, Code Examples | BAIXO — sonner tem `'use client'` na linha 1 de src/index.tsx [CITED: github.com/emilkowalski/sonner]. SpeedInsights no mesmo layout segue padrão idêntico. Se errar: criar `src/components/ui/SonnerToaster.js` com `'use client'` e importar esse wrapper |
| A2 | `Locatarios.js` é o componente mobile de locatários ativo no dashboard | Current State — Locatarios.js | MÉDIO — se existir rota separada que não monta `Locatarios.js`, as mudanças podem estar no componente errado |

---

## Open Questions (RESOLVED)

> Todas resolvidas durante discuss/plan: Q1 → D-08 + UI-SPEC ("Unidade removida"); Q2 → UI-SPEC `mobileOffset={{ bottom: "80px" }}`; Q3 → D-07 (listagem ativo-only).

1. **Q1: Mensagem de toast para deletarUnidade — conflito D-03 vs D-05**
   - What we know: D-05 marca Toast ✅ para `Unidades.js`/deletarUnidade. D-03 lista apenas 5 mensagens específicas e NÃO inclui deletarUnidade.
   - What's unclear: A intenção é ter toast para deletar unidade? Se sim, qual a mensagem?
   - Recommendation: Planner deve perguntar ao usuário. Sugestão: `toast.success("Unidade removida")`. Se D-03 é a fonte de verdade, não adicionar toast para deletarUnidade.

2. **Q2: Posição do Toaster em mobile**
   - What we know: `position="bottom-right"` é o padrão. A fase 13 adicionou `MobileBottomNav` na parte inferior da tela.
   - What's unclear: Em viewports <640px, o toast pode ficar atrás da nav ou sobrepor.
   - Recommendation: Executor deve testar em 375px. Se houver sobreposição, usar `mobileOffset={{ bottom: "80px" }}` ou `position="top-center"`.

3. **Q3: Contratos encerrados/cancelados devem permanecer visíveis na tabela?**
   - What we know: Atualmente `getContratos()` retorna todos os status. A tabela mostra contratos ativo/encerrado/cancelado. O "Arquivo" callout diz "Contratos encerrados são preservados como histórico imutável."
   - What's unclear: A animação de saída implica que o item some da tabela imediatamente — mas recarregar a página o trará de volta (pois o re-fetch não foi alterado no useEffect inicial). Isso pode ser confuso para o Proprietário.
   - Recommendation: O comportamento de vanish-on-action / reappear-on-reload é aceitável para o escopo desta fase (é o comportamento implícito em ANIM-01 que diz "item sai da lista"). Se quiserem filtro permanente (tabela só mostra `ativo`), é uma mudança de escopo a ser decidida — não implementar sem confirmação explícita.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npm | `npm install sonner` | ✓ | >=20 | — |
| sonner | ANIM-03 | ✗ (not installed) | 2.0.7 latest | — |
| Browser CSS transitions | ANIM-01, ANIM-02 | ✓ | native | — |

**Missing dependencies with no fallback:**
- `sonner` — precisa ser instalado: `npm install sonner`

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright v1.60.0 |
| Config file | `playwright.config.js` |
| Quick run command | `npx playwright test --project=chromium` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ANIM-01 | Encerrar/cancelar contrato → item sai com fade-out | manual-only (CSS timing) | — | N/A |
| ANIM-02 | Deletar unidade / revogar → item sai com animação | manual-only (CSS timing) | — | N/A |
| ANIM-03 | Toast aparece após criar contrato, encerrar, cancelar, revogar, pagar parcela | e2e smoke | `npx playwright test tests/toast-feedback.spec.js` | ❌ Wave 0 |

**Nota ANIM-01/ANIM-02:** CSS transitions de 200ms não são confiáveis para testar via Playwright sem `waitForTimeout` frágil. Validação via UAT visual é a abordagem adequada. Testes E2E existentes verificam regressão funcional (ação completa corretamente).

### Sampling Rate
- **Per task commit:** verificação manual no browser (localhost:3000)
- **Per wave merge:** full suite Playwright
- **Phase gate:** Full suite green antes de `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/toast-feedback.spec.js` — cobre ANIM-03: verifica toast visível após cada ação principal

*(Testes de animação ANIM-01/ANIM-02 são manual-only — nenhum arquivo de teste automatizado necessário)*

---

## Security Domain

> Mudanças puramente client-side (UI state + toast). Sem novos endpoints, Server Actions, queries, ou lógica de autenticação.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | toast.success recebe string literal, não user input |
| V6 Cryptography | no | — |

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact nesta fase |
|-----------|-------------------|
| Inline styles + CSS vars | Animação usa `style={{ opacity, transform, transition }}` — consistente |
| Server Actions retornam `{ status: 200 }` ou `{ status: 4xx/5xx, erroMessage }` | `toast.success()` somente em `status === 200`; usar `result.erroMessage` (não `errorMessage`) |
| `'use client'` obrigatório para hooks/eventos | Todos os componentes de feature já têm `'use client'` — ok |
| Next.js 16: `proxy.js` não `middleware.js` | Não afeta esta fase |
| Commits via conventional-commits, nunca em `main` | Criar branch `gsd/phase-14-animacoes-feedback` |
| Sem TypeScript | Todos os arquivos `.js` |

---

## Sources

### Primary (HIGH confidence)
- `src/lib/queries-client.js` (lido) — confirma que `getContratos()` retorna ALL statuses (linha 20-23)
- `src/components/features/Contratos.js` (lido) — handlers exatos confirmados
- `src/components/features/Unidades.js` (lido) — handler exato confirmado, sem UnidadesDesktop separado
- `src/components/features/LocatariosDesktop.js` (lido) — handleRevogar exato confirmado
- `src/components/features/Locatarios.js` (lido) — handleDeletarLocatario exato confirmado
- `src/components/features/Parcelas.js` (lido) — marcarComoPaga exato confirmado
- `src/app/layout.js` (lido) — estrutura atual confirmada
- `src/actions/contratos.js`, `unidades.js`, `locatarios.js`, `parcelas.js` (lidos) — return shapes confirmados, UPDATE vs DELETE distinção verificada
- [github.com/emilkowalski/sonner/blob/main/src/index.tsx] — `'use client'` na linha 1 confirmado [CITED]
- [sonner.emilkowal.ski/toaster] — props do Toaster confirmados [CITED]

### Secondary (MEDIUM confidence)
- `npm view sonner version` → 2.0.7 [VERIFIED: npm registry]
- [sonner.emilkowal.ski] — install, API básica [CITED]

### Tertiary (LOW confidence)
- [github.com/emilkowalski/sonner/issues/169] — discussão histórica sobre Server Components (pré-`'use client'` interno)

---

## Metadata

**Confidence breakdown:**
- Standard stack (sonner): HIGH — registry verificado, fonte oficial confirmada
- Architecture (removingIds pattern): HIGH — locked decision D-02
- UPDATE vs DELETE distinction: HIGH — lido diretamente dos arquivos de actions e queries
- Current handler state: HIGH — código lido diretamente dos arquivos fonte
- Toaster in Server Component: HIGH — `'use client'` interno verificado em src/index.tsx; padrão idêntico ao SpeedInsights já em uso no projeto
- Pitfalls: HIGH — derivados de análise do código atual e semântica das queries

**Research date:** 2026-06-12
**Valid until:** 2026-07-12
