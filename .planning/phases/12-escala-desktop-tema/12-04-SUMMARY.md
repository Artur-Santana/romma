---
phase: 12-escala-desktop-tema
plan: "04"
subsystem: ui/theme
tags: [theme-system, light-palette, css-vars, THEME-02]
dependency_graph:
  requires: [12-01]
  provides: [data-theme-ultra-violet-legivel, data-theme-cloudy-sky-legivel]
  affects: [src/app/globals.css]
tech_stack:
  added: []
  patterns: [data-theme-css-vars-light-palette, token-hardcode-override]
key_files:
  created: []
  modified:
    - src/app/globals.css
decisions:
  - "cascade propaga: sobrescrever --surface dentro de [data-theme] propaga para bg-surface via var(--surface) em @theme inline — Pitfall 4 confirmado resolvido"
  - "overrides de --foreground/--card-foreground/--muted-foreground/--popover-foreground necessarios em paletas claras (Pitfall 1)"
  - "--fg-1..5, --surface, --surface-hi, --border-1..3 sobrescritos por serem tokens hardcoded nao derivados de --ds-* (Pitfall 2)"
  - "cloudy-sky: --surface/--surface-hi em hue 240 para manter coerencia cromatica com bg azul"
  - "--ds-primary de ultra-violet: oklch(0.380 0.13 293) (RESEARCH Code Examples) vs oklch(0.480 0.160 301) (bloco original) — adotado o valor revisado do RESEARCH"
metrics:
  duration_minutes: 15
  completed_date: "2026-06-12T00:50:51Z"
  tasks_completed: 3
  files_changed: 1
---

# Phase 12 Plan 04: Paletas Claras — ultra-violet e cloudy-sky — Summary

**One-liner:** Blocos `[data-theme]` ultra-violet e cloudy-sky expandidos com overrides obrigatorios de tokens hardcoded — foreground escuro, surfaces claras, borders preto-alfa — eliminando texto branco invisivel e cards pretos em bg claro.

---

## What Was Built

Expandidos os dois blocos de paleta clara em `src/app/globals.css` que existiam apenas com os 5 `--ds-*` tokens (insuficientes para bg claro). Adicionados overrides obrigatorios em cada bloco cobrindo os tokens hardcoded que nao derivam da formula `--ds-background`.

### Mudancas por tarefa

**Task 1 (concluida — orquestrador):** Verificacao de cascade — resultado "propaga". `--surface` em `[data-theme]` propaga para `bg-surface` via `var(--surface)` em `@theme inline`.

**Task 2 — ultra-violet (commit ab1cf84):**
- `[data-theme="ultra-violet"]` expandido com overrides de paleta clara
- `--ds-background: oklch(0.975 0.025 97)` — lemon chiffon
- `--foreground/--card-foreground/--popover-foreground: oklch(0.10 0 0)` — quase preto
- `--muted-foreground: oklch(0.45 0 0)`
- `--fg-1..5`: escala de preto (0.10, 0.25, 0.40, 0.55, 0.70) — era branco puro
- `--surface: oklch(0.920 0.02 97)` / `--surface-hi: oklch(0.890 0.02 97)`
- `--border-1/2/3`: preto-alfa — era branco-alfa invisivel

**Task 3 — cloudy-sky (commit c2b6f61):**
- `[data-theme="cloudy-sky"]` expandido com mesma estrutura de overrides
- `--ds-background: oklch(0.880 0.03 240)` — #CBDDE9 azul claro
- `--foreground/--card-foreground/--popover-foreground: oklch(0.10 0 0)`
- `--muted-foreground: oklch(0.45 0 0)`
- `--fg-1..5`: escala de preto (0.10, 0.25, 0.40, 0.55, 0.70)
- `--surface: oklch(0.840 0.022 240)` / `--surface-hi: oklch(0.810 0.020 240)` — coerencia cromatica azul
- `--border-1/2/3`: preto-alfa

---

## Pitfalls Evitados

| Pitfall | Descricao | Como evitado |
|---------|-----------|--------------|
| Pitfall 1 | `--foreground: oklch(from ... calc(l+0.7))` clamba para branco em bg claro | Sobrescrita direta de `--foreground` e derivados com L=0.10 |
| Pitfall 2 | `--fg-1` hardcoded `oklch(1 0 0)` branco; `--surface` hardcoded quase preto | Override direto de `--fg-1..5`, `--surface`, `--surface-hi` em cada bloco |
| Pitfall 4 | `--color-surface` declarado duas vezes | Cascade confirmado: `var(--surface)` em `@theme inline` resolve o override — `--color-surface` nao precisa ser sobrescrito |

---

## Deviations from Plan

### Desvio de Setup: merge do branch gsd/phase-12-escala-desktop-tema

**Found during:** Setup inicial
**Issue:** O worktree foi criado com base em Phase 11 (sem commits de 12-01/02/03). Os blocos de paleta do 12-01 nao existiam no worktree.
**Fix:** `git merge gsd/phase-12-escala-desktop-tema --no-edit` — fast-forward limpo.
**Impacto:** Nenhum — todos os commits dos planos anteriores preservados.

### Ajuste de valor: --ds-primary de ultra-violet

**Issue:** Bloco original do 12-01 usava `oklch(0.480 0.160 301.0)`. RESEARCH Code Examples especificava `oklch(0.380 0.13 293)` como valor revisado para accent mais escuro e legivel em bg claro.
**Fix:** Adotado o valor do RESEARCH.

---

## Task 4 — Pendente (Checkpoint)

Task 4 e `checkpoint:human-verify`. Verificacao visual das paletas claras no browser.

---

## Known Stubs

Nenhum.

---

## Threat Flags

Nenhuma superficie de seguranca nova — mudancas sao puramente CSS/tokens.

---

## Self-Check: PASSED

- [x] `src/app/globals.css` contem `[data-theme="ultra-violet"]` com `--foreground: oklch(0.10 0 0)`
- [x] `src/app/globals.css` contem `[data-theme="cloudy-sky"]` com `--foreground: oklch(0.10 0 0)`
- [x] Commit ab1cf84 (ultra-violet) existe no log
- [x] Commit c2b6f61 (cloudy-sky) existe no log
- [x] Ambos os blocos definem `--fg-1`, `--surface`, `--surface-hi`, `--border-3`
- [x] `--ds-background` de ultra-violet L=0.975 (claro) e cloudy-sky L=0.880 (claro)
