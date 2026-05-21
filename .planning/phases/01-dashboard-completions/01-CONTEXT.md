# Phase 1: Dashboard Completions - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Fase 1 entrega: (1) métricas financeiras reais no dashboard (MRR e Receita Esperada verificadas/corrigidas nos tiles existentes); (2) alerta de contratos vencendo validado; (3) migração completa de todos os feature components do dashboard de inline styles para Tailwind v4 + shadcn/ui.

O grid de 4 tiles do dashboard NÃO muda. Não há novos tiles — o trabalho é verificar fórmulas e labels dos tiles existentes.

</domain>

<decisions>
## Implementation Decisions

### Regra Absoluta de Styling (substitui CLAUDE.md e UI-SPEC neste ponto)
- **D-01:** **PROIBIDO inline styles em qualquer arquivo deste projeto.** Toda estilização usa Tailwind v4 classes exclusivamente. Esta regra override qualquer instrução do CLAUDE.md ou UI-SPEC que diga o contrário.
- **D-02:** CSS vars já estão mapeados em `globals.css` para Tailwind v4 (`@theme`). Usar como tokens Tailwind — não usar arbitrary values `bg-[var(--surface)]`. Os tokens são classes nativas Tailwind neste projeto.
- **D-03:** shadcn/ui deve ser usado onde fizer sentido: Table, Badge, Button, Card. Componentes shadcn substituem implementações customizadas quando disponíveis.
- **D-04:** Responsividade via breakpoints Tailwind (`md:hidden`, `md:block`, etc.). As classes `.romma-mobile-only` e `.romma-desktop-only` de `globals.css` devem ser substituídas por breakpoints Tailwind nos componentes migrados.

### Migração VIS-02 — Escopo Completo
- **D-05:** Migrar TODOS os feature components do dashboard de inline styles para Tailwind v4 + shadcn/ui. Componentes alvo:
  - `src/components/features/ContratosDesktop.js`
  - `src/components/features/GestaoEdificios.js`
  - `src/components/features/LocatariosDesktop.js` (ou `Locatarios.js` — verificar qual está ativo em `/dashboard/locatarios`)
  - `src/components/features/Parcelas.js`
  - `src/app/dashboard/page.js` (tiles de métricas)
- **D-06:** Componentes de UI shell em `src/components/ui/` que estejam sendo usados no dashboard também devem ser migrados se tiverem inline styles.

### Dashboard Tiles (DASH-01, DASH-02, DASH-03)
- **D-07:** Grid de 4 tiles inalterado. Nenhum tile novo é adicionado.
- **D-08:** DASH-01 (MRR) — tile já existe ("Contratos Ativos" já mostra valor mensal a receber). Verificar se a fórmula é `SUM(unidades.valor_mensal WHERE contratos.status = 'ativo')` e se o label/formato está correto.
- **D-09:** DASH-02 (Receita Esperada) — tile "Parcelas Pendentes" já mostra valor equivalente. Verificar fórmula (`SUM` de parcelas com `status IN ('pendente', 'vencida')`), ajustar label se necessário. Usar `fmtBRL()` para exibição.
- **D-10:** DASH-03 (alerta vencendo em 7 dias) — já implementado segundo UI-SPEC. Verificar apenas que funciona corretamente; sem reescrita.

### Claude's Discretion
- Qual dos dois componentes (`Locatarios.js` vs `LocatariosDesktop.js`) está ativamente em uso na rota `/dashboard/locatarios` — verificar no código e migrar o ativo.
- Escolha específica de componentes shadcn para cada elemento (ex: usar `<Table>` do shadcn para as listas vs construir com divs Tailwind).
- Estrutura de queries para MRR/Receita Esperada: verificar se as queries existentes em `queries-server.js` ou `queries-client.js` já cobrem o cálculo ou se precisam de ajuste.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Escopo e Requisitos
- `.planning/ROADMAP.md` — escopo da Fase 1, success criteria (DASH-01, DASH-02, DASH-03, VIS-02)
- `.planning/REQUIREMENTS.md` — definições formais de DASH-01, DASH-02, DASH-03, VIS-02

### Design Contract
- `.planning/phases/01-dashboard-completions/01-UI-SPEC.md` — contrato visual completo: paleta de cores (CSS vars), tipografia, espaçamento, copywriting, componentes, estados de dados. OBRIGATÓRIO ler antes de implementar qualquer UI.

### Padrão Tailwind neste Projeto
- `src/app/login/page.js` — referência canônica de como Tailwind + shadcn são usados neste projeto
- `src/app/globals.css` — tokens CSS vars mapeados para Tailwind v4 via `@theme`; usar como base para todas as classes de cor/tipografia

### Implementação Existente (a verificar e migrar)
- `src/app/dashboard/page.js` — tiles de métricas existentes, lógica de MRR/Parcelas Pendentes/Vencendo
- `src/components/features/ContratosDesktop.js` — implementação atual a migrar
- `src/components/features/GestaoEdificios.js` — implementação atual a migrar
- `src/components/features/Parcelas.js` — implementação atual a migrar
- `src/components/features/Locatarios.js` e `src/components/features/LocatariosDesktop.js` — verificar qual está ativo e migrar

### Utilitários e Patterns
- `src/lib/utils.js` — `fmtBRL()`, `fmtData()` para formatação de valores monetários e datas
- `src/lib/queries-server.js` — queries server-side existentes (verificar cobertura de MRR/Receita)
- `src/lib/queries-client.js` — queries client-side existentes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `fmtBRL(value)` em `src/lib/utils.js` — formatação BRL já implementada, usar em todos os valores monetários
- `fmtData(date)` em `src/lib/utils.js` — formatação de datas
- `StatusBadge` em `src/components/ui/StatusBadge.js` — considerar substituir por shadcn `<Badge>` durante a migração
- `ConfirmDialog` em `src/components/ui/ConfirmDialog.js` — para ações destrutivas
- `MobileTopBar`, `MobileBottomNav` em `src/components/ui/MobileNav.js` — shell mobile
- `OwnerSidebar` em `src/components/ui/OwnerSidebar.js` — sidebar desktop
- `PageHeader` em `src/components/ui/PageHeader.js` — cabeçalhos de seção

### Established Patterns
- Data fetching: `useEffect` → funções de `queries-client.js` (client components) ou `await` direto → `queries-server.js` (server components)
- Null safety: sempre `?? []` em retornos de array
- Form state: objeto único `useState({ ... })` com spread update
- Server Actions: retornam `{ status: 200 }` ou `{ status: 5xx, erroMessage: '...' }`
- Auth guard: função `authGuard()` local em cada action file

### Integration Points
- `src/proxy.js` — guard de autenticação e role que protege `/dashboard/**`
- `src/app/dashboard/layout.js` — shell do dashboard (sidebar + nav); não mexer na Fase 1

</code_context>

<specifics>
## Specific Ideas

- O usuário confirmou que tiles existentes já mostram valores financeiros corretos: "Contratos Ativos" mostra valor a receber do mês; "Parcelas Pendentes" mostra valor equivalente à Receita Esperada. O trabalho de DASH-01/02 é verificação e possível ajuste de label/fórmula, não nova implementação.
- A regra "no inline styles" é uma decisão forte e explícita do usuário — não é negociável e override toda documentação anterior.
- CSS vars estão disponíveis como tokens Tailwind nativos (não como arbitrary values) — o usuário confirmou que o mapeamento já existe.

</specifics>

<deferred>
## Deferred Ideas

- Migração de `src/app/unidades/` para Tailwind — pertence à Fase 4 (VIS-01: Polimento Visual Público). Mencionado pelo usuário mas fora do escopo da Fase 1.
- Migração de `src/app/page.js` (homepage pública) para Tailwind — Fase 4.
- Componentes legacy `Contratos.js` e `Unidades.js` (não os Desktop variants) — verificar se ainda estão em uso; se não estiverem, deletar como parte da Fase 3 (Refatoração).

</deferred>

---

*Phase: 01-dashboard-completions*
*Context gathered: 2026-05-21*
