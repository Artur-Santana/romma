---
phase: 07-ajustes-finais-pre-banca
plan: "03"
subsystem: ui
tags: [skeleton, shadcn, loading-state, ux]

requires: []
provides:
  - "Componente Skeleton (src/components/ui/skeleton.js) instalado via shadcn CLI"
  - "loading.js Suspense boundary para /dashboard (Visão Geral)"
  - "loading.js Suspense boundary para /dashboard/locatarios"
  - "loadingInicial flag + SkeletonUnidades em Unidades.js"
  - "loadingInicial flag + SkeletonContratos em Contratos.js"
  - "Skeleton substituindo texto Carregando... no PortalDashboard"
affects: [07-04, visual-verification]

tech-stack:
  added: ["src/components/ui/skeleton.js (shadcn Skeleton, sem pacote npm novo)"]
  patterns:
    - "loading.js como Suspense boundary para Server Components (Next.js App Router)"
    - "loadingInicial flag separada do loading de mutations em Client Components"
    - "rounded-none em todos os Skeleton (sharp-corner system)"

key-files:
  created:
    - "src/components/ui/skeleton.js"
    - "src/app/dashboard/loading.js"
    - "src/app/dashboard/locatarios/loading.js"
  modified:
    - "src/components/features/Unidades.js"
    - "src/components/features/Contratos.js"
    - "src/components/features/portal/PortalDashboard.js"

key-decisions:
  - "setLoadingInicial(false) colocado em fetchDados (useEffect mount) e não em carregarDados (função nunca chamada no mount) — Rule 1 fix"
  - "Skeleton gerado via shadcn CLI (arquivo local, sem npm package novo) conforme Registry Safety"
  - "rounded-none explícito em todos os usos (shadcn preset radix-lyra já configurou assim, mas mantido para clareza)"

patterns-established:
  - "loadingInicial: pattern para distinguir skeleton de carregamento inicial de loading de mutations em Client Components"
  - "loading.js: arquivo de Suspense boundary para Server Components com skeleton estruturado"

requirements-completed: [UX-02]

duration: 15min
completed: 2026-06-02
---

# Phase 07 Plan 03: Skeleton Loading Summary

**Skeleton loading aplicado nas 4 abas do dashboard e no portal do Locatário via estratégias adequadas por arquitetura (loading.js para SSR, loadingInicial para Client, substituição direta no portal)**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-02T20:09:00Z
- **Completed:** 2026-06-02T20:20:00Z
- **Tasks:** 3/3 executadas (Task 4 aguarda verificação visual)
- **Files modified:** 6

## Accomplishments

- Instalado componente `Skeleton` via shadcn CLI (arquivo local `skeleton.js`, zero pacotes npm novos)
- Criados 2 `loading.js` Suspense boundaries para as abas Server Component (/dashboard e /dashboard/locatarios)
- Adicionado `loadingInicial` flag separada em `Unidades.js` e `Contratos.js` para cobrir o carregamento inicial sem afetar o `loading` de mutations
- Substituído texto cru "Carregando..." por blocos Skeleton estruturados no PortalDashboard
- Build limpo após cada task; 0 erros

## Task Commits

1. **Task 1: Instalar Skeleton + loading.js das abas Server Component** - `fc9aa3f` (feat)
2. **Task 2: Skeleton de initial load em Unidades.js e Contratos.js** - `7c4e797` (feat)
3. **Task 3: Skeleton no PortalDashboard** - `b637584` (feat)

## Files Created/Modified

- `src/components/ui/skeleton.js` — Componente Skeleton do shadcn/ui (cn + animate-pulse + bg-muted)
- `src/app/dashboard/loading.js` — Suspense boundary com skeleton da Visão Geral (eyebrow + título + grid 4 KPI cards + bloco lista)
- `src/app/dashboard/locatarios/loading.js` — Suspense boundary com skeleton de Locatários (eyebrow + título + tabela)
- `src/components/features/Unidades.js` — Adicionado import Skeleton, loadingInicial state, SkeletonUnidades local, guard de render
- `src/components/features/Contratos.js` — Adicionado import Skeleton, loadingInicial state, SkeletonContratos local, guard de render
- `src/components/features/portal/PortalDashboard.js` — Import Skeleton, substituição do ramo loading com 5 Skeleton (h-32 card + 4x h-8 linhas)

## Decisions Made

- Skeleton criado como arquivo local via shadcn CLI (não importado de biblioteca externa) — consistente com o padrão do projeto
- Todos os `<Skeleton>` usam `rounded-none` explícito — consistente com `--radius: 0` do sistema visual sharp-corner

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] setLoadingInicial colocado em fetchDados (mount) e não em carregarDados**
- **Found during:** Task 2 (Skeleton de initial load em Unidades.js)
- **Issue:** O plan especificava "na função carregarDados, adicionar setLoadingInicial(false)" — mas carregarDados (linhas 38-41) nunca é chamada no mount. O useEffect usa fetchDados inline (linhas 85-91) que duplica a lógica. Se o set fosse em carregarDados, a flag nunca viraria false e o skeleton renderizaria para sempre.
- **Fix:** setLoadingInicial(false) adicionado ao final de fetchDados no useEffect — que é o caminho real do mount. UI-SPEC linha 149 confirma: "O useEffect existente deve chamar setLoadingInicial(false)".
- **Files modified:** src/components/features/Unidades.js
- **Verification:** Build passou; grep confirma 3 ocorrências de loadingInicial (declaração + set + guard)
- **Committed in:** 7c4e797 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug no caminho de execução do mount)
**Impact on plan:** Fix essencial para corretude — sem ele o skeleton bloquearia a UI indefinidamente. Sem scope creep.

## Issues Encountered

- shadcn CLI gerou `skeleton.jsx` em vez de `skeleton.js` — convertido manualmente para `.js` (projeto é JS sem TS conforme CLAUDE.md)

## Known Stubs

Nenhum. Todos os skeletons são puramente visuais (nenhum dado hardcoded ou placeholder de dados reais).

## Threat Flags

Nenhum. UX-02 é puramente apresentacional — não introduz novos endpoints, fluxos de dados ou superfícies de segurança.

## Next Phase Readiness

- Task 4 (checkpoint:human-verify) aguarda verificação visual nas 5 superfícies
- Após aprovação, skeleton loading estará completo para a demo da banca

---
*Phase: 07-ajustes-finais-pre-banca*
*Completed: 2026-06-02*
