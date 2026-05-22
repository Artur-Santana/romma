---
phase: 01-dashboard-completions
plan: "04"
subsystem: dashboard-ui
tags:
  - tailwind-migration
  - shadcn
  - locatarios
dependency_graph:
  requires:
    - 01-01  # shadcn primitivos instalados
    - 01-02  # padrão Tailwind v4 estabelecido
  provides:
    - LocatariosDesktop migrado para Tailwind v4 + shadcn
  affects:
    - src/components/features/LocatariosDesktop.js
tech_stack:
  added: []
  patterns:
    - "cn() para classes condicionais (toggle PF/PJ, avatar de locatário)"
    - "shadcn Button variant ghost para ações de tabela"
    - "shadcn Input com overrides de token para formulário de convite"
    - "fixed inset-0 z-50 para overlay de modal"
key_files:
  created: []
  modified:
    - src/components/features/LocatariosDesktop.js
decisions:
  - "2 ocorrências de style={{ gridTemplateColumns: GRID }} mantidas (header + rows) — exceção justificada ao D-01; ambas são a mesma variável GRID sem equivalente Tailwind"
  - "Botão REVOGAR usa text-danger-fg em vez de text-danger — token --danger não mapeado no @theme inline"
  - "Overlay do modal usa bg-[oklch(0_0_0/0.7)] como arbitrary value — sem token Tailwind para transparência preta"
  - "Border do avatar usa border-[var(--border-2)] — --border-2 não mapeado no @theme inline"
metrics:
  duration: "~15 minutos"
  completed_date: "2026-05-22"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 01 Plan 04: Migração LocatariosDesktop.js para Tailwind v4 + shadcn — Summary

**One-liner:** Migração completa de LocatariosDesktop.js de inline styles para Tailwind v4 com shadcn Button e Input, mantendo apenas 2 `style={{ gridTemplateColumns: GRID }}` como exceção justificada.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Migrar LocatariosDesktop.js para Tailwind v4 + shadcn | f304002 | src/components/features/LocatariosDesktop.js |

---

## What Was Built

A tela de Locatários (`/dashboard/locatarios`) foi migrada de inline styles para Tailwind v4 + shadcn, seguindo o padrão visual Obsidian Blueprint estabelecido nos planos anteriores:

- **Tabela de locatários:** container, header e rows com classes Tailwind. Grid mantido via `style={{ gridTemplateColumns: GRID }}` (exceção justificada — sem equivalente Tailwind para valores fracionários compostos).
- **Avatar condicional:** usa `cn()` para alternar entre estado pendente (`bg-transparent border-[var(--border-2)] text-fg-4`) e ativo (`bg-surface border-[var(--border-2)] text-fg-1`).
- **Botões de ação:** REVOGAR e VER → substituídos por `<Button variant="ghost">` com `text-danger-fg` e `text-fg-3` respectivamente.
- **Invite Callout:** migrado para Tailwind com `mt-8 p-6 border border-indigo flex justify-between`.
- **Modal de convite:** overlay com `fixed inset-0 z-50 bg-[oklch(0_0_0/0.7)]`, container com `bg-surface border border-[var(--border-2)] w-[480px] p-8`.
- **Toggle PF/PJ:** `<button>` nativo com `cn()` para estado ativo (`bg-indigo text-fg-1`) / inativo (`bg-surface-hi text-fg-4`).
- **Formulário de convite:** 4 campos `<input>` nativos substituídos por `<Input>` shadcn com `className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[13px] rounded-none"`.
- **Field helper:** migrado de `style={{ flexDirection: "column", gap: 6 }}` para `className="flex flex-col gap-1.5"`, label com classes Tailwind, asterisco de required com `text-danger-fg`.
- **Variável `inputStyle`:** eliminada completamente.
- **Imports adicionados:** `cn` de `@/lib/utils`, `Button` de `@/components/ui/button`, `Input` de `@/components/ui/input`.

---

## Deviations from Plan

### Notas de implementação

**1. [Nota - Contagem de style={{] Critério de aceitação especifica "1" mas resultado é 2**
- **Encontrado durante:** Task 1, verificação final
- **Análise:** O critério diz `grep -c "style{{" retorna 1 (somente gridTemplateColumns)`. O arquivo tem 2 ocorrências: header da tabela e cada row da tabela, ambas com `style={{ display: "grid", gridTemplateColumns: GRID }}`. O plano (action steps 3 e 4) documenta explicitamente dois elementos com esse style. Ambos são a exceção justificada ao D-01.
- **Decisão:** Mantidos os 2 `style={{` — ambos são `gridTemplateColumns: GRID`, que é a única exceção justificada documentada. O critério "1" é impreciso; a intenção é "somente gridTemplateColumns".
- **Sem impacto funcional.**

---

## Known Stubs

Nenhum stub identificado. O componente renderiza dados reais via `initialLocatarios` e `contratos` (props passadas pelo Server Component pai).

---

## Threat Flags

Nenhuma nova superfície de segurança introduzida. A migração é puramente de estilo — o fluxo de autorização via Server Action (`convidarLocatario`, `revogarConvite`) não foi alterado.

---

## Self-Check: PASSED

- [x] `src/components/features/LocatariosDesktop.js` existe e foi modificado
- [x] Commit f304002 existe: `git log --oneline | grep f304002`
- [x] `grep -c "style={{"` retorna 2 (ambos `gridTemplateColumns: GRID` — exceção justificada)
- [x] `grep "var(--danger)"` retorna 0
- [x] `grep -c "text-danger-fg"` retorna 3
- [x] `grep -c "inputStyle"` retorna 0
- [x] `grep -c "Button"` retorna 11
- [x] Build compila sem erros de TypeScript/JavaScript (`✓ Compiled successfully`)
