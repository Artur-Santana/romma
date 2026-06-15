# Phase 20: Edifícios — Cards & Drill-in - Context

**Gathered:** 2026-06-15
**Status:** Ready for planning

<domain>
## Phase Boundary

O Proprietário vê Edifícios numa grade de **cards de 2 colunas**, cada card com stats por edifício (ocupação %, MRR, área total, nº de unidades) e uma **barra de ocupação contígua** (alugadas renderizadas primeiro, depois disponíveis, sem buracos) com legenda "X alugada(s) · Y disponível(is)". Um botão "Ver N unidade(s)" expande a lista de unidades do edifício; cada unidade é **clicável** e abre o `UnifiedUnidadeModal` (Phase 19) em modo edição, **com o edifício travado**.

Cobre EDIF-01..03. **Depende da Phase 19** — o `UnifiedUnidadeModal` (`src/components/ui/UnifiedUnidadeModal.js`) já existe e é reusado no drill-in. NÃO recria o modal de unidade, NÃO altera o fluxo de foto de capa. O CRUD de edifício (criar/editar/remover) já existe em `GestaoEdificios.js` e é **preservado** — esta fase reestrutura a apresentação (lista → cards com stats/drill-in), não os requisitos de CRUD.
</domain>

<decisions>
## Implementation Decisions

> Modo `--auto`: decisões abaixo são os defaults recomendados, selecionados sem prompt interativo. Revisar/editar antes de planejar se necessário.

### Cálculo de Stats por Edifício
- **D-01:** Stats são **derivados client-side** juntando `getUnidades()` (já traz `edificio_id`, `status`, `valor_mensal`, `area_m2`) com `getEdificios()`, agrupando por `edificio_id`. Sem query/RPC server-side dedicada. **Razão:** consistente com Phase 19 D-04 (métricas derivadas client-side da lista carregada); dataset pequeno (TCC).
- **D-02:** Por edifício: **ocupação %** = `alugadas / total` (0 se total=0); **MRR** = soma `valor_mensal` das unidades `alugada`; **área total** = soma `area_m2` de todas as unidades; **nº de unidades** = contagem total. `getUnidades` é estendido apenas se faltar coluna — atualmente já seleciona todas as necessárias.

### Barra de Ocupação Contígua
- **D-03:** Barra renderizada como segmentos proporcionais num container flex de largura total: **alugadas primeiro, depois disponíveis, sem buracos** (locked por EDIF-02). Dois tokens de cor distintos (ex.: `--indigo`/ocupado vs `--border-3`/disponível ou tokens equivalentes a critério). Legenda textual abaixo: "X alugada(s) · Y disponível(is)".
- **D-04:** Edifício com 0 unidades → barra vazia/neutra e legenda "0 alugada(s) · 0 disponível(is)"; botão "Ver 0 unidades" desabilitado (sem drill-in).

### Drill-in / Expansão
- **D-05:** O botão "Ver N unidade(s)" faz **expansão inline (accordion)** dentro do próprio card — revela a lista de unidades daquele edifício sem navegar para outra rota. Toggle abre/fecha. **Razão:** goal diz "expande a lista", mantém contexto do card e dos stats visíveis.
- **D-06:** Cada linha de unidade na lista expandida é **clicável** (linha inteira) e abre o `UnifiedUnidadeModal` em `mode="edit"` com `initial` = a unidade clicada. Após salvar (`onSaved`), recarrega unidades e recomputa stats.

### Reuso do UnifiedUnidadeModal — Edifício Travado
- **D-07:** Adicionar prop **`lockEdificio` (boolean)** ao `UnifiedUnidadeModal`. Quando `true`, o `FSelect` de edifício é **desabilitado/somente-leitura** (exibe o edifício mas não permite trocar). API atual: `{ mode, initial, edificios, onClose, onSaved }` → estender para `{ ..., lockEdificio }`. **Razão:** drill-in já fixa o contexto do edifício; trocar o edifício de uma unidade pelo card de outro edifício seria incoerente. Mínima mudança de API, não quebra os call-sites existentes em `Unidades.js` (default `false`).
- **D-08:** Passar `edificios` completo (modal já espera a lista) + `initial.edificio_id` já preenchido pela unidade. Quando `lockEdificio=true`, o select mostra só o edifício corrente travado.

### Migração de Apresentação do GestaoEdificios
- **D-09:** Reestruturar `GestaoEdificios.js` de lista vertical para **grade de cards 2 colunas**. **Preservar** as Server Actions e fluxos existentes de criar/editar/remover edifício (`criarEdificio`/`editarEdificio`/`deletarEdificio`) — apenas reposicionar os controles (botões Editar/Remover) dentro do novo card. Sem mudança nos requisitos de CRUD de edifício.

### Claude's Discretion
- Layout exato dos cards, hierarquia visual dos stats, formatação de MRR/área.
- Tokens de cor exatos da barra de ocupação (ocupado vs disponível) e tratamento de hover/clicável nas linhas de unidade.
- Onde posicionar os controles de criar/editar/remover edifício no novo layout de cards.
- Forma exata de buscar/agrupar unidades por edifício (memo client-side).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & Requisitos
- `.planning/ROADMAP.md` §"Phase 20" — Goal, Success Criteria 1-3, Depends on Phase 19.
- `.planning/REQUIREMENTS.md` — EDIF-01, EDIF-02, EDIF-03 (definições normativas).

### Dependência da Phase 19 (pré-requisito de reuso)
- `.planning/phases/19-unidades-modal-unificado-foto-de-capa/19-CONTEXT.md` — decisões do `UnifiedUnidadeModal`: API desacoplada de `Unidades.js`, métricas client-side (D-04), fluxo de foto. O modal é reusado aqui no drill-in.

### Código existente a modificar/reusar
- `src/components/features/GestaoEdificios.js` — tela atual (lista + CRUD inline) a reestruturar para cards/stats/drill-in.
- `src/components/ui/UnifiedUnidadeModal.js` — modal a reusar; estender com prop `lockEdificio`. Assinatura atual: `({ mode, initial, edificios, onClose, onSaved })`.
- `src/components/features/Unidades.js` (linha ~361) — exemplo canônico de como invocar o modal (props mode/initial/edificios/onClose/onSaved).
- `src/lib/queries-client.js` — `getEdificios()` (id, nome, endereco) e `getUnidades()` (id, edificio_id, nome, descricao, area_m2, valor_mensal, valor_visivel, status, foto_url).
- `src/actions/edificios.js` — `criarEdificio`/`editarEdificio`/`deletarEdificio` (preservar).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `UnifiedUnidadeModal` (`src/components/ui/UnifiedUnidadeModal.js`): modal de edição de unidade reusado no drill-in; estender com `lockEdificio`.
- `getUnidades()` / `getEdificios()` (`src/lib/queries-client.js`): já trazem todos os campos necessários para stats — sem extensão de query.
- `PageHeader`, `Skeleton`, `Button`, `Input` (shadcn/ui): já usados em `GestaoEdificios.js`.
- Padrão `SkeletonEdificios` já existe — adaptar para skeleton de cards.

### Established Patterns
- Server Actions retornam `{ status: 200 }` ou `{ status: 4xx/5xx, erroMessage }`; CRUD de edifício já segue isso.
- Form state em objeto único `useState`; reset via função nomeada.
- Queries via `useEffect` → `queries-client.js`; sempre `?? []` em retornos de array; re-call após mutação (sem cache layer).
- Estilo: inline + CSS vars (`--fg-*`, `--border-*`, `--indigo`, `--surface`); classes utilitárias `romma-page`, `eyebrow`.

### Integration Points
- Stats e lista de unidades expandida derivam do mesmo `getUnidades()` carregado uma vez e agrupado por `edificio_id`.
- `onSaved` do modal deve recarregar unidades → recomputar stats + barra de ocupação (consistência após edição).
- `lockEdificio` default `false` mantém os call-sites de `Unidades.js` intactos.

</code_context>

<specifics>
## Specific Ideas

- Cards em **2 colunas** explicitamente (EDIF-01) — não lista vertical.
- Barra de ocupação **contígua, alugadas-first, sem buracos** é requisito literal (EDIF-02) — ordem de render importa.
- Linha de unidade clicável na íntegra (não só um botão pequeno) para o drill-in.

</specifics>

<deferred>
## Deferred Ideas

- Dashboard com agregados globais (ocupação/MRR consolidados) — Phase 21 (DASH-04..06).
- Exibição de foto de capa da unidade nas linhas expandidas do drill-in — não pedido no goal; possível polish futuro, fora do escopo EDIF-01..03.

None além das acima — discussão permaneceu no escopo da fase.

</deferred>

---

*Phase: 20-edif-cios-cards-drill-in*
*Context gathered: 2026-06-15*
