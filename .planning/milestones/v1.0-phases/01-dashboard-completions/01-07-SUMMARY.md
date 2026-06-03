---
phase: 01-dashboard-completions
plan: "07"
subsystem: dashboard-ui
tags: [tailwind-migration, ui-shell, realtime-dot, top-strip, page-header]
dependency_graph:
  requires: [01-05, 01-06]
  provides: [ui-shell-migrated-tailwind]
  affects:
    - src/components/ui/RealtimeDot.js
    - src/components/ui/TopStrip.js
    - src/components/ui/PageHeader.js
tech_stack:
  added: []
  patterns: [arbitrary-value-tailwind, cn()-conditional-classes, all-unset-exception]
key_files:
  created: []
  modified:
    - src/components/ui/RealtimeDot.js
    - src/components/ui/TopStrip.js
    - src/components/ui/PageHeader.js
decisions:
  - "RealtimeDot animation via Tailwind arbitrary value [animation:rommaPulse_2s_ease-in-out_infinite] — preserva @keyframes definido em globals.css sem inline style"
  - "TopStrip bg-[oklch(0.218_0_0/0.95)] — arbitrary value necessário para cor semitransparente sem token CSS var"
  - "PageHeader button CTA mantém style={{ all: 'unset' }} como única exceção documentada — Tailwind não possui equivalente direto para CSS all reset"
  - "StatusBadge.js excluído: config.fg/config.bg computados em runtime impossibilitam mapeamento estático para classes Tailwind"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-22T13:53:01Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 3
---

# Phase 01 Plan 07: UI Shell Components Tailwind v4 Migration Summary

Migração dos três componentes de UI shell (RealtimeDot, TopStrip, PageHeader) de inline styles para Tailwind v4 — completando a cobertura D-06 para todos os componentes de shell do dashboard. StatusBadge mantém inline styles com justificativa técnica documentada.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Migrar RealtimeDot.js e TopStrip.js para Tailwind v4 | 99e5d1d | RealtimeDot.js, TopStrip.js |
| 2 | Migrar PageHeader.js para Tailwind v4 | 154e6ca | PageHeader.js |

## Acceptance Criteria Verification

| Criterion | Result |
|-----------|--------|
| `grep -c "style={{"` RealtimeDot.js | 0 ✓ |
| `grep -c "style={{"` TopStrip.js | 0 ✓ |
| `grep -c "style={{"` PageHeader.js | 1 (all:unset — exceção documentada) ✓ |
| `npm run build` | Success (exit 0) ✓ |

## Decisions Made

1. **RealtimeDot animation arbitrary value** — `animation: "rommaPulse 2s ease-in-out infinite"` migrado para `[animation:rommaPulse_2s_ease-in-out_infinite]` como Tailwind arbitrary value. O `@keyframes rommaPulse` permanece em `globals.css` sem alteração — apenas a referência à animação foi movida para className.

2. **TopStrip bg-[oklch(...)]** — A cor de fundo `oklch(0.218 0 0 / 0.95)` não possui token CSS var correspondente no projeto (diferente de `--surface`). Usada como arbitrary value `bg-[oklch(0.218_0_0/0.95)]` — espaços substituídos por underscore conforme sintaxe Tailwind v4.

3. **PageHeader all:unset exception** — O `<button>` CTA requer `all: "unset"` para remover todos os estilos nativos do browser. Tailwind não possui utilitário equivalente. Mantido como `style={{ all: "unset" }}` (1 ocorrência) — dentro do limite aceito pelo plano (≤1). Todos os demais estilos do botão migrados para className.

4. **cn() import adicionado** — RealtimeDot.js e PageHeader.js receberam `import { cn } from "@/lib/utils"` conforme especificado no plano.

## Exceção D-06 Documentada: StatusBadge.js

**StatusBadge.js mantém inline styles** — exceção técnica justificada para o critério D-06:

- `StatusBadge` usa `config.fg` e `config.bg` computados dinamicamente a partir de `STATUS_MAP`
- Valores são expressões CSS interpoladas em runtime, ex: `"oklch(from var(--success) l c h / 0.12)"`
- Esses valores não têm equivalente como classes Tailwind estáticas — a interpolação `oklch(from var(...) l c h / alpha)` requer avaliação em runtime que Tailwind não pode pré-compilar
- Alternativa (refatorar STATUS_MAP para usar classes Tailwind por status) está fora do escopo desta fase
- StatusBadge **MANTÉM inline styles** até que uma refatoração do mapa de cores seja planejada explicitamente

## Deviations from Plan

None — plano executado exatamente como escrito.

## Threat Flags

None. Migração de estilo pura — nenhuma nova superfície de rede, auth, schema ou boundary de confiança introduzida. Comportamento dos componentes preservado.

## Self-Check: PASSED

- [x] `src/components/ui/RealtimeDot.js` exists in worktree
- [x] `src/components/ui/TopStrip.js` exists in worktree
- [x] `src/components/ui/PageHeader.js` exists in worktree
- [x] Commit `99e5d1d` exists in git log
- [x] Commit `154e6ca` exists in git log
- [x] `npm run build` passed (exit code 0)
- [x] `grep -c "style={{"` RealtimeDot.js = 0
- [x] `grep -c "style={{"` TopStrip.js = 0
- [x] `grep -c "style={{"` PageHeader.js = 1 (all:unset — dentro do limite aceitável)
