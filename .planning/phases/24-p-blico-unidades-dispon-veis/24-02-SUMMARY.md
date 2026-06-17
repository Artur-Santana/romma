---
phase: 24-publico-unidades-disponiveis
plan: "02"
subsystem: frontend/public
tags: [public-page, cards, sort, signed-url, sheet, animation]
dependency_graph:
  requires: [24-01-rpc-foto-url]
  provides: [/unidades PUB-01, /unidades PUB-02, /unidades PUB-03, /unidades PUB-04, /unidades PUB-05]
  affects:
    - src/components/features/UnidadesPublicas.js
    - src/components/features/UnidadePublicaCard.js
    - src/components/features/UnidadeDetailSheet.js
tech_stack:
  added: []
  patterns:
    - fotoSrcs async via Promise.all + createSignedUrl anon (D-04/D-05)
    - sortUnits() client-side com null guard
    - simulating state no pai (UnidadesPublicas) passado como prop (UI-SPEC Interaction Contract)
    - rSheetUp 320ms ease-crisp no painel da sheet (D-14)
key_files:
  created: []
  modified:
    - src/components/features/UnidadesPublicas.js
    - src/components/features/UnidadePublicaCard.js
    - src/components/features/UnidadeDetailSheet.js
decisions:
  - fotoSrcs resolvidos async no useEffect via createSignedUrl anon (fallback para placeholder)
  - simulating state fica no pai UnidadesPublicas (não encapsulado na sheet) conforme UI-SPEC
  - sortUnits aplica null guard ?? Infinity / ?? -Infinity para unidades sem valor
  - rSheetUp aplicada ao painel interno da sheet (Pitfall 5 corrigido)
  - refOf() mantido no header da sheet; REF de display RM-2026-{id[0:6]} é campo separado (Pitfall 6)
metrics:
  duration: "~20min"
  completed: "2026-06-17"
  tasks_completed: 3
  tasks_total: 4
  files_created: 0
  files_modified: 3
---

# Phase 24 Plan 02: Componentes Públicos — Sort, Cards com Imagem, Sheet com Foto Real Summary

**One-liner:** Três componentes da listagem pública evoluídos in-place: sort pills client-side, cards verticais com imagem 116px + overlay + StatusBadge absoluto em grid responsivo, e sheet com imagem real 160px + valor/m² + refs LOC+REF + CTA "[>] Simular Aluguel" com animação rSheetUp.

## What Was Built

### Task 1 — UnidadesPublicas.js (commit 92b7c18)

- States novos: `sort` (default `'rel'`), `fotoSrcs` (default `{}`), `simulating` (default `false`)
- Constante `SORTS` com 4 entradas: `rel/Relevância`, `valor_asc/Menor valor`, `valor_desc/Maior valor`, `area_desc/Maior área`
- Função pura `sortUnits(list, sort)` com null guard (`?? Infinity`, `?? -Infinity`, `?? 0`)
- Helper async `resolveFotoUrl(supabase, foto_url)`: path `/` → direto; path Storage → `createSignedUrl(3600)`; null → placeholder `/Detalhe_Arquitetonico.png`
- `useEffect` resolve todos os fotoSrcs via `Promise.all` após load dos dados
- Barra de contagem substituída: `flex justify-between` — "N UNIDADES" à esq + label "Ordenar" + 4 pills à dir
- Grid responsivo: `grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3` em wrapper `maxWidth:1100`
- `simularAluguel()` agora controla `simulating` no pai (true → 800ms → false + close sheet + removingId)
- Props `fotoSrc` e `simulating` passadas para filhos

### Task 2 — UnidadePublicaCard.js (commit 96eba47)

- Aceita prop nova `fotoSrc`
- Layout convertido de row horizontal → card vertical (`flex-col`, `gap-14`, `padding 18px`)
- Bloco de imagem no topo: container `position:relative height:116 overflow:hidden border:border-3`
- `<Image fill>` com `filter: grayscale(0.3) contrast(1.1) brightness(0.6)` e `sizes`
- Overlay `var(--primary-hover)` opacity `0.12`
- `StatusBadge` posicionado absoluto `top:10 right:10` sobre a imagem
- Nome: `.r-subhead` + `fontSize:17 letterSpacing:-0.3px`; edifício: `.r-meta` + `marginTop:4 letterSpacing:1px`
- Footer: área em `.r-meta` | valor em `font-mono 700 13px color:var(--primary-hover)` ou "Consulte o Proprietário"
- `refOf()` removido do card — ref só na sheet
- Animação de remoção `opacity-0 transition-opacity duration-700` mantida

### Task 3 — UnidadeDetailSheet.js (commit c0f23b4)

- Aceita props novas `fotoSrc` e `simulating`
- Imagem: container `position:relative height:160 marginBottom:18 border:border-3` com `<Image fill src={fotoSrc}>` + filter `brightness(0.65)` (0.05 mais forte que card) + overlay `0.16`
- Row "Valor / m²": só quando `unidade.valor_visivel && unidade.area_m2 > 0` (guard divisão por zero)
- Row de refs: `LOC: −23.561° S, 46.656° W` (estático) + `REF: RM-2026-{id[0:6].toUpperCase()}`
- `refOf(unidade)` mantido no header (campo diferente do REF de display público — Pitfall 6)
- Botão CTA: `[>] Simular Aluguel` / `[···] Processando` com `disabled={simulating}`
- Animação de entrada: `animation: rSheetUp 320ms var(--ease-crisp) both` no painel (Pitfall 5 corrigido)
- Backdrop click, drag handle e header preservados

## Task Commits

| Task | Nome | Commit | Arquivos |
|------|------|--------|----------|
| 1 | UnidadesPublicas — sort, fotoSrcs, grid | 92b7c18 | UnidadesPublicas.js |
| 2 | UnidadePublicaCard — imagem, overlay, tokens | 96eba47 | UnidadePublicaCard.js |
| 3 | UnidadeDetailSheet — imagem real, valor/m², refs, CTA | c0f23b4 | UnidadeDetailSheet.js |
| 4 | Checkpoint visual (aguardando) | — | — |

## Deviations from Plan

### Crítica (documentada no prompt de execução)

**[CRITICAL DEVIATION] foto_signed_url não existe no resultado da RPC**
- **Origem:** Plan 24-01 não conseguiu usar `storage.sign()` SQL — não existe no Supabase
- **Impacto:** O plano original dizia construir `fotoSrcs` sincronamente via `u.foto_signed_url`
- **Solução adotada (D-04/D-05 do CONTEXT.md):** `resolveFotoUrl()` async via `supabase.storage.from('unidades-fotos').createSignedUrl(foto_url, 3600)` no client (anon key)
- **Habilitado por:** Policy `anon SELECT` em `storage.objects` adicionada no Plan 24-01
- **Comportamento atual:** `foto_url` é NULL para todas as unidades em produção → todas usam `/Detalhe_Arquitetonico.png` (correto)
- **Files modified:** `UnidadesPublicas.js`

### Auto-adições (Rule 2)

**[Rule 2 - Missing Guard] Guard de divisão por zero em Valor/m²**
- **Encontrado durante:** Task 3
- **Issue:** O plano pedia `unidade.valor_visivel` como única condição; divisão por `area_m2 = 0` causaria `Infinity`
- **Fix:** Condição expandida para `unidade.valor_visivel && unidade.area_m2 > 0`
- **Files modified:** `UnidadeDetailSheet.js`

## Known Stubs

Nenhum. O placeholder `/Detalhe_Arquitetonico.png` é comportamento correto documentado (foto_url NULL em produção), não um stub — a lógica de resolução async funciona e vai exibir fotos reais quando `foto_url` for preenchido.

## Threat Flags

Nenhum. O client anon usa `createSignedUrl` (TTL 3600s) via policy explícita — nenhuma superfície nova além do que o Plan 24-01 já habilitou.

## Correções pós-UAT (Task 4 — verificação humana)

A verificação ao vivo revelou divergências vs design original e um pivot de fluxo. Correções aplicadas e aprovadas pelo usuário:

1. **Sheet alinhado ao design** (66818fb): modal centrado `maxWidth 520` (era full-width); header com eyebrow `Unidade · {edifício}` (era refOf UN-...); métricas `r-metric 30px`; valor mensal via `fmtBRLk` ("R$6,8k"); CTA bracket `[>] … ENTER`; removido row Endereço + botão Fechar + drag handle. Adicionados `fmtBRLk` + `shortBuilding` em utils.js.

2. **Card alinhado** (66818fb): nome do edifício via `shortBuilding`; valor footer em span único ("Consulte o proprietário" minúsculo).

3. **Pivot CTA "Simular Aluguel" → "Falar com Proprietário"** (83c3cd5): visitante não aluga (Proprietário fecha). Click → feedback `[✓] Solicitação enviada` self-contained, **sem remover card**. Removido fluxo de simular/remoção (`removedIds`, `removingId`, `timerRef`, `simularAluguel`, props `simulating`/`onSimular`/`isRemoving`). `key={selected.id}` reseta feedback.

4. **Barra superior contida** (83c3cd5): header + tabs em `maxWidth 1100` alinhados ao grid (antes edge-to-edge). Título desktop `40px`.

5. **Contraste** (75fcfd3): count da aba ativa `text-indigo`→`text-fg-1`; total UNIDADES `opacity 0.6`→`fg-3`.

6. **Tabs inline style** (9351e31): `all:unset` inline matava border/font/uppercase/gap do className → portado pra inline completo.

7. **Drag-to-scroll nas tabs** (957f218): scrollbar oculto + click-arrastar; supressão de click quando arrasto >4px.

## Self-Check: PASSED

- [x] PUB-01..PUB-05 verificados ao vivo em /unidades (anon) — aprovado pelo usuário
- [x] Sheet, card e barra superior batem com o design original
- [x] CTA pivotado para "Falar com Proprietário" com feedback de interesse
- [x] Drag-to-scroll funcional nas tabs
- [x] ESLint limpo nos 3 arquivos após todas as correções
- [x] Task 4 (checkpoint) aprovado
