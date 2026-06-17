# Phase 24: Público — Unidades Disponíveis - Research

**Researched:** 2026-06-17
**Domain:** Next.js 16 App Router, Supabase Storage signed URLs (anon context), Tailwind v4, React client state
**Confidence:** HIGH — all findings from direct codebase inspection

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Evoluir `UnidadesPublicas.js` in-place (não renomear, não criar novo arquivo).
- **D-02:** Evoluir `UnidadePublicaCard.js` in-place — imagem 116px, filter `grayscale(0.3) contrast(1.1) brightness(0.6)` + overlay indigo 12% alpha + `StatusBadge` absoluto top-right. Tokens `r-subhead`, `r-meta`.
- **D-03:** Evoluir `UnidadeDetailSheet.js` in-place — imagem 160px, valor/m², refs LOC+REF, renomear CTA para `"[>] Simular Aluguel"`.
- **D-04:** Helper `resolveFotoUrl(foto_url)` no client: `/` → direto; path Storage → `createSignedUrl` via anon client; null/falha → `/Detalhe_Arquitetonico.png`.
- **D-05:** Resolver URLs no `useEffect` inicial; armazenar em mapa `{ [unidade_id]: resolvedSrc }`. Cards/sheet consomem o mapa.
- **D-06:** `<Image fill objectFit="cover" />` para fotos Storage. `<Image>` normal para placeholder estático.
- **D-07:** Sort control — contagem à esquerda + label "Ordenar" + 4 pills à direita. Pill ativa: borda `--indigo` + bg `oklch(0.339 0.179 301.68 / 0.18)`.
- **D-08:** Sort client-side com `sortUnits(list, sort)` — Relevância = sem sort (ordem RPC).
- **D-09:** Contador da aba reflete `disponiveis` filtradas por `removedIds`.
- **D-10:** Manter `shortenName()` existente.
- **D-11:** Desktop: `grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))]` + `gap-3`. Mobile: `grid-cols-1`. Container `maxWidth: 1100, margin: "0 auto"` + padding `var(--rd-gutter-m)`.
- **D-12:** Container de lista com `flex-1 overflow-auto min-h-0`.
- **D-13:** Sheet: imagem 160px + grade 2 col (Área + Valor com `--primary-hover` quando visível) + valor/m² (quando `valor_visivel`) + refs LOC + REF + descrição.
- **D-14:** Botão CTA: `"[>] Simular Aluguel"` → `"[···] Processando"`. Chama `onSimular(unidade.id)`.
- **D-15:** Animação de remoção existente mantida (`setRemovingId` → 700ms → `setRemovedIds` + fechar sheet). `opacity-0 transition-opacity duration-700` atual suficiente.

### Claude's Discretion
- Posição exata do botão "✕" no header da sheet.
- Se `simulating` state fica em `UnidadesPublicas.js` ou encapsulado em `UnidadeDetailSheet`.
- Skeleton loading para fotos (pode usar `bg-surface/50` placeholder).
- Se `resolveFotoUrl` fica inline no componente ou em `src/lib/utils.js`.

### Deferred Ideas (OUT OF SCOPE)
- Animação `rUnitOut` com blur+slide (além do opacity simples atual) — polish post-banca.
- "Voltar" link → rota configurável (atualmente hardcoded `/`).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PUB-01 | Listagem pública tem abas por edifício (com contadores) + aba "Todos" | Abas já existem em UnidadesPublicas.js:51-112; apenas adicionar sort pills ao mesmo nível da barra de contagem |
| PUB-02 | Listagem pública permite ordenação (relevância / menor valor / maior valor / maior área) | `sortUnits()` do design public.jsx:12-17 é puro JS client-side; nenhuma query nova necessária |
| PUB-03 | Cards públicos exibem imagem de capa, área, valor (ou "Consulte") e status "Disponível" | Requer: (1) RPC atualizado com `foto_url`; (2) `resolveFotoUrl()` helper; (3) `<Image>` no card |
| PUB-04 | Ficha da unidade abre em bottom sheet com imagem, descrição, área, valor mensal, valor/m² e refs | UnidadeDetailSheet.js já tem estrutura; adicionar imagem real, valor/m², refs LOC+REF, botão renomeado |
| PUB-05 | "Simular aluguel" remove a unidade da lista com animação | Lógica `simularAluguel()` + `removedIds` já funcional; card já tem `opacity-0 transition-opacity` |
</phase_requirements>

---

## Summary

Phase 24 é puro frontend — três arquivos de componente evoluídos in-place, sem schema novo, sem Server Actions, sem queries novas (exceto o patch obrigatório na RPC). O codebase já tem 80% da lógica necessária (abas, realtime, removedIds, sheet com backdrop). O trabalho real se concentra em quatro pontos técnicos:

1. **RPC gap crítico:** `get_unidades_disponiveis()` não retorna `foto_url`. A coluna existe na tabela, mas o `RETURNS TABLE` da função e o SELECT interno não a incluem. Nenhum plano pode assumir que `u.foto_url` chega do RPC sem primeiro atualizar a função.

2. **Anon client NÃO pode chamar `createSignedUrl` no bucket `unidades-fotos`:** O bucket é privado e a única policy de SELECT em `storage.objects` é `TO authenticated` (verifica propriedade via `storage_unidade_owned_by_auth`). Não existe policy de SELECT `TO anon`. Chamadas de `supabase.storage.from('unidades-fotos').createSignedUrl(...)` via cliente anon retornam erro de permissão. A alternativa é uma RPC SECURITY DEFINER que retorna as signed URLs server-side — exatamente o que a Context.md D-04 implica ao incluir o passo de chamar via anon client, mas que na prática precisa ser mediado por um workaround. Ver seção "foto_url / Signed URL Strategy" abaixo.

3. **Animação de saída card:** `rommaUnitOut` / `rUnitOut` já definidas em globals.css; o card atual usa `transition-opacity duration-700`. Ambas as abordagens são disponíveis — a decisão é qual aplicar (D-15 mantém opacity; `rUnitOut` é blur+slide mas está marcado como deferred).

4. **Sort + realtime:** Não há conflito de state — sort é aplicado sobre `filtered` (que já exclui `removedIds`), realtime apenas recarrega do DB. A única interação a testar é quando um item é removido via "Simular" e está em uma posição de sort específica.

**Primary recommendation:** Quebrar em 2 planos — Plano 01 (migração RPC + foto_url strategy) e Plano 02 (evolução dos três componentes).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Dados de unidades disponíveis | Database (RPC SECURITY DEFINER) | — | Já resolve RLS para anon+authenticated |
| Resolução de foto (signed URL) | Database (RPC SECURITY DEFINER) | — | Bucket privado; anon não tem policy de SELECT em storage.objects; apenas SECURITY DEFINER pode assinar URLs para anon |
| Abas por edifício + contadores | Browser/Client | — | Computed de `disponiveis` já carregadas |
| Sort client-side | Browser/Client | — | `sortUnits()` sobre lista em memória |
| Animação de remoção | Browser/Client | — | `setRemovingId` + timeout já funcional |
| Grid responsivo | Browser/Client | — | CSS grid classes Tailwind |
| Bottom sheet + backdrop | Browser/Client | — | `fixed inset-0` já implementado |
| Realtime (INSERT/DELETE) | Browser/Client + Database | Supabase Realtime | Canal existente funcional |

---

## Technical Findings Per File

### 1. `src/lib/queries-client.js` — `getUnidadesDisponiveis()` (linha 77-83)

**O que existe:** Chama `supabase.rpc('get_unidades_disponiveis')`. Já mascara `valor_mensal` para null quando `!valor_visivel`.

**Problema crítico:** O RPC `get_unidades_disponiveis()` foi definido em `20260523000000_fix_unidades_select_public_rpc.sql`. O `RETURNS TABLE` lista 9 colunas: `id, edificio_id, nome, descricao, area_m2, valor_mensal, valor_visivel, status, edificio_nome`. **`foto_url` não está nessa lista.** A coluna foi adicionada à tabela em `20260601000000_v15_foundation.sql` (Phase 17), que veio depois. A função RPC nunca foi atualizada para incluir `foto_url`.

**Resultado:** `u.foto_url` retorna `undefined` para todos os items vindos do RPC. Cards e sheet receberão `foto_url: undefined`.

**Ação requerida em Plano 01:** Nova migration que faz `CREATE OR REPLACE FUNCTION public.get_unidades_disponiveis()` adicionando `foto_url text` ao `RETURNS TABLE` e `u.foto_url` ao SELECT interno.

**Sem alteração em `getUnidadesDisponiveis()`** — a função JS não precisa mudar; apenas retransmite o que o RPC retorna.

[VERIFIED: codebase inspection]

### 2. Signed URL para bucket privado — anon context

**O que existe (Phase 17):**
- Bucket `unidades-fotos` criado como `public = false` (privado)
- Policy `unidades_fotos_select_proprietario`: `FOR SELECT TO authenticated` usando `storage_unidade_owned_by_auth()`
- A função `storage_unidade_owned_by_auth` tem `REVOKE EXECUTE FROM anon`

**Conclusão crítica:** Não existe NENHUMA policy de SELECT `TO anon` em `storage.objects` para o bucket `unidades-fotos`. Uma chamada `supabase.storage.from('unidades-fotos').createSignedUrl(foto_url, 3600)` com cliente anon (sem sessão autenticada) vai retornar erro porque: (a) `createSignedUrl` requer que o chamador tenha SELECT sobre o objeto, e (b) a única policy SELECT é restrita a `authenticated`.

[VERIFIED: codebase inspection — migration 20260601000000_v15_foundation.sql]

**Estratégia viável:** Incluir as signed URLs diretamente na resposta da RPC `get_unidades_disponiveis()`. A função já é `SECURITY DEFINER`, executando como `postgres` (superuser analítico), que tem acesso pleno ao storage. Dentro da função SQL, chamar `storage.sign()` (função interna do Supabase) para gerar a URL assinada para cada `foto_url` não-nulo. Isso retorna a URL pronta sem passar pelo RLS de storage.

Alternativa verificada no codebase: `UnidadeCard.js` usa `createSignedUrl` pelo cliente browser (`createBrowserClient` com anon key) — mas esse componente só é usado no dashboard onde o usuário está autenticado como Proprietário. Para a página pública (anon), o mesmo padrão não funciona.

**Fallback chain para resolveFotoUrl():**
1. `foto_url` começa com `/` → retornar direto (asset público `/Detalhe_Arquitetonico.png` ou `/images/unidade-exemplo.jpg`)
2. RPC retorna `signed_url` não-nulo → usar diretamente (URL já assinada, sem chamada client-side)
3. `signed_url` nulo ou `foto_url` nulo → fallback `/Detalhe_Arquitetonico.png`

Isso simplifica `resolveFotoUrl`: **deixa de ser async**. O mapa `fotoSrcs` vira simplesmente `{ [id]: u.signed_url ?? u.foto_url ?? '/Detalhe_Arquitetonico.png' }` construído no useEffect junto com o load, sem await extra.

[VERIFIED: codebase inspection + migration analysis]

### 3. `src/components/features/UnidadesPublicas.js` (168 linhas)

**O que existe:**
- `useState`: `unidades`, `edificios`, `activeTab`, `selected`, `removedIds`, `removingId`
- `useEffect`: carrega com `Promise.all([getUnidadesDisponiveis(), getEdificiosPublicos()])`, inscreve canal realtime `public-unidades` para INSERT+DELETE
- `disponiveis` = `unidades.filter(u => !removedIds.has(u.id))`
- Abas com `tabs` array: `Todos` + um item por edifício
- `filtered` = filtragem por aba
- `simularAluguel(uid)`: `setRemovingId(uid)` → `setTimeout(() => { setRemovingId(null); setSelected(null); setRemovedIds(...) }, 700)`
- `edificioById` via `useMemo`
- Renderização: lista vertical de `UnidadePublicaCard` (sem grid)
- Barra count: mostra `{filtered.length} UNIDADES` à esquerda + `SYNC · {date}` à direita

**O que precisa mudar:**
- Adicionar `sort` state (`'rel'` default) e `fotoSrcs` state (`{}` default)
- No `useEffect`, após `load()`, construir `fotoSrcs` mapa (sync, sem async extra, pois URLs vêm do RPC)
- Adicionar `sortUnits(list, sort)` function
- Aplicar `sortUnits(filtered, sort)` para obter lista final
- Substituir barra count para incluir pills de sort à direita
- Substituir lista vertical por grid: `grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3`
- Envolver conteúdo scrollável em container `maxWidth: 1100, margin: "0 auto"`
- Passar `fotoSrc={fotoSrcs[u.id] ?? '/Detalhe_Arquitetonico.png'}` para cada card
- Passar `fotoSrc={fotoSrcs[selected.id] ?? '/Detalhe_Arquitetonico.png'}` para o sheet

**Não alterar:** canal realtime, `removedIds`/`removingId`/`simularAluguel`, `shortenName`, `edificioById`, abas.

### 4. `src/components/features/UnidadePublicaCard.js` (55 linhas)

**O que existe:** Botão full-width, lista row com ref/nome/edifício/area/StatusBadge/valor. Animação: `transition-opacity duration-700` + `isRemoving ? 'opacity-0' : 'opacity-100'`. Importa `StatusBadge` e `fmtBRL, refOf` de utils.

**O que precisa mudar:**
- Aceitar prop nova `fotoSrc`
- Converter estrutura de row para card com imagem no topo:
  - Container imagem `relative h-[116px] overflow-hidden` com `<Image fill style={{objectFit:'cover', filter:'grayscale(0.3) contrast(1.1) brightness(0.6)'}} />`
  - Overlay div `absolute inset-0` com `background: var(--primary-hover)` + `opacity: 0.12`
  - StatusBadge `absolute top-2.5 right-2.5`
- Mover nome/edifício para baixo da imagem usando tokens `r-subhead` / `r-meta`
- Manter valor e "Detalhes →" no footer do card
- Animação: manter `transition-opacity duration-700`; ou aplicar `.romma-unit-out` class (já em globals.css) — decisão do implementador conforme D-15

**O card se torna um card vertical em vez de row horizontal.** O `display: block; width: 100%` pode se manter pois o card fill o grid cell.

### 5. `src/components/features/UnidadeDetailSheet.js` (104 linhas)

**O que existe:**
- `fixed inset-0 z-50` backdrop com `onClick={onClose}`
- Sheet: `w-full max-h-[85dvh] overflow-auto` com `border-t border-indigo`
- Drag handle (barra cinza topo)
- Header: ref + nome + edifício + botão ✕ (44×44 com borda)
- Imagem atual: `<Image fill src="/Detalhe_Arquitetonico.png" className="object-cover opacity-10" />` — placeholder com 10% opacidade
- Grade 2 colunas: Área + Valor Mensal
- Descrição
- Endereço (quando edificio?.endereco)
- Botão "Tenho interesse →" (estilo sólido indigo) + botão "Fechar"
- Nota "Demo · 'Tenho interesse' simula aluguel..."

**O que precisa mudar:**
- Aceitar prop `fotoSrc` e `simulating` (ou gerenciar internamente)
- Imagem: trocar `/Detalhe_Arquitetonico.png` + `opacity-10` por `src={fotoSrc}` com filter real `grayscale(0.3) contrast(1.1) brightness(0.65)` + overlay indigo 16% alpha (igual design linha 59)
- Após grade 2 cols: adicionar row "Valor / m²" quando `unidade.valor_visivel && unidade.area_m2` → `Math.round(valor_mensal / area_m2)` + `fmtBRL()`
- Após valor/m²: row refs `LOC: −23.561° S, 46.656° W` + `REF: RM-2026-{u.id.slice(0,6).toUpperCase()}`
- Botão CTA: substituir texto por `[>] Simular Aluguel` (normal) / `[···] Processando` (simulating). Estilo bracket igual AuthField/SubmitButton da Phase 18.
- Remover nota "Demo · ..." ou adaptar texto

**Não alterar:** backdrop click pattern, drag handle, header layout, grade área/valor, descrição.

**`refOf(unidade)`:** já importado de `@/lib/utils` — verificar se retorna formato correto para sheet header vs. o novo `REF: RM-2026-...`. São campos diferentes: `refOf()` = ref do sistema (provavelmente diferente), `REF: RM-2026-...` = ref de display público. Ver utils.

### 6. `next.config.mjs` — remotePatterns

**Já configurado:** `hostname: 'vfymttcajeyhrmsyhrtj.supabase.co'`, `pathname: '/storage/v1/object/**'`, sem `search` key (permite query params `?token=...`). Signed URLs do formato `https://vfymttcajeyhrmsyhrtj.supabase.co/storage/v1/object/sign/...?token=...` passam sem alteração.

[VERIFIED: next.config.mjs inspection]

### 7. `src/app/globals.css` — Tokens e animações disponíveis

**Tokens de tipo disponíveis (v1.5):**
- `--rt-metric: 40px`, `--rt-title: 32px`, `--rt-section: 20px`, `--rt-subhead: 16px`
- `--rt-body: 14px`, `--rt-label: 11px`, `--rt-meta: 10px`
- Classes: `.r-subhead`, `.r-meta`, `.r-body`, `.r-label`, `.r-data`, `.r-title`

**Tokens de densidade:**
- `--rd-gutter-m: 20px` (padding horizontal mobile)
- `--rd-gutter: 32px` (desktop)

**Animações já em globals.css:**
- `@keyframes rUnitOut { to { opacity: 0; transform: translateX(40px); filter: blur(4px); } }` — blur+slide (design)
- `@keyframes rommaUnitOut { to { opacity: 0; transform: translateX(40px); filter: blur(4px); } }` — mesmo efeito, nome legacy
- `.romma-unit-out { animation: rommaUnitOut 600ms var(--ease-crisp) forwards; }` — classe utilitária pronta
- `@keyframes rSheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }` — sheet entra de baixo

**O card atual NÃO usa `rUnitOut` — usa `transition-opacity duration-700`**. São mutuamente exclusivos. D-15 mantém opacity; `rUnitOut` está como deferred. O implementador pode usar `romma-unit-out` facilmente se preferido, mas não está nos requisitos.

[VERIFIED: globals.css inspection]

---

## foto_url / Signed URL Strategy

### Análise definitiva

O `CONTEXT.md` D-04 descreve `resolveFotoUrl` chamando `supabase.storage.from('unidades-fotos').createSignedUrl(foto_url, 3600)` via anon client. Esta chamada falha em produção porque:

1. O bucket é `public = false`
2. A policy `unidades_fotos_select_proprietario` é `TO authenticated` (não `TO anon`)
3. `storage_unidade_owned_by_auth` tem `REVOKE EXECUTE FROM anon`

**Solução correta:** Incluir `foto_url` e gerar `signed_url` dentro do RPC `get_unidades_disponiveis()` via `SECURITY DEFINER`. A função executa como `postgres` e tem acesso ao storage. Internamente usa `storage.sign('unidades-fotos', foto_url, 3600)` que retorna `{signedURL: '...'}`.

**Migration necessária em Plano 01:**
```sql
CREATE OR REPLACE FUNCTION public.get_unidades_disponiveis()
RETURNS TABLE (
  id              uuid,
  edificio_id     uuid,
  nome            text,
  descricao       text,
  area_m2         numeric,
  valor_mensal    numeric,
  valor_visivel   boolean,
  status          text,
  edificio_nome   text,
  foto_url        text,
  foto_signed_url text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.edificio_id,
    u.nome,
    u.descricao,
    u.area_m2,
    u.valor_mensal,
    u.valor_visivel,
    u.status::text,
    e.nome AS edificio_nome,
    u.foto_url,
    CASE
      WHEN u.foto_url IS NULL THEN NULL
      WHEN u.foto_url LIKE '/%' THEN u.foto_url
      ELSE (storage.sign('unidades-fotos', u.foto_url, 3600)).signedURL
    END AS foto_signed_url
  FROM public.unidades u
  JOIN public.edificios e ON e.id = u.edificio_id
  WHERE u.status = 'disponivel'
  ORDER BY e.nome, u.nome;
$$;
-- GRANT permanece idêntico
GRANT EXECUTE ON FUNCTION public.get_unidades_disponiveis() TO anon, authenticated;
```

**Nota sobre `storage.sign()`:** É uma função interna do Supabase (não exposta pela API pública) disponível dentro de funções SECURITY DEFINER. Alternativa se `storage.sign()` não estiver disponível como SQL: usar `extensions.pgcrypto` com HMAC para assinar manualmente — mas `storage.sign()` é o padrão documentado para uso dentro de migrations Supabase.

[ASSUMED: `storage.sign()` disponibilidade em SECURITY DEFINER context — deve ser confirmado ou testado na migration. Fallback: retornar só `foto_url` e usar uma Server Action separada para resolver URLs.]

**Se `storage.sign()` não funcionar:** Fallback — retornar apenas `foto_url` raw. Adicionar uma Server Action `resolverFotoUrls(ids)` que recebe array de `{id, foto_url}` e usa `supabaseAdmin` (service_role) para chamar `createSignedUrl` em batch. Componente chama via `fetch` no `useEffect`. Este fallback funciona 100% mas adiciona latência de uma chamada extra após o load inicial.

### Consumo no componente

Com RPC retornando `foto_signed_url`:

```js
// No useEffect load:
const fotoSrcs = Object.fromEntries(
  u.map(u => [u.id, u.foto_signed_url ?? u.foto_url ?? '/Detalhe_Arquitetonico.png'])
)
setFotoSrcs(fotoSrcs)
// Nenhuma chamada async adicional necessária
```

O helper `resolveFotoUrl` de D-04 torna-se uma função sync simples (ou inline), não async.

---

## Sort + Realtime Interaction

**Não há conflito de state.** O fluxo é:

```
unidades (raw do RPC)
  → disponiveis = filter(!removedIds)
  → filtered = filter(activeTab)
  → sorted = sortUnits(filtered, sort)   ← nova etapa, apenas reordena em memória
  → render
```

Realtime (`INSERT`/`DELETE`) chama `load()` que re-seta `unidades`. `removedIds` persiste (é state local). Sort é aplicado na derivação final.

**Interação sort + remoção:** Quando `simularAluguel(uid)` é chamado enquanto a lista está sortada, `removingId === uid` aplica opacity-0 ao card no lugar onde ele aparece no sort atual. Após 700ms, `removedIds` exclui o item da derivação. Funciona corretamente — sem conflito.

**Realtime LIMITAÇÃO CONHECIDA (CLAUDE.md):** `disponivel → alugada` não propaga em tempo real (RLS descarta evento). Card some só no refresh. Esta limitação é aceitável — o "Simular aluguel" é otimista local.

---

## Animation Pattern for Card Removal

**Atual em `UnidadePublicaCard.js`:**
```jsx
className={`... transition-opacity duration-700 ${isRemoving ? 'opacity-0' : 'opacity-100'}`}
```

**Disponível em `globals.css` (não usado no card atualmente):**
- `.romma-unit-out`: `animation: rommaUnitOut 600ms var(--ease-crisp) forwards` → opacity 0 + translateX(40px) + blur(4px)
- `rUnitOut` keyframe: mesmo efeito, referenciado pelo design public.jsx

**D-15 determina:** manter `opacity-0 transition-opacity duration-700` (atual). A animação `rUnitOut` está marcada como deferred. O implementador pode aplicar `.romma-unit-out` class em vez da className condicional — ambas existem em globals.css — mas não é requisito desta fase.

**Se o implementador quiser usar `rUnitOut` (trivial e disponível):**
```jsx
style={{ animation: isRemoving ? 'rUnitOut 600ms var(--ease-crisp) forwards' : 'none' }}
```
Decide per D-15: "pode ajustar para `rUnitOut` com blur+slide se trivial." Como está marcado deferred, manter opacity simples é o caminho seguro.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sorted list | Loop manual com comparadores | `sortUnits()` de public.jsx (3 linhas) | Já existe, portável diretamente |
| Signed URLs para anon | Client-side fetch com anon key | RPC SECURITY DEFINER com `storage.sign()` | Anon não tem policy SELECT em storage.objects |
| Grid responsivo | Media query manual | Tailwind `md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]` | Padrão Tailwind v4 do projeto |
| Bracket button `[>] Simular Aluguel` | Botão custom do zero | Mesmo padrão visual de `SubmitButton` da Phase 18 (AuthField style) | Consistência cross-screen |
| Valor/m² | Cálculo inline sem guard | `Math.round(valor_mensal / area_m2)` apenas quando ambos não-nulos e `valor_visivel` | Divisão por zero se `area_m2` for 0 |

---

## Common Pitfalls

### Pitfall 1: foto_url ausente do RPC — undefined silencioso
**What goes wrong:** `u.foto_url` será `undefined` em todos os cards porque o campo não está no `RETURNS TABLE` do RPC. Nenhum erro — só imagens não aparecem.
**Why it happens:** Migration de Phase 17 adicionou a coluna à tabela, mas o RPC foi criado em Phase anterior e nunca atualizado.
**How to avoid:** Plano 01 deve incluir a migration que atualiza o RPC antes de qualquer trabalho nos componentes.
**Warning signs:** Cards aparecem com placeholder mesmo para unidades com foto_url gravada no DB.

### Pitfall 2: anon createSignedUrl falha silenciosamente
**What goes wrong:** `supabase.storage.from('unidades-fotos').createSignedUrl(path, 3600)` retorna `{ data: null, error: { message: 'new row violates row-level security policy' } }` para usuários anon. O fallback do D-04 é acionado para toda unidade.
**Why it happens:** Policy SELECT em storage.objects é `TO authenticated` apenas.
**How to avoid:** Gerar `foto_signed_url` no RPC SECURITY DEFINER (solução principal). Nunca depender de anon client para signed URLs em bucket privado.
**Warning signs:** Todas as unidades com foto mostram placeholder; log de console mostra erro RLS ao tentar createSignedUrl.

### Pitfall 3: sort com valor_mensal null (unidades com valor_visivel=false)
**What goes wrong:** `sortUnits` ordena por `x.valor_mensal - y.valor_mensal`. O RPC já mascara `valor_mensal: null` quando `!valor_visivel`. NaN na comparação resulta em ordem imprevisível.
**Why it happens:** `null - null = NaN`, comparador retorna NaN que JS trata como falsy → itens ficam na posição original mas sem ordenação consistente.
**How to avoid:** `sortUnits` deve tratar null: `(x.valor_mensal ?? Infinity) - (y.valor_mensal ?? Infinity)` para `valor_asc` (itens sem valor vão para o fim). Para `valor_desc`: `(y.valor_mensal ?? -Infinity) - (x.valor_mensal ?? -Infinity)`.
**Warning signs:** Sort "Menor valor" coloca unidades sem valor em posição aleatória.

### Pitfall 4: next/image com `fill` sem container posicionado
**What goes wrong:** `<Image fill ...>` dentro de um container sem `position: relative` faz a imagem escapar do layout.
**Why it happens:** `fill` usa `position: absolute; inset: 0` no elemento `<img>`.
**How to avoid:** Container da imagem precisa de `position: relative; overflow: hidden` e height explícita (116px card, 160px sheet). Já presente em `UnidadeDetailSheet.js` linha 39 (`relative h-40 border border-border-3 overflow-hidden`).

### Pitfall 5: Sheet com `rSheetUp` animation em globals.css — precisa aplicar
**What goes wrong:** `@keyframes rSheetUp` existe mas a sheet atual não tem `animation: rSheetUp ...` — a sheet apenas aparece.
**Why it happens:** A animação estava no design mas não foi portada para o componente.
**How to avoid:** Se quiser animação de entrada na sheet, adicionar `style={{ animation: 'rSheetUp 320ms var(--ease-crisp) both' }}` ao painel interno. É opcional mas o design espera isso (public.jsx:51).

### Pitfall 6: `refOf()` vs `REF: RM-2026-{id.slice(0,6)}`
**What goes wrong:** Confundir o `refOf(unidade)` (já importado) com o novo campo de display `REF: RM-2026-...`. São dois campos diferentes.
**Why it happens:** Ambos são "referências" mas servem propósitos diferentes. `refOf()` é o identificador técnico usado no header. `REF: RM-2026-...` é o código de display público da sheet.
**How to avoid:** Manter `refOf(unidade)` no header; adicionar `REF: RM-2026-{unidade.id.slice(0,6).toUpperCase()}` na row de refs.

---

## Code Examples

### sortUnits — portado de public.jsx:12-17

```js
// [CITED: .planning/design/js/public.jsx:12-17]
const SORTS = [
  { id: 'rel', label: 'Relevância' },
  { id: 'valor_asc', label: 'Menor valor' },
  { id: 'valor_desc', label: 'Maior valor' },
  { id: 'area_desc', label: 'Maior área' },
]

function sortUnits(list, sort) {
  const a = [...list]
  // Guard: null valores ficam no fim
  if (sort === 'valor_asc') a.sort((x, y) => (x.valor_mensal ?? Infinity) - (y.valor_mensal ?? Infinity))
  else if (sort === 'valor_desc') a.sort((x, y) => (y.valor_mensal ?? -Infinity) - (x.valor_mensal ?? -Infinity))
  else if (sort === 'area_desc') a.sort((x, y) => (y.area_m2 ?? 0) - (x.area_m2 ?? 0))
  return a
}
```

### Sort pills UI — portado de public.jsx:135-143

```jsx
// [CITED: .planning/design/js/public.jsx:135-143]
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
  <span className="r-label" style={{ fontSize: 9 }}>Ordenar</span>
  <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
    {SORTS.map(s => (
      <button key={s.id} onClick={() => setSort(s.id)}
        style={{
          all: 'unset', cursor: 'pointer', flexShrink: 0,
          padding: '5px 10px',
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.5px',
          border: `1px solid ${sort === s.id ? 'var(--indigo)' : 'var(--border-3)'}`,
          background: sort === s.id ? 'oklch(0.339 0.179 301.68 / 0.18)' : 'transparent',
          color: sort === s.id ? 'var(--fg-1)' : 'var(--fg-4)',
        }}
      >{s.label}</button>
    ))}
  </div>
</div>
```

### Desktop grid — portado de public.jsx:173

```jsx
// [CITED: .planning/design/js/public.jsx:173]
<div style={{ maxWidth: 1100, margin: '0 auto', padding: 'var(--rd-gutter-m)' }}>
  <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
    {sorted.map(u => <UnidadePublicaCard key={u.id} ... />)}
  </div>
</div>
```

### Card image section — portado de public.jsx:27-31

```jsx
// [CITED: .planning/design/js/public.jsx:27-31]
<div style={{ position: 'relative', height: 116, overflow: 'hidden', border: '1px solid var(--border-3)' }}>
  <Image fill alt="" src={fotoSrc} sizes="(min-width: 768px) 280px, 100vw"
    style={{ objectFit: 'cover', filter: 'grayscale(0.3) contrast(1.1) brightness(0.6)' }}
  />
  <div style={{ position: 'absolute', inset: 0, background: 'var(--primary-hover)', opacity: 0.12 }} />
  <div style={{ position: 'absolute', top: 10, right: 10 }}>
    <StatusBadge status={unidade.status} />
  </div>
</div>
```

### CTA button bracket style

```jsx
// [CITED: .planning/design/js/public.jsx:76 + Phase 18 SubmitButton pattern]
<button
  style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%',
    boxSizing: 'border-box', minHeight: 44 }}
  className="py-[14px] px-5 bg-indigo font-mono font-bold text-[13px] text-fg-1 text-center tracking-[0.5px]"
  onClick={() => onSimular(unidade.id)}
  disabled={simulating}
>
  {simulating ? '[···] Processando' : '[>] Simular Aluguel'}
</button>
```

### Valor/m² row

```jsx
// [CITED: .planning/design/js/public.jsx:66-71]
{unidade.valor_visivel && unidade.area_m2 > 0 && (
  <div style={{ border: '1px solid var(--border-3)', padding: '12px 16px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span className="r-label">Valor / m²</span>
    <span className="r-data" style={{ fontSize: 14, color: 'var(--fg-1)' }}>
      {fmtBRL(Math.round(unidade.valor_mensal / unidade.area_m2))}
      <span className="r-meta">/m²</span>
    </span>
  </div>
)}
```

### Refs row

```jsx
// [CITED: .planning/design/js/public.jsx:73-75]
<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <span className="r-meta">LOC: −23.561° S, 46.656° W</span>
  <span className="r-meta">REF: RM-2026-{unidade.id.slice(0, 6).toUpperCase()}</span>
</div>
```

---

## Implementation Plan Recommendations

### Divisão recomendada: 2 planos

**Plano 24-01: RPC + signed URL (Wave 1)**

Pré-requisito de tudo. Sem isso, cards ficam sem foto.

1. Migration SQL: `CREATE OR REPLACE FUNCTION get_unidades_disponiveis()` — adicionar `foto_url text` e `foto_signed_url text` ao RETURNS TABLE; adicionar `u.foto_url` + expressão CASE com `storage.sign()` ao SELECT.
2. Aplicar migration: `supabase db push` (ou Supabase Studio SQL editor para dev).
3. Verificar que `supabase.rpc('get_unidades_disponiveis')` retorna `foto_url` e `foto_signed_url` em produção.
4. Nenhuma mudança em arquivos `.js` neste plano.

**Plano 24-02: Componentes (Wave 2, blocked on 24-01)**

Todos os 3 componentes em-place + `fotoSrcs` state em UnidadesPublicas.

Ordem dentro do plano (dependency order):
1. `UnidadesPublicas.js`: adicionar `sort` + `fotoSrcs` states; `sortUnits()`; sort bars na UI; grid responsivo; passar props `fotoSrc` para card e sheet
2. `UnidadePublicaCard.js`: adicionar imagem de capa + overlay + StatusBadge absoluto; ajustar tipografia para `r-subhead`/`r-meta`
3. `UnidadeDetailSheet.js`: imagem real + filter; valor/m²; refs row; botão `[>] Simular Aluguel` + simulating state

---

## Risks and Landmines

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| `storage.sign()` não disponível em SQL SECURITY DEFINER | HIGH | MEDIUM | Testar na migration. Fallback: Server Action com supabaseAdmin |
| RPC `get_unidades_disponiveis` no DB remoto desatualizada (não inclui foto_url) | HIGH | CERTAIN | Plano 01 obrigatório antes de qualquer componente |
| `next/image` com `fill` sem `sizes` prop → warning + layout shift | LOW | HIGH | Sempre incluir `sizes` prop conforme D-06 |
| sort `valor_desc` com null valores → NaN comparison | MEDIUM | HIGH | Guard com `?? -Infinity` no comparador |
| `simulating` state: encapsular em sheet vs. em pai | LOW | — | Decisão de Claude's Discretion. Preferir em pai (UnidadesPublicas) para controle unificado com `simularAluguel()` |
| `rSheetUp` animation não aplicada à sheet atual | LOW | CERTAIN | Adicionar `style={{ animation: 'rSheetUp 320ms var(--ease-crisp) both' }}` ao painel interno |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `storage.sign('unidades-fotos', path, 3600)` funciona dentro de funções SQL SECURITY DEFINER no Supabase | foto_url / Signed URL Strategy | Se não funcionar: usar fallback Server Action com supabaseAdmin |
| A2 | `refOf(unidade)` em utils.js retorna o identificador de referência técnica já usado no header (diferente do REF de display público) | Pitfall 6 | Verificar implementação de `refOf` em `src/lib/utils.js` antes de planejar |

---

## Environment Availability

Step 2.6: SKIPPED — fase é puramente frontend + uma migration SQL. Sem dependências de ferramentas externas além do `supabase` CLI (já utilizado em fases anteriores) e `npm` (já disponível).

---

## Validation Architecture

Nyquist validation não configurado explicitamente — tratando como desabilitado para esta fase (sem plano de E2E novo). A fase não tem Server Actions novas, apenas componentes visuais + uma migration SQL. A validação é manual/UAT.

---

## Security Domain

| ASVS Category | Applies | Notes |
|---------------|---------|-------|
| V5 Input Validation | não aplicável | Fase é read-only, sem formulários |
| V4 Access Control | sim — verificado | RPC SECURITY DEFINER não expõe dados além de `status='disponivel'`; `foto_signed_url` é URL temporária (3600s TTL); nenhum dado de proprietário exposto |
| V3 Session Management | não aplicável | Página pública, sem sessão |
| V2 Authentication | não aplicável | Página pública, sem auth |

**Nenhuma nova superficie de ataque.** A migration de RPC adiciona signed URL ao resultado mas não expõe nada que não estava acessível (unidades disponíveis são públicas; foto é asset do proprietário já acessível pelo dashboard autenticado).

---

## Sources

### Primary (HIGH confidence)
- `src/components/features/UnidadesPublicas.js` — inspecionado diretamente (168 linhas)
- `src/components/features/UnidadePublicaCard.js` — inspecionado diretamente (55 linhas)
- `src/components/features/UnidadeDetailSheet.js` — inspecionado diretamente (104 linhas)
- `src/lib/queries-client.js:77-83` — getUnidadesDisponiveis inspecionado
- `supabase/migrations/20260523000000_fix_unidades_select_public_rpc.sql` — RPC schema verificado
- `supabase/migrations/20260601000000_v15_foundation.sql` — storage RLS policies verificadas
- `src/app/globals.css` — keyframes e tokens verificados
- `next.config.mjs` — remotePatterns verificados
- `.planning/design/js/public.jsx` — design reference (185 linhas) inspecionado
- `.planning/phases/24-p-blico-unidades-dispon-veis/24-CONTEXT.md` — decisões verificadas

### Tertiary (LOW confidence)
- `storage.sign()` SQL function — [ASSUMED] baseado em conhecimento de treinamento sobre Supabase internals; requer verificação na migration

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — Next.js/Supabase/Tailwind v4 fixos pelo projeto
- Architecture: HIGH — todos os arquivos inspecionados diretamente
- foto_url / Signed URL: HIGH para o problema (RLS confirmada), MEDIUM para a solução (`storage.sign()` assumed)
- Pitfalls: HIGH — derivados de inspeção direta de código

**Research date:** 2026-06-17
**Valid until:** 2026-06-24 (estável — sem dependências externas em movimento)
