---
phase: 12-escala-desktop-tema
plan: "01"
subsystem: ui/theme
tags: [theme-system, desktop-layout, dev-tooling, e2e]
dependency_graph:
  requires: []
  provides: [ThemeToggle, max-width-1320px, data-theme-pumpkin, data-theme-deep-olive]
  affects: [src/app/dashboard/layout.js, src/app/globals.css, e2e/tema.spec.js]
tech_stack:
  added: []
  patterns: [data-theme-css-vars, NODE_ENV-gate, fixed-position-dev-tool]
key_files:
  created:
    - src/components/ui/ThemeToggle.js
    - e2e/tema.spec.js
  modified:
    - src/app/dashboard/layout.js
    - src/app/globals.css
decisions:
  - ThemeToggle gateado por process.env.NODE_ENV === 'development' no Server Component do layout — bundle não enviado em produção
  - max-width 1320px escolhido dentro do range 1200-1400px especificado em D-06
  - Todas as 4 paletas candidatas implementadas (pumpkin, deep-olive, ultra-violet, cloudy-sky) para facilitar escolha do proprietário
  - ultra-violet e cloudy-sky incluídas como paletas claras (exigirão override adicional de tokens hardcoded para uso pleno)
metrics:
  duration: "~8 minutos"
  completed: "2026-06-11T21:46:00Z"
  tasks_completed: 4
  tasks_total: 5
  files_changed: 4
---

# Phase 12 Plan 01: Fundação do Sistema de Temas e Contenção Desktop — Summary

**One-liner:** ThemeToggle dev-only cicla 4 paletas via data-theme setAttribute; dashboard centralizado em max-width 1320px; smoke test T-12-01 codifica ausência do toggle em produção.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Criar ThemeToggle.js Client Component dev-only | `12fbb3d` | src/components/ui/ThemeToggle.js (novo) |
| 2 | Wirear ThemeToggle + max-width wrapper no dashboard/layout | `9865d2e` | src/app/dashboard/layout.js |
| 3 | Adicionar blocos data-theme de paletas escuras em globals.css | `72562da` | src/app/globals.css |
| 4 | Smoke test E2E — ThemeToggle ausente em produção | `c475b58` | e2e/tema.spec.js (novo) |
| 5 | Verificação visual — max-width + paletas escuras | PENDENTE | Requer verificação humana |

---

## Task 5: Pendente — Verificação Visual Humana

**Status:** Aguardando aprovação humana (checkpoint:human-verify)

### Como verificar

1. Rodar `npm run dev` e abrir o dashboard autenticado em viewport >= 1280px (idealmente 1440px ou DevTools responsive a 1440px).
2. Confirmar que o conteúdo NÃO estica até as bordas — fica contido a ~1320px e centralizado (espaço igual nas laterais com sidebar aberta).
3. Localizar o botão "DEV: Tema — Obsidian" no canto inferior direito. Clicar e ciclar até "Pumpkin": background do dashboard deve virar charcoal azulado e o accent virar laranja.
4. Clicar novamente até "Deep Olive": background verde-escuro, accent/sage.
5. Abrir DevTools → Elements → `<html>` e confirmar que `data-theme` muda a cada clique.

**Resume signal:** "approved" se max-width e ambas as paletas escuras funcionam, ou descrição do que quebrou.

---

## Deviations from Plan

### Adições além do escopo mínimo

**1. [Rule 2 - Missing Feature] Paletas ultra-violet e cloudy-sky adicionadas**
- **Found during:** Task 3
- **Issue:** O plano especificava apenas pumpkin e deep-olive como obrigatórias; D-01 do CONTEXT.md lista todas as 4 como candidatas a testar
- **Fix:** Adicionados blocos `[data-theme="ultra-violet"]` e `[data-theme="cloudy-sky"]` no globals.css. ThemeToggle já inclui todas as 4 no array THEMES
- **Nota:** Paletas claras (ultra-violet, cloudy-sky) terão aparência parcialmente correta — tokens hardcoded como `--fg-1: oklch(1 0 0)` (branco) não são sobrescritos, o que pode causar conflito em background claro. Documentado para a equipe

---

## Known Stubs

Nenhum stub detectado. Todos os quatro arquivos implementam funcionalidade real.

---

## Threat Flags

Nenhuma nova superfície de segurança introduzida além do que o plano antecipava.

| Flag | File | Description |
|------|------|-------------|
| T-12-01 (mitigated) | src/app/dashboard/layout.js | Gate NODE_ENV impede bundle do ThemeToggle em produção; smoke test assere ausência |

---

## Verification Notes

- **UX-01 (parcial):** max-width 1320px implementado — verificação visual na Task 5 (pendente)
- **THEME-01:** mecanismo `[data-theme]` + ThemeToggle implementado — verificação visual na Task 5 (pendente)
- **THEME-02 (parcial):** pumpkin e deep-olive disponíveis — verificação visual na Task 5 (pendente)
- **T-12-01:** gate NODE_ENV implementado; smoke test presente (validação contra `next build && next start` adiada — node_modules ausente no worktree)
- **playwright --list:** não executado (node_modules ausente no worktree de execução paralela) — teste verificado por grep e parse Node.js

## Self-Check

- [x] `src/components/ui/ThemeToggle.js` existe com `"use client"`, `data-testid="theme-toggle"`, `setAttribute("data-theme"`
- [x] `src/app/dashboard/layout.js` contém `import ThemeToggle`, `maxWidth: "1320px"`, `process.env.NODE_ENV === "development"`
- [x] `src/app/globals.css` contém `[data-theme="pumpkin"]` e `[data-theme="deep-olive"]` após fechamento do `.dark`
- [x] `e2e/tema.spec.js` contém `test.describe("tema"` e `[data-testid="theme-toggle"]`
- [x] 4 commits individuais por task
- [x] Task 5 documentada como pendente com passos de verificação

## Self-Check: PASSED
