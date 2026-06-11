---
phase: 12-escala-desktop-tema
plan: "02"
subsystem: dashboard-ui
tags: [typography, css, scale, desktop]
dependency_graph:
  requires: []
  provides: [tabela-contratos-14px, tabela-parcelas-14px, tabela-locatarios-14px]
  affects: [dashboard-visual-scale]
tech_stack:
  added: []
  patterns: [tailwind-text-token-bump, css-var-header-token]
key_files:
  created: []
  modified:
    - src/components/features/Contratos.js
    - src/components/features/Parcelas.js
    - src/components/features/LocatariosDesktop.js
decisions:
  - "Grid COL de Contratos ampliada (100px->116px ID, 80px->96px Acoes) para prevenir reflow com fonte 14px mono — pré-autorizado pelo plano"
  - "Grid COL de Parcelas ampliada (60px->72px numero) para prevenir reflow com fonte 14px mono — pré-autorizado pelo plano"
  - "h3 do modal 'Enviar Convite' elevado de 20px para 24px junto com o modal de edição — Rule 2 consistência de piso tipográfico UI-SPEC"
metrics:
  duration: "~10min"
  completed_date: "2026-06-11"
  tasks_total: 4
  tasks_completed: 3
  files_changed: 3
---

# Phase 12 Plan 02: Escala Tipográfica Desktop — Tabelas Summary

Correção de escala tipográfica em 3 tabelas do dashboard: fontes de dado de célula elevadas de 11-13px para >=14px, padding de célula aumentado para py-4, e literais hardcoded de header substituídos por token var(--surface-hi).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Contratos.js — fontes >=14px, padding py-4, literal de header | 36360c5 | src/components/features/Contratos.js |
| 2 | Parcelas.js — fontes >=14px, padding py-4, literal de header | 2420e3b | src/components/features/Parcelas.js |
| 3 | LocatariosDesktop.js — fontes >=14px, literal de header, h3 modal >=24px | 9360efa | src/components/features/LocatariosDesktop.js |

## Task Pending (Checkpoint)

| Task | Name | Status |
|------|------|--------|
| 4 | Verificação visual — tabelas em 1280px sem reflow | PENDING — checkpoint:human-verify |

## Changes per File

### Contratos.js (commit 36360c5)
- `bg-[oklch(0.26_0_0)]` → `bg-[var(--surface-hi)]` em 2 ocorrências (SkeletonContratos header + tabela header)
- REF_C ID: `text-[11px]` → `text-[14px]`
- Nome do locatário: `text-[13px]` → `text-[14px]`
- Nome da unidade: `text-[12px]` → `text-[14px]`
- Data início: `text-[11px]` → `text-[14px]`
- Data fim: `text-[11px]` → `text-[14px]`
- Padding de célula: `py-3.5` → `py-4` (7 células)
- Grid COL: `"100px 1.6fr 1.6fr 1fr 1fr 1.2fr 80px"` → `"116px 1.6fr 1.6fr 1fr 1fr 1.2fr 96px"`

### Parcelas.js (commit 2420e3b)
- `bg-[oklch(0.26_0_0)]` → `bg-[var(--surface-hi)]` (header da tabela)
- Metadata locatário·unidade: `text-[12px]` → `text-[14px]`
- Contagem pagas/pendentes: `text-[12px]` → `text-[14px]`
- Número da parcela: `text-[12px]` → `text-[14px]`
- data_fechamento: `text-[11px]` → `text-[14px]`
- data_vencimento: `text-[11px]` → `text-[14px]`
- data_pagamento: `text-[11px]` → `text-[14px]`
- Padding de célula: `py-[14px]` → `py-4` (6 células)
- Grid COL: `"60px 1fr 1fr 1fr 1.2fr 120px"` → `"72px 1fr 1fr 1fr 1.2fr 120px"`

### LocatariosDesktop.js (commit 9360efa)
- `bg-[oklch(0.26_0_0)]` → `bg-[var(--surface-hi)]` (header da tabela)
- nome_razao_social: `text-[13px]` → `text-[14px]`
- documento: `text-[11px]` → `text-[14px]`
- email: `text-[11px]` → `text-[14px]`
- contagem de contratos: `text-[12px]` → `text-[14px]`
- h3 "Editar Locatário": `text-[20px]` → `text-[24px]`
- h3 "Enviar Convite": `text-[20px]` → `text-[24px]` (Rule 2 — ver Deviations)
- Padding de row `py-4` já estava correto — mantido

## Deviations from Plan

### Auto-added (Rule 2)

**1. [Rule 2 - Missing critical functionality] Elevação de h3 "Enviar Convite" para 24px**
- **Found during:** Task 3
- **Issue:** O plano mencionava apenas o h3 "Editar Locatário" (linha 225), mas o modal "Enviar Convite" (linha 322) também tem `text-[20px]` — abaixo do piso de 24px para títulos de seção definido no UI-SPEC (D-08). Ambos os h3 têm o mesmo papel semântico (título de modal).
- **Fix:** Elevado `text-[20px]` → `text-[24px]` no segundo modal junto com o primeiro.
- **Files modified:** src/components/features/LocatariosDesktop.js
- **Commit:** 9360efa

### Auto-applied pre-authorizations

**2. [Pre-authorized] Ampliação da grid COL em Contratos.js**
- O plano pré-autorizou `100px → 116px` (ID) e `80px → 96px` (Ações) para evitar reflow com `REF_C_001` (9 chars mono) em 14px dentro de 100px com 40px de padding lateral.
- Aplicado conforme instrução do plano.

**3. [Pre-authorized] Ampliação da grid COL em Parcelas.js**
- O plano pré-autorizou `60px → 72px` (número) para evitar reflow com `"01"` mono em 14px.
- Aplicado conforme instrução do plano.

## Known Stubs

Nenhum stub identificado. Todas as alterações são puramente tipográficas/de padding em dados reais existentes.

## Threat Flags

Nenhum. Mudança puramente CSS/tipográfica — sem novos endpoints, inputs, ou superfícies de segurança.

## Pending — Task 4 (Checkpoint)

Task 4 é um `checkpoint:human-verify`. Requer verificação visual no browser em viewport 1280px:

1. `npm run dev`, abrir dashboard em DevTools com viewport 1280px
2. Em Contratos, Parcelas e Locatários: inspecionar computed style de dado de célula e confirmar `font-size: 14px`
3. Confirmar nenhum dado quebrou linha dentro de coluna fixa
4. Abrir modal de edição de Locatário e confirmar h3 >= 24px
5. Confirmar headers de tabela com tom de superfície coerente via var(--surface-hi)

Resume-signal: "approved" se 3 tabelas têm dados >=14px sem reflow, ou descreva o problema.

## Self-Check: PASSED

- src/components/features/Contratos.js: existe e modificado
- src/components/features/Parcelas.js: existe e modificado
- src/components/features/LocatariosDesktop.js: existe e modificado
- Commit 36360c5 (Contratos): verificado
- Commit 2420e3b (Parcelas): verificado
- Commit 9360efa (LocatariosDesktop): verificado
- Zero ocorrências de `oklch(0.26_0_0)` nos 3 arquivos: verificado
- `bg-[var(--surface-hi)]` presente nos 3 arquivos: verificado
- `py-4` presente nos 3 arquivos: verificado
