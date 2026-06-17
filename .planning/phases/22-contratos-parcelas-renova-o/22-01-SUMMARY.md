---
phase: 22-contratos-parcelas-renova-o
plan: "01"
subsystem: contratos
tags: [cards, busca, filtro, countdown, progresso, arquivo, mobile-rows]
dependency_graph:
  requires: []
  provides: [CONTR-01, CONTR-02, CONTR-03, CONTR-04, CONTR-05]
  affects: [src/components/features/Contratos.js]
tech_stack:
  added: []
  patterns:
    - repeat(auto-fill, minmax(330px, 1fr)) grid para cards desktop
    - daysLeft/pctElapsed com T12:00:00 UTC-safe parsing
    - nameOf() client-side search helper
    - showArquivo toggle inline sem nova rota
key_files:
  created: []
  modified:
    - src/components/features/Contratos.js
decisions:
  - Cards 330px auto-fill no desktop, rows clicáveis no mobile (D-01, D-02)
  - isExpiring corrigido para T12:00:00 (Pitfall 4 UTC shift)
  - arquivo = contratos com status !== 'ativo' (encerrado + cancelado, D-07)
  - COL/COL_STYLE/HeaderCell removidos como órfãos
metrics:
  duration: "~18 min"
  completed: "2026-06-16"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 1
---

# Phase 22 Plan 01: Contratos — Cards Desktop + Busca + Arquivo Summary

Cards desktop com busca/filtro client-side, countdown T12:00:00, barra de progresso 4px e arquivo toggleável de encerrados+cancelados.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Adicionar state, helpers e listas derivadas de busca/filtro/arquivo | 5dad41c | Contratos.js |
| 2 | Substituir tabela por cards desktop + rows mobile + barra de busca/filtro | adc218c | Contratos.js |
| 3 | Ativar arquivo de encerrados (toggle inline) | 1544ce4 | Contratos.js |

## What Was Built

- **Barra de busca**: Input com ícone ⌕, filtra `nameOf(c)` (locatário + unidade) client-side.
- **Toggle Vencendo**: Botão com borda/fundo `--warning` quando ativo, mostra contagem `vencendoCount`.
- **Cards desktop** (`repeat(auto-fill, minmax(330px, 1fr))`): Cada card com borda `--warning` quando expirando, badge de status, nome do locatário (16px bold), unidade + edifício abreviado (font-mono 11px), countdown `daysLeft` dias → data_fim, barra de progresso 4px (`pctElapsed` 4%–100%), datas início→fim, valor mensal via `fmtBRL(uni?.valor_mensal)`, botões "Ver →", "Cancelar", "Encerrar".
- **Rows mobile**: Lista clicável com nome locatário, badge e unidade + datas, sem cards.
- **Archive toggle**: Botão inline substitui `<Button disabled>` — alterna `showArquivo`, mostra contagem. Lista expandida com eyebrow `eyebrow--indigo`, rows ARQ_NNN com opacidade 0.78, badge de status real (`encerrado`/`cancelado`), botão "Ver →".
- **Helpers UTC-safe**: `daysLeft`, `pctElapsed`, `nameOf` com `T12:00:00` para evitar erro de 1 dia por UTC shift. `isExpiring` também corrigido.
- **Formulário de novo contrato preservado intacto** (CONTR-03): valor da unidade selecionada continua visível.
- **ConfirmDialog/askCancelar/askEncerrar/confirmarCancelamento/confirmarEncerramento preservados** (CONTR-04).

## Deviations from Plan

### Auto-fixed Issues

Nenhum — plano executado exatamente como escrito.

### Changes from Plan Spec

- Animação `rFade` aplicada nos cards via CSS animation (existe em globals.css/app.css do design). Token `--dur-base` e `--rd-panel` referenciados com fallback inline (16px) para robustez.
- No arquivo expandido: StatusBadge usa `c.status` real (encerrado ou cancelado) em vez de forçar "encerrado" — alinhado com D-07 que inclui ambos.

## Known Stubs

Nenhum — todos os dados são derivados de `getContratos()` + `getUnidades()` + `getEdificios()` já carregados.

## Threat Flags

Nenhum — componente é client-only, sem novos endpoints ou auth paths.

## Self-Check: PASSED

- [x] src/components/features/Contratos.js existe e foi modificado
- [x] Commit 5dad41c existe (Task 1)
- [x] Commit adc218c existe (Task 2)
- [x] Commit 1544ce4 existe (Task 3)
- [x] `node_modules/.bin/next build` passa sem erros após Task 3
- [x] `repeat(auto-fill, minmax(330px, 1fr))` presente no arquivo
- [x] `daysLeft`, `pctElapsed`, `nameOf` com T12:00:00 no arquivo
- [x] Formulário de novo contrato preservado (linhas 207-317 originais)
