---
phase: 22-contratos-parcelas-renova-o
plan: "02"
subsystem: parcelas
tags: [redesign, timeline, financeiro, dashboard]
dependency_graph:
  requires: []
  provides: [PARC-01, PARC-02, PARC-03]
  affects: [src/components/features/Parcelas.js]
tech_stack:
  added: []
  patterns: [inline-derivations, react-state-recalc, vertical-timeline, segmented-progress-bar]
key_files:
  created: []
  modified:
    - src/components/features/Parcelas.js
decisions:
  - "getEdificios() adicionado ao Promise.all do carregar() — getContratos() traz unidades(nome) sem edificio_id/nome, e getUnidades() traz edificio_id mas não o nome do edifício; join manual via unidade.edificio_id foi a abordagem correta"
  - "Três tasks implementadas num único commit pois todas modificam o mesmo arquivo Parcelas.js — atomicidade preservada, sem duplicação de build"
  - "romma-desktop-only / romma-mobile-only usados para grade-resumo e resumo financeiro separados (5cols / 2×3 desktop vs mobile) evitando media query inline"
metrics:
  duration: "~20min"
  completed: "2026-06-16"
  tasks_completed: 3
  files_changed: 1
---

# Phase 22 Plan 02: Redesenho de Parcelas.js — Grade-resumo, Resumo Financeiro, Barra e Timeline Summary

**One-liner:** Redesenho completo de Parcelas.js de tabela simples para painel financeiro narrativo com grade-resumo 5-colunas, resumo financeiro derivado de `unidade.valor_mensal`, barra de progresso segmentada e timeline vertical com registrar pagamento ao vivo.

## What Was Built

### PARC-01: Grade-resumo + Resumo financeiro

**Grade-resumo** (5 colunas desktop / 2×3 mobile):
- Células: Unidade, Edifício, Valor mensal, Início, Término
- Border `var(--border-3)`, fundo `var(--surface)`, labels `.r-label`
- Renderização dupla via `romma-desktop-only` / `romma-mobile-only` (5 cols vs 2×2 grid)
- Nome do edifício resolvido via `getEdificios()` + match `unidade.edificio_id`

**Resumo financeiro** (4 colunas — 2×2 mobile):
- "Valor do contrato" / "Total recebido" (`--success`) / "Em aberto" (`--highlight`) / "Inadimplência" (`--danger-fg`/`--danger-bg2` quando `vencidas > 0`)
- Valores em `fmtBRL`, 24px desktop / 20px mobile, font-display 700
- Derivações 100% inline no corpo do componente — recalculam automaticamente no re-render

### PARC-02: Barra de progresso + Timeline vertical

**Barra segmentada:**
- 1 célula por parcela, `height: 6px`, `gap: 3px`, `aria-hidden="true"`
- Cores: `--success` (paga), `--danger` (vencida), `--warning` (pendente), `--surface-hi` (futura)

**Timeline vertical:**
- Ponto quadrado `12×12px` sem border-radius (Obsidian Blueprint aplicado)
- Futura: `background: transparent` + `border: 1px solid var(--fg-5)`
- Linha vertical `width:1px`, `background: var(--border-3)`, `minHeight: 28px` até penúltimo item
- "Parcela NN" + `StatusBadge` + "✓ Registrar" (pendente/vencida) + meta row `.r-meta`
- Meta: "Venc · data" (vencida→`--danger-fg`), "Pago · data|—", `fmtBRL(valor_mensal)`

### PARC-03: Registrar pagamento ao vivo

- `marcarComoPaga` chama SA, re-fetcha com `getParcelasByContrato`, seta `setParcelas`
- Derivações inline recalculam resumo financeiro automaticamente (zero query extra)
- Toast: `"Pagamento registrado · DD/MM/AAAA"` com data local via `fmtData()`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing data] getEdificios() adicionado ao Promise.all**
- **Found during:** Task 1 — análise de `getContratos()` (só traz `unidades(nome)`) + `getUnidades()` (traz `edificio_id` mas não `edificios.nome`)
- **Fix:** Adicionado `getEdificios` ao import de `queries-client` e ao `Promise.all` do `carregar()`. Estado `const [edificio, setEdificio] = useState(null)` adicionado. Match via `unidade.edificio_id`.
- **Files modified:** `src/components/features/Parcelas.js`
- **Commit:** d13e423

**2. [Rule 1 - Design] Header redesenhado para mostrar nome do locatário**
- **Found during:** Task 1 — o design canônico (`console3.jsx:256`) usa `locatario.nome_razao_social` como título principal, não "Parcelas."
- **Fix:** Header atualizado para exibir nome do locatário como `<h1>` com StatusBadge ao lado (sem botão "Renovar" — reservado para Plan 03).

## Known Stubs

Nenhum. Todos os valores são derivados de dados reais do Supabase.

## Threat Flags

Nenhuma nova superfície de segurança introduzida. `Parcelas.js` é componente client-side read+action-only.

## Self-Check: PASSED

- [x] `src/components/features/Parcelas.js` existe e foi modificado
- [x] Commit `d13e423` existe: `git log --oneline | grep d13e423`
- [x] `npx next build --no-lint` passa: 15/15 páginas geradas, 0 erros de compilação
- [x] COL, gridStyle, HeaderCell removidos (sem órfãos)
- [x] Derivações financeiras são inline (não em useEffect)
