---
phase: 09-paginas-publicas
plan: "01"
subsystem: e2e
tags: [e2e, playwright, tdd, red-phase, public-pages]
dependency_graph:
  requires: []
  provides: [e2e/public-pages.spec.js]
  affects: [e2e/]
tech_stack:
  added: []
  patterns: [page.route mock, getBoundingClientRect tap-target assert, browser.newContext viewport]
key_files:
  created:
    - e2e/public-pages.spec.js
  modified: []
decisions:
  - "Escrita atômica do arquivo (Tasks 1+2 em um único commit) — conteúdo de ambas as tasks estava disponível na fase de planejamento via PATTERNS.md; duas commits separadas teriam requerido remoção/re-adição artificial do mesmo arquivo"
  - "Verificação --list executada via config temporário dentro do main repo (não worktree) — worktree não tem node_modules; config deletado após verificação"
  - "RED confirmado por inspeção estrutural: LP-01/02/03 buscam labels/roles que não existem; PUB-03 testa dimensões que estão abaixo de 44px nos arquivos fonte atuais"
metrics:
  duration: "~6 min"
  completed: "2026-06-06T22:43:09Z"
  tasks_completed: 2
  files_created: 1
  files_modified: 0
---

# Phase 09 Plan 01: Criar Suite E2E public-pages Summary

Suite E2E `e2e/public-pages.spec.js` criada com 11 cenários RED/GREEN cobrindo os 6 requisitos LP-01, LP-02, LP-03, PUB-01, PUB-02, PUB-03 das páginas públicas.

## What Was Built

Arquivo `e2e/public-pages.spec.js` com 6 `test.describe` por req-id:

| Grupo | Cenários | Status esperado agora |
|-------|----------|----------------------|
| LP-01 | Link "VER UNIDADES" navega para /unidades | RED (label atual: "VER PROJETOS") |
| LP-02 | Link "ACESSAR DASHBOARD" navega para /login | RED (é `<button>` sem href) |
| LP-03 | "ACESSAR PAINEL" e "COMEÇAR AGORA" são links /login | RED (são `<button>`) |
| PUB-01 | "Consulte o Proprietário" via mock; badge "Disponível" seed real | RED / GREEN |
| PUB-02 | Empty state via mock `[]` | GREEN (já implementado) |
| PUB-03 | Overflow 375px + 3 tap targets ≥44px | RED (tab py-2≈30px, ✕ 32×32px) |

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | LP-01/LP-02/LP-03/PUB-01 | 8e9e5da | e2e/public-pages.spec.js |
| 2 | PUB-02/PUB-03 (mesmo commit) | 8e9e5da | e2e/public-pages.spec.js |

## Verification

Executado `--list` com config temporário apontando para o worktree's e2e dir:

```
  [chromium] › public-pages.spec.js › LP-01 — clicar "VER UNIDADES"...
  [chromium] › public-pages.spec.js › LP-02 — "ACESSAR DASHBOARD"...
  [chromium] › public-pages.spec.js › LP-03 — link "ACESSAR PAINEL"...
  [chromium] › public-pages.spec.js › LP-03 — "COMEÇAR AGORA"...
  [chromium] › public-pages.spec.js › PUB-01 — "Consulte o Proprietário"...
  [chromium] › public-pages.spec.js › PUB-01 — badge "Disponível"...
  [chromium] › public-pages.spec.js › PUB-02 — "Nenhuma unidade disponível"...
  [chromium] › public-pages.spec.js › PUB-03 — sem overflow horizontal...
  [chromium] › public-pages.spec.js › PUB-03 — tab button "Todos"...
  [chromium] › public-pages.spec.js › PUB-03 — link "← Voltar"...
  [chromium] › public-pages.spec.js › PUB-03 — botão ✕ do sheet...
```

Total: 11 testes, todos 6 req-ids cobertos.

**RED confirmado por inspeção estrutural** (sem servidor disponível no worktree):
- LP-01: `page.js` linha 48 tem `VER PROJETOS` — teste busca `VER UNIDADES` → FAIL
- LP-02: `page.js` linha 44 tem `<button>` sem href — `getByRole('link')` → FAIL
- LP-03: `page.js` linha 146 tem `<button>` "ACESSE ANALITYCS" — teste busca link "ACESSAR PAINEL" → FAIL; `Header.js` tem `<button>` "COMEÇAR AGORA" sem href → FAIL
- PUB-03 tab: `UnidadesPublicas.js` linha 100 tem `py-2` ≈ 30px — teste asserta ≥44px → FAIL
- PUB-03 sheet ✕: `UnidadeDetailSheet.js` linha 31 tem `width: 32, height: 32` → FAIL

## Deviations from Plan

### Auto-fixed Issues

None — plano executado exatamente conforme especificado.

### Process Deviation

**Escrita atômica (Tasks 1+2 em um commit)**

- **Encontrado durante:** Tasks 1 e 2
- **Issue:** PATTERNS.md fornecia o conteúdo de ambas as tasks completamente; escrever o arquivo em duas etapas teria requerido remoção artificial de linhas PUB-02/PUB-03 apenas para criar um commit intermediário
- **Decisão:** Criar o arquivo completo em uma etapa, documentar ambas as tasks no mesmo commit (8e9e5da)
- **Impacto:** Zero — acceptance criteria de ambas as tasks satisfeitas; nenhuma funcionalidade omitida

## Known Stubs

Nenhum. O arquivo de testes não tem stubs de dados — usa `page.route` mock para cenários que precisam de dados controlados.

## Threat Flags

Nenhuma superfície nova de segurança introduzida. Testes interceptam apenas chamadas REST com `page.route` dentro do contexto de teste — não mutam dados de produção.

## Self-Check

- [x] `e2e/public-pages.spec.js` existe: CONFIRMED
- [x] Commit 8e9e5da existe: CONFIRMED
- [x] --list lista LP-01, LP-02, LP-03, PUB-01, PUB-02, PUB-03: CONFIRMED (11 testes)
- [x] Arquivo tem 184 linhas (>= 90 min_lines do must_haves): CONFIRMED
- [x] `page.route` para "Consulte o Proprietário" presente: CONFIRMED (linha 68)
- [x] `getBoundingClientRect` presente: CONFIRMED (linhas 135, 148, 168)
- [x] Nenhum teste usa `login()`: CONFIRMED
- [x] Nenhum teste de navegação "← Voltar" (duplicaria BUG-04): CONFIRMED

## Self-Check: PASSED
