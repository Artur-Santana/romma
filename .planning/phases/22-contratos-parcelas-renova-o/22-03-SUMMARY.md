---
phase: 22-contratos-parcelas-renova-o
plan: 03
subsystem: ui
tags: [server-action, modal, parcelas, contratos, renovacao, supabase, next-js]

# Dependency graph
requires:
  - phase: 22-contratos-parcelas-renova-o
    provides: Parcelas.js redesenhado (Plan 02) + contratos.js com cadeia de propriedade (Plans 01-02)
provides:
  - SA renovarContrato(id, meses) com validação completa, append de parcelas futuras sem Edge Function
  - Modal de renovação em Parcelas.js com opções +6/+12/+24/custom + preview + re-fetch ao vivo
affects: [phase-25-portal-locatario-pix-recibo]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "renovarContrato: UPDATE data_fim antes do INSERT para garantir consistência em falha parcial"
    - "T12:00:00 em todas as construções de Date para eliminar UTC shift"
    - "MAX(numero) via ORDER DESC LIMIT 1 para numeração sequencial de parcelas"
    - "handleRenovar: modal fecha só após 200; erro mantém modal aberto com toast.error"
    - "previewNovoTermino: pure function sem state extra — calcula preview on-demand"

key-files:
  created: []
  modified:
    - src/actions/contratos.js
    - src/components/features/Parcelas.js

key-decisions:
  - "renovarContrato INSERT direto via supabaseAdmin (sem invocar Edge Function gerar-parcelas) — atomic, auditável, sem overhead de Edge cold start"
  - "Botão Renovar exibido só quando contrato.status === 'ativo' — evita renovação de contratos encerrados/cancelados"
  - "Re-fetch Promise.all([getParcelasByContrato, getContratos]) após renovação — atualiza grade-resumo (Término) e timeline ao vivo sem reload de página"

patterns-established:
  - "Loop while (fechBase <= fim) com fechBase.setMonth após push — padrão replicável para geração de parcelas mensais"
  - "Modal custom com backdrop onClick (e.target === e.currentTarget) — fecha ao clicar fora sem bloquear interação com conteúdo"

requirements-completed: [PARC-04]

# Metrics
duration: 20min
completed: 2026-06-16
---

# Phase 22 Plan 03: Renovação Summary

**SA renovarContrato com append atômico de parcelas futuras via supabaseAdmin (sem Edge Function) + modal +6/+12/+24/custom com preview e re-fetch ao vivo em Parcelas.js**

## Performance

- **Duration:** 20 min
- **Started:** 2026-06-16T10:45:00Z
- **Completed:** 2026-06-16T11:05:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Server Action `renovarContrato(id, meses)` com auth + UUID + validação meses 1-36 + cadeia de propriedade 3 níveis + T12:00:00 anti-UTC-shift + MAX(numero) para numeração sequencial + INSERT em lote sem Edge Function
- Botão "Renovar" no header de Parcelas (visível só para contratos ativos) abrindo modal com opções rápidas +6/+12/+24, campo custom 1-36 e preview "Novo término" em tempo real
- handleRenovar fecha modal só após 200, mostra toast.success e re-fetcha contrato+parcelas para atualizar grade-resumo e timeline ao vivo; mantém modal aberto em erro com toast.error
- Build `next build` passa sem erros em ambas as tasks

## Task Commits

1. **Task 1: Implementar Server Action renovarContrato** - `7b55f45` (feat)
2. **Task 2: Botão Renovar + modal de renovação em Parcelas.js** - `4a8a2c8` (feat)

**Plan metadata:** (a seguir, commit de docs)

## Files Created/Modified

- `src/actions/contratos.js` — adicionada export `renovarContrato(id, meses)` (81 linhas) ao final do arquivo
- `src/components/features/Parcelas.js` — adicionados: import renovarContrato, 3 states (showRenew/renew/renovando), helpers previewNovoTermino/handleRenovar, botão Renovar no header, modal completo

## Decisions Made

- INSERT direto via supabaseAdmin em vez de re-invocar Edge Function `gerar-parcelas`: evita overhead de cold start, elimina dependência de SUPABASE_JWT no path de renovação, e mantém a operação auditável como SA normal.
- Botão Renovar condicional (`contrato.status === 'ativo'`): impede renovação de contratos encerrados/cancelados onde a operação não faria sentido.
- Re-fetch duplo após renovação (`getParcelasByContrato` + `getContratos`): atualiza o campo "Término" na grade-resumo ao vivo sem exigir reload da página.

## Deviations from Plan

Nenhum — plano executado exatamente como especificado.

## Issues Encountered

Build inicial com `npx next build --no-lint` retornava "Errors: 1" sem detalhar o erro (comportamento do wrapper RTK). Usando `npm run build` o output completo confirmou que o build passou (Compiled successfully). Sem problema real de código.

## Known Stubs

Nenhum — todos os dados são buscados do banco; o modal consome `contrato.data_fim` real para preview.

## Threat Flags

Sem novas superfícies de segurança além das mapeadas no `<threat_model>` do plano (T-22-01 a T-22-04 todos mitigados pela SA):
- T-22-01 (IDOR): cadeia de propriedade 3 níveis implementada
- T-22-02 (meses malicioso): `Number.isInteger(m) && m >= 1 && m <= 36`
- T-22-03 (sem auth): `authGuard()` primeiro
- T-22-04 (UUID injection): `UUID_RE.test(id)` retorna 400

## Self-Check

- [x] `src/actions/contratos.js` contém `export async function renovarContrato`
- [x] `src/components/features/Parcelas.js` contém `showRenew`
- [x] Commit 7b55f45 existe (`renovarContrato`)
- [x] Commit 4a8a2c8 existe (modal renovação)
- [x] Build passa (`npm run build` — Compiled successfully)

## Self-Check: PASSED

## Next Phase Readiness

- PARC-04 / SC-5 completo: renovação via modal estende data_fim + gera parcelas futuras sem Edge Function
- Phase 22 completa (Plans 01+02+03 executados)
- Próxima fase: Phase 23 — Locatários Busca & Máscaras

---
*Phase: 22-contratos-parcelas-renova-o*
*Completed: 2026-06-16*
