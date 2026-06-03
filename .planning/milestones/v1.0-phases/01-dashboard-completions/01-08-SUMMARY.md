---
phase: 01-dashboard-completions
plan: "08"
subsystem: dashboard-ui
tags: [tailwind-migration, ui-shell, confirm-dialog, mobile-nav, sidebar]
dependency_graph:
  requires: [01-05, 01-06]
  provides: [ui-shell-migrated-tailwind]
  affects:
    - src/components/ui/ConfirmDialog.js
    - src/components/ui/MobileNav.js
    - src/components/ui/OwnerSidebar.js
tech_stack:
  added: []
  patterns: [cn()-conditional-classes, hover-via-tailwind-prefix, arbitrary-value-tokens]
key_files:
  created: []
  modified:
    - src/components/ui/ConfirmDialog.js
    - src/components/ui/MobileNav.js
    - src/components/ui/OwnerSidebar.js
decisions:
  - "border-[var(--border-1)] e border-[var(--border-2)] usados como arbitrary values — tokens não mapeados no @theme inline"
  - "onMouseEnter/onMouseLeave removidos do OwnerSidebar — hover substituído por hover:bg-[oklch(0.265_0_0)] Tailwind"
  - "eyebrow--danger e eyebrow--indigo preservados como classes CSS globais — não são tokens Tailwind"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-22T14:00:00Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 3
---

# Phase 01 Plan 08: ConfirmDialog, MobileNav e OwnerSidebar Tailwind v4 Migration Summary

Migração completa dos três componentes UI shell de inline styles para Tailwind v4 — ConfirmDialog com cn() condicional para bordas danger/indigo, MobileNav (MobileTopBar + MobileBottomNav) com border-[var(--border-2)] e estados ativos via cn(), OwnerSidebar com hover Tailwind substituindo onMouseEnter/onMouseLeave.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Migrar ConfirmDialog.js para Tailwind v4 com cn() condicional | f8e3f9e | ConfirmDialog.js |
| 2 | Migrar MobileNav.js e OwnerSidebar.js para Tailwind v4 | fe0a793 | MobileNav.js, OwnerSidebar.js |

## Acceptance Criteria Verification

| Criterion | Result |
|-----------|--------|
| `grep -c "style={{"` ConfirmDialog.js | 0 ✓ |
| `grep -c "style={{"` MobileNav.js | 0 ✓ |
| `grep -c "style={{"` OwnerSidebar.js | 0 ✓ |
| `npm run build` | Success ✓ |
| import { cn } em todos os três arquivos | ✓ |

## Decisions Made

1. **Arbitrary values para border-1 e border-2** — `--color-border-1` e `--color-border-2` não estão mapeados no `@theme inline` (apenas `--color-border-3` está). Usados como `border-[var(--border-1)]` e `border-[var(--border-2)]` consistentemente.

2. **Remoção dos handlers onMouseEnter/onMouseLeave no OwnerSidebar** — o código original usava `e.currentTarget.style.background` diretamente para hover. Migrado para `hover:bg-[oklch(0.265_0_0)]` via Tailwind — elimina estilo imperativo, consistente com a abordagem declarativa do restante da migração.

3. **Preservação das classes CSS globais eyebrow** — `eyebrow`, `eyebrow--danger`, `eyebrow--indigo` são classes definidas em `globals.css`, não tokens Tailwind. Mantidas como template literals/strings de className sem alteração.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Completeness] eyebrow subtitle fontSize 9 em MobileNav**
- **Found during:** Task 2, verificação após escrita
- **Issue:** `style={{ fontSize: 9 }}` no span do subtitle do MobileTopBar resultaria em 1 ocorrência de `style={{` — critério exige 0
- **Fix:** Migrado para classe arbitrary `text-[9px]` junto ao `eyebrow eyebrow--indigo`
- **Files modified:** src/components/ui/MobileNav.js
- **Commit:** fe0a793

**2. [Rule 1 - Improvement] onMouseEnter/onMouseLeave substituídos por hover: Tailwind**
- **Found during:** Task 2, leitura de OwnerSidebar
- **Issue:** Handlers imperativos de hover (`e.currentTarget.style.background`) são incompatíveis com migração completa para Tailwind — deixariam estilo mutável no DOM
- **Fix:** Removidos os dois handlers, adicionado `hover:bg-[oklch(0.265_0_0)]` na classe do Link inativo
- **Commit:** fe0a793

## Threat Flags

None. Migração de estilo pura — nenhuma nova superfície de rede, auth ou schema introduzida. `supabase.auth.getUser()` e `supabase.auth.signOut()` no OwnerSidebar preservados sem alteração.

## Self-Check: PASSED

- [x] `src/components/ui/ConfirmDialog.js` existe no worktree
- [x] `src/components/ui/MobileNav.js` existe no worktree
- [x] `src/components/ui/OwnerSidebar.js` existe no worktree
- [x] Commit `f8e3f9e` existe no git log
- [x] Commit `fe0a793` existe no git log
- [x] `grep -c "style={{"` retorna 0 em todos os três arquivos
- [x] `npm run build` passou — sem erros
