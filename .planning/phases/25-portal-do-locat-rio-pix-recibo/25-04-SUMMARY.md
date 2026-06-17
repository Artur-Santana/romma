---
plan: 04
phase: 25-portal-do-locat-rio-pix-recibo
wave: 3
status: complete
---

# Plan 25-04 Summary — ParcelsTable coluna Ação + jsPDF Recibo

## Self-Check: PASSED

## What Was Built

`src/components/features/portal/ParcelsTable.js` estendido com:

- `'use client'` adicionado (useState necessário)
- Props estendidas: `{ parcelas, locatario, contrato, onPagar }`
- Grid expandido de 4 → 5 colunas: `grid-cols-[60px_1fr_1fr_1fr_1.4fr]`, `min-w-[600px]`
- 5ª coluna header "AÇÃO" (font-mono eyebrow style)
- Coluna Ação por row:
  - `pendente`/`vencida` → `[>] PAGAR` (indigo, chama `onPagar(parcela)`)
  - `paga` → `[↓] RECIBO` (fg-4, chama `handleBaixarRecibo`)
  - `futura` / outros → `—` (fg-5)
- `gerarCodigoAuth(parcelaId, dataPagamento)` — btoa determinístico, 8 chars uppercase
- `handleBaixarRecibo(parcela, totalParcelas)` — import dinâmico `await import('jspdf')` com defensive destructuring (`mod.jsPDF ?? mod.default?.jsPDF ?? mod.default`)
- PDF campos: locatário, unidade, parcela X/N, valor mensal (fmtBRL), datas (fechamento/vencimento/pagamento), forma PIX, código auth
- Inline erroPDF em caso de falha (não crasha página)
- `fmtBRL` de `@/lib/utils` usado (valor_mensal em reais, não centavos)

## Gates

| Gate | Result |
|------|--------|
| `npm run build` exit 0 | ✅ PASS — SSR safety confirmada |
| `npx vitest run` 127/127 | ✅ PASS — sem regressão |

## Commits

- `feat(25-04)` — ParcelsTable coluna Ação + jsPDF recibo client-side

## Checkpoint

`checkpoint:human-verify` — verificação manual necessária em `/portal/dashboard`:
1. Coluna AÇÃO visível no histórico de parcelas
2. `[>] PAGAR` abre PixModal nas pendente/vencida
3. `[↓] RECIBO` baixa PDF com todos os campos PORT-07
4. `npm run build` exit 0 confirmado ✅
