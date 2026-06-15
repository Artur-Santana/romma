# Phase 21: Dashboard — Visão Geral Editorial - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-15
**Phase:** 21-dashboard-vis-o-geral-editorial
**Mode:** `--auto` (decisões selecionadas automaticamente — opção recomendada por área, sem prompt interativo)
**Areas discussed:** Origem dos dados do fluxo de caixa, Definição recebido vs previsto, Janela temporal, Barra de ocupação por unidade, Renderização do gráfico, Estrutura de componente, Mobile

---

## Origem dos dados do fluxo de caixa

| Option | Description | Selected |
|--------|-------------|----------|
| Nova query de leitura dedicada (todos os contratos, inclui `paga`) | Mudança aditiva de leitura, mesma RLS/schema | ✓ |
| Estender `getParcelasByContratos` | Quebraria os consumidores atuais (métricas filtram pendente/vencida) | |
| RPC/agregação server-side dedicada | Overkill para dataset TCC | |

**Auto-choice:** Nova query `getParcelasFluxo()` em queries-server.js. Valor derivado de `unidade.valor_mensal` (parcela não tem coluna de valor).
**Notes:** `getParcelasByContratos` filtra `['pendente','vencida']` e só contratos ativos — insuficiente para "recebido".

---

## Definição recebido vs previsto

| Option | Description | Selected |
|--------|-------------|----------|
| Recebido por `data_pagamento` (pagas) · Previsto por `data_vencimento` (todas) | Sólido sobre fantasma; pico = maior recebido | ✓ |
| Recebido e previsto ambos por `data_vencimento` | Perde a noção de quando o dinheiro entrou | |

**Auto-choice:** Recebido = `status='paga'` agrupado por mês de `data_pagamento`; Previsto = todas as parcelas por mês de `data_vencimento`.

---

## Janela temporal do gráfico

| Option | Description | Selected |
|--------|-------------|----------|
| Rolante 6 meses (−3 … +2) | Histórico de recebido + previsão futura, 6 barras (espelha design) | ✓ |
| Ano corrente (jan–dez) | Muitas barras vazias no início do uso | |
| Só futuro (próximos 6) | Perde o "recebido" histórico | |

**Auto-choice:** mês atual −3 até +2.

---

## Barra de ocupação por unidade

| Option | Description | Selected |
|--------|-------------|----------|
| Uma célula por unidade (`OccupancyBar` do design) | Granular: m.total células, alugadas coloridas | ✓ |
| Barra agrupada alugadas/disponíveis (padrão Phase 20) | Menos granular; não é o pedido editorial | |

**Auto-choice:** Portar `OccupancyBar` de overview.jsx (1 célula = 1 unidade) + numeral grande de %.

---

## Renderização do gráfico

| Option | Description | Selected |
|--------|-------------|----------|
| Barras `div`+CSS (portar `CashFlowChart`) | Zero dependência nova, fiel ao design | ✓ |
| Biblioteca de chart (recharts/chart.js) | Dependência nova, fora do stack | |

**Auto-choice:** Barras CSS com fantasma `absolute` + sólido `relative`, animação `rGrow`.

---

## Estrutura de componente

| Option | Description | Selected |
|--------|-------------|----------|
| Manter Server Component + agregação server-side | Igual à tela atual, sem `'use client'` | ✓ |
| Converter para Client Component | Sem ganho; date-driven não precisa de Realtime | |

**Auto-choice:** Server Component preservado; estado vazio (setup wizard) mantido.

---

## Mobile

| Option | Description | Selected |
|--------|-------------|----------|
| Incluir fluxo de caixa compacto no mobile | Paridade de narrativa, altura reduzida | ✓ |
| Omitir gráfico no mobile | Perde DASH-05 no mobile | |

**Auto-choice:** Bloco de ocupação + métricas + fluxo compacto + contratos + atalhos no mobile.

---

## Claude's Discretion

- Mapeamento de tokens design (`--highlight`/`--primary-hover`/`--secondary`/`--surface-hi`) → tokens de produção (`globals.css`).
- Nome/assinatura exata da nova query de fluxo.
- Altura das barras no mobile; limites/slices das tabelas (manter 4 contratos / 5 parcelas).

## Deferred Ideas

- Drill-in/timeline de parcelas + registrar pagamento → Phase 22.
- Realtime para fluxo/ocupação → fora de escopo (date-driven).
- Seletor de período do gráfico → pós-banca.
