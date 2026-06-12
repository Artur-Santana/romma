# Phase 13: Mobile Responsivo — Research

**Researched:** 2026-06-12
**Domain:** Responsive layout, CSS media queries, React Server/Client Component split
**Confidence:** HIGH (baseado em leitura direta do código-fonte — nenhum claim de training data)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** `src/components/ui/DashboardShell.js` como Client Component (`"use client"`). `dashboard/layout.js` permanece Server Component — importa `DashboardShell` para wrappear `{children}`. Shell renderiza: desktop → TopStrip + sidebar + main; mobile → MobileTopBar + {children} + MobileBottomNav.

**D-02: MobileBottomNav — itens:**
```
/dashboard           → label "Início",      code "OVW"
/dashboard/unidades  → label "Unidades",    code "UNI"
/dashboard/contratos → label "Contratos",   code "CTR"
/dashboard/locatarios→ label "Locatários",  code "LOC"
```

**D-03: MobileTopBar — título por rota:**
- `/dashboard` → "Dashboard"
- `/dashboard/unidades` → "Unidades"
- `/dashboard/contratos` → "Contratos"
- `/dashboard/locatarios` → "Locatários"
- `/dashboard/contratos/[id]` → "Parcelas" + `onBack` → `router.back()`

**D-04:** Fixes inline nos componentes existentes — NÃO criar variantes `*Mobile.js`. Overflow horizontal em tabelas → `overflow-x: auto` no container. Tap targets < 44px → padding mínimo 44px de altura.

**D-05:** Portal: `PortalDashboard.js` usa Tailwind — trocar por classes responsivas (`px-4 sm:px-12`, `text-[28px] sm:text-[48px]`, `pt-6 sm:pt-12`). `ParcelsTable.js` pode precisar de `overflow-x: auto`.

**D-06:** Breakpoint mínimo 375px. CSS mobile = `max-width: 768px` (já definido). Tailwind `sm:` = 640px para transições de padding/tipografia.

### Claude's Discretion

Detecção de mobile no DashboardShell: hook `useMediaQuery(768)` vs render CSS com `romma-desktop-only`/`romma-mobile-only`. Escolher o mais limpo com a infraestrutura existente.

### Deferred Ideas (OUT OF SCOPE)

- Animações de transição entre abas mobile → Phase 14
- Drawer/menu lateral deslizante → pós-banca
- Dark mode toggle no mobile → fora de escopo
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UX-02 | Dashboard mobile tem sidebar colapsável → MobileTopBar + MobileBottomNav (DashboardShell Client Component) | D-01 viabilizado por arquitetura RSC; detalhes de conflito de chrome em §Pitfall 1 |
| UX-03 | Todas as 4 abas do dashboard são usáveis em mobile (Unidades, Contratos, Parcelas, Locatários) | LocatariosDesktop bloqueado por `romma-desktop-only`; tabelas precisam de min-width explícito além de overflow-x:auto — ver §Pitfall 2 e §Pitfall 3 |
| UX-04 | Portal do Locatário é usável em mobile | PortalDashboard tem padding fixo 48px; ParcelsTable usa CSS grid sem scrollbar — ambos documentados com fix concreto |
</phase_requirements>

---

## Summary

Phase 13 é uma fase de refatoração de UI — nenhum pacote novo é instalado, nenhuma nova funcionalidade de negócio é criada. As três entregas são: (1) um novo Client Component `DashboardShell` que abstrai o chrome do dashboard (sidebar desktop, top bar + bottom nav mobile), (2) fixes responsivos nas quatro abas do dashboard, e (3) fixes responsivos no Portal do Locatário.

A infraestrutura de CSS mobile já existe em `globals.css` (`.romma-desktop-only`, `.romma-mobile-only`, media query `max-width: 768px`). Os componentes `MobileTopBar` e `MobileBottomNav` em `src/components/ui/MobileNav.js` estão completos e prontos para uso. O `dashboard/page.js` já tem uma implementação mobile manual (linhas 138-153 e 335-442) que precisa ser reconciliada com o DashboardShell — é o ponto de maior atenção desta fase.

**Recomendação principal:** Usar CSS render-both (blocos com `romma-desktop-only`/`romma-mobile-only` ou equivalente Tailwind `hidden md:block`) no DashboardShell — evita hydration flash e é consistente com o padrão já estabelecido no projeto.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Detecção de viewport / troca de layout | Browser / Client | — | Requer `usePathname` para títulos por rota; precisa de `"use client"` |
| Renderização dos filhos (pages) | Frontend Server (SSR) | — | `children` do layout.js continuam como Server Components |
| Fixes de overflow em tabelas | Browser / Client | — | Mudanças de CSS no componente existente (`overflow-x`, `min-width`) |
| Autenticação / guarda de rota | API / Backend | Frontend Server | Não alterada nesta fase |

---

## Standard Stack

### Nenhum pacote novo a instalar

Esta fase não adiciona dependências. Todo o necessário já está no projeto:

| Recurso | Onde está | Uso |
|---------|-----------|-----|
| `MobileTopBar`, `MobileBottomNav` | `src/components/ui/MobileNav.js` | Prontos; aceitar `title`, `onBack`, `items` |
| `usePathname` | `next/navigation` (já no projeto) | Mapear rota atual para título no DashboardShell |
| `useRouter` | `next/navigation` (já no projeto) | `router.back()` para `/contratos/[id]` |
| `.romma-desktop-only` / `.romma-mobile-only` | `src/app/globals.css` | Classes CSS de visibilidade por viewport |
| `TopStrip`, `OwnerSidebar` | `src/components/ui/` | Manter no caminho desktop do DashboardShell |
| Classes Tailwind responsivas `sm:` | Tailwind v4 (já configurado) | Fixes de padding/tipografia no portal |

## Package Legitimacy Audit

Nenhum pacote externo instalado nesta fase. Seção não aplicável.

---

## Architecture Patterns

### Diagrama de Fluxo — DashboardShell

```
dashboard/layout.js (Server Component)
    │
    └── <DashboardShell> (Client Component — "use client")
            │
            ├── usePathname() → route → title/showBack
            │
            ├── [desktop: width > 768px via CSS]
            │       TopStrip
            │       OwnerSidebar
            │       <main>{children}</main>
            │
            └── [mobile: width ≤ 768px via CSS]
                    MobileTopBar (title, onBack se /contratos/[id])
                    <main class="flex-1 overflow-auto">{children}</main>
                    MobileBottomNav (items fixos D-02)
```

Os `{children}` recebidos pelo DashboardShell são Server Components (as `page.js` do dashboard). Como o shell é um Client Component que recebe `children` como prop do Server Component pai (`layout.js`), eles continuam sendo renderizados no servidor. [CITED: Next.js App Router docs — "Passing Server Components to Client Components as Props"]

### Estrutura de Arquivos

```
src/
├── components/ui/
│   ├── DashboardShell.js    ← NOVO (Client Component)
│   └── MobileNav.js         ← existente, não alterar
├── app/dashboard/
│   ├── layout.js             ← modificar: usar DashboardShell
│   └── page.js               ← modificar: remover chrome mobile manual
└── components/features/
    ├── Contratos.js          ← fix: overflow-x em tabela
    ├── LocatariosDesktop.js  ← fix: remover romma-desktop-only + overflow-x
    ├── Unidades.js           ← fix: overflow-x em UX se houver tabela
    ├── Parcelas.js           ← fix: overflow-x + tap target botão "Pagar"
    └── portal/
        ├── PortalDashboard.js ← fix: px-4 sm:px-12 + text responsivo
        └── ParcelsTable.js   ← fix: overflow-x no wrapper
```

### Pattern 1: DashboardShell com CSS render-both (recomendado)

**O que é:** Renderiza dois blocos — desktop e mobile — com visibilidade controlada por CSS. O servidor renderiza ambos; o CSS esconde o inadequado.

**Por que usar:** Evita hydration mismatch (o `useMediaQuery` resulta em `false` no SSR e `true` no cliente → flash de conteúdo). Consistente com o padrão existente (`romma-desktop-only`/`romma-mobile-only` já em globals.css e usado em `dashboard/page.js`).

```jsx
// src/components/ui/DashboardShell.js
"use client"

import { usePathname, useRouter } from "next/navigation"
import { MobileTopBar, MobileBottomNav } from "@/components/ui/MobileNav"
import TopStrip from "@/components/ui/TopStrip"
import OwnerSidebar from "@/components/ui/OwnerSidebar"

const NAV_ITEMS = [
  { href: "/dashboard",             label: "Início",     code: "OVW" },
  { href: "/dashboard/unidades",    label: "Unidades",   code: "UNI" },
  { href: "/dashboard/contratos",   label: "Contratos",  code: "CTR" },
  { href: "/dashboard/locatarios",  label: "Locatários", code: "LOC" },
]

const ROUTE_TITLES = {
  "/dashboard":             "Dashboard",
  "/dashboard/unidades":    "Unidades",
  "/dashboard/contratos":   "Contratos",
  "/dashboard/locatarios":  "Locatários",
}

export default function DashboardShell({ children }) {
  const pathname = usePathname()
  const router = useRouter()

  // D-03: título e back para /contratos/[id]
  const isParcelasRoute = pathname.startsWith("/dashboard/contratos/") && pathname !== "/dashboard/contratos"
  const title = isParcelasRoute ? "Parcelas" : (ROUTE_TITLES[pathname] ?? "Dashboard")
  const onBack = isParcelasRoute ? () => router.back() : undefined

  return (
    <>
      {/* Desktop */}
      <div className="romma-desktop-only" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <TopStrip />
        <div style={{ display: "flex", height: "calc(100vh - 24px)" }}>
          <div className="romma-sidebar-wrapper">
            <OwnerSidebar badges={{}} />
          </div>
          <main style={{ flex: 1, overflow: "auto", background: "var(--background)" }}>
            <div style={{ maxWidth: "1570px", margin: "0 auto", padding: "0 24px" }}>
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile */}
      <div className="romma-mobile-only">
        <MobileTopBar title={title} onBack={onBack} />
        <main style={{ flex: 1, overflow: "auto", background: "var(--background)" }}>
          {children}
        </main>
        <MobileBottomNav items={NAV_ITEMS} />
      </div>
    </>
  )
}
```

**Nota:** `romma-desktop-only` tem `display: block` como default — mas o shell precisa de `flex`. Sobrescrever inline com `style={{ display: "flex" }}` é seguro; o CSS de media query usa `display: none !important` para ocultar em mobile.

### Pattern 2: Fix de overflow em tabelas CSS grid

**O que é:** Tabelas com CSS grid (`gridTemplateColumns`) precisam de um wrapper `overflow-x: auto` **E** o grid interno precisa de `min-width` explícito para que o overflow funcione.

**Por que:** Colunas com `fr` e `1fr` encolhem para caber no viewport — elas não transbordam. Só com `min-width` no container interno o scroll é produzido.

```jsx
// Padrão para Contratos.js, Parcelas.js
// ERRADO: apenas overflow-x:auto não gera scroll com fr columns
<div style={{ overflowX: "auto" }}>
  <div style={{ gridTemplateColumns: COL }}>...</div>
</div>

// CORRETO: min-width força overflow quando fr columns encolheriam demais
<div style={{ overflowX: "auto" }}>
  <div style={{ gridTemplateColumns: COL, minWidth: "700px" }}>...</div>
</div>
```

**Valor de `minWidth` por componente:**
- `Contratos.js` — COL = `"116px 1.6fr 1.6fr 1fr 1fr 1.2fr 96px"` → `minWidth: "680px"`
- `Parcelas.js` — COL = `"72px 1fr 1fr 1fr 1.2fr 120px"` → `minWidth: "580px"`
- `ParcelsTable.js` — grid-cols `[60px_1fr_1fr_1.2fr]` → `minWidth: "480px"` (Tailwind: `min-w-[480px]`)

### Anti-Patterns a Evitar

- **Só `overflow-x: auto` sem `min-width`:** Com `fr` columns, o CSS grid comprime as colunas ao invés de criar overflow — não produz scrollbar. Ver §Pitfall 3.
- **`useMediaQuery` no DashboardShell:** Causa hydration mismatch (SSR renderiza `false`, cliente muda para `true` depois do mount) → flash de layout. Usar CSS render-both é mais simples e consistente com o codebase.
- **Editar `Locatarios.js` ao invés de `LocatariosDesktop.js`:** `Locatarios.js` é o twin legado não usado no dashboard atual. A rota `/dashboard/locatarios` carrega `LocatariosDesktop`. Ver §Pitfall 4.

---

## Don't Hand-Roll

| Problema | Não construir | Usar | Por quê |
|----------|--------------|------|---------|
| Detecção de viewport para títulos | Hook customizado `useMediaQuery` + `window.matchMedia` | CSS render-both com classes existentes | Mais simples, SSR-safe, consistente com código existente |
| Componentes mobile separados | `ContratosDesktop.js` + `ContratosMobile.js` | Fix inline no `Contratos.js` existente | D-04 locked — cria duplicação e divergência de lógica |
| Nova navegação mobile | Reimplementar bottom nav | `MobileBottomNav` de `MobileNav.js` | Já implementado, testado, com estilo Obsidian correto |

---

## Common Pitfalls

### Pitfall 1: Double Chrome em `/dashboard`

**O que dá errado:** `dashboard/page.js` (Server Component) **já** renderiza seu próprio `MobileTopBar` + `MobileBottomNav` (linhas 138-153 e 335-442 do arquivo). Ao adicionar `DashboardShell` no `layout.js`, a rota `/dashboard` vai ter dois top bars e dois bottom navs no mobile.

**Por que acontece:** A página `/dashboard` foi construída manualmente antes do DashboardShell existir — ela tem sua própria estrutura mobile completa (`<div className="flex flex-col h-screen md:hidden">`).

**Como evitar:** O plano deve incluir uma tarefa específica para refatorar `dashboard/page.js`:
1. Remover o wrapper `<div className="flex flex-col h-screen md:hidden">` e o `MobileBottomNav` interno
2. Remover o wrapper `<div className="romma-desktop-only">` (o DashboardShell passa a controlar isso)
3. Manter os **dois conjuntos de conteúdo** (métricas desktop vs cards mobile) — eles são genuinamente diferentes e devem ser preservados como variantes internas da página

**Sinal de alerta:** Testar `/dashboard` em 375px antes de qualquer fix mostrará dupla barra de navegação.

### Pitfall 2: LocatariosDesktop invisível em mobile (UX-03 bloqueado)

**O que dá errado:** `LocatariosDesktop.js` linha 104: `className="romma-desktop-only romma-page..."` → em mobile, `display: none`. UX-03 exige que a aba de Locatários seja utilizável em 375px.

**Por que acontece:** O componente foi construído antes do requisito mobile existir, com a classe de ocultação inline.

**Como evitar:** Remover `romma-desktop-only` do elemento raiz. A tabela fica visível, mas precisa do fix de overflow (ver Pitfall 3). Verificar também: o formulário de convite usa `grid-cols-2` — em 375px isso também precisa de `grid-cols-1 sm:grid-cols-2` ou colapsar para 1 coluna.

**Nota:** `Locatarios.js` (sem "Desktop") é o twin legado não utilizado na rota atual — não editar esse arquivo.

### Pitfall 3: Tabelas CSS grid com `fr` columns não fazem overflow sem `min-width`

**O que dá errado:** Adicionar `overflow-x: auto` ao container não produz scrollbar se o grid interno usa `fr` units (`1.6fr`, `1fr` etc.). O CSS grid algoritmo comprime as colunas para caber — não cria overflow.

**Por que acontece:** `fr` significa "fração do espaço disponível" — por definição se adapta ao container. Overflow só ocorre quando o conteúdo tem tamanho absoluto ou `min-width` que excede o container.

**Como evitar:** Adicionar `minWidth` explícito no elemento grid interno (não no wrapper):
```jsx
// wrapper
<div style={{ overflowX: "auto" }}>
  // grid interno com min-width
  <div style={{ display: "grid", gridTemplateColumns: COL, minWidth: "680px" }}>
```

**Valores recomendados:** Contratos → `680px`, Parcelas → `580px`, ParcelsTable → `480px`.

### Pitfall 4: Tap targets < 44px nos botões de ação

**O que dá errado:** Botões de ação em `LocatariosDesktop.js` ("Editar", "REVOGAR", "VER") e o botão "Pagar" em `Parcelas.js` usam `p-0 h-auto` (Button ghost/sm) → área tocável < 44px. Em mobile touch, o usuário não consegue acertar o alvo.

**Arquivos afetados:**
- `LocatariosDesktop.js`: `className="... p-0 h-auto"` para Editar/REVOGAR/VER
- `Parcelas.js`: botão "Pagar" — verificar height atual

**Como evitar:** Substituir `p-0 h-auto` por `py-[10px] px-3` mínimo em mobile (via classe responsiva ou mudança direta se o botão já não tiver visual importante no desktop).

### Pitfall 5: `romma-desktop-only` default é `display: block` — não `flex`

**O que dá errado:** O DashboardShell usa `romma-desktop-only` no bloco desktop, mas o layout do shell precisa de `display: flex` (para sidebar + main lado a lado). A classe global define `display: block` como default.

**Como evitar:** Sobrescrever com `style={{ display: "flex" }}` inline no elemento. O media query `@media (max-width: 768px) { .romma-desktop-only { display: none; } }` ainda funciona — o `!important` não está na regra default, mas a media query aplica `display: none` que overrides o inline. Verificar se é necessário adicionar `!important` ao hide em `globals.css` para garantir precedência sobre inline style.

**Verificação:** `globals.css` linha 359: `.romma-sidebar-wrapper { display: none !important; }` tem `!important`. Mas `.romma-desktop-only { display: none; }` (linha 360) não tem. Adicionar `!important` à regra mobile é mais seguro.

---

## Runtime State Inventory

> Fase de refatoração de UI — nenhuma renomeação de strings ou migração de dados.

Não aplicável. Esta fase modifica apenas estrutura de componentes React e classes CSS — sem strings persistidas em banco, configurações de serviços externos, ou registros de OS.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright ^1.60.0 |
| Config file | `playwright.validation.config.js` (já existe na raiz) |
| Quick run command | `npx playwright test --config=playwright.validation.config.js --grep "UX-02"` |
| Full suite command | `npx playwright test --config=playwright.validation.config.js` |

### Phase Requirements → Test Map

| Req ID | Comportamento | Tipo | Comando | Arquivo existe? |
|--------|--------------|------|---------|----------------|
| UX-02 | Sidebar oculta em 375px; MobileTopBar e MobileBottomNav visíveis | E2E | `--grep "UX-02"` | ❌ Wave 0 |
| UX-03 | 4 abas do dashboard sem overflow horizontal em 375px | E2E | `--grep "UX-03"` | ❌ Wave 0 |
| UX-04 | Portal do Locatário sem overflow horizontal em 375px | E2E | `--grep "UX-04"` | ❌ Wave 0 |

### Assertions concretas por requirement

**UX-02:**
```js
// Sidebar oculta
await expect(page.locator('.romma-sidebar-wrapper')).toBeHidden()
// MobileTopBar visível
await expect(page.locator('[data-testid="mobile-top-bar"]')).toBeVisible()
// MobileBottomNav visível
await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible()
```

**UX-03 (por aba):**
```js
// Sem overflow horizontal — assertion crítica
const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
expect(scrollWidth).toBeLessThanOrEqual(375)
// Botões clicáveis
const btn = page.getByText('REVOGAR') // ou ação relevante
const box = await btn.boundingBox()
expect(box.height).toBeGreaterThanOrEqual(44)
```

**UX-04:**
```js
await page.goto('/portal/dashboard')
const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
expect(scrollWidth).toBeLessThanOrEqual(375)
```

### Viewport para todos os testes desta fase
```js
// playwright.validation.config.js — já configurado ou adicionar:
use: { viewport: { width: 375, height: 812 } }
```

### Wave 0 Gaps

- [ ] `tests/e2e/phase-13-mobile.spec.js` — testes UX-02, UX-03, UX-04 com viewport 375px
- [ ] Adicionar `data-testid="mobile-top-bar"` em `MobileTopBar` e `data-testid="mobile-bottom-nav"` em `MobileBottomNav` para seletores estáveis

---

## Security Domain

Esta fase não introduz nova superfície de ataque. As mudanças são puramente de layout/CSS. As proteções existentes (autenticação em `layout.js`, RLS, Server Actions com auth guard) não são alteradas.

| ASVS Category | Aplica | Observação |
|---------------|--------|-----------|
| V2 Authentication | não | Não alterado |
| V3 Session Management | não | Não alterado |
| V4 Access Control | não | Não alterado |
| V5 Input Validation | não | Sem novos inputs |
| V6 Cryptography | não | Sem novos dados |

---

## Code Examples

### MobileBottomNav — items conforme D-02

```jsx
// Verificado em MobileNav.js: aceita { href, label, code }
const NAV_ITEMS = [
  { href: "/dashboard",             label: "Início",     code: "OVW" },
  { href: "/dashboard/unidades",    label: "Unidades",   code: "UNI" },
  { href: "/dashboard/contratos",   label: "Contratos",  code: "CTR" },
  { href: "/dashboard/locatarios",  label: "Locatários", code: "LOC" },
]
// MobileBottomNav detecta pathname ativo via usePathname() internamente
// startsWith(item.href + "/") → /contratos/[id] fica com CTR ativo (correto)
```

### PortalDashboard — fix D-05

```jsx
// Antes:
<div className="romma-page bg-background min-h-full px-12 pt-12 pb-20">
<h1 className="font-display font-bold text-[48px] ...">

// Depois (conforme D-05):
<div className="romma-page bg-background min-h-full px-4 sm:px-12 pt-6 sm:pt-12 pb-20">
<h1 className="font-display font-bold text-[28px] sm:text-[48px] ...">
```

### ParcelsTable — fix de overflow

```jsx
// ParcelsTable usa Tailwind grid-cols — adicionar overflow wrapper e min-width:
<section ...>
  <span className="eyebrow eyebrow--indigo">HISTÓRICO DE PARCELAS</span>
  <div className="mt-4 overflow-x-auto">
    <div className="border border-border-3 bg-surface min-w-[480px]">
      {/* conteúdo inalterado */}
    </div>
  </div>
</section>
```

### dashboard/page.js — reconciliação do chrome mobile

```jsx
// Remover os dois wrappers de chrome manual:

// REMOVER: <div className="flex flex-col h-screen md:hidden">...</div>
//          incluindo o <MobileBottomNav> e <MobileTopBar> internos

// REMOVER: <div className="romma-desktop-only">...</div>
//          mas MANTER o conteúdo interno

// O DashboardShell (via layout.js) passa a fornecer todo o chrome
// Os dois blocos de conteúdo (desktop e mobile) precisam ser preservados:
//   - romma-desktop-only: grid de métricas, tabela de contratos recentes, quick actions
//   - flex/md:hidden mobile: stats cards 2x2, contratos mobile, quick actions 2x2
// Ambos viram conteúdo direto, sem wrapper de chrome
```

---

## State of the Art

| Abordagem Antiga | Abordagem Atual | Quando Mudou | Impacto |
|-----------------|-----------------|-------------|---------|
| Chrome mobile embutido em `page.js` | Chrome mobile em `DashboardShell` (layout) | Phase 13 | `page.js` fica focado em conteúdo — chrome é responsabilidade do shell |
| Sidebar sempre visível | Sidebar oculta via CSS em mobile | Já definido | `.romma-sidebar-wrapper { display: none !important }` em globals.css |

---

## Inventory de Componentes: Estado atual vs. Trabalho necessário

| Componente | Arquivo | Problema mobile atual | Trabalho necessário |
|-----------|---------|----------------------|---------------------|
| Dashboard overview | `src/app/dashboard/page.js` | Chrome mobile duplicado (MobileTopBar+BottomNav manuais) | Remover wrappers de chrome; manter conteúdo mobile vs desktop |
| Contratos list | `src/components/features/Contratos.js` | Tabela `COL = "116px 1.6fr..."` comprime sem scroll | Wrapper `overflow-x:auto` + `minWidth: 680px` no grid; form `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` |
| Locatários list | `src/components/features/LocatariosDesktop.js` | `romma-desktop-only` → invisível em mobile | Remover a classe; wrapper overflow + min-width na tabela; tap targets dos botões de ação |
| Unidades list | `src/components/features/Unidades.js` | Verificar: componente usa cards (`UnidadeCard`), possivelmente ok | Verificar padding `p-12` → `p-4 sm:p-12`; form overflow se `grid-cols-2` |
| Parcelas detail | `src/components/features/Parcelas.js` | Tabela `COL = "72px 1fr..."` comprime; `text-[48px]` não responsivo; botão Pagar pode ser < 44px | overflow + min-width; heading responsivo; tap target botão |
| Portal dashboard | `src/components/features/portal/PortalDashboard.js` | `px-12 pt-12 text-[48px]` fixos | `px-4 sm:px-12`, `pt-6 sm:pt-12`, `text-[28px] sm:text-[48px]` |
| Portal parcelas | `src/components/features/portal/ParcelsTable.js` | Grid 4 colunas sem min-width | Wrapper overflow + `min-w-[480px]` |
| Portal contrato | `src/components/features/portal/ContratoCard.js` | Verificar padding e overflow | Verificar e corrigir se necessário |
| GestaoEdificios | `src/components/features/GestaoEdificios.js` | Não é uma das 4 abas do dashboard (rota separada /edificios) | Fora de escopo das 4 abas — verificar se UX-03 exige |

> **Nota sobre rota `/dashboard/unidades`:** Carrega `Unidades.js` (não `UnidadesDesktop.js` — esse arquivo não existe). O CONTEXT.md menciona `UnidadesDesktop.js` mas o código real é `Unidades.js`.

---

## Open Questions (RESOLVED)

1. **`Unidades.js` — overflow em 375px?**
   - RESOLVED: tratado pelo fix de UX-03 (inspeção + fix do form `grid-cols-2 → grid-cols-1 sm:grid-cols-2`), plano 13-02.
   - O que sabemos: usa `UnidadeCard` (cards, não tabela grid). Pode ser naturalmente responsivo.
   - O que é incerto: `UnidadeCard` não foi inspecionado; form de nova unidade usa `grid-cols-2`.
   - Recomendação: o plano deve incluir inspeção e fix mínimo do form `grid-cols-2`.

2. **`ContratoCard.js` — overflow?**
   - RESOLVED: tratado pelo fix de UX-04 (verificação + fix de overflow no portal), plano 13-03.
   - O que sabemos: usado no PortalDashboard, não foi inspecionado nesta pesquisa.
   - Recomendação: tarefa de verificação + fix se necessário.

3. **`.romma-desktop-only` sem `!important` em media query**
   - RESOLVED: tratado pelo fix de UX-02 (adicionar `!important` à regra mobile em globals.css ou usar `hidden` do Tailwind no DashboardShell), plano 13-02.
   - O que sabemos: a regra mobile é `display: none` sem `!important`. O DashboardShell usará `style={{ display: "flex" }}` inline, que tem maior especificidade que uma classe CSS.
   - Risco: o bloco desktop pode vazar em mobile quando inline style estiver presente.
   - Recomendação: o plano deve adicionar `!important` à regra `.romma-desktop-only { display: none; }` em globals.css, ou usar `hidden` do Tailwind que usa `!important`.

---

## Assumptions Log

| # | Claim | Section | Risco se errado |
|---|-------|---------|----------------|
| A1 | `Unidades.js` usa cards (não tabela grid) e pode não ter overflow horizontal crítico | Inventory de Componentes | Fix adicional necessário se UnidadeCard tem layout horizontal fixo |
| A2 | `ContratoCard.js` não tem overflow crítico | Open Questions | Needs verificação antes de fechar UX-04 |

---

## Sources

### Primary (HIGH confidence — leitura direta do código-fonte)

- `src/components/ui/MobileNav.js` — API de `MobileTopBar` e `MobileBottomNav` (props: title, subtitle, onBack, onMenu, right; items: href, label, code)
- `src/app/dashboard/layout.js` — estrutura atual do shell (Server Component, `romma-sidebar-wrapper`)
- `src/app/dashboard/page.js` — chrome mobile manual existente (linhas 138-153 e 335-442)
- `src/components/features/LocatariosDesktop.js` — `romma-desktop-only` na linha 104
- `src/components/features/Contratos.js` — `COL = "116px 1.6fr 1.6fr 1fr 1fr 1.2fr 96px"`
- `src/components/features/Parcelas.js` — `COL = "72px 1fr 1fr 1fr 1.2fr 120px"`
- `src/components/features/portal/PortalDashboard.js` — `px-12 pt-12 text-[48px]` fixos
- `src/components/features/portal/ParcelsTable.js` — grid Tailwind `grid-cols-[60px_1fr_1fr_1.2fr]` sem overflow wrapper
- `src/app/globals.css` — `.romma-desktop-only`, `.romma-mobile-only`, media query 768px, `.romma-sidebar-wrapper { display: none !important }`

### Secondary (MEDIUM confidence)

- [CITED: Next.js App Router docs] — Client Components recebendo `children` como props de Server Components mantém os children como Server Components

---

## Metadata

**Confidence breakdown:**
- Mapa de componentes e problemas: HIGH — leitura direta do código-fonte
- Padrão DashboardShell: HIGH — baseado na infraestrutura CSS existente e no padrão já usado em `dashboard/page.js`
- Fix de tabelas (min-width): HIGH — comportamento documentado de CSS grid fr units
- Valores de min-width: MEDIUM — estimativa baseada no número de colunas; ajuste visual pode ser necessário

**Research date:** 2026-06-12
**Valid until:** Indefinido (fase de UI pura, sem dependências de versão de pacotes)
