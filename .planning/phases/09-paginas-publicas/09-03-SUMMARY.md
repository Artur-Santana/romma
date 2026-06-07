---
phase: 09-paginas-publicas
plan: "03"
subsystem: public-pages
tags: [tap-target, copy, accessibility, PUB-01, PUB-02, PUB-03, D-05, D-06]
dependency_graph:
  requires: ["09-01"]
  provides: ["PUB-01", "PUB-02", "PUB-03"]
  affects: ["UnidadePublicaCard.js", "UnidadesPublicas.js", "UnidadeDetailSheet.js"]
tech_stack:
  added: []
  patterns: ["min-h-[44px] + minHeight inline cascade guarantee", "all:unset tap target fix"]
key_files:
  modified:
    - src/components/features/UnidadePublicaCard.js
    - src/components/features/UnidadesPublicas.js
    - src/components/features/UnidadeDetailSheet.js
decisions:
  - "Adicionado minHeight: 44 inline nos botões de ação do DetailSheet como garantia de cascata além da classe Tailwind min-h-[44px], conforme nota do plano"
  - "Tab button: combinação py-3 + min-h-[44px] (py-3 sozinho daria ~38-40px, ambas classes obrigatórias)"
metrics:
  duration: "~8 minutos"
  completed: "2026-06-06"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
---

# Phase 09 Plan 03: Copy D-05 e tap targets PUB-03 Summary

**One-liner:** Corrige fallback de preço ("Consulte o Proprietário") e garante tap targets >=44px em tab buttons, link Voltar e todos os elementos interativos do UnidadeDetailSheet.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | D-05 — fallback de preço em UnidadePublicaCard | cb3b4bd | UnidadePublicaCard.js |
| 2 | D-06 — tap targets tab buttons e link Voltar | 494ab8b | UnidadesPublicas.js |
| 3 | PUB-03 critério #6 — tap targets UnidadeDetailSheet | bf1d1f0 | UnidadeDetailSheet.js |

---

## What Was Built

**Task 1 — UnidadePublicaCard.js (D-05):**
- Trocou o texto literal `Valor sob consulta` por `Consulte o Proprietário` dentro do `<span>` de fallback de preço
- className do span mantido intacto: `font-mono text-[11px] text-fg-3 tracking-[1px] uppercase`
- Card button mantém `py-5` (~68px de tap target) — não alterado
- PUB-01 verificado: 5 campos presentes (nome, edifício, área m², valor/fallback, StatusBadge)

**Task 2 — UnidadesPublicas.js (D-06):**
- Tab button: `py-2` → `py-3 min-h-[44px]` (ambas classes obrigatórias; py-3 sozinho fica em ~38-40px)
- Link Voltar: adicionado `py-3 inline-flex items-center min-h-[44px]` ao className (inline-flex + items-center são necessários para a altura aplicar a um `<a>` inline)
- Empty state "Nenhuma unidade disponível" verificado presente e inalterado (PUB-02)
- Tab row mantém `overflow-x-auto` — sem overflow horizontal em 375px

**Task 3 — UnidadeDetailSheet.js (PUB-03, critério #6):**
- Botão ✕: `width: 32, height: 32` → `width: 44, height: 44` no objeto style inline
- Botão "Tenho interesse →": `min-h-[44px]` na className + `minHeight: 44` no style inline (garantia de cascata com `all: 'unset'`)
- Botão "Fechar": mesma adição de `min-h-[44px]` + `minHeight: 44`
- Texto `Consulte o Proprietário` (linha ~59) preservado inalterado
- Estrutura overlay (`onClick={onClose}`, `stopPropagation`) intacta

---

## Deviations from Plan

### Auto-fixed Issues

Nenhum desvio. Plano executado exatamente como especificado.

**Nota sobre cascata (prevista no plano):** A nota do plano sobre a garantia de cascata foi aplicada preventivamente nos botões de ação do DetailSheet — tanto `min-h-[44px]` (Tailwind) quanto `minHeight: 44` (inline) foram adicionados simultaneamente, conforme orientação do plano para o caso em que `all: 'unset'` poderia interferir com classes Tailwind.

---

## Success Criteria Verification

- [x] D-05 aplicado: `UnidadePublicaCard.js` contém `Consulte o Proprietário`, NÃO contém `Valor sob consulta`
- [x] Tab buttons >=44px: `py-3 min-h-[44px]` (dois critérios, não apenas um)
- [x] Link Voltar >=44px: `py-3 inline-flex items-center min-h-[44px]`
- [x] Sheet ✕ >=44px: `width: 44, height: 44`
- [x] Botões de ação do sheet >=44px: `min-h-[44px]` + `minHeight: 44`
- [x] Empty state (PUB-02): "Nenhuma unidade disponível" presente e inalterado
- [x] `grep -c 'min-h-\[44px\]' UnidadesPublicas.js` >= 2 (tab button + link Voltar)
- [x] `grep -c 'min-h-\[44px\]\|minHeight: 44' UnidadeDetailSheet.js` >= 2 (dois botões de ação)

---

## Known Stubs

Nenhum. Todos os campos renderizam dados reais da query Supabase.

---

## Threat Flags

Nenhuma nova superfície de segurança introduzida. Todas as mudanças são puramente apresentacionais (className/string). T-09-05 e T-09-06 cobrem esta fase; disposição `accept` mantida.

---

## Self-Check: PASSED

- [x] `src/components/features/UnidadePublicaCard.js` existe e contém `Consulte o Proprietário`
- [x] `src/components/features/UnidadesPublicas.js` existe e contém `min-h-[44px]` 2x
- [x] `src/components/features/UnidadeDetailSheet.js` existe e contém `width: 44, height: 44` + `minHeight: 44` 2x
- [x] Commit cb3b4bd existe (Task 1)
- [x] Commit 494ab8b existe (Task 2)
- [x] Commit bf1d1f0 existe (Task 3)
