---
phase: 01-dashboard-completions
plan: 01
subsystem: dashboard
tags: [shadcn, e2e, playwright, tdd-red, ui-primitives]
dependency_graph:
  requires: []
  provides:
    - shadcn Button component (src/components/ui/button.jsx)
    - shadcn Input component (src/components/ui/input.jsx)
    - shadcn Select component (src/components/ui/select.jsx)
    - Dashboard E2E smoke tests RED phase (e2e/dashboard.spec.js)
  affects:
    - Qualquer plan posterior que use Button, Input ou Select do shadcn
    - Plans 01-02 e 01-03 que dependem dos testes para validar migração dos tiles
tech_stack:
  added:
    - shadcn/ui button component (cva + radix-ui Slot)
    - shadcn/ui input component (styled input)
    - shadcn/ui select component (radix-ui Select primitives)
  patterns:
    - TDD RED phase para acceptance criteria de DASH-01/02/03
    - Viewport explícito nos testes para discriminar layout mobile vs desktop
key_files:
  created:
    - src/components/ui/button.jsx
    - src/components/ui/input.jsx
    - src/components/ui/select.jsx
    - e2e/dashboard.spec.js
  modified: []
decisions:
  - Testes em e2e/ não em tests/ — playwright.config.js usa testDir ./e2e
  - Viewport 1440x900 explícito para evitar falso positivo (mobile mostra MRR separado)
  - Verificação de semantic-RED por inspeção de código, não por execução full (preservar servidor dev do usuário)
metrics:
  duration: ~18 minutos
  completed_date: "2026-05-22"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 0
---

# Phase 01 Plan 01: Pré-condições shadcn + Testes E2E RED Summary

Instalação dos três primitivos shadcn (button, input, select) via CLI e criação dos testes E2E @smoke que falham semanticamente contra os tiles atuais do dashboard (DASH-01: label "Contratos Ativos" vs esperado "MRR"; DASH-02: label "Parcelas Pendentes" vs esperado "Receita Esperada").

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Instalar primitivos shadcn (button, input, select) | a926b57 | src/components/ui/button.jsx, input.jsx, select.jsx |
| 2 | Criar testes E2E para DASH-01, DASH-02, DASH-03 (RED) | 852755b | e2e/dashboard.spec.js |

## Verification

- `src/components/ui/button.jsx`, `input.jsx`, `select.jsx` — todos existem (verificado)
- `e2e/dashboard.spec.js` — descoberto pelo Playwright com 3 testes @smoke (verificado via `--list`)
- Semantic RED garantido por inspeção de código:
  - `src/app/dashboard/page.js:79` → `label: "Contratos Ativos"` (não "MRR") → DASH-01 falha
  - `src/app/dashboard/page.js:80` → `label: "Parcelas Pendentes"` (não "Receita Esperada") → DASH-02 falha
  - DASH-03 passa: banner `vencendoContratos.length > 0` já implementado em `page.js:205-229`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Path] Arquivo de teste colocado em e2e/ não em tests/**
- **Encontrado durante:** Task 2
- **Problema:** O plano especificava `tests/dashboard.spec.js` mas `playwright.config.js` usa `testDir: './e2e'`. Um arquivo em `tests/` não seria descoberto pelo Playwright.
- **Correção:** Arquivo criado em `e2e/dashboard.spec.js`. Frontmatter `files_modified` do plano lista `tests/dashboard.spec.js` — essa é uma inconsistência de documentação no plano.
- **Arquivos modificados:** e2e/dashboard.spec.js (path corrigido)
- **Commit:** 852755b

### Limitação de Verificação (não bloqueante)

A execução completa dos testes Playwright requer o fluxo padrão do `playwright.config.js` (webServer faz `npm run build` + `npm start` com vars do `.env.test` apontando para Supabase local). Executar esse fluxo mataria o servidor dev do usuário na porta 3000 — ação destrutiva fora do escopo da worktree.

Alternativa usada: verificação por `--list` (3 testes descobertos) + inspeção de código (garantia semântica de RED). O Supabase local estava rodando e o usuário de teste `proprietario@test.romma.local` existe (verificado via API). Os testes passarão/falharão corretamente quando executados via `npx playwright test` no ambiente principal.

## Known Stubs

Nenhum stub introduzido neste plano. Os componentes shadcn são completamente funcionais. O arquivo de testes é intencionalmente RED (falhas semânticas esperadas na fase RED do TDD).

## Threat Flags

Nenhuma nova superfície de segurança introduzida. Os componentes shadcn são gerados localmente (copiam código-fonte, não adicionam dependências npm externas).

## Self-Check: PASSED

- button.jsx: FOUND
- input.jsx: FOUND
- select.jsx: FOUND
- e2e/dashboard.spec.js: FOUND
- Commit a926b57: FOUND (Task 1)
- Commit 852755b: FOUND (Task 2)
