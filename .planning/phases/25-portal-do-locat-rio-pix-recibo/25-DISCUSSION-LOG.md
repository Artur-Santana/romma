# Phase 25: Portal do Locatário — PIX & Recibo - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-17
**Phase:** 25-portal-do-locat-rio-pix-recibo
**Mode:** `--auto` (autonomous, recommended option selected per area)
**Areas discussed:** Fonte do QR/PIX, Caminho de escrita do pagamento, Modelo de dados do recibo, Biblioteca de PDF, Sync com Proprietário, Cálculo de progresso

---

## Fonte do QR / código PIX

| Option | Description | Selected |
|--------|-------------|----------|
| QR estático único (asset fixo + código constante) | Imagem bundlada + string copia-e-cola fixa | ✓ |
| QR por-proprietário configurável | Chave PIX por instância | |
| Geração de BR Code real | QR PIX válido gerado | |

**User's choice:** QR estático único (recommended default — ROADMAP/PROJECT cortaram BR Code; PIX-F1 deferido)
**Notes:** Modal exibe nota explícita de que pagamento real não é processado.

---

## Caminho de escrita da confirmação de pagamento

| Option | Description | Selected |
|--------|-------------|----------|
| Nova Server Action do Locatário, cadeia própria, test-first | Guard parcela→contrato→locatário→usuario; 404 cross-tenant | ✓ |
| Reusar `marcarParcelaComoPaga` | Action do Proprietário (valida proprietario_id) | |

**User's choice:** Nova Server Action (recommended — ROADMAP exige guard fresco test-first; cadeia do Locatário difere da do Proprietário)
**Notes:** Update na mesma tabela `parcelas`, sem tabela nova.

---

## Modelo de dados do recibo

| Option | Description | Selected |
|--------|-------------|----------|
| Sem schema; derivar forma/código no PDF | forma "PIX" constante; código derivado de parcela.id | ✓ |
| Migração: colunas forma_pagamento + codigo_autenticacao | Persistir campos do recibo | |

**User's choice:** Sem schema, derivação determinística (recommended — evita migração; código estável por parcela)

---

## Biblioteca de PDF

| Option | Description | Selected |
|--------|-------------|----------|
| jsPDF via import dinâmico | Leve, client-only, sem crash SSR | ✓ |
| pdfmake | Mais pesado | |
| @react-pdf/renderer | React-based, maior bundle | |

**User's choice:** jsPDF + import dinâmico (recommended — atende "sem crash SSR em produção via import dinâmico")

---

## Sync com o painel do Proprietário

| Option | Description | Selected |
|--------|-------------|----------|
| Refresh-based via persistência em `parcelas` | Reflete no próximo refetch | ✓ |
| Subscription realtime nova | Propaga ao vivo | |

**User's choice:** Refresh-based (recommended — ROADMAP exige só "via persistência"; limitação conhecida de RLS em UPDATE torna realtime não confiável)

---

## Cálculo de destaque e progresso

| Option | Description | Selected |
|--------|-------------|----------|
| Buscar todas as parcelas (incl. futura) p/ progresso | Total e % adimplente corretos; destaque = próxima não-paga | ✓ |
| Reusar getParcelasPortal (exclui futura) | Total incompleto | |

**User's choice:** Buscar todas (recommended — progresso pagas/total precisa do total real)

---

## Claude's Discretion

- Estilo/layout do destaque, modal PIX e recibo PDF → `/gsd-ui-phase 25` (UI hint: yes).
- Naming da nova Server Action e da função de derivação do código de autenticação.

## Deferred Ideas

- PORT-F1: processamento real de pagamento PIX (gateway) — pós-v1.5.
- PIX-F1: geração de QR Code PIX real (BR Code) — v1.5 usa QR estático.
- Dream D3: QR Code de acesso — pós-TCC.
