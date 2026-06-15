---
phase: 19
slug: unidades-modal-unificado-foto-de-capa
status: draft
shadcn_initialized: true
preset: obsidian-blueprint
created: 2026-06-14
---

# Phase 19 — UI Design Contract
## Unidades: Modal Unificado & Foto de Capa

> Contrato visual e de interação para a Phase 19. Gerado por gsd-ui-researcher.
> Fonte de verdade: protótipo `.planning/design/js/console2.jsx` + tokens existentes em `src/app/globals.css`.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn/ui (já inicializado) |
| Preset | Obsidian Blueprint — tema escuro único; `--radius: 0` (cantos retos em todo o sistema) |
| Component library | radix-ui (via shadcn) |
| Icon library | Nenhuma biblioteca de ícones — usar caracteres mono inline: `⌕` (busca), `⤓` (upload), `✕` (fechar), `✓` (confirmar), `▾` (select arrow) |
| Body font | Space Grotesk (`var(--font-body)`) |
| Mono font | Space Grotesk (`var(--font-mono)`) — tratado como mono via classe |
| Display font | Hanken Grotesk (`var(--font-display-arch)` / `var(--font-headline-hanken)`) |
| Styling approach | Inline styles + CSS vars canônicos (`var(--fg-1)`, `var(--surface)`, etc.) — NÃO usar classes Tailwind utilitárias em componentes novos desta fase |

> **shadcn gate:** `components.json` presente. Sistema já inicializado. Sem necessidade de `npx shadcn init`. Registry: apenas shadcn oficial — sem third-party blocks nesta fase.

---

## Spacing Scale

Tokens de densidade "regular" entregues na Phase 17 (`src/app/globals.css` linhas 395–404). Esta fase os **consome diretamente** via `var()`.

| Token CSS | Valor | Uso nesta fase |
|-----------|-------|----------------|
| `--rd-gutter` | 32px | Padding horizontal da tela no desktop |
| `--rd-gutter-m` | 20px | Padding horizontal da tela no mobile |
| `--rd-page-y` | 28px | Padding vertical da tela (topo/fundo scroll) |
| `--rd-block` | 24px | Espaço entre blocos maiores (ex: métricas → filtros → grade) |
| `--rd-block-sm` | 16px | Espaço entre sub-blocos (ex: filtros → grade de cards) |
| `--rd-panel` | 20px | Padding interno de painéis/cards |
| `--rd-cell` | 20px | Padding horizontal das células de métricas |
| `--rd-row-y` | 12px | Padding vertical de linhas/cards |
| `--rd-row-x` | 16px | Padding horizontal de linhas/cards |

**Escala base (8-point):**

| Token | Valor | Uso |
|-------|-------|-----|
| xs | 4px | Gap entre ícone e texto em linha; gap entre badges |
| sm | 8px | Gap entre botões de filtro de status; gap de ações no card |
| md | 16px | Gap entre campos do grid do modal (14–16px); padding de botões de ação |
| lg | 24px | Gap entre seções do modal; padding interno do modal (`28px` per protótipo) |
| xl | 32px | Gutter lateral desktop (`--rd-gutter`) |
| 2xl | 48px | — |
| 3xl | 64px | Bottom padding da tela no desktop |

**Exceções:**

- Modal interno: padding `28px` (não 32px — per protótipo linha 93: `padding: 28`)
- Dropzone vazia: altura `110px` (per protótipo linha 71)
- Preview com foto: altura `150px` (per protótipo linha 57)
- Botões "Trocar" / "Remover" na foto: `padding: 6px 10px` (micro-ação em overlay)
- Botões de ação "Editar" / "Remover" no card: `padding: 5px 9px`
- Checkbox custom: `16px × 16px` hit area; touch area mínima 44px via padding do wrapper

---

## Typography

Escala tipográfica v1.5 entregue na Phase 17 (`--rt-*` tokens). Esta fase usa as classes `.r-*` já existentes.

| Role | Classe CSS | Tamanho | Weight | Line Height | Família | Uso nesta fase |
|------|------------|---------|--------|-------------|---------|----------------|
| Metric / Display grande | `.r-section` | 20px (`--rt-section`) | 700 | 1.05 | Display (Hanken) | Título do modal ("Cadastrar Unidade" / nome da unidade em edição) |
| Número de métrica | inline `font-size: 26px` | 26px | 700 | 1 | Display (Hanken) | Valores na barra de métricas (Área total, MRR, Potencial, Ocultos) |
| Subhead | `.r-subhead` | 16px (`--rt-subhead`) | 600 | 1.2 | Body (Space Grotesk) | Nome da unidade no card; nome do edifício |
| Body | `.r-body` | 14px (`--rt-body`) | 400 | 1.5 | Body (Space Grotesk) | Corpo de texto; body do ConfirmDialog; placeholder de inputs |
| Data / valores | `.r-data` | 14px (`--rt-data`) | 400 | — | Mono (Space Grotesk) | Valor mensal no card (`R$ 0.000/mês`); dados numéricos |
| Label caps | `.r-label` | 11px (`--rt-label`) | 700 | — | Mono | Labels de campo no modal; labels das métricas (9.5px per protótipo — override pontual) |
| Meta | `.r-meta` | 10px (`--rt-meta`) | 400 | — | Mono | Subtítulo do card (edifício · área m²); texto de estado vazio |
| Eyebrow | `.r-eyebrow` ou `.eyebrow` | 10px (`--rt-meta`) | 700 | — | Body | Eyebrow do modal ("NOVA UNIDADE" / "EDITAR UNIDADE"); eyebrow da tela |
| Botões de ação (micro) | inline | 10px | 700 | — | Mono | "Editar", "Remover", "Trocar", "Cancelar", "ou usar foto de exemplo" — `letter-spacing: 0.5px; text-transform: uppercase` |

**Pesos em uso: 400 (regular) e 700 (bold).** Nenhum peso intermediário (600 em `.r-subhead` é o único — não adicionar outros).

---

## Color

Sistema Obsidian Blueprint — tema escuro único. Todos os valores abaixo são aliases de tokens CSS já presentes em `globals.css`.

| Role | Token CSS | Valor OKLCH | Uso nesta fase |
|------|-----------|-------------|----------------|
| Dominant 60% — fundo geral | `var(--background)` | `oklch(0.2393 0 0)` | Fundo da tela de Unidades; backdrop do modal |
| Secondary 30% — superfícies | `var(--surface)` / `var(--surface-hi)` | `oklch(0.182 0 0)` / `oklch(0.218 0 0)` | Fundo dos cards de unidade; fundo dos campos de input; fundo da dropzone |
| Accent 10% — indigo | `var(--indigo)` / `var(--primary)` | `oklch(0.339 0.1793 301.68)` | Botão CTA primário ("Nova Unidade", "Criar Unidade", "Salvar Alterações"); borda ativa de input com foco; borda da dropzone em drag-over; borda do ConfirmDialog não-destrutivo; eyebrow "NOVA UNIDADE" / "EDITAR UNIDADE"; texto "ou usar foto de exemplo"; toggle de filtro de status ativo |
| Dourado / Highlight | `var(--highlight)` / `var(--color-highlight)` | `oklch(0.7245 0.0998 82.35)` | **EXCLUSIVO:** valor "Potencial em aberto" na barra de métricas (número e label); `.r-eyebrow.gold` quando necessário |
| Destructive | `var(--danger-fg)` / `var(--danger-bg)` / `var(--danger-bg2)` | `oklch(0.826 0.073 22.5)` / bgColor | Botão "Remover" no card; botão "Remover" na foto de preview; borda do ConfirmDialog de remoção; ErrLine de validação; texto de erro inline |
| Border default | `var(--border-3)` | `oklch(0.387 0 0 / 0.4)` | Borda padrão de cards, inputs sem foco, grid de métricas, separadores |
| Border sutil | `var(--border-2)` | `oklch(1 0 0 / 0.10)` | Borda da dropzone sem drag; botões "Trocar" na overlay de foto |
| Foreground primário | `var(--fg-1)` | `oklch(1 0 0)` | Texto principal (nome da unidade, valores, títulos) |
| Foreground secundário | `var(--fg-3)` / `var(--fg-4)` | — | Subtítulos, labels, placeholders, texto de estado vazio |

**Accent reservado para:** botão CTA ("Nova Unidade"), botão de submit do modal, foco de input, drag-over da dropzone, filtro de status ativo, eyebrow do modal. Nunca usar `--indigo` em texto de corpo, ícones decorativos ou hover states genéricos.

**Dourado reservado para:** exclusivamente o card "Potencial em aberto" na barra de métricas (valor numérico + label). Não usar em nenhum outro elemento desta fase.

---

## Barra de Métricas-resumo (UNID-01)

> Contrato visual prescritivo para o componente de métricas.

**Layout:** Grid de 4 colunas no desktop; 2×2 no mobile. Container com `border: 1px solid var(--border-3)` sem gap (divisórias internas via `borderRight` / `borderTop`).

**Padding por célula:** `14px var(--rd-cell)` (14px vertical, 20px horizontal).

**Estrutura de cada célula:**

```
[LABEL — r-label, fontSize: 9.5px, marginBottom: 7px]
[VALOR — font-display, fontWeight: 700, fontSize: 26px, letterSpacing: -1px]
[SUBTÍTULO — r-meta, marginTop: 4px]
```

**Células e seus valores:**

| Posição | Label | Valor | Subtítulo | Cor especial |
|---------|-------|-------|-----------|--------------|
| 1 | "Área total" | `{totalM2} m²` | `{n} unidades` | nenhuma |
| 2 | "MRR realizado" | `R$ {valor}` (formato BRL abreviado) | `{n} alugadas` | nenhuma |
| 3 | "Potencial em aberto" | `R$ {valor}` | `{n} disponíveis` | `var(--highlight)` em label E valor |
| 4 | "Valores ocultos" | `{n}` (numeral) | `"não exibidos no site"` | nenhuma |

**Derivação:** Calculada client-side sobre `unidades` (lista completa, não filtrada). Ver CONTEXT.md D-04.

---

## Barra de Busca e Filtros (UNID-02)

**Layout:** `display: flex; gap: 8px; flexWrap: wrap; alignItems: center`.

**Componentes da barra (esquerda → direita):**

1. **Campo de busca** — `flex: 0 0 240px` no desktop; `flex: 1 1 100%` no mobile. Fundo `var(--surface-hi)`, borda `var(--border-3)`, `fontSize: 13px`, ícone `⌕` posicionado absoluto à esquerda (`left: 12px`), `padding: 9px 12px 9px 30px`.

2. **Grupo de botões de status** — três botões: "Todos" / "Disponível" / "Alugada". Estilo micro: `padding: 8px 12px`, `fontSize: 10px`, mono caps, `letter-spacing: 0.5px`. Ativo: `border: 1px solid var(--indigo)`, `background: oklch(0.339 0.179 301.68 / 0.18)`, cor `var(--fg-1)`. Inativo: `border: 1px solid var(--border-3)`, cor `var(--fg-4)`.

3. **Select de edifício** — estilo `FSelect` do protótipo: `padding: 10px 34px 10px 12px`, `fontSize: 13px`, mono, `flex: 0 0 200px` no desktop; `flex: 1 1 100%` no mobile. Fundo `var(--surface-hi)`, borda `var(--border-3)` (primary no foco).

4. **Contador de resultados** — `.r-meta` inline: `{n} resultado(s)` — exibido APENAS quando algum filtro está ativo (query ≠ "" ou fStatus ≠ "all" ou fEd ≠ "all").

---

## Grade de Cards — Variante B (UNID-02 / UNID-03)

**Layout:** `display: grid; gridTemplateColumns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; alignItems: start`.

**Card individual:** `border: 1px solid var(--border-3); background: var(--surface)`.

**Estrutura interna do card** (layout coluna, `flexDirection: column`, `gap: 14px`):

```
[Linha de nome + badge de status]
[Divisor 1px var(--border-3)]
[Linha de valor + ações]
```

**Linha de nome:** `r-subhead` (nome, truncado com ellipsis) + `.r-meta` (abreviação do edifício · área m²). Badge de status ao lado direito.

**Linha de valor + ações:**
- Valor: `.r-data` `fontSize: 14px` + `.r-meta` "/mês"
- Botão "Editar": `fontSize: 10px, mono caps, padding: 5px 9px, border: 1px solid var(--border-3)`, cor `var(--fg-3)`
- Botão "Remover": idem mas cor `var(--danger-fg)`, borda `color-mix(in oklch, var(--destructive) 30%, transparent)`

**Badge de status:**
- `disponivel`: texto "Disponível", `background: oklch(0.696 0.17 162.5 / 0.15)`, cor `var(--success)`, `fontSize: 9px, mono caps`
- `alugada`: texto "Alugada", background azul/primary com opacidade, cor `var(--fg-1)`, `fontSize: 9px, mono caps`

**Animação de saída:** ao remover, `opacity: 0; transform: scale(0.97); transition: opacity 220ms ease, transform 220ms ease` — depois de 220ms o item é removido da lista via `setUnidades`.

**Estado vazio (nenhum resultado nos filtros):** `padding: 40px 24px; textAlign: center` com texto `.r-meta` "Nenhuma unidade corresponde aos filtros." Sem ilustração, sem ícone.

**Estado vazio (sem unidades cadastradas):** mesmo layout mas texto "Nenhuma unidade cadastrada. Clique em Nova Unidade para começar."

---

## Modal Unificado — `UnifiedUnidadeModal` (UNID-03)

> API do componente: `mode` ("create" | "edit"), `initial` (objeto unidade ou `null`), `edificios` (array), `onClose` (função), `onSaved` (função). NÃO recebe `unidades` nem setters de estado do pai.

**Backdrop:** classe `romma-modal-backdrop` (`position: fixed; inset: 0; z-index: 50; background: oklch(0 0 0 / 0.70); display: flex; align-items: center; justify-content: center; padding: 16px`).

**Container do modal:** `width: 560px; max-width: 100%; background: var(--background); border: 1px solid var(--border-3)`. `padding: 28px`.

**Header do modal:**

```
[Eyebrow r-eyebrow.indigo — "NOVA UNIDADE" | "EDITAR UNIDADE"]
[h3 r-section — "Cadastrar Unidade" | nome da unidade em edição]
[Botão fechar × — 30×30px, border: 1px solid var(--border-3), cor var(--fg-3), mono]
```

Layout do header: `display: flex; justifyContent: space-between; alignItems: flex-start; marginBottom: 20px`.

**Formulário** — `display: flex; flexDirection: column; gap: 16px`.

**Ordem dos campos:**

1. `CoverPhotoField` (ver seção abaixo) — largura completa
2. Grid de campos `2 × 3` (`gridTemplateColumns: 1fr 1fr; gap: 14px`):
   - Edifício (FSelect)
   - Nome da unidade (FInput, `required`, `placeholder: "Ex: Sala 1208"`)
   - Área m² (FInput, `type: number`, `placeholder: "0"`)
   - Valor mensal R$ (FInput, `type: number`, `placeholder: "0"`)
   - Status (FSelect: "Disponível" / "Alugada")
   - Descrição (FInput, `placeholder: "Opcional"`)
3. `FormCheck` — "Exibir valor publicamente"
4. Barra de ações (ver abaixo)

**Estilo dos campos — FInput:**

- `all: unset; boxSizing: border-box; width: 100%`
- `padding: 10px 12px; fontSize: 14px; fontFamily: var(--font-body)`
- `color: var(--fg-1); background: var(--surface-hi)`
- `border: 1px solid var(--border-3)` (repouso) → `border: 1px solid var(--primary)` (foco)
- `transition: border-color var(--dur-fast)`

**Estilo dos campos — FSelect:**

- Mesmo container de FInput mas `fontSize: 13px; fontFamily: var(--font-mono)`
- `padding: 10px 34px 10px 12px` (espaço para seta `▾` à direita)
- Seta `▾` posicionada absoluta `right: 12px`, `fontSize: 10px`, `color: var(--fg-4)`

**Label de campo — FLabel:**

- `fontFamily: var(--font-mono); fontSize: 10px; letterSpacing: 1px; textTransform: uppercase; color: var(--fg-4)`

**FormField wrapper:** `display: flex; flexDirection: column; gap: 6px`

**Checkbox "Exibir valor publicamente":**

- Box `16×16px`, `border: 1px solid var(--border-3)` (desmarcado) → `border: 1px solid var(--indigo); background: var(--indigo)` (marcado)
- Check SVG branco `10×10px` dentro do box
- Label via FLabel

**Barra de ações (rodapé do modal):**

- `display: flex; gap: 8px; justifyContent: flex-end; marginTop: 4px`
- Botão "Cancelar": outline (`border: 1px solid var(--border-3); background: transparent; color: var(--fg-2)`), `padding: 10px 16px`, mono caps `fontSize: 12px`
- Botão submit: primário (`background: var(--indigo); color: var(--fg-1); border: none`), `padding: 10px 18px`, texto: "Criar Unidade" (modo create) / "Salvar Alterações" (modo edit)
- Prefixo code bracket no botão submit: `[✓]` — mono, `fontSize: 10px`, margem direita `6px`

**Estado de erro no modal (ErrLine):**

- `background: var(--danger-bg2); borderLeft: 2px solid var(--danger-fg); padding: 10px 14px`
- `fontFamily: var(--font-mono); fontSize: 12px; color: var(--danger-fg)`
- Exibido abaixo do grid de campos, acima da barra de ações

**Estado de loading no submit:** botão muda para `[···]` + texto "Salvando..." (cursor wait). Desabilitado durante loading.

**Mobile:** modal ocupa `width: 100%` (padding de 16px do backdrop garante margens). Grid de campos colapsa para `1 coluna` abaixo de `480px`.

---

## Campo de Foto de Capa — `CoverPhotoField` (UNID-04)

**Três estados:**

### Estado 1 — Sem foto (dropzone)

```
[FLabel "Foto de capa"]
[Div dropzone — marginTop: 6px; height: 110px]
  borda: 1px dashed var(--border-2) (repouso) → var(--indigo) (drag-over)
  fundo: var(--surface-hi) (repouso) → oklch(0.339 0.179 301.68 / 0.08) (drag-over)
  layout: flex column center; gap: 8px
  [Box 30×30px com borda var(--border-2) — ícone ⤓ mono var(--fg-4)]
  [Texto r-meta "Arraste uma imagem ou clique para enviar"]
  [Link "ou usar foto de exemplo" — fontSize: 10px, cor var(--indigo), mono caps, letterSpacing: 0.5px]
```

`transition: all var(--dur-fast)` no container de dropzone para transição suave no drag-over.

`input[type="file"]` oculto (`display: none`) com `accept="image/*"`. `onClick` do dropzone dispara `inputRef.current?.click()`.

### Estado 2 — Com foto (preview)

```
[Div relativo — height: 150px; marginTop: 6px; border: 1px solid var(--border-3); overflow: hidden]
  [img — width: 100%; height: 100%; objectFit: cover]
    [filtro da foto de exemplo: grayscale(0.3) contrast(1.1) brightness(0.7)]
    [filtro de upload real: none]
  [Div overlay gradient — inset: 0; background: linear-gradient(180deg, transparent, rgba(0,0,0,0.5))]
  [Barra de ações — absolute, bottom: 10px, right: 10px; display: flex; gap: 6px]
    [Botão "Trocar" — fundo rgba(0,0,0,0.55), borda var(--border-2), cor var(--fg-1), mono caps 10px]
    [Botão "Remover" — fundo rgba(0,0,0,0.55), borda danger-mix, cor var(--danger-fg), mono caps 10px]
```

### Estado 3 — Upload em progresso

Após submit do modal, enquanto upload acontece: overlay de loading sobre o preview (opacity 0.6 + `.r-meta` "Enviando..."). Não bloquear o restante do formulário — o loading do submit já cobre isso.

**Regras de validação (client-side, antes de qualquer upload):**

- MIME: `file.type.startsWith('image/')` — exibir ErrLine "Apenas imagens são aceitas."
- Tamanho: `file.size > 2 * 1024 * 1024` — exibir ErrLine "Arquivo deve ter menos de 2MB."
- Memory leak: revogar `URL.createObjectURL` anterior ao selecionar novo arquivo e ao fechar modal.

**Foto de exemplo:** ao clicar "ou usar foto de exemplo", definir `preview = '/images/unidade-exemplo.jpg'` (path público em `/public/images/`). Nome exato do asset: `unidade-exemplo.jpg`. Detectar na exibição: se `foto_url.startsWith('/')` → `<img src={foto_url}>` direto (sem `createSignedUrl`).

---

## ConfirmDialog de Remoção (UNID-05)

Reusar `src/components/ui/ConfirmDialog.js` sem alteração de API.

| Prop | Valor para remoção de unidade |
|------|-------------------------------|
| `open` | `true` quando usuário clica "Remover" no card |
| `title` | `"Remover unidade?"` |
| `body` | `"A unidade [Nome da Unidade] será removida permanentemente. Esta ação não pode ser desfeita."` |
| `confirmLabel` | `"Remover Unidade"` |
| `cancelLabel` | `"Cancelar"` |
| `danger` | `true` |

**Visual resultante (per ConfirmDialog.js existente):**

- Eyebrow "AÇÃO DESTRUTIVA" em `var(--danger-fg)`
- Borda do container em `var(--danger-fg)`
- Botão confirm: `background: var(--danger-bg); color: var(--danger-fg)`
- Botão cancel: outline neutro

**Sequência de ações após confirmação:**

1. Tentar cleanup de Storage: `supabase-browser.storage.from('unidades-fotos').remove([unidade.foto_url])` — best-effort, ignorar erro
2. Chamar `deletarUnidade(id)` — Server Action
3. Iniciar animação de saída do card (220ms)
4. Exibir toast sonner "Unidade removida" (pattern existente de Phase 14)

---

## PageHeader (tela de Unidades)

Reusar `src/components/ui/PageHeader.js`.

| Prop | Valor |
|------|-------|
| `eyebrow` | `"U.LIST · UNIDADES"` |
| `title` | `"Unidades."` |
| `subtitle` | `"{n} disponíveis · {m} alugadas"` (dinâmico) |
| `cta.label` | `"Nova Unidade"` |
| `cta.code` | `"U+"` |
| `cta.onClick` | Abre modal em `mode: "create"` |

---

## Copywriting Contract

| Elemento | Copy |
|----------|------|
| CTA primária (tela) | "Nova Unidade" |
| CTA submit criar | "Criar Unidade" |
| CTA submit editar | "Salvar Alterações" |
| CTA cancelar | "Cancelar" |
| Eyebrow modal criar | "NOVA UNIDADE" |
| Eyebrow modal editar | "EDITAR UNIDADE" |
| Label campo foto | "Foto de capa" |
| Instrução dropzone | "Arraste uma imagem ou clique para enviar" |
| Link foto de exemplo | "ou usar foto de exemplo" |
| Botão trocar foto | "Trocar" |
| Botão remover foto | "Remover" |
| Checkbox visibilidade | "Exibir valor publicamente" |
| Placeholder busca | "Buscar unidade..." |
| Filtro status — todos | "Todos" |
| Filtro status — disponível | "Disponível" |
| Filtro status — alugada | "Alugada" |
| Select edifício — default | "Todos os edifícios" |
| Contador de filtro | "{n} resultado(s)" |
| Estado vazio (filtros ativos) | "Nenhuma unidade corresponde aos filtros." |
| Estado vazio (sem unidades) | "Nenhuma unidade cadastrada. Clique em Nova Unidade para começar." |
| Loading inicial | Skeleton (sem texto — 3 cards placeholder) |
| Erro de MIME no upload | "Apenas imagens são aceitas." |
| Erro de tamanho no upload | "Arquivo deve ter menos de 2MB." |
| Toast remoção | "Unidade removida" |
| Toast criação | "Unidade criada com sucesso" |
| Toast edição | "Unidade atualizada" |
| Toast erro genérico | "Erro ao salvar. Tente novamente." |
| Confirmação remoção — title | "Remover unidade?" |
| Confirmação remoção — body | "A unidade [Nome] será removida permanentemente. Esta ação não pode ser desfeita." |
| Confirmação remoção — label | "Remover Unidade" |
| Subtítulo de métricas — ocultos | "não exibidos no site" |
| Subtítulo de métricas — alugadas | "{n} alugadas" |
| Subtítulo de métricas — disponíveis | "{n} disponíveis" |
| Subtítulo de métricas — total | "{n} unidades" |

---

## Formatação de Valores Monetários

- **Formato abreviado (barra de métricas):** `R$ {n}k` quando ≥ 1000 (ex: `R$ 12,5k`); valor exato abaixo de 1000.
- **Formato completo (card e modal):** `R$ {n.000}` com separador de milhar pt-BR (ex: `R$ 3.200`).
- Função de referência: `D.fmtBRLk` e `D.fmtBRL` do protótipo (implementação livre no projeto).

---

## Animações e Transições

Todas as animações respeitam `prefers-reduced-motion: reduce` e `@media print { animation: none }` (per REFINO-05, entregue na Phase 17).

| Elemento | Animação | Duração / Easing |
|----------|----------|-----------------|
| Entrada da tela | `.r-fade` (translateY 8px → 0) | `var(--dur-base)` = 220ms, `var(--ease-crisp)` |
| Abertura do modal | Sem animação (aparecer direto) — backdrop com `romma-modal-backdrop` | — |
| Saída de card removido | `opacity: 0; transform: scale(0.97); transition: 220ms ease` | 220ms ease |
| Hover em dropzone (drag-over) | `border-color + background` | `var(--dur-fast)` = 120ms |
| Hover em botões micro | `color + border-color` via `.r-ghostbtn` | `var(--dur-fast)` = 120ms |
| Hover em botão de filtro status | `border + background` | `var(--dur-fast)` = 120ms |

---

## Componentes Novos a Criar

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| `UnifiedUnidadeModal` | `src/components/ui/UnifiedUnidadeModal.js` | Modal único criar/editar com CoverPhotoField embutido |
| `CoverPhotoField` | inline em `UnifiedUnidadeModal.js` OU `src/components/ui/CoverPhotoField.js` | Dropzone + preview + ações de foto |

> Decisão de extração: `CoverPhotoField` pode ser inline no modal para simplificar (sem necessidade de prop drilling adicional). A Phase 20 não reutiliza `CoverPhotoField` diretamente — apenas `UnifiedUnidadeModal`. Executor decide conforme clareza do código.

---

## Componentes Existentes a Modificar

| Componente | Arquivo | Mudança |
|------------|---------|---------|
| `Unidades` | `src/components/features/Unidades.js` | Adicionar barra de métricas, busca/filtros, trocar form inline + edição por-card pelo `UnifiedUnidadeModal`, adicionar `ConfirmDialog` para remoção |
| `UnidadeCard` | `src/components/ui/UnidadeCard.js` | Aceitar `foto_url`, gerar signed URL via `useFotoSignedUrl`, adaptar layout para Variante B (grade de cards) |
| `getUnidades` | `src/lib/queries-client.js` | Adicionar `foto_url` ao SELECT |
| `criarUnidade` | `src/actions/unidades.js` | Aceitar `foto_url`, retornar `{ status: 200, id }` |
| `editarUnidade` | `src/actions/unidades.js` | Aceitar `foto_url` no patch |
| `deletarUnidade` | `src/actions/unidades.js` | Cleanup best-effort de Storage antes do delete |

---

## Registry Safety

| Registry | Blocks usados | Safety Gate |
|----------|---------------|-------------|
| shadcn oficial | `Input`, `Select`, `Button`, `Skeleton` (já instalados) | Não requerido — componentes oficiais |
| Third-party | Nenhum | N/A |

Nenhum pacote npm novo nesta fase. Toda a funcionalidade (Storage upload, signed URL, drag/drop nativo, metrics derivadas) usa dependências já instaladas.

---

## Notas de Implementação (para Executor)

1. **Path do Storage:** usar `{unidade_id}/{uuid}.{ext}` (NÃO `{edificio_id}/...`). A RLS `storage_unidade_owned_by_auth` extrai o primeiro segmento como `unidade_id`. Ver RESEARCH.md Pitfall 1.

2. **Fluxo criar com foto:**
   - `criarUnidade(form)` → `{ status: 200, id }`
   - Upload: `supabase-browser.storage.from('unidades-fotos').upload(`${id}/${uuid}.${ext}`, file)`
   - `editarUnidade(id, { foto_url: path })`

3. **Exibição de foto:** `foto_url.startsWith('/')` → `<img src={foto_url}>` direto. Caso contrário: `createSignedUrl(foto_url, 3600)` via `supabase-browser`.

4. **Cleanup de signed URL:** não persistir em estado entre sessões. Re-gerar on-render.

5. **`UnifiedUnidadeModal` desacoplado:** props API fixa: `{ mode, initial, edificios, onClose, onSaved }`. Phase 20 importará este componente diretamente.

6. **`criarUnidade` retorna `id`:** necessário para montar o path de upload antes que a unidade tenha URL de foto.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
