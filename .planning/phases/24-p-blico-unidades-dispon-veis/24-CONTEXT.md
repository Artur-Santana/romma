# Phase 24: Público — Unidades Disponíveis - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Visitantes navegam as Unidades disponíveis (variante A — cards com imagem) com **abas por edifício** (+ aba Todos), **ordenação** (relevância/menor valor/maior valor/maior área), **cards com imagem de capa**, **ficha bottom-sheet** com imagem + valor/m² + refs, e **Simular aluguel** que remove a unidade da lista com animação refletindo o realtime existente.

Cobre **PUB-01 a PUB-05**. Não altera schema — `foto_url` já existe na tabela `unidades` (Phase 17) e é gravado pela Phase 19. Não cria novas queries: `getUnidadesDisponiveis()` via RPC SECURITY DEFINER já retorna `foto_url`. Dependência de Phase 17 (tokens) e Phase 19 (foto_url preenchido no DB).

**Fora de escopo:** favoritar/lista de interesse, indicador "X pessoas vendo agora", qualquer nova query ou mutação, upload de fotos (Phase 19), alteração de schema, alteração de RLS.

</domain>

<decisions>
## Implementation Decisions

### Componentes alvo (evolução in-place)

- **D-01 (Componente principal):** Evoluir `UnidadesPublicas.js` in-place — adicionar sort control, desktop grid, e tokens tipográficos. Não renomear nem criar novo arquivo.
- **D-02 (Card):** Evoluir `UnidadePublicaCard.js` in-place — adicionar imagem de capa (altura 116px, igual `public.jsx:22-31`) com filter `grayscale(0.3) contrast(1.1) brightness(0.6)` + overlay indigo 12% alpha + `StatusBadge` absoluto top-right. Aplicar tokens `r-subhead`, `r-meta` na tipografia.
- **D-03 (Detail sheet):** Evoluir `UnidadeDetailSheet.js` in-place — adicionar imagem (160px), valor/m² (quando `valor_visivel`), refs LOC + REF (igual design), renomear botão CTA para `"[>] Simular Aluguel"`.

### Exibição de foto_url (contexto anon — bucket PRIVATE)

- **D-04 (Estratégia foto_url):** Implementar helper `resolveFotoUrl(foto_url)` no client:
  1. Se `foto_url` começa com `/` → retornar direto (public asset — caso do "usar foto de exemplo" da Phase 19 D-09).
  2. Se `foto_url` é path de Storage (não começa com `/`, não nulo) → chamar `supabase.storage.from('unidades-fotos').createSignedUrl(foto_url, 3600)` via anon client; usar `signedUrl` resultante.
  3. Se `foto_url` é null ou signing falhar → fallback para `/Detalhe_Arquitetonico.png`.
- **D-05 (Carregamento async de signed URLs):** `resolveFotoUrl` é async. Resolver as URLs no `useEffect` inicial (junto com o load de dados) e armazenar em um mapa `{ [unidade_id]: resolvedSrc }` no state. Cards/sheet usam o mapa; enquanto não resolvido, mostram o placeholder.
- **D-06 (next/image):** Usar `<Image fill objectFit="cover" />` para as fotos (remotePatterns para `vfymttcajeyhrmsyhrtj.supabase.co` já em `next.config.mjs` — Phase 17). Para o placeholder `/Detalhe_Arquitetonico.png`, usar `<Image>` normal sem `fill`.

### Ordenação (PUB-02)

- **D-07 (Sort control):** Linha abaixo das abas, mesma barra de count (flex justify-between): contagem `{N} UNIDADES` à esquerda + label `"Ordenar"` + pills de sort à direita. 4 pills: Relevância / Menor valor / Maior valor / Maior área. Pill ativa: borda `--indigo` + bg `oklch(0.339 0.179 301.68 / 0.18)`. Igual `public.jsx:152-163`.
- **D-08 (Sort logic):** Client-side sobre a lista já carregada. `sortUnits(list, sort)` — mesmo algoritmo de `public.jsx:14-18`. "Relevância" = sem sort (ordem original da query).

### Abas com contadores (PUB-01)

- **D-09 (Contadores):** Contador da aba reflete as unidades NÃO removidas (`disponiveis` filtradas pelo `removedIds` Set). Mantém a lógica atual de `UnidadesPublicas.js:55-57`.
- **D-10 (Nome curto):** Manter `shortenName()` existente em `UnidadesPublicas.js` para os labels das abas.

### Desktop layout (PUB-03)

- **D-11 (Grid):** No desktop (`md:`): `grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))]` com `gap-3` — mesma lógica de `public.jsx:181`. No mobile: `grid-cols-1`. Container `maxWidth: 1100, margin: "0 auto"` wrapping o grid e o footer, com padding `var(--rd-gutter-m)`.
- **D-12 (Scroll):** Container de lista com `flex-1 overflow-auto min-h-0` (padrão Phase 17 REFINO-03 já implementado).

### Ficha bottom-sheet (PUB-04)

- **D-13 (Conteúdo da sheet):** Imagem de capa (160px, `resolveFotoUrl`), grade 2 colunas (Área + Valor mensal com `--primary-hover` quando visível), valor/m² (`Math.round(valor_mensal / area_m2)`) em row separado apenas quando `valor_visivel`, refs em row (LOC: coords simuladas + REF: `RM-2026-{id.slice(0,6).toUpperCase()}`), descrição.
- **D-14 (Botão CTA):** `"[>] Simular Aluguel"` (estado normal) → `"[···] Processando"` (loading durante animação). Chama `onSimular(unidade.id)`. Estilo bracket igual ao dos forms de acesso.

### Simular aluguel (PUB-05)

- **D-15:** Lógica existente mantida: `setRemovingId(uid)` → 700ms → `setRemovedIds(prev => new Set([...prev, uid]))` + fechar sheet. Animação `opacity-0 transition-opacity duration-700` (atual) suficiente; pode ajustar para `rUnitOut` com blur+slide se trivial.

### Claude's Discretion

- Posição exata do botão "✕" no header da sheet (44×44 com border atual vs. estilo exato do design).
- Se `simulating` state entra no `UnidadesPublicas.js` ou fica encapsulado no `UnidadeDetailSheet`.
- Skeleton loading para as fotos enquanto signed URLs resolvem (pode usar `bg-surface/50` placeholder).
- Se o helper `resolveFotoUrl` fica inline no componente ou em `src/lib/utils.js`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design (fonte visual canônica)
- `.planning/design/js/public.jsx` — `PublicUnidadesScreen`, `PublicUnitCard`, `UnitSheet` — referência completa de sort, grid, card com imagem, bottom-sheet, simular aluguel; **portar para o codebase real** trocando dados mock por Supabase.
- `.planning/design/screenshots/desktop/10-publico.png` — alvo visual desktop.
- `.planning/design/screenshots/mobile/10-publico.png` — alvo visual mobile.
- `.planning/design/README.md` §"Público — Unidades Disponíveis" — variante A escolhida + features + itens removidos (sem favoritar, sem viewers).
- `.planning/design/styles/app.css` — tokens `--rt-*`, `--rd-*`, animações `rSheetUp`, `rUnitOut`.
- `src/app/globals.css` — tokens de produção (`--indigo`, `--surface`, `--border-3`, `--font-mono`, `--font-body`).

### Código a evoluir
- `src/components/features/UnidadesPublicas.js` — componente principal (168L): adicionar sort, desktop grid, tokens. **Evoluir in-place.**
- `src/components/features/UnidadePublicaCard.js` — card sem imagem: adicionar imagem de capa + tokens. **Evoluir in-place.**
- `src/components/features/UnidadeDetailSheet.js` — sheet existente: adicionar imagem, valor/m², refs, renomear botão CTA. **Evoluir in-place.**
- `src/lib/queries-client.js` §`getUnidadesDisponiveis` (linha 77) — RPC SECURITY DEFINER já retorna `foto_url`. **Sem alteração.**
- `src/lib/supabase-browser.js` — usar para `createSignedUrl` na função `resolveFotoUrl`.

### Infra de foto (Phase 17 + 19)
- `.planning/phases/19-unidades-modal-unificado-foto-de-capa/19-CONTEXT.md` — D-09 (asset estático = path `/...`), D-10 (foto_url armazena path; display via signed URL on-read), D-08 (path format `{unidade_id}/{uuid}.ext`).
- `.planning/phases/17-funda-o-tokens-mobile-modal-fixes-infra/17-CONTEXT.md` — bucket `unidades-fotos` PRIVATE, RLS SECURITY DEFINER, `remotePatterns` sem search key.

### Requisitos
- `.planning/REQUIREMENTS.md` — PUB-01 a PUB-05.
- `.planning/ROADMAP.md` §"Phase 24" — Goal + 4 Success Criteria.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `UnidadesPublicas.js` — já tem: tabs por edifício, contadores, realtime (INSERT/DELETE), `removedIds` Set, `simularAluguel()` com 700ms delay, `shortenName()`, `edificioById` memoizado. Adicionar: sort state + `sortUnits()`, grid desktop, sort control UI, `fotoSrcs` state (mapa id→resolvedSrc).
- `UnidadePublicaCard.js` — já tem: nome, edifício, área, valor mascarado, StatusBadge, `isRemoving` opacity. Adicionar: imagem de capa (topo do card, 116px), receber `fotoSrc` como prop.
- `UnidadeDetailSheet.js` — já tem: close on backdrop, header com nome/edifício/ref, grade área/valor, descrição, endereço, botão CTA, animação entrada. Adicionar: imagem (160px), valor/m², refs LOC+REF, texto do botão "[>] Simular Aluguel".
- `fmtBRL` (`src/lib/utils.js`) — já importado em UnidadePublicaCard e UnidadeDetailSheet.
- `RealtimeDot` (`src/components/ui/RealtimeDot.js`) — já usado em UnidadesPublicas.js.
- `StatusBadge` (`src/components/ui/StatusBadge.js`) — já usado em UnidadePublicaCard.js.

### Established Patterns
- Realtime: canal `supabase.channel('public-unidades')` com INSERT+DELETE já funcional — não alterar.
- `removedIds` + `removingId` + `setTimeout` 700ms: padrão de animação de remoção já implementado.
- `edificioById` via `useMemo` + `Object.fromEntries`: padrão de lookup já presente.
- Signed URL via `supabase-browser.js`: mesmo padrão usado em Unidades.js do dashboard (Phase 19).
- `style={{ all: 'unset', cursor: 'pointer' }}` para botões sem estilo padrão.

### Integration Points
- `UnidadesPublicas.js` → `UnidadePublicaCard` (passar `fotoSrc` como prop nova).
- `UnidadesPublicas.js` → `UnidadeDetailSheet` (passar `fotoSrc` da unidade selecionada + novo texto do botão CTA).
- `resolveFotoUrl` usa `supabase-browser.js` — importar diretamente no componente (já é 'use client').
- `next/image` já configurado com `remotePatterns` para `vfymttcajeyhrmsyhrtj.supabase.co` (Phase 17).

</code_context>

<specifics>
## Specific Ideas

- Botão CTA da sheet: `"[>] Simular Aluguel"` → `"[···] Processando"` — estilo bracket igual à tela de acesso (Phase 18 `AuthField`/`SubmitButton`).
- Imagem do card: filter `grayscale(0.3) contrast(1.1) brightness(0.6)` + overlay `--primary-hover` 12% alpha — exatamente como `public.jsx:26-29`.
- REF da sheet: `RM-2026-{id.slice(0,6).toUpperCase()}` — igual `public.jsx:79`.
- Sort pills: borda `--indigo` + bg `oklch(0.339 0.179 301.68 / 0.18)` no ativo — igual `public.jsx:162`.
- Desktop: `maxWidth: 1100, margin: "0 auto"` wrapping todo o conteúdo — igual `public.jsx`.

</specifics>

<deferred>
## Deferred Ideas

- Animação `rUnitOut` com blur+slide (além do opacity simples atual) — polish post-banca.
- "Voltar" link → rota configurável (atualmente hardcoded `/`).

</deferred>

---

*Phase: 24-Público-Unidades-Disponíveis*
*Context gathered: 2026-06-17*
