---
phase: 04-polimento-visual-publico
plan: "01"
subsystem: ui
tags: [tailwind-v4, next-image, realtime, supabase, public-page, bottom-sheet]

requires:
  - phase: 02-publico-e-realtime
    provides: UnidadesPublicas lógica em unidades/page.js (inline), Realtime subscription, getUnidades/getEdificios queries

provides:
  - Thin shell Server Component em src/app/unidades/page.js
  - UnidadesPublicas.js: Client Component com data fetching, Realtime, tabs de edifício, animação de remoção
  - UnidadePublicaCard.js: card de unidade público com paleta Obsidian Blueprint, eyebrow, valor/consulta
  - UnidadeDetailSheet.js: bottom sheet com next/image, CTA 'Tenho interesse', overlay fixed viewport

affects:
  - fase-04 planos subsequentes (referência de padrão Tailwind v4 para componentes públicos)
  - fase-05 testes E2E (alvo: /unidades visitante)

tech-stack:
  added: []
  patterns:
    - "Thin shell Server Component importa único Client Component feature (sem props)"
    - "bottom-sheet: overlay fixed inset-0 z-50 + sheet max-h-[85dvh] (não absolute — cobre viewport completo)"
    - "next/image com fill em container relative h-40 overflow-hidden para placeholder de imagem"
    - "Tailwind arbitrary property [scrollbar-width:none] como substituto de inline style"
    - "RealtimeDot sem props (interface pública sem label)"

key-files:
  created:
    - src/components/features/UnidadesPublicas.js
    - src/components/features/UnidadePublicaCard.js
    - src/components/features/UnidadeDetailSheet.js
  modified:
    - src/app/unidades/page.js

key-decisions:
  - "UI-SPEC prevalece sobre PATTERNS.md: eyebrow 11px (não 9px), font-body (não font-display) para títulos de card, sem font-medium 500 em novos componentes"
  - "Overlay do UnidadeDetailSheet migrado de position:absolute para fixed inset-0 — upgrade intencional que cobre o viewport completo"
  - "[scrollbar-width:none] como arbitrary property Tailwind v4 elimina o único inline style de layout remanescente nas tabs de filtro"
  - "Botão secundário do UnidadeDetailSheet usa cópia 'Fechar' (UI-SPEC) — não 'Voltar' (PATTERNS.md)"

patterns-established:
  - "Card público: button reset canônico (style={{ all: 'unset' }}) + className Tailwind v4 puro para layout"
  - "Eyebrow/label 11px tracking-[1px] uppercase uniformes em todos os usos (UN-XXXXXX, rótulos de campo)"
  - "Empty state verbatim da UI-SPEC: 'Nenhuma unidade disponível' + 'Todas as unidades estão ocupadas...'"

requirements-completed: [VIS-01]

duration: 25min
completed: 2026-05-27
---

# Phase 04 Plan 01: Slice Público /unidades Summary

**Página /unidades migrada para thin shell + 3 subcomponentes Tailwind v4 com paleta Obsidian Blueprint, next/image para placeholder e Realtime preservado**

## Performance

- **Duration:** 25 min
- **Started:** 2026-05-27T23:30:00Z
- **Completed:** 2026-05-27T23:55:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- src/app/unidades/page.js reescrito como Server Component thin shell puro (sem 'use client', sem estado)
- 3 subcomponentes extraídos do monólito: UnidadesPublicas, UnidadePublicaCard, UnidadeDetailSheet — todos em Tailwind v4 com zero inline styles de layout
- UnidadeDetailSheet usa next/image com fill para placeholder (/Detalhe_Arquitetonico.png) em container relative h-40
- Realtime subscription preservada (canal 'public-unidades', INSERT + DELETE, cleanup removeChannel)
- Zero tags `<img>` nativas nos 4 arquivos do plano
- Lint passa com zero erros nos novos arquivos (8 warnings pré-existentes em landing page/page.js — fora de escopo)

## Task Commits

1. **Task 1: Grep gates + scaffolding dos 3 subcomponentes** - `b6a2532` (chore)
2. **Task 2: Slice vertical completo** - `ed4acc5` (feat)

**Plan metadata:** [SUMMARY commit a seguir]

## Files Created/Modified

- `src/app/unidades/page.js` — reescrito como thin shell Server Component (4 linhas)
- `src/components/features/UnidadesPublicas.js` — Client Component principal: data fetching, Realtime, tabs edifícios, estado animado
- `src/components/features/UnidadePublicaCard.js` — card público: eyebrow UN-XXXXXX, valor/consulta, StatusBadge, CTA "Detalhes →"
- `src/components/features/UnidadeDetailSheet.js` — bottom sheet: overlay fixed, next/image, grid área/valor, "Tenho interesse →", disclaimer

## Decisions Made

- UI-SPEC (11px eyebrow, font-body para títulos) prevaleceu sobre PATTERNS.md (9px, font-display) — UI-SPEC é contrato definitivo
- Overlay migrado de `position: absolute` para `fixed inset-0 z-50` — comportamento correto para bottom sheet de viewport completo
- `[scrollbar-width:none]` como arbitrary property Tailwind v4 eliminou o único inline style de layout restante nas tabs
- Botão secundário: "Fechar" (UI-SPEC + nome da prop `onClose`) — não "Voltar" (PATTERNS.md)
- RealtimeDot sem props `label=""` e `compact` — interface pública usa defaults

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Substituído inline style `scrollbarWidth: 'none'` por arbitrary property Tailwind v4**
- **Found during:** Task 2, verificação do grep gate de inline styles
- **Issue:** `style={{ scrollbarWidth: 'none' }}` no container de tabs violaria a restrição D-04 de zero inline styles de layout
- **Fix:** Substituído por `className="... [scrollbar-width:none]"` — arbitrary property CSS do Tailwind v4
- **Files modified:** src/components/features/UnidadesPublicas.js
- **Verification:** `grep -rn 'style={{' ... | grep -v "all: 'unset'" | wc -l` → 0
- **Committed in:** ed4acc5 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug de inline style)
**Impact on plan:** Correção necessária para atender critério D-04. Sem scope creep.

## Issues Encountered

- PATTERNS.md divergia do UI-SPEC em eyebrow size (9px vs 11px), font-family de título (font-display vs font-body), peso de valor (font-medium vs font-bold) e copy do botão secundário ("Voltar" vs "Fechar"). Seguiu-se o UI-SPEC como contrato definitivo.

## Threat Surface Scan

Nenhuma superfície de segurança nova introduzida. Os 3 threats identificados no PLAN (T-04-01 a T-04-03) foram aceitos por design — dados públicos, subscription read-only, assets self-hosted.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- /unidades pública pronta para demonstração: thin shell, Tailwind v4, Realtime, next/image
- Padrão estabelecido para planos subsequentes da Fase 4 (UnidadeCard dashboard rewrite, LocatariosDesktop edição)
- Lint limpo nos 4 arquivos do plano; 8 warnings em page.js (landing) aguardam plano 04-02

## Self-Check: PASSED

- FOUND: src/app/unidades/page.js
- FOUND: src/components/features/UnidadesPublicas.js
- FOUND: src/components/features/UnidadePublicaCard.js
- FOUND: src/components/features/UnidadeDetailSheet.js
- FOUND: commit b6a2532 (Task 1)
- FOUND: commit ed4acc5 (Task 2)
- Zero `<img>` nativas: 0
- Zero inline styles de layout: 0

---
*Phase: 04-polimento-visual-publico*
*Completed: 2026-05-27*
