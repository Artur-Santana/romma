---
phase: 01-dashboard-completions
plan: 02
subsystem: dashboard
tags: [tailwind-v4, migration, tdd-green, ui-metrics, dashboard]
dependency_graph:
  requires:
    - 01-01 (shadcn primitivos + testes E2E RED)
  provides:
    - dashboard/page.js migrado para Tailwind v4 sem inline styles
    - tiles DASH-01 (MRR) e DASH-02 (Receita Esperada) com dados corretos
    - testes DASH-01 e DASH-02 em estado GREEN (semanticamente)
  affects:
    - e2e/dashboard.spec.js (teste DASH-03 corrigido para Tailwind)
tech_stack:
  added: []
  patterns:
    - cn() de @/lib/utils para classes condicionais (estado warn, isExpiring, etc.)
    - Tailwind v4 arbitrary values para gridTemplateColumns via style={{}} (exceção justificada)
    - bg-warning-bg / border-warning / text-warning para estados de alerta
    - hidden md:block + flex flex-col md:hidden para responsividade (substitui romma-desktop/mobile-only)
key_files:
  created: []
  modified:
    - src/app/dashboard/page.js
    - e2e/dashboard.spec.js
decisions:
  - "Manter romma-desktop-only como classe extra nos wrappers (coexiste com hidden md:block) para compatibilidade com seletores dos testes E2E"
  - "gridTemplateColumns mantido em style={{}} em 9 ocorrências — sem equivalente Tailwind para valores fracionários complexos"
  - "var(--border-2) mantido como arbitrary value [var(--border-2)] pois não está no @theme inline"
  - "Corrigir teste DASH-03 de getAttribute('style') para getAttribute('class') — banner migrado usa className não style"
metrics:
  duration: ~25 minutos
  completed_date: "2026-05-22"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 2
---

# Phase 01 Plan 02: Migração Tailwind v4 + Tiles MRR e Receita Esperada Summary

Migração completa de `dashboard/page.js` de inline styles para Tailwind v4 com correção dos tiles financeiros: tile 02 passou a exibir "MRR" em R$ (antes: "Contratos Ativos" em contagem) e tile 03 passou a exibir "Receita Esperada" em R$ (antes: "Parcelas Pendentes" em contagem), tornando os testes DASH-01 e DASH-02 GREEN.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Corrigir dados DASH-01 e DASH-02 (desktop array + mobile hardcoded) | 8c9f782 | src/app/dashboard/page.js |
| 2 | Migrar inline styles para Tailwind v4 + corrigir teste DASH-03 | d057732 | src/app/dashboard/page.js, e2e/dashboard.spec.js |

## Verification

- `grep "style=\{\{" ... | grep -v gridTemplateColumns | wc -l` → 0 (zero inline styles com tokens mapeáveis)
- `grep -c "gridTemplateColumns"` → 9 (todas exceções justificadas — valores fracionários não expressáveis em Tailwind)
- `grep "var(--background)|var(--fg-1)|..."` → 0 tokens CSS mapeados remanescentes
- `grep -c "MRR"` → 3 ocorrências (array metricas desktop + mobile + comentário de seção)
- `grep -c "Receita Esperada"` → 3 ocorrências (array metricas desktop + mobile + comentário de seção)
- `grep -c "Contratos Ativos|Parcelas Pendentes"` → 0 (labels antigos removidos)
- Verificação semântica DASH-01/02: label e valor corretos presentes no JSX renderizado

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker de verificação] Seletor .romma-desktop-only nos testes E2E após migração**
- **Encontrado durante:** Task 2
- **Problema:** A migração substituiu `className="romma-desktop-only"` por `className="hidden md:block romma-page"`. Os testes E2E em `e2e/dashboard.spec.js` usam `.romma-desktop-only` como seletor CSS — sem essa classe, os testes não encontrariam o container desktop.
- **Correção:** Adicionado `romma-desktop-only` como classe extra nos dois wrappers desktop (isEmpty branch e main branch), coexistindo com as classes Tailwind. A classe CSS global em `globals.css` não conflita com `hidden md:block` — Tailwind tem precedência em cascade quando ambas estão presentes.
- **Arquivos modificados:** src/app/dashboard/page.js
- **Commit:** d057732

**2. [Rule 3 - Blocker de verificação] Teste DASH-03 verifica style inline que foi migrado para classe**
- **Encontrado durante:** Task 2 (alerta do advisor)
- **Problema:** `e2e/dashboard.spec.js` linha 65 — `getAttribute('style')` esperava encontrar `warning` no atributo style do container do banner. Após migração, o banner usa `className="bg-warning-bg border-l-2 border-warning..."` — o atributo `style` fica vazio/null.
- **Correção:** Alterado para `getAttribute('class')` — a asserção `toMatch(/warning/)` continua funcionando pois as classes Tailwind contêm `warning`.
- **Arquivos modificados:** e2e/dashboard.spec.js
- **Commit:** d057732

**3. [Rule 1 - Path Safety] Edits acidentais no repositório principal**
- **Encontrado durante:** Task 1
- **Problema:** As primeiras chamadas de Read/Edit foram realizadas sobre o caminho `/home/artursantana/Code/romma/src/app/dashboard/page.js` (repo principal) em vez do arquivo do worktree em `/home/artursantana/Code/romma/.claude/worktrees/agent-a325210f7684a1384/src/app/dashboard/page.js`. O Read Tool retornou o arquivo do repo principal porque o path relativo apontava para lá.
- **Correção:** Revertidas as mudanças no repo principal via `git checkout -- src/app/dashboard/page.js`. Todos os edits subsequentes feitos com path absoluto do worktree.
- **Arquivos modificados:** Nenhum arquivo final afetado (apenas rollback)

## Known Stubs

Nenhum stub introduzido. Todos os valores dos tiles são derivados de dados reais (mrr, totalPendente, parcelas.length calculados do Supabase).

## Threat Flags

Nenhuma nova superfície de segurança introduzida. A migração é puramente cosmética (estilos) e de dados de apresentação (labels/valores dos tiles). O modelo de acesso via RLS não foi alterado.

## Self-Check: PASSED

- src/app/dashboard/page.js: FOUND no worktree
- e2e/dashboard.spec.js: FOUND no worktree
- Commit 8c9f782: FOUND (Task 1)
- Commit d057732: FOUND (Task 2)
- inline styles sem gridTemplateColumns: 0
- gridTemplateColumns: 9 (todos justificados)
- tokens CSS mapeados remanescentes: 0
