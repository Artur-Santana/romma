# Phase 17: Fundação — Tokens, Mobile/Modal Fixes & Infra - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Base de design + infraestrutura para todas as telas da v1.5. Entrega (aditiva, zero regressão visual nas telas ainda não refatoradas):
- Tokens tipográficos (`--rt-*`, 8 níveis) e de densidade (`--rd-*`, nível "regular") em `globals.css`.
- Fixes cross-cutting nas cascas de layout: scroll mobile (cadeia `min-height:0` + altura), modal centralizado (`romma-modal-backdrop` fixed inset:0), animações de entrada sem fill `both`.
- Schema/Storage/config: migração `unidades.foto_url`, colunas `proprietarios.nome/sobrenome/telefone`, bucket Storage `unidades-fotos` PRIVATE + RLS, `next.config.mjs` `images.remotePatterns`.

Cobre REFINO-01..05. NÃO inclui refatoração das telas em si (fases 18-25 consomem esses tokens).
</domain>

<decisions>
## Implementation Decisions

### Tokens & Densidade
- Copiar nomes/valores dos tokens exatamente do design handoff (`.planning/design/styles/app.css`): `--rt-metric/title/title-sm/section/subhead/body/data/label/meta` + `--rd-gutter/gutter-m/page-y/block/block-sm/panel/cell/row-y/row-x`.
- **Apenas densidade "Regular"** (bloco `:root`). NÃO implementar `[data-density="compact"]` nem `[data-density="comfy"]`, nem toggle, nem qualquer código que assuma a existência de outras densidades (REFINO-F1 deferido por completo).
- Colocar em nova seção claramente marcada dentro de `src/app/globals.css` (aditivo, zero regressão).
- Portar as classes helper `.r-*` (`.r-metric/.r-title/.r-section/.r-subhead/.r-body/.r-data/.r-label/.r-meta/.r-eyebrow`, `.r-panel/.r-divtop/.r-divrt`) + keyframes (`rFade` etc.) — as telas consomem direto.

### Migração & Infra
- Migração via arquivo SQL versionado em `supabase/migrations/` (convenção do projeto) **e** aplicar no projeto hosted remoto agora (demo precisa estar live).
- `proprietarios.nome/sobrenome/telefone`: TEXT **nullable** (linha existente fica null; Phase 18 popula no signup).
- `unidades.foto_url`: TEXT nullable.
- Bucket Storage `unidades-fotos`: **PRIVATE** + políticas RLS por cadeia de propriedade (unidade → edificio → proprietario_id); display via signed URLs.
- `next.config.mjs`: adicionar `images.remotePatterns` para `vfymttcajeyhrmsyhrtj.supabase.co`.

### Fixes Cross-cutting de Layout
- Fix de scroll aplicado às 3 cascas agora: dashboard layout, portal layout, listagem pública — cadeia `min-height:0` nos flex containers + altura definida em html/body/root; barra inferior mobile permanece visível ao rolar.
- Utility `romma-modal-backdrop` (fixed inset:0, centraliza na viewport inteira no mobile) **e** refatorar modais existentes para usá-la.
- Retrofit das animações de entrada existentes: estado base VISÍVEL, animação só toca in (sem fill `both`), `@media print` safeguard, respeitar `prefers-reduced-motion`. Padrão `.r-fade` do handoff.
- Altura `height:100%` + gestão de overflow escopada nas **cascas** (não global em html/body) para não quebrar páginas públicas estáticas.

### Claude's Discretion
- Valores px exatos de densidade vêm do handoff; ajustes finos se conflitarem com layout existente ficam a critério.
- Estrutura exata das políticas RLS do bucket.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/globals.css` — já tem CSS vars Obsidian Blueprint (`--fg-1..5`, `--border-1..3`, `--surface`, `--indigo`, `--highlight`, `--font-*`). Tokens novos são aditivos sobre essa base.
- `.planning/design/styles/app.css` — fonte de verdade dos tokens `--rt-*`/`--rd-*` e classes `.r-*`.
- `.planning/design/screenshots/desktop|mobile/*.png` — referência hifi por tela.
- `.planning/design/js/*.jsx` — protótipos React por tela (auth, console, overview, portal, public, shared).

### Established Patterns
- 5 clientes Supabase por contexto (`lib/supabase*.js`); `supabaseAdmin` server-only.
- RLS multi-tenant por `proprietario_id`; cadeia de propriedade unidade→edificio→proprietario_id já usada nas Server Actions (ex: `cancelarContrato` 3-hop).
- Migrações em `supabase/migrations/` com timestamp prefix (último: `20260524000000`).
- `next.config.mjs` minimal (`reactCompiler: true`) — sem `images` ainda.

### Integration Points
- `proprietarios` table atualmente só `id/usuario_id/created_at` — precisa ALTER ADD nome/sobrenome/telefone (consumido na Phase 18).
- `unidades` sem `foto_url` — precisa ALTER ADD (consumido nas Phases 19/24).
- Cascas de layout: `src/app/dashboard/layout.js`, layout do portal, listagem pública `/unidades`.
- Modais existentes (Contratos, Unidades, Locatarios) a serem migrados p/ `romma-modal-backdrop`.

</code_context>

<specifics>
## Specific Ideas

- Token spec exato em `.planning/design/styles/app.css` (já lido) — usar valores 1:1.
- Supabase project: `vfymttcajeyhrmsyhrtj` · `https://vfymttcajeyhrmsyhrtj.supabase.co`.
- Animação: padrão handoff `@keyframes rFade { from { transform: translateY(8px); } to { transform: translateY(0); } }` — sem `opacity:0` como fill final.

</specifics>

<deferred>
## Deferred Ideas

- REFINO-F1: variantes de densidade compact/comfy + toggle pelo usuário — deferido pós-v1.5, NÃO implementar nada relacionado nesta fase.

</deferred>
