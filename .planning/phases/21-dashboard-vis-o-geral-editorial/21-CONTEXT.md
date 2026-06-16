# Phase 21: Dashboard — Visão Geral Editorial - Context

**Gathered:** 2026-06-15
**Status:** Ready for planning

<domain>
## Phase Boundary

O Proprietário tem uma **Visão Geral editorial (variante B)** que reorganiza o dashboard existente (`src/app/dashboard/page.js`, Server Component) em torno de três blocos novos/realçados:

1. **Bloco de ocupação em destaque** — numeral grande de % + **barra dividida por unidade** (uma célula por unidade, alugadas coloridas, disponíveis com borda) + métricas empilhadas (Ocupação, MRR, Receita Esperada, Vencendo em 7 dias).
2. **Gráfico de fluxo de caixa** — barras verticais: **recebido sólido** vs. **previsto fantasma (ghost)**, com **pico em dourado**, alimentado por **agregação mensal de parcelas**.
3. **Tabela de contratos recentes + painel de parcelas + atalhos rápidos** que navegam para as seções correspondentes.

Cobre **DASH-04, DASH-05, DASH-06**. Depende apenas da **Phase 17** (tokens) — **sem backend novo de schema**. O design canônico desta tela já existe em `.planning/design/js/overview.jsx` (componentes `OccupancyBar` e `CashFlowChart`) e deve ser portado para a tela real, trocando dados mock por dados derivados das queries.

**Fora de escopo:** novas tabelas/colunas, Realtime para fluxo/ocupação, drill-in de contrato/parcela (Phase 22), qualquer CRUD. Esta fase é **apresentação + uma agregação de leitura**, não escrita.
</domain>

<decisions>
## Implementation Decisions

> Modo `--auto`: decisões abaixo são os defaults recomendados, selecionados sem prompt interativo. Revisar/editar antes de planejar se necessário.

### Origem dos dados do fluxo de caixa (DASH-05)
- **D-01:** A query atual `getParcelasByContratos` (queries-server.js:53) filtra `status IN ('pendente','vencida')` e só recebe contratos **ativos** — **insuficiente** para o fluxo de caixa, que precisa de parcelas `paga` (recebido) e de todos os contratos no histórico. Adicionar **uma query de leitura dedicada** em `queries-server.js` (ex.: `getParcelasFluxo()`) que retorna parcelas de **todos os contratos** dentro da janela do gráfico, com `status, data_vencimento, data_pagamento, contrato_id`. **Razão:** mudança aditiva de leitura, sem alterar schema; consistente com "queries já existem" no espírito (mesmas tabelas, mesma RLS), apenas um SELECT a mais.
- **D-02:** Parcela **não tem coluna de valor** — o valor é **derivado** de `unidade.valor_mensal` via `contrato.unidade_id`. A agregação junta parcela → contrato → unidade client-side/server-side a partir das listas já carregadas (`getUnidades`, `getContratos`).

### Definição de recebido vs. previsto (DASH-05)
- **D-03:** **Recebido (barra sólida)** = soma do valor das parcelas com `status = 'paga'`, agrupadas pelo **mês de `data_pagamento`**. **Previsto (barra fantasma)** = soma do valor de **todas** as parcelas (futura/pendente/vencida/paga) agrupadas pelo **mês de `data_vencimento`** — representa o total esperado do mês. A barra sólida é desenhada **sobre** a fantasma (padrão do `CashFlowChart` em overview.jsx:36-38).
- **D-04:** **Pico em dourado** = o mês com **maior valor recebido** na janela recebe `f.peak = true` → cor `--highlight` + glow (mapear token; ver canonical refs). Demais barras sólidas usam `--primary-hover` (mapear para token equivalente do globals.css).

### Janela temporal do gráfico (DASH-05)
- **D-05:** Janela **rolante de 6 meses**: do mês atual `−3` até `+2` (3 meses passados + atual + 2 futuros). 6 barras, espelhando o design ("Previsão de Fluxo · 2026"). Rótulo de mês abreviado (`jan`, `fev`…). **Razão:** mostra recebido histórico (sólido cresce) e previsão futura (só fantasma), narrativa editorial pretendida.

### Bloco de ocupação dividido por unidade (DASH-04)
- **D-06:** Portar `OccupancyBar` (overview.jsx:48-55): **uma célula por unidade** (`m.total` células flex, gap 3px); as primeiras `alugadas` células coloridas (`--primary-hover`), as restantes com fundo `--surface-hi` + borda `--border-3`. Numeral grande de `%` (≈56px) ao lado de `alugadas/total unidades`. **Não** reusar a barra agrupada da Phase 20 — aqui é granular por unidade.
- **D-07:** As 4 métricas empilhadas reaproveitam os cálculos **já existentes** em page.js:48-74 (pctOcupacao, mrr, totalPendente/Receita Esperada, vencendoContratos). Sem recálculo divergente.

### Renderização do gráfico (DASH-05)
- **D-08:** **Sem biblioteca de chart** (não há nenhuma no stack e não será adicionada). Gráfico = **barras `div` com CSS** exatamente como `CashFlowChart` (fantasma `position:absolute`, sólido `position:relative`, alturas em `%`). Animação de entrada `rGrow` com `prefers-reduced-motion` respeitado (padrão Phase 17). **Razão:** consistência visual com o design, zero dependência nova, dataset pequeno (TCC).

### Estrutura de componente
- **D-09:** Manter a tela como **Server Component** (page.js atual já é async Server Component que faz `Promise.all` das queries-server). A agregação do fluxo é feita server-side a partir das listas carregadas + nova query D-01. **Sem** `'use client'` e **sem** Realtime para fluxo/ocupação (date-driven; atualiza no refresh — aceitável). Estado vazio (`isEmpty`, setup wizard) é **preservado**.

### Atalhos rápidos (DASH-06)
- **D-10:** Os atalhos rápidos atuais (page.js:297-319 desktop, 404-428 mobile) já navegam para as seções (`/dashboard/unidades`, `/locatarios`, `/contratos`, `/`). **Preservar** e garantir que continuam apontando para as seções correspondentes após o re-layout editorial.

### Mobile
- **D-11:** Bloco de ocupação em destaque + métricas aparecem no mobile (já existem em forma 2×2). Gráfico de fluxo de caixa: **incluir versão compacta** no mobile (altura reduzida, mesmas 6 barras) — manter paridade da narrativa, não omitir. Tabela de contratos recentes e atalhos 2×2 mobile preservados.

### Claude's Discretion
- Mapeamento dos tokens do design (`--highlight`, `--primary-hover`, `--secondary`, `--surface-hi`) para os tokens reais do `globals.css` (`--indigo`, `--warning`, `--border-3`, etc.) — o researcher/planner resolve lendo `.planning/design/styles/app.css` vs `src/app/globals.css`.
- Nome exato e assinatura da nova query de fluxo; se aproveita parte de `getParcelasByContratos` ou query independente.
- Altura exata das barras no mobile e ordenação/limite das tabelas (manter os slices atuais: 4 contratos / 5 parcelas desktop).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design (fonte visual canônica — variante B editorial)
- `.planning/design/js/overview.jsx` — Layout completo da Visão Geral editorial; componentes `CashFlowChart` (linhas 28-45) e `OccupancyBar` (linhas 47-56) que devem ser **portados** para a tela real trocando `D.fluxo`/`m` por dados derivados.
- `.planning/design/styles/app.css` — Tokens do design (`--highlight`, `--primary-hover`, `--secondary`, `--surface-hi`) a mapear para os tokens de produção.
- `src/app/globals.css` — Tokens reais de produção (`--indigo`, `--warning`, `--border-1..3`, `--surface`, tokens `--rt-*`/`--rd-*` da Phase 17) — alvo do mapeamento.

### Código a refatorar
- `src/app/dashboard/page.js` — Implementação atual (Server Component) com métricas, contratos recentes, parcelas, quick actions, estado vazio. Esta fase **reorganiza** este arquivo, não recria a tela do zero.
- `src/lib/queries-server.js` §53 (`getParcelasByContratos`) — Mostra o filtro `['pendente','vencida']` + só contratos ativos que **não serve** ao fluxo de caixa (D-01); nova query de leitura necessária.

### Requisitos
- `.planning/REQUIREMENTS.md` — DASH-04, DASH-05, DASH-06 (linhas 28-30).
- `.planning/ROADMAP.md` §"Phase 21" — Goal + 3 Success Criteria.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Cálculos de métricas** (page.js:48-74): `pctOcupacao`, `mrr`, `totalPendente`, `vencendoContratos` — reaproveitar direto para o bloco de ocupação e métricas empilhadas.
- **`OccupancyBar` / `CashFlowChart`** (overview.jsx) — algoritmo de render pronto; falta só alimentar com dados reais.
- **Queries server** (`getUnidades`, `getContratos`, `getParcelasByContratos`) — já chamadas em `Promise.all` no page.js; estender o conjunto com a query de fluxo.
- **`StatusBadge`, `RealtimeDot`, `fmtBRL`, `fmtData`, `cn`** — já importados na tela.

### Established Patterns
- Dashboard é **Server Component async** com agregação server-side; métricas derivadas das listas carregadas (sem RPC). Manter (D-09).
- Layout duplo `romma-desktop-only` / `md:hidden` (mobile) — toda seção nova precisa das duas variantes.
- Parcela sem valor próprio → valor sempre derivado de `unidade.valor_mensal` (padrão de todo o dashboard).

### Integration Points
- Nova query em `src/lib/queries-server.js` (mesma RLS/cliente anon server).
- Agregação mensal do fluxo: novo helper puro (ex.: bucket por mês) — candidato a função utilitária testável.
- Tokens de cor: ponte entre `app.css` (design) e `globals.css` (produção).

</code_context>

<specifics>
## Specific Ideas

- Fluxo de caixa fiel ao design: barra fantasma (previsto, `opacity 0.5`) atrás, barra sólida (recebido) à frente, pico do mês com mais recebido em dourado com glow.
- Barra de ocupação **granular por unidade** (1 célula = 1 unidade), não a barra agrupada por status da Phase 20.
- Janela de 6 meses (−3 … +2) para contar a história "recebido até agora + previsão à frente".

</specifics>

<deferred>
## Deferred Ideas

- Drill-in / timeline de parcelas e registrar pagamento — **Phase 22** (Contratos & Parcelas — Renovação).
- Realtime para fluxo/ocupação no dashboard — fora de escopo (date-driven, refresh basta); não promover a tempo real.
- Filtro/seleção de período do gráfico (trocar janela) — não pedido; possível melhoria pós-banca.

</deferred>

---

*Phase: 21-dashboard-vis-o-geral-editorial*
*Context gathered: 2026-06-15*
