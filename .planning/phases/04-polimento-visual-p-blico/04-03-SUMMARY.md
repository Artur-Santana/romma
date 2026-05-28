---
phase: 04-polimento-visual-publico
plan: "03"
subsystem: dashboard/unidades
tags: [shadcn, tailwind-v4, crud, design-system, unidade-card]
dependency_graph:
  requires: []
  provides: [UnidadeCard-visual-completo]
  affects: [src/components/features/Unidades.js]
tech_stack:
  added: []
  patterns: [shadcn-Input, shadcn-Select, shadcn-Button, StatusBadge, fmtBRL, objeto-unico-formEdit]
key_files:
  created: []
  modified:
    - src/components/ui/UnidadeCard.js
    - src/components/features/Unidades.js
decisions:
  - "D-08 Opção A: interface simplificada para objeto único { formEdit, onEditar, onSalvar, onDeletar, onFormChange, onCancelar, erro } — elimina 14 props individuais no call site"
  - "valor_visivel excluído do modo edição seguindo must_have literalmente (5 campos: nome, descrição, área, valor, status)"
  - "onCancelar adicionado como prop explícita para manter abstração limpa (não expor setEditandoId diretamente)"
metrics:
  duration_minutes: 8
  completed_date: "2026-05-27T23:28:05Z"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 2
---

# Phase 04 Plan 03: UnidadeCard Rewrite Summary

**One-liner:** UnidadeCard reescrito com Tailwind v4 + shadcn — modo leitura com eyebrow UN-XXXXXX, StatusBadge, fmtBRL e modo edição inline com Input/Select/Button via objeto único de props.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Reescrever UnidadeCard.js com modo leitura e modo edição inline | dbd04d1 | src/components/ui/UnidadeCard.js, src/components/features/Unidades.js |

---

## What Was Built

### UnidadeCard.js (rewrite completo)

**Modo leitura** — exibe por unidade:
- Eyebrow `UN-XXXXXX` em `font-mono text-[9px] text-fg-5 tracking-[0.8px] uppercase`
- Nome em `font-display font-bold text-[18px] tracking-[-0.6px] text-fg-1`
- Descrição truncada (se presente)
- Área em m², valor via `fmtBRL()` (ou "Valor sob consulta" quando `valor_visivel=false`), `StatusBadge`
- Botões `Button variant="ghost" size="sm"`: "Editar" (`text-fg-3`) e "Remover" (`text-danger-fg`)
- "Remover" dispara `onDeletar(unidade.id)` diretamente (sem confirmation dialog — UI-SPEC)

**Modo edição** — ativo quando `editandoId === unidade.id`:
- shadcn `Input` para nome, descrição, área (number), valor (number)
- shadcn `Select` para status com opções "Disponível" / "Alugada"
- Todos os inputs: `className="h-9 rounded-none border-border-3 bg-surface text-fg-1"`
- Erro exibido em `font-mono text-[11px] text-danger-fg` abaixo do form
- `Button variant="default"` "Salvar" + `Button variant="ghost"` "Cancelar"

### Unidades.js (call site atualizado)

A chamada de `UnidadeCard` foi simplificada de 14 props individuais para objeto único seguindo Opção A (D-08).

---

## Decisions Made

1. **D-08 Opção A (objeto único):** `Unidades.js` já tinha `formEdit` como estado de objeto — faz sentido passar diretamente em vez de desagrupar em 14 props. Call site atualizado sem quebrar comportamento.

2. **`onCancelar` explícita:** A prop `onCancelar` foi adicionada (não estava no plano original) para manter abstração limpa. O parent decide o que acontece no cancel (reset do form + setEditandoId null) sem expor setters internos.

3. **`valor_visivel` fora do modo edição:** O must_have lista explicitamente 5 campos (nome, descrição, área, valor, status). O campo `valor_visivel` existia no skeleton original mas foi omitido no modo edição seguindo o must_have literalmente. O valor é preservado no `formEdit` do parent (não é zerado em edições), portanto a funcionalidade não é perdida — apenas não é editável no inline form.

---

## Deviations from Plan

### Auto-added functionality

**1. [Rule 2 - Missing critical prop] Adicionado `onCancelar` à interface de props**
- **Found during:** Task 1 — análise da Opção A
- **Issue:** A Opção A do plano propunha `{ unidade, editandoId, formEdit, onEditar, onSalvar, onDeletar, onFormChange }` sem prop de cancel. Expor `setEditandoId` quebraria a abstração; reusar `onEditar(null)` seria semanticamente incorreto.
- **Fix:** Prop `onCancelar` adicionada; parent passa `() => { setEditandoId(null); resetFormEdit() }`
- **Files modified:** UnidadeCard.js, Unidades.js
- **Commit:** dbd04d1

---

## Known Stubs

Nenhum stub identificado. Todos os dados são renderizados a partir de props reais passadas pelo parent `Unidades.js`.

---

## Threat Flags

Nenhuma nova superfície de segurança introduzida. `UnidadeCard` é um componente de apresentação puro — mutations passam pelo Server Action `editarUnidade` no parent.

---

## Self-Check: PASSED

- [x] `src/components/ui/UnidadeCard.js` existe e exporta `default UnidadeCard`
- [x] `src/components/features/Unidades.js` atualizado com nova interface de props
- [x] Commit dbd04d1 existe: `git log --oneline | head -3`
- [x] Zero inline styles de layout (grep retornou 0)
- [x] Todos os imports shadcn presentes (button, input, select)
- [x] StatusBadge e fmtBRL importados
- [x] `npm run lint` — 0 erros (8 warnings pré-existentes em page.js, sem relação)
- [x] D-08 documentado com comentário no código
- [x] JetBrains Mono ausente do arquivo
