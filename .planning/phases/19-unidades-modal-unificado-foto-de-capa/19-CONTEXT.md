# Phase 19: Unidades — Modal Unificado & Foto de Capa - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

O Proprietário gerencia Unidades numa grade de cards com barra de métricas-resumo, busca e filtros, criando/editando por um **único modal unificado** (`UnifiedUnidadeModal`) que inclui upload de foto de capa persistida no Storage privado. Remoção exige confirmação e limpa a foto órfã.

Cobre UNID-01..05. A infra de Storage (coluna `foto_url`, bucket `unidades-fotos` PRIVATE + RLS por cadeia de propriedade, `remotePatterns`) já foi entregue na Phase 17 — esta fase **consome** essa infra, não a recria. NÃO inclui Edifícios cards/drill-in (Phase 20 reusa o `UnifiedUnidadeModal` daqui).
</domain>

<decisions>
## Implementation Decisions

> Modo `--auto`: decisões abaixo são os defaults recomendados, selecionados sem prompt interativo. Revisar/editar antes de planejar se necessário.

### Arquitetura do Modal
- **D-01:** Criar componente novo e dedicado `UnifiedUnidadeModal` (não estender o form inline atual). Mesmo componente serve criar e editar via prop de modo + dados iniciais + callbacks. **Razão:** Phase 20 declara dependência explícita de reuso no drill-in — o modal precisa ser autocontido e reutilizável fora de `Unidades.js`.
- **D-02:** Substituir o form inline (`showForm`) e a edição inline por-card do `Unidades.js` atual pelo modal unificado. O fluxo passa a ser: clicar "Nova Unidade" ou "Editar" → abre o mesmo modal.
- **D-03:** Modal usa a utility `romma-modal-backdrop` (entregue na Phase 17) para centralização e backdrop, mantendo consistência com os modais migrados.

### Métricas-resumo, Busca e Filtros
- **D-04:** Métricas (área total m², MRR realizado, potencial em aberto, contagem de valores ocultos) são **derivadas client-side** da lista de unidades já carregada — sem query server-side dedicada. MRR realizado = soma `valor_mensal` das `alugada`; potencial em aberto = soma `valor_mensal` das `disponivel` (renderizado em dourado); valores ocultos = contagem `valor_visivel === false`.
- **D-05:** Busca por nome e filtros (status: todos/disponível/alugada; edifício) são **filtragem client-side** da lista carregada, atualizando ao vivo a cada keystroke/seleção. Dataset pequeno (TCC) não justifica round-trip server.

### Upload de Foto & Preview
- **D-06:** Seleção (arrastar/clicar) gera **preview local via object URL** imediatamente; o upload real só acontece no submit do modal. Evita órfãos de formulários abandonados.
- **D-07:** Upload feito client-side via `supabase-browser` direto ao bucket privado `unidades-fotos`; a **Server Action grava apenas a string do path** em `unidades.foto_url` (nunca recebe/processa o binário). Validação de MIME `image/*` e tamanho `<2MB` no cliente antes do upload, re-checada na Server Action onde aplicável.
- **D-08:** Path do objeto no bucket estruturado para resolver a cadeia de propriedade da RLS (segmento por `edificio_id`), ex.: `{edificio_id}/{uuid}.{ext}`. Cadeia de propriedade validada por `edificio.proprietario_id` mantida em toda mutação.

### Foto de Exemplo
- **D-09:** "Usar foto de exemplo" referencia um **asset estático em `/public`** salvo diretamente em `foto_url` — não passa pelo Storage (sem upload). Simplifica o fluxo de demo.

### Valor de `foto_url` & Exibição
- **D-10:** `foto_url` armazena o **path do objeto no Storage** (não URL pública). Como o bucket é privado, a exibição gera **signed URL on-read** via `supabase-browser` (`createSignedUrl`). Asset de exemplo (`/public`) é exibido direto pelo path público.

### Remoção com Cleanup
- **D-11:** (Locked pelo goal SC5) Remover exige modal de confirmação (reusar `ConfirmDialog`). A foto órfã é deletada do Storage **antes** do delete no banco, mas o delete do DB **não bloqueia** por falha de cleanup (best-effort no Storage, log/ignore erro).

### Claude's Discretion
- Layout exato da grade de cards e da barra de métricas.
- Estrutura precisa do componente de dropzone/upload (custom vs. input file estilizado).
- Nome/formato exato do asset de foto de exemplo em `/public`.
- Geração do UUID do path (client-side `crypto.randomUUID()` é aceitável).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & Requisitos
- `.planning/ROADMAP.md` §"Phase 19" — Goal, Success Criteria 1-5, Depends on Phase 17.
- `.planning/REQUIREMENTS.md` — UNID-01..05 (definições normativas dos requisitos).

### Infra herdada da Phase 17 (pré-requisito)
- `.planning/phases/17-funda-o-tokens-mobile-modal-fixes-infra/17-CONTEXT.md` — decisões de Storage: `unidades.foto_url` TEXT nullable, bucket `unidades-fotos` PRIVATE + RLS por cadeia de propriedade (unidade→edificio→proprietario_id), display via signed URLs, `next.config.mjs` remotePatterns (search key omitido p/ permitir `?token=`), utility `romma-modal-backdrop`.

### Código existente a modificar/reusar
- `src/components/features/Unidades.js` — tela atual (form inline + edição por-card) a ser refatorada para usar o modal.
- `src/actions/unidades.js` — `criarUnidade`/`editarUnidade`/`deletarUnidade`; estender para gravar `foto_url` e cleanup de Storage no delete.
- `src/components/ui/ConfirmDialog.js` — reuso na confirmação de remoção.
- `src/lib/supabase-browser.js` — client anon p/ upload e signed URLs no browser.
- `src/lib/queries-client.js` — `getUnidades`/`getEdificios` (estender p/ trazer `foto_url`).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ConfirmDialog` (`src/components/ui/ConfirmDialog.js`): modal de confirmação para a remoção destrutiva (SC5).
- `supabase-browser` (`src/lib/supabase-browser.js`): client anon já existente para upload client-side e `createSignedUrl`.
- `romma-modal-backdrop` (CSS, Phase 17): backdrop/centralização do modal unificado.
- Componentes UI shadcn já no projeto: `Input`, `Select`, `Button`, `Skeleton`, `PageHeader`.
- `useUnidadesRealtime` (`src/hooks/useUnidadesRealtime.js`): subscription Realtime existente (limitação conhecida: `disponivel→alugada` não propaga).

### Established Patterns
- Server Actions retornam `{ status: 200 }` ou `{ status: 4xx/5xx, erroMessage }`; `authGuard()` local + validação UUID por regex (ver `src/actions/unidades.js`).
- Mutações usam `supabaseAdmin` (server-only) com checagem de cadeia `edificio.proprietario_id`.
- Form state em objeto único `useState`; reset via função nomeada.
- Queries centralizadas em `queries-client.js`; sempre `?? []` em retornos de array.

### Integration Points
- A Server Action de upload grava só a string do path (binário sobe pelo browser direto ao Storage).
- `foto_url` precisa fluir de `getUnidades` → card/modal; exibição via signed URL.
- O `UnifiedUnidadeModal` será importado por Phase 20 (drill-in de Edifícios) — manter API desacoplada de `Unidades.js`.

</code_context>

<specifics>
## Specific Ideas

- Potencial em aberto destacado em **dourado** (token de cor) na barra de métricas — ênfase visual pedida explicitamente no goal.
- Fluxo de foto deve oferecer as 3 ações: arrastar/clicar → preview, "usar foto de exemplo", e trocar/remover.

</specifics>

<deferred>
## Deferred Ideas

- Edifícios em cards de 2 colunas com stats e barra de ocupação + drill-in reusando este modal — **Phase 20**.
- Exibição de foto de capa nas páginas públicas de Unidades — depende de `foto_url` gravado aqui; consumido em Phase 24 (per ROADMAP "Depends on Phase 19").

None além das acima — discussão permaneceu no escopo da fase.

</deferred>

---

*Phase: 19-unidades-modal-unificado-foto-de-capa*
*Context gathered: 2026-06-14*
