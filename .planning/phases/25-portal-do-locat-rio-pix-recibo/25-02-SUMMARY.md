---
phase: 25-portal-do-locat-rio-pix-recibo
plan: "02"
subsystem: portal-ui
tags: [portal, locatario, vencimento-destaque, progresso, pix-modal-wiring, tailwind]
dependency_graph:
  requires:
    - 25-01 (getTodasParcelasPortal, confirmarPagamentoLocatario)
  provides:
    - VencimentoDestaque (componente — destaque próximo vencimento PORT-04)
    - ContratoCard extensão (barra de progresso PORT-04)
    - PortalDashboard extensão (todasParcelas state + pixModal state + wiring PORT-05)
    - PixModal stub (para substituição no Plan 03)
  affects:
    - src/components/features/portal/VencimentoDestaque.js
    - src/components/features/portal/ContratoCard.js
    - src/components/features/portal/PortalDashboard.js
    - src/components/features/portal/PixModal.js
tech_stack:
  added: []
  patterns:
    - Derivação pura de props (sem useEffect) para cálculo de próxima pagável
    - IIFE inline em JSX para cálculo de progresso (pct, pagas, total)
    - Tailwind portal exception (bg-indigo, text-highlight, text-warning, text-danger-fg)
    - pixModal state object ({ open, parcela }) com setPixModal handler
    - refetchParcelas named function para re-fetch pós-pagamento
key_files:
  created:
    - src/components/features/portal/VencimentoDestaque.js
    - src/components/features/portal/PixModal.js (stub)
  modified:
    - src/components/features/portal/ContratoCard.js
    - src/components/features/portal/PortalDashboard.js
decisions:
  - "VencimentoDestaque sem 'use client' — derivação pura de props, sem hooks"
  - "PixModal.js criado como stub (return null) para evitar import error até Plan 03"
  - "refetchParcelas declarada como named function dentro do componente (não dentro do useEffect)"
  - "ParcelsTable recebe todasParcelas (inclui futura) — Plan 03 adiciona coluna Ação"
metrics:
  duration_seconds: 180
  completed_date: "2026-06-17"
  tasks_completed: 2
  files_changed: 4
---

# Phase 25 Plan 02: VencimentoDestaque + ContratoCard Progresso + PortalDashboard Wiring Summary

**One-liner:** Camada de destaque PORT-04 completa — VencimentoDestaque (valor BRL 32px, dias restantes condicional, PAGAR AGORA), barra de progresso no ContratoCard, e wiring do PixModal no PortalDashboard via getTodasParcelasPortal.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Criar VencimentoDestaque.js + estender ContratoCard.js | 6984a2c | src/components/features/portal/VencimentoDestaque.js, src/components/features/portal/ContratoCard.js |
| 2 | Estender PortalDashboard.js — todasParcelas state + PixModal state + wiring | a8ddef3 | src/components/features/portal/PortalDashboard.js, src/components/features/portal/PixModal.js |

---

## What Was Built

### `VencimentoDestaque.js` (novo)

Componente de destaque do próximo vencimento (PORT-04). Derivação pura de props — sem hooks, sem useEffect:

- Filtra `parcelas` por `status === 'pendente' || 'vencida'`, ordena por `data_vencimento` ascending, pega `[0]`
- Retorna `null` quando não há parcela pagável (componente oculto)
- Exibe valor BRL 32px (`font-display font-bold text-[32px]`) via `contrato.unidades?.valor_mensal`
- Subtítulo `Parcela X/N · N dias restantes` com cor condicional: `text-danger-fg` se < 0, `text-warning` se ≤ 7, `text-fg-3` senão
- Botão `[>] PAGAR AGORA` com `style={{ all: 'unset' }}`, `bg-indigo`, chama `onPagar(proximaPagavel)`
- Container: `border-l-4 border-l-highlight bg-surface` (gold left border accent conforme UI-SPEC Surface 1)

### `ContratoCard.js` (estendido)

- Aceita nova prop `parcelas = []` (retrocompatível — default vazio mantém comportamento anterior)
- Adiciona barra de progresso (`role="progressbar"`, `bg-border-3` track 6px, `bg-indigo` fill)
- Stats row: `{pagas} pagas · {total} total` + `· {pct}% adimplente` (gold quando < 100%, success quando 100%)
- Cálculo inline via IIFE no JSX: `total`, `pagas`, `pct` derivados de prop sem estado

### `PortalDashboard.js` (estendido)

- Importa `getTodasParcelasPortal`, `VencimentoDestaque`, `PixModal`, `toast` de sonner
- Estado adicional: `todasParcelas` (array, inclui futura), `pixModal` ({ open: false, parcela: null })
- `fetchData` chama `getTodasParcelasPortal(ct.id)` após `getParcelasPortal`
- `refetchParcelas()` função nomeada para re-fetch pós-confirmação
- Render tree happy-path: `VencimentoDestaque` → `ContratoCard(todasParcelas)` → `ParcelsTable(todasParcelas, locatario, contrato, onPagar)` → `PixModal`
- `onPagar` handler: `setPixModal({ open: true, parcela })`
- `onSucesso` do PixModal: `await refetchParcelas(); toast.success("Pagamento registrado")`

### `PixModal.js` (stub)

Stub mínimo `export default function PixModal() { return null }` para evitar import error até o Plan 03 substituir pelo componente completo.

---

## Deviations from Plan

None — plano executado exatamente como escrito.

---

## Known Stubs

| File | Line | Description |
|------|------|-------------|
| `src/components/features/portal/PixModal.js` | 2 | Stub `return null` — será substituído pelo Plan 03 com modal PIX completo (QR, copiar código, confirmar pagamento) |

O stub é intencional: o Plan 03 (PixModal completo) o substitui. Não impede o objetivo do Plan 02 (wiring do estado e renderização do VencimentoDestaque).

---

## Threat Flags

None — nenhuma nova superfície de rede ou boundary de confiança além do que o threat model do plano documenta. T-25-06, T-25-07, T-25-08 verificados:

- T-25-06: `getTodasParcelasPortal` usa `supabase-browser` (anon key + RLS) — isolamento por locatário garantido
- T-25-07: cálculo de `proximaPagavel` é display-only; ownership real validado na Server Action (Plan 01)
- T-25-08: state client-side do próprio usuário; dados carregados via RLS

---

## Self-Check

Files exist:
- `src/components/features/portal/VencimentoDestaque.js` — contém `export default function VencimentoDestaque` ✓
- `src/components/features/portal/ContratoCard.js` — contém `role="progressbar"`, aceita prop `parcelas` ✓
- `src/components/features/portal/PortalDashboard.js` — contém `getTodasParcelasPortal`, `todasParcelas`, `pixModal`, `VencimentoDestaque`, `PixModal` ✓
- `src/components/features/portal/PixModal.js` — stub criado ✓

Commits exist:
- 6984a2c — feat(25-02): criar VencimentoDestaque + barra de progresso ContratoCard ✓
- a8ddef3 — feat(25-02): estender PortalDashboard — todasParcelas + pixModal + wiring ✓

Build: `npm run build` exit 0 ✓
Tests: `npx vitest run` 127/127 PASS ✓

## Self-Check: PASSED
