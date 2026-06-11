---
phase: 12-escala-desktop-tema
plan: "03"
subsystem: dashboard-ui
tags: [typography, desktop-scale, audit, D-08]
dependency_graph:
  requires: [12-02]
  provides: [UX-01-partial]
  affects: [dashboard/page.js, GestaoEdificios.js, UnidadeCard.js, contratos/id/page.js]
tech_stack:
  added: []
  patterns: [tailwind-text-px-bump, token-replace]
key_files:
  created: []
  modified:
    - src/app/dashboard/page.js
    - src/components/features/GestaoEdificios.js
    - src/components/ui/UnidadeCard.js
decisions:
  - "contratos/[id]/page.js é um wrapper de 9 linhas — toda tipografia pertence a Parcelas.js (plano 02)"
  - "UnidadeCard: nome da unidade (text-[18px]) é titulo de item, nao titulo de secao — nao bumpar para 24px"
  - "Unidades.js: audit completo, sem mudancas — todos os textos sao labels EXEMPT (uppercase+tracking)"
metrics:
  duration_minutes: 12
  completed_date: "2026-06-11T21:50:22Z"
  tasks_completed: 4
  files_changed: 3
---

# Phase 12 Plan 03: Escala Desktop Restante — Summary

**One-liner:** Audit D-08 completo das telas nao-tabela do dashboard: Overview dados bumped para >=14px, literal de header substituido por token, endereco de edificio e descricao de unidade elevados.

---

## What Was Built

Completou o audit de escala tipografica D-08 (UX-01) para as telas do dashboard que nao sao tabelas principais: Overview (dashboard/page.js), Gestao de Edificios, Unidades (UnidadeCard) e detalhe de Contrato (contratos/[id]).

### Mudancas por arquivo

**src/app/dashboard/page.js**
- `bg-[oklch(0.26_0_0)]` → `bg-[var(--surface-hi)]` no header da tabela "Contratos Recentes"
- Nome/locatario nas rows de contratos: `text-[13px]` → `text-[14px]`
- Valor mensal (fmtBRL) nas rows de contratos: `font-mono text-[13px]` → `text-[14px]`
- Data de fim (data_fim) na row de contrato: `font-mono text-[12px]` → `text-[14px]`
- Nome/locatario nas rows de parcelas: `text-[13px]` → `text-[14px]`
- Valor mensal nas rows de parcelas: `font-mono text-[13px]` → `text-[14px]`
- Setup wizard step label: `font-bold text-[13px]` → `text-[14px]`
- Quick Actions label: `font-semibold text-[13px]` → `text-[14px]`

**src/components/features/GestaoEdificios.js**
- Endereco do edificio: `font-mono text-[11px]` → `text-[14px]`
- Nome do edificio (text-[15px]) preservado intacto

**src/components/ui/UnidadeCard.js**
- Descricao da unidade: `font-body text-[12px]` → `text-[14px]`
- Area/valor chips (text-[10px] tracking uppercase) preservados como EXEMPT
- Nome da unidade (text-[18px]) preservado como titulo de item (nao titulo de secao)

---

## Audit Results

| Arquivo | Resultado | Mudancas |
|---------|-----------|----------|
| dashboard/page.js | 7 bumps + 1 literal token | sim |
| GestaoEdificios.js | 1 bump (endereco) | sim |
| UnidadeCard.js | 1 bump (descricao) | sim |
| Unidades.js | Audit limpo — apenas labels EXEMPT | nenhuma |
| contratos/[id]/page.js | Wrapper 9 linhas — tipografia em Parcelas.js (plano 02) | nenhuma |

**EXEMPT preservados em todas as telas:**
- Labels `text-[10px]` / `text-[11px]` uppercase com tracking (eyebrows, chips de metadado)
- Metadados operacionais `font-mono text-[12px]` (OPERADOR, contagem de edificios/unidades)
- Links de navegacao e botoes (texto mobile, arrows)
- Todo o bloco mobile (`md:hidden` / Phase 13)

---

## Deviations from Plan

### Decisoes de Scope

**1. contratos/[id]/page.js — Wrapper sem tipografia propria**
- **Found during:** Task 4
- **Issue:** O arquivo e um wrapper de 9 linhas (`return <Parcelas contratoId={id} />`). Toda tipografia de detalhe de contrato vive em `Parcelas.js`, que pertence ao plano 02 (`files_modified` de 12-02 lista `Parcelas.js` explicitamente).
- **Resolution:** Audit registrado como limpo. Nenhuma mudanca feita. Documentado aqui para o verificador.

**2. UnidadeCard.js — nome da unidade (18px) nao bumped para 24px**
- **Found during:** Task 3
- **Decision:** `text-[18px]` no nome da unidade e um titulo de item (item dentro de lista/card), nao um titulo de secao `<h2>`/`<h3>`. D-10 exige >=24px para titulos de secao. Bumpar este texto para 24px mudaria o design do card sem justificativa de escala. Nao bumped.
- **Revisor:** Se discordar, alterar para `text-[24px]` em `UnidadeCard.js` linha 122.

---

## Commits

| Task | Arquivo | Commit | Descricao |
|------|---------|--------|-----------|
| 1 | dashboard/page.js | a5aefdc | Overview dados >=14px + header token surface-hi |
| 2 | GestaoEdificios.js | c698e92 | Endereco text-[11px] → text-[14px] |
| 3 | UnidadeCard.js | edc5eaf | Descricao text-[12px] → text-[14px] |

---

## Known Stubs

Nenhum.

---

## Threat Flags

Nenhuma superficie de seguranca nova introduzida — mudancas sao puramente CSS/tipografia.

---

## Self-Check: PASSED

- [x] src/app/dashboard/page.js modificado e commitado (a5aefdc)
- [x] src/components/features/GestaoEdificios.js modificado e commitado (c698e92)
- [x] src/components/ui/UnidadeCard.js modificado e commitado (edc5eaf)
- [x] Nenhum `oklch(0.26_0_0)` em dashboard/page.js
- [x] `bg-[var(--surface-hi)]` presente em dashboard/page.js
- [x] ESLint passa nos arquivos modificados
