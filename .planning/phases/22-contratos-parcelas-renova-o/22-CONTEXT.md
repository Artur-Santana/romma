# Phase 22: Contratos & Parcelas — Renovação - Context

**Gathered:** 2026-06-15
**Status:** Ready for planning

<domain>
## Phase Boundary

O Proprietário recebe **dois upgrades paralelos**:

1. **Tela de Contratos** (`src/components/features/Contratos.js`) — variante B do design: cards no desktop com busca inline, filtro "Vencendo", countdown de dias, barra de progresso início→término + arquivo toggleável de encerrados. Mobile mantém lista/rows.
2. **Tela de Parcelas** (`src/components/features/Parcelas.js`) — variante B do design: redesign completo da tela de detalhe do contrato com grade-resumo (5 colunas), resumo financeiro (4 colunas), barra de progresso das parcelas + timeline vertical, botão "Renovar" → modal que dispara `renovarContrato` SA.

Cobre **CONTR-01 a CONTR-05, PARC-01 a PARC-04**. Depende apenas de tokens da Phase 17. Caminho de escrita novo: `renovarContrato` SA faz UPDATE em contratos + INSERT de parcelas futuras em lote — **sem re-chamar a Edge Function `gerar-parcelas`**.

**Fora de escopo:** "Expandir contrato" (somando unidade) está cortado a pedido (ver REQUIREMENTS.md Out of Scope). Qualquer Realtime, novas tabelas, mudança de schema.
</domain>

<decisions>
## Implementation Decisions

> Modo `--auto`: decisões abaixo são os defaults recomendados, selecionados sem prompt interativo. Revisar/editar antes de planejar se necessário.

### Layout da tela de Contratos (CONTR-01, CONTR-02)

- **D-01 (Layout desktop):** Converter `Contratos.js` para **cards** no desktop (variante B do design, `console3.jsx:95-133`): `display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr))`. Cada card contém: badge status/vencendo, nome locatário, unidade + edifício abreviado, datas início→término com countdown de dias, barra de progresso `pctElapsed` (início→hoje/término, min 4%, max 100%), valor mensal, ações "Ver →" e "Cancelar". Borda `--warning` quando `isExpiring`. **Razão:** design canônico é variante B cards; ROADMAP diz "board de cards".
- **D-02 (Layout mobile):** Mobile mantém lista de rows (clicáveis → detalhe), sem cards. Cada row: nome locatário, unidade + datas abreviadas, badge. Padrão do design (`console3.jsx:152-158`).
- **D-03 (Countdown):** `daysLeft(c) = Math.ceil((new Date(c.data_fim) - new Date()) / 86400000)`. Exibido na borda inferior do card ao lado de `data_fim`. Cor `--warning` quando `isExpiring` (≤7 dias). Sem nova coluna na query — calculado client-side.
- **D-04 (Progresso):** `pctElapsed = Math.max(4, Math.min(100, Math.round(((hoje - inicio) / (fim - inicio)) * 100)))`. Barra de altura 4px, fundo `--surface-hi`, preenchimento `--primary-hover` (ou `--warning` quando expirando).

### Busca e filtro "Vencendo" (CONTR-01)

- **D-05:** Busca + filtro são **client-side** sobre a lista já carregada. `nameOf(c)` concatena `locatarios.nome_razao_social + unidades.nome` (dados já no join de `getContratos`). Toggle "Vencendo · N" exibe count de ativos expirando; quando ativo, filtra `view` para só mostrar expirando. Ao filtrar, exibe `N resultado(s)` em `r-meta`. Posição: acima da grade de cards / lista (igual design).

### Arquivo de encerrados (CONTR-04, CONTR-05)

- **D-06:** Toggle **inline** — o callout "Ver Arquivo →" existente (Contratos.js:434) vira botão funcional: alterna `showArquivo` state. Quando `true`, expande lista abaixo do callout com encerrados + cancelados (opacidade 0.78). Cada row do arquivo: ID arquivado, locatário, unidade + edifício + datas, badge status, botão "Ver →". Sem nova rota. Igual `console3.jsx:184-218`.
- **D-07:** Status do cancelar/encerrar: `cancelarContrato` já muda status para `cancelado` e libera unidade; `encerrarContrato` já muda para `encerrado`. No toggle arquivo, filtrar `contratos.status !== 'ativo'` para incluir ambos (`cancelado` + `encerrado`). **Razão:** REQUIREMENTS CONTR-04 diz "status 'encerrado'"; `cancelarContrato` existente muda para `cancelado` — ambos aparecem no arquivo histórico.

### Grade-resumo e resumo financeiro (PARC-01)

- **D-08 (Grade-resumo):** 5 colunas no desktop, 2×3 no mobile: Unidade, Edifício, Valor mensal, Início, Término. Dados já carregados no `carregar()` do Parcelas.js. Tokens: border `--border-3`, fundo células `var(--surface)`.
- **D-09 (Resumo financeiro):** 4 colunas: "Valor do contrato" (`parcelas.length × valor_mensal`), "Total recebido" (`pagas.length × valor_mensal`, cor `--success`), "Em aberto" (`(pendente + vencida + futura) × valor_mensal`, cor `--highlight`), "Inadimplência" (`vencidas.length × valor_mensal`; fundo `--danger-bg2` + cor `--danger-fg` quando `vencidas > 0`; senão `R$0` em `--fg-3`). Valores em `fmtBRL`. Igual `console3.jsx:276-289`.
- **D-10 (Derivação de valor):** Parcelas **não têm coluna de valor**. Valor = `unidade.valor_mensal` (já no estado `unidade` do Parcelas.js). Os cálculos financeiros usam esse valor derivado, não uma soma de parcelas com coluna própria.

### Timeline vertical de parcelas (PARC-02, PARC-03)

- **D-11 (Barra de progresso):** Acima da timeline: `parc.length` células de altura 6px separadas por gap 3px; cor por status: `--success` (paga), `--danger` (vencida), `--warning` (pendente), `--surface-hi` (futura). Label `pagas/total pagas` alinhado à direita. Igual `console3.jsx:296-298`.
- **D-12 (Timeline):** Substituir tabela atual por timeline vertical. Cada item: coluna esquerda = ponto colorido (12×12, `background: status_cor`; `border: 1px solid --fg-5` quando futura) + linha vertical (`width:1, background: --border-3, minHeight: 28`) até o último; coluna direita = "Parcela NN" + badge status + botão "✓ Registrar" (quando pendente/vencida) + meta: "Venc · data" + "Pago · data_ou_—" + `fmtBRL(valor_mensal)`. Igual `console3.jsx:300-327`. Sem tabela.
- **D-13 (Registrar pagamento):** `marcarParcelaComoPaga` já existe em `src/actions/parcelas.js`. Após sucesso: re-fetch parcelas + atualizar estado local para refletir mudança no resumo financeiro **ao vivo** (sem reload de página). Toast "Pagamento registrado · data". Comportamento atual do Parcelas.js já faz isso (linha 50-58) — manter e expandir para o resumo recalcular automaticamente (React state, sem query extra).

### Modal de renovação e SA renovarContrato (PARC-04)

- **D-14 (Trigger renovação):** Botão "Renovar" na tela de detalhe (Parcelas.js), no header ao lado do badge status — igual `console3.jsx:260`. Abre modal `showRenew`. **Não** adicionar botão na tabela de contratos (CONTR-05 não menciona renovação — só é PARC-04).
- **D-15 (Modal renovação):** Opções rápidas `+6 / +12 / +24 meses` como botões de grid 3 colunas + campo custom de meses (número livre). Mostra término atual: "Término atual: DD/MM/AAAA". Ao confirmar: fecha modal, chama SA, mostra toast, re-fetch contrato para atualizar grade-resumo. Igual `console3.jsx:346-384`.
- **D-16 (SA `renovarContrato`):** Nova export em `src/actions/contratos.js`. Assinatura: `renovarContrato(id, meses)`. Lógica:
  1. `authGuard()` + UUID_RE validate.
  2. Verificar cadeia de propriedade: `contratos → unidades.edificio_id → edificios.proprietario_id = user.id` (padrão já estabelecido).
  3. Buscar contrato atual: `data_fim`, + `MAX(numero)` das parcelas existentes via `SELECT numero FROM parcelas WHERE contrato_id = id ORDER BY numero DESC LIMIT 1`.
  4. Calcular nova `data_fim`: `new Date(data_fim + 'T12:00:00'); d.setMonth(d.getMonth() + meses); nova_data_fim = d.toISOString().slice(0, 10)`.
  5. `UPDATE contratos SET data_fim = nova_data_fim WHERE id = id`.
  6. Calcular novas parcelas: a partir do mês seguinte ao último `data_fechamento` existente (buscar com `SELECT data_fechamento FROM parcelas WHERE contrato_id = id ORDER BY numero DESC LIMIT 1`). Parcela N+1: `fechamento = dia 1 do próximo mês`; `vencimento = fechamento + 7 dias`; status = `'futura'`. Continuar mensalmente até `nova_data_fim`. Datas com `T12:00:00` para evitar UTC shift.
  7. `INSERT INTO parcelas (contrato_id, numero, data_fechamento, data_vencimento, status)` em lote.
  8. Retornar `{ status: 200 }` ou `{ status: 5xx, erroMessage }`.
  - **Razão:** SC-5 do ROADMAP é explícito: "append de novas parcelas futuras via Server Action, datas parseadas com T12:00:00, cadeia de propriedade verificada, parcelas já pagas preservadas — sem re-chamar a Edge Function gerar-parcelas".

### Claude's Discretion

- Numeração exata de parcelas novas (max(numero)+1 via SQL ou via lista carregada no frontend) — researcher/planner decide considerando atomicidade.
- Se o callout existente no Contratos.js precisa ser completamente substituído ou apenas ter onClick adicionado.
- Animação de entrada dos cards (rFade / `--ease-crisp`) — aplicar se já existir em globals.css, skip se não.
- Formatos do campo custom de meses (input number com min=1 max=36 é suficiente).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design (fonte visual canônica)
- `.planning/design/js/console3.jsx` — `ContratosScreen` (linhas 29-218) e `ContratoDetailScreen` (linhas 220-387): layout cards, busca, filtro vencendo, arquivo, timeline B, resumo financeiro, modal renovar — **portar para o codebase real trocando dados mock por Supabase**.
- `.planning/design/screenshots/desktop/07-contratos.png` — Alvo visual da tela de Contratos no desktop.
- `.planning/design/screenshots/desktop/08-contrato-parcelas.png` — Alvo visual da tela de detalhe no desktop.
- `.planning/design/screenshots/mobile/07-contratos.png` — Alvo visual mobile Contratos.
- `.planning/design/screenshots/mobile/08-contrato-parcelas.png` — Alvo visual mobile Parcelas.
- `.planning/design/README.md` §"Contratos" e §"Contrato · Parcelas" (linhas 121-136) — variante escolhida + lista de features.
- `.planning/design/styles/app.css` — Tokens de refino (`--rt-*`, `--rd-*`, animações `rFade`).
- `src/app/globals.css` — Tokens de produção (`--indigo`, `--warning`, `--danger`, `--success`, `--surface-hi`, `--border-3`, `--primary-hover`, `--highlight`).

### Código a estender/redesenhar
- `src/components/features/Contratos.js` — Componente atual (tabela simples) a converter para cards desktop + novas features.
- `src/components/features/Parcelas.js` — Componente atual (tabela simples) a redesenhar para timeline vertical + grade-resumo + resumo financeiro.
- `src/actions/contratos.js` — SA existentes; adicionar `renovarContrato` export.
- `src/actions/parcelas.js` — `marcarParcelaComoPaga` já existe; sem mudança necessária.
- `src/lib/queries-client.js` § `getContratos`, `getParcelasByContrato` — queries existentes; verificar se `getContratos` já faz join com `locatarios` e `unidades` (sim: linha `select('id, ... locatarios(nome_razao_social), unidades(nome)')`).

### Requisitos
- `.planning/REQUIREMENTS.md` — CONTR-01 a CONTR-05, PARC-01 a PARC-04 (linhas relevantes).
- `.planning/ROADMAP.md` §"Phase 22" — Goal + 5 Success Criteria (incluindo SC-5 renovação com T12:00:00).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`isExpiring(c)`** (Contratos.js:41-45): já calcula `diff ≤ 7 dias` — reaproveitável para o filtro toggle e a borda dos cards.
- **`ConfirmDialog`** (shadcn/ui): já usado em Contratos.js para cancelar/encerrar — reusar para confirmação no arquivo.
- **`getContratos()`** (queries-client.js): join `locatarios(nome_razao_social)` + `unidades(nome)` — busca client-side pode concatenar esses campos sem query extra.
- **`marcarParcelaComoPaga`** (parcelas.js action): chain de ownership completa (parcela→contrato→unidade→edificio→proprietario) — modelo a replicar em `renovarContrato`.
- **`fmtData`, `fmtBRL`, `cn`** — já usados nos dois componentes.
- **`StatusBadge`** — suporta `status="vencendo"` (Contratos.js:394) — manter no card.
- **`toast` (sonner)** — já integrado; padrão: `toast.success("mensagem")`.
- **`PageHeader`** — já importado em Contratos.js; manter.

### Established Patterns
- `authGuard()` local declarado em cada arquivo de actions (não compartilhado).
- UUID_RE redeclarado por arquivo de action.
- Cadeia de propriedade: `parcela → contrato → unidade → edificio.proprietario_id = user.id` (ver parcelas.js:20-38).
- Re-fetch após mutação: `Promise.all([getContratos(), getUnidades()]).then(...)` (Contratos.js:172-177).
- Animação de remoção: `removingIds` Set com opacity/scale fade-out 200ms (Contratos.js:71, 346-355).
- Form state: objeto único, `setForm({ ...form, key: val })`, reset via função nomeada.

### Integration Points
- `renovarContrato` usa `supabaseAdmin` para UPDATE + INSERT — sem nova query client.
- Frontend chama `renovarContrato(id, meses)` → re-fetch `getParcelasByContrato(contratoId)` + `getContratos()` para atualizar grade-resumo e a lista principal.
- Busca em Contratos: `nameOf(c) = (c.locatarios?.nome_razao_social ?? '') + ' ' + (c.unidades?.nome ?? '')` — campos já no resultado do join.

</code_context>

<specifics>
## Specific Ideas

- Cards dos contratos com borda `--warning` quando vencendo (ao invés de apenas cor do texto).
- Arquivo de encerrados com opacidade reduzida (0.78) para sinalizar estado arquivado.
- Modal de renovação com preview "Novo término: DD/MM/AAAA" calculado ao selecionar opção, antes de confirmar.
- Barra de progresso das parcelas: visualmente elegante com células de 6px por parcela (1 célula = 1 parcela), coloridas por status — narrativa imediata de qual posição está.
- Timeline vertical: ponto quadrado 12×12 (nunca círculo — regra Obsidian Blueprint) + linha vertical até próximo item.

</specifics>

<deferred>
## Deferred Ideas

- "Expandir contrato" (somando unidade) — explicitamente cortado a pedido (REQUIREMENTS.md Out of Scope).
- Reajuste IGP-M no detalhe do contrato — explicitamente removido (README.md §226).
- Realtime no detalhe de parcelas — não pedido; refresh basta para TCC.
- Filtro de arquivo por período/locatário — não escopo da fase.

</deferred>

---

*Phase: 22-contratos-parcelas-renova-o*
*Context gathered: 2026-06-15*
