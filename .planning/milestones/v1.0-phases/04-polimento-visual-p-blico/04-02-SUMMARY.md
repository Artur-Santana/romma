---
phase: 04-polimento-visual-publico
plan: "02"
subsystem: frontend/layout
tags: [fonts, next-image, perf, lint, cleanup]
completed_at: "2026-05-27T23:26:52Z"
duration_minutes: 8
tasks_completed: 2
tasks_total: 2
files_changed: 3

dependency_graph:
  requires: []
  provides: [VIS-01]
  affects:
    - src/app/layout.js
    - src/app/globals.css
    - src/app/page.js

tech_stack:
  added: []
  patterns:
    - next/image fill com aspect-ratio no container pai
    - next/image unoptimized para SVGs self-hosted
    - CSS var --font-mono redirecionada para Space Grotesk

key_files:
  created: []
  modified:
    - src/app/layout.js
    - src/app/globals.css
    - src/app/page.js

decisions:
  - "SVGs migrados com unoptimized (Option A do PATTERNS.md): self-hosted sem risco de sanitização"
  - "Hero desktop usa aspect-[4/3] no container pai para suportar Image fill sem altura inline"
  - "data_regional_demand_graph.png usa h-32 + object-contain para manter proporção do gráfico"

requirements: [VIS-01]
---

# Phase 04 Plan 02: Limpeza de Fontes e Migração next/image Summary

Remoção de JetBrains Mono e Public_Sans de layout.js + atualização de globals.css; migração das 8 tags `<img>` nativas em page.js para next/image com fill/unoptimized conforme padrões do projeto.

## Tasks Executadas

| Task | Nome | Commit | Arquivos |
|------|------|--------|----------|
| 1 | Remover JetBrains Mono + Public_Sans; atualizar globals.css | d067859 | src/app/layout.js, src/app/globals.css |
| 2 | Migrar 8 tags `<img>` para next/image em page.js | b5c5323 | src/app/page.js |

## Verificação Final

| Critério | Resultado |
|----------|-----------|
| `grep JetBrains src/` | 0 matches |
| `grep Public_Sans src/` | 0 matches |
| `--font-mono` aponta para `var(--font-space-grotesk)` em @theme | OK |
| `--font-mono` aponta para `var(--font-space-grotesk)` em :root | OK |
| `<img>` nativas em page.js | 0 |
| `import Image from "next/image"` em page.js | OK (linha 2) |
| `npm run lint` | Limpo — zero erros, zero warnings |

## Deviations from Plan

### Auto-fixed Issues

Nenhuma — plano executado exatamente conforme especificado.

### Decisões de implementação

**1. Hero desktop (Detalhe_Arquitetonico.png — img 2):**
Container original era `<div className="relative">` sem height. Adicionado `aspect-[4/3]` para suportar `Image fill` sem quebrar o layout existente. Alternativa de height fixa rejeitada por incompatibilidade com o grid responsivo da seção.

**2. data_regional_demand_graph.png (img 8):**
Container pai `<div>` recebeu `relative h-32` para suportar `Image fill`. Usou `object-contain` (não `object-cover`) para preservar a proporção do gráfico — informação visual não deve ser cortada.

**3. horizontal_divider.svg:**
Dimensões obtidas do arquivo SVG real (`width="32" height="1"`). Usadas como `width={32} height={1}` em vez de valores arbitrários.

## Known Stubs

Nenhum.

## Threat Flags

Nenhuma superfície nova fora do threat model do plano. SVGs com `unoptimized` são self-hosted em `/public/` — sem upload de usuário (T-04-02-01 aceito conforme threat register).

## Self-Check: PASSED

- src/app/layout.js — presente e sem JetBrains/Public_Sans
- src/app/globals.css — --font-mono usa var(--font-space-grotesk) nas duas ocorrências
- src/app/page.js — zero `<img>` nativas; Image from next/image importado
- Commits d067859 e b5c5323 — verificados no git log
