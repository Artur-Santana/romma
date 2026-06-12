# Phase 13: Mobile Responsivo - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Dashboard do Proprietário e Portal do Locatário navegáveis e utilizáveis em viewport 375px. O foco é tornar as interfaces existentes acessíveis em mobile — não redesenhar ou criar variantes separadas.

Entregáveis concretos:
1. `DashboardShell` Client Component substituindo a sidebar por `MobileTopBar` + `MobileBottomNav` em mobile
2. Fixes responsivos nos 4 componentes `*Desktop.js` (sem overflow horizontal, scroll funciona, tap targets ≥44px)
3. Fixes responsivos no `PortalDashboard.js` (padding e tipografia)

O que NÃO é escopo: criar componentes `*Mobile.js` separados, redesenhar fluxos, adicionar novas funcionalidades.

</domain>

<decisions>
## Implementation Decisions

### D-01: DashboardShell — arquitetura
- Novo `src/components/ui/DashboardShell.js` como **Client Component** (`"use client"`)
- `dashboard/layout.js` permanece **Server Component** — importa e usa `DashboardShell` para wrappear `{children}`
- `DashboardShell` renderiza: no desktop → estrutura existente (TopStrip + sidebar + main); no mobile → `MobileTopBar` + `{children}` + `MobileBottomNav`
- Detecção de mobile via CSS (`romma-desktop-only` / `romma-mobile-only`) ou hook `useMediaQuery` — implementador escolhe a abordagem mais limpa com a infraestrutura existente

### D-02: MobileBottomNav — itens de navegação
```
/dashboard          → label "Início",     code "OVW"
/dashboard/unidades → label "Unidades",   code "UNI"
/dashboard/contratos→ label "Contratos",  code "CTR"
/dashboard/locatarios→ label "Locatários",code "LOC"
```

### D-03: MobileTopBar — título por rota
- `/dashboard` → title "Dashboard"
- `/dashboard/unidades` → title "Unidades"
- `/dashboard/contratos` → title "Contratos"
- `/dashboard/locatarios` → title "Locatários"
- `/dashboard/contratos/[id]` → title "Parcelas" com `onBack` → `router.back()`
- Sem subtítulo padrão (subtitle omitido)

### D-04: Fixes nos *Desktop.js — abordagem
- **Não** criar variantes `*Mobile.js` separadas
- Fixes inline nos componentes existentes: `ContratosDesktop.js`, `LocatariosDesktop.js`, `UnidadesDesktop.js`, `Parcelas.js` (via `GestaoEdificios.js` se aplicável)
- Problemas a corrigir: overflow horizontal em tabelas → `overflow-x: auto` no container; colunas com min-width que causam scroll; tap targets < 44px → padding mínimo 44px de altura
- Abordagem de estilo: Tailwind classes responsivas (`sm:`) ou inline `style={}` — usar o que o componente já usa (ContratosDesktop usa mistura; preferir consistência)

### D-05: Portal Locatário — fixes
- `PortalDashboard.js` usa Tailwind classes — trocar por classes responsivas:
  - `px-12` → `px-4 sm:px-12`
  - `text-[48px]` → `text-[28px] sm:text-[48px]`
  - `pt-12` → `pt-6 sm:pt-12`
- `ContratoCard.js` e `ParcelsTable.js` — verificar e corrigir overflow horizontal se necessário
- `ParcelsTable.js` pode precisar de `overflow-x: auto` no wrapper

### D-06: Breakpoint alvo
- **375px** é o viewport mínimo (iPhone SE / maioria dos Android)
- CSS breakpoint mobile: `max-width: 768px` (já definido em globals.css)
- Tailwind breakpoint `sm:` = 640px — usar para transições de layout

### Claude's Discretion
- Detecção de mobile no DashboardShell: hook `useMediaQuery(768)` vs render CSS com `romma-desktop-only`/`romma-mobile-only` — escolher o mais limpo com a infraestrutura existente
- Se usar abordagem CSS pura (dois blocos renderizados, um hidden), ambos são renderizados no servidor — ok para este projeto
- Ordem dos fixes nos *Desktop.js: implementador decide quais têm overflow mais crítico e prioriza

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Componentes mobile existentes
- `src/components/ui/MobileNav.js` — MobileTopBar + MobileBottomNav já implementados, prontos para uso
- `src/app/dashboard/layout.js` — estrutura atual do shell (Server Component, usa romma-sidebar-wrapper)
- `src/app/globals.css` — CSS vars, .romma-desktop-only, .romma-mobile-only, breakpoint 768px

### Portal
- `src/components/features/portal/PortalDashboard.js` — componente principal do portal, usa Tailwind
- `src/components/features/portal/ContratoCard.js` — card de contrato ativo
- `src/components/features/portal/ParcelsTable.js` — tabela de parcelas

### Dashboard feature components (a corrigir)
- `src/components/features/ContratosDesktop.js` — tabela de contratos
- `src/components/features/LocatariosDesktop.js` — lista de locatários
- `src/components/features/UnidadesDesktop.js` — gestão de unidades (se existir; verificar)
- `src/components/features/Parcelas.js` — detalhe de parcelas (via rota /contratos/[id])
- `src/components/features/GestaoEdificios.js` — gestão de edifícios

### Roadmap e requirements
- `.planning/ROADMAP.md` §Phase 13 — success criteria (UX-02, UX-03, UX-04)
- `.planning/REQUIREMENTS.md` §UX — requisitos UX-02/03/04

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MobileTopBar` (`src/components/ui/MobileNav.js`): aceita `title`, `subtitle`, `onBack`, `onMenu`, `right` — pronto para uso no DashboardShell
- `MobileBottomNav` (`src/components/ui/MobileNav.js`): aceita `items[]` com `{ href, label, code }`, detecta pathname ativo via `usePathname` — pronto para uso
- `TopStrip` (`src/components/ui/TopStrip.js`): já usado no layout atual — manter no DashboardShell desktop path

### Established Patterns
- `dashboard/layout.js` é Server Component (sem `"use client"`) — não quebrar isso; DashboardShell é o Client Component filho
- Styling: feature components usam inline `style={}` + CSS vars; componentes mais novos (MobileNav, login) usam Tailwind — Portal usa Tailwind → fixes do portal em Tailwind
- CSS media query mobile já definida em globals.css: `@media (max-width: 768px)` com `.romma-sidebar-wrapper { display: none }` e `.romma-mobile-only { display: flex; flex-direction: column; height: 100vh }`

### Integration Points
- `dashboard/layout.js` — ponto de integração do DashboardShell (substituir `<div className="romma-sidebar-wrapper">` + `<main>` pelo novo shell)
- `portal/layout.js` — NÃO precisa de mudança estrutural; fixes ficam nos componentes internos
- Path alias `@/*` → `./src/*` — usar em todos os imports

### Atenção
- `UnidadesDesktop.js` pode não existir (STRUCTURE.md menciona como "Active (if exists)") — verificar antes de planejar
- `Parcelas.js` (não `ParcelasDesktop.js`) — componente legado, verificar se tem overflow issues em 375px

</code_context>

<specifics>
## Specific Ideas

- MobileBottomNav usa `font-mono text-[9px]` para codes e `font-body font-bold text-[9px] tracking-[1px] uppercase` para labels — padrão Obsidian Blueprint, manter
- Nenhuma animação de transição entre abas necessária nesta fase (pertence à Phase 14)
- Success criteria do roadmap: sidebar NÃO deve vazar ou sobrepor conteúdo em 375px — DashboardShell deve garantir isso

</specifics>

<deferred>
## Deferred Ideas

- Animações de transição entre abas mobile → Phase 14 (Animações & Feedback)
- Drawer/menu lateral deslizante (hambúrguer) → pós-banca (UX-02 diz "sidebar colapsável" mas MobileBottomNav já atende o requirement mínimo)
- Dark mode toggle no mobile → fora de escopo (tema Obsidian é permanente após Phase 12)

</deferred>

---

*Phase: 13-mobile-responsivo*
*Context gathered: 2026-06-12*
