---
phase: 12-escala-desktop-tema
plan: "06"
subsystem: ui/theme
tags: [theme, D-02, THEME-02, ThemeToggle, cleanup, fix]
dependency_graph:
  requires: [12-05]
  provides: [THEME-02-complete, D-02-hardcoded]
  affects: []
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified:
    - src/app/dashboard/layout.js
    - e2e/tema.spec.js
    - src/app/dashboard/page.js
    - src/components/features/LocatariosDesktop.js
  deleted:
    - src/components/ui/ThemeToggle.js
decisions:
  - "D-02 hardcoded: ThemeToggle removido permanentemente; Obsidian = :root base sem data-theme"
  - "FIX-01-A e FIX-01-B resolvidos: textos 13px de body text elevados para 14px (piso desktop)"
metrics:
  duration_minutes: 20
  completed_date: "2026-06-12T00:00:00Z"
  tasks_completed: 2
  files_changed: 4
---

# Phase 12 Plan 06: Hardcodar Obsidian + Remover ThemeToggle — Summary

**One-liner:** ThemeToggle removido permanentemente (D-02 hardcoded); Obsidian Blueprint como unico tema via :root base sem data-theme; FIX-01-A/B corrigidos (13px -> 14px).

---

## Contexto

Decisao D-02 (plano 12-05): Obsidian e a paleta vencedora e o padrao :root sem data-theme. "Hardcodar Obsidian" significa:
1. Nenhum `data-theme` aplicado ao DOM em nenhuma circunstancia
2. ThemeToggle removido — proposito de teste de paleta encerrado

### Mecanismo de tema pre-execucao

Auditoria do mecanismo antes de editar revelou:
- ThemeToggle usava apenas estado React local (`useState`) — sem persistencia em localStorage
- Nenhum bootstrap script no root layout aplicava `data-theme`
- ThemeToggle ja estava gateado por `process.env.NODE_ENV === "development"` — producao ja era Obsidian
- Conclusao: remocao do toggle e a unica acao necessaria para hardcodar Obsidian

---

## Task 1 — Remover ThemeToggle

**Arquivos modificados:**
- `src/app/dashboard/layout.js` — removida importacao e JSX `{process.env.NODE_ENV === "development" && <ThemeToggle />}`
- `src/components/ui/ThemeToggle.js` — arquivo deletado (dev-only, proposito encerrado)
- `e2e/tema.spec.js` — atualizado: testa ausencia do toggle em qualquer ambiente + data-theme vazio no `<html>`

**Commit:** `4e529b6`

---

## Task 2 — FIX-01-A e FIX-01-B (textos 13px de body text)

Aproveitamento oportunistico dos achados de FIX-01 da auditoria AUDIT-01 (12-05-SUMMARY).

| Fix | Arquivo | Elemento | Antes | Depois |
|-----|---------|----------|-------|--------|
| FIX-01-A | `src/app/dashboard/page.js:203` | Banner de vencimento de contratos | 13px | 14px |
| FIX-01-B | `src/components/features/LocatariosDesktop.js:206` | Descricao callout "Fluxo de Convite" | 13px | 14px |

**Casos 13px mantidos (EXEMPT ou mobile):**
- `page.js:43` — `font-mono` erro state label — EXEMPT (label mono operacional)
- `page.js:144` — `text-fg-3` dentro de `romma-mobile-pane` — escopo mobile, fora da auditoria desktop
- `page.js:402` — nome locatario em painel mobile — escopo mobile
- `LocatariosDesktop.js:303,400` — botoes CTA `uppercase tracking-[1.2px]` — EXEMPT

**Commit:** `689b34c`

---

## Verificacao do Estado Final

### data-theme no DOM

| Cenario | Estado |
|---------|--------|
| Producao (Vercel) | Nenhum data-theme aplicado — Obsidian :root base |
| Desenvolvimento (npm run dev) | Nenhum data-theme aplicado — ThemeToggle removido |
| localStorage | Nunca foi usado pelo ThemeToggle (useState apenas) |

### Obsidian = :root

A paleta Obsidian esta definida diretamente em `:root` em `src/app/globals.css` — sem nenhum seletor `[data-theme]`. E a paleta base que sempre carrega independente de qualquer atributo.

---

## Deviations from Plan

### PLAN.md ausente

**Situacao:** O arquivo `12-06-PLAN.md` nao existe no diretorio `.planning/phases/12-escala-desktop-tema/`. Nenhum plano foi gerado pelo orquestrador antes da execucao.
**Resolucao:** Escopo reconstruido a partir do prompt de execucao (`<context>`, `<success_criteria>`) + D-02 registrada em 12-05-SUMMARY.md.

### Worktree sem commits da fase 12

**Situacao:** O worktree foi criado com base em Phase 11 (commit `92d9ad6`). Os commits de 12-01 a 12-05 existiam no branch `gsd/phase-12-escala-desktop-tema` mas nao no worktree.
**Resolucao:** `git merge gsd/phase-12-escala-desktop-tema` — fast-forward limpo. Todos os commits preservados.

---

## Known Stubs

Nenhum — mudancas sao remocao de codigo dev-only e ajuste de tamanhos de fonte.

---

## Threat Flags

Nenhuma — remocao de componente dev-only e correcoes de tipografia nao introduzem superficie de seguranca.

---

## Self-Check

- [x] `src/app/dashboard/layout.js` — ThemeToggle removido (importacao + JSX)
- [x] `src/components/ui/ThemeToggle.js` — deletado via `git rm`
- [x] `e2e/tema.spec.js` — atualizado para testar ausencia do toggle + data-theme vazio
- [x] `src/app/dashboard/page.js:203` — FIX-01-A: 13px -> 14px
- [x] `src/components/features/LocatariosDesktop.js:206` — FIX-01-B: 13px -> 14px
- [x] Commit `4e529b6` existe (Task 1)
- [x] Commit `689b34c` existe (Task 2)
- [x] Nenhum data-theme aplicado via JS em nenhum ponto da codebase

## Self-Check: PASSED
