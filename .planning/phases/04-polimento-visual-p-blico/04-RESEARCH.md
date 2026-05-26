# Phase 4: Polimento Visual Público - Research

**Researched:** 2026-05-25
**Domain:** UI polish — Tailwind v4, next/image, next/font, design system migration
**Confidence:** HIGH (stack já presente na codebase; verificação via leitura direta dos arquivos)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Fontes (VIS-01)**
- D-01: JetBrains Mono removido do projeto. Space Grotesk passa a cobrir todos os usos, incluindo os spots que antes usavam `--font-mono`. Remover `JetBrains_Mono` de `layout.js` e `--font-jetbrains-mono` de `globals.css`. `--font-mono` passa a referenciar `var(--font-space-grotesk)` (ou ser removido se não houver usos restantes). VIS-01 sobre Manrope/Noto Sans satisfeito com Space Grotesk.

**Imagens e next/image**
- D-02: 8 tags `<img>` nativas em `src/app/page.js` devem ser substituídas por `<Image>` do `next/image`. Corrige os 8 warnings `@next/next/no-img-element` deferidos da Fase 3. Necessário para DEPL-03 limpo.
- D-03: A `/unidades` pública não tem `<img>` nativas — o SVG grid placeholder deve ser substituído por uma `<Image>` com asset estático em `/public` (ex: `/images/unidade-placeholder.jpg`). Adicionar asset ao repositório.

**Redesign /unidades pública**
- D-04: Reescrever `src/app/unidades/page.js` completamente em Tailwind v4 — sem inline styles. Consistente com D-01 da Fase 1 ("PROIBIDO inline styles").
- D-05: Extrair subcomponentes: `src/components/features/UnidadesPublicas.js` (Client Component principal), `src/components/features/UnidadePublicaCard.js`, `src/components/features/UnidadeDetailSheet.js`. Padrão consistente com portal e dashboard.
- D-06: Paleta Obsidian Blueprint (`roxo #370085 = var(--indigo)`, `dourado #C5A059`) aplicada via CSS vars + tokens Tailwind já existentes em `globals.css`.

**UnidadeCard no Dashboard**
- D-07: `src/components/ui/UnidadeCard.js` — reescrever com design system Tailwind v4 + shadcn. O plano 01-06 explicitamente adiou a migração ("não migrar agora"). Implementar CRUD visual completo: modo leitura com dados formatados, modo edição inline com shadcn Input/Select/Button.
- D-08: A interface de props do `UnidadeCard` pode ser simplificada durante a reescrita — atualmente recebe ~14 props individuais (padrão arcaico). Subdelegar ao executor qual abordagem é mais limpa (props individuais vs. objeto único).

**Botão Editar Locatário**
- D-09: Adicionar botão "Editar" em `LocatariosDesktop.js`. O componente já tem a lógica de edição implementada (`editandoId`, `formEdit`, `handleEditarLocatario`) mas o botão não aparecia na UI. Verificar exatamente o que está faltando e adicionar de forma consistente com os outros botões de ação do componente.

### Claude's Discretion
- Nome exato do arquivo de placeholder de imagem em `/public` e formato (jpg vs webp).
- Estrutura exata de props do `UnidadePublicaCard.js` (os dados disponíveis são: `unidade`, `edificio`, `onSelect`).
- Se o `UnidadeCard.js` do dashboard deve permanecer em `src/components/ui/` ou mover para `src/components/features/` — checar onde outros cards do projeto vivem.

### Deferred Ideas (OUT OF SCOPE)
- Redesign completo da Landing Page `/` (VIS-04) — pós-banca ou pós-TCC.
- Troca de fontes para Manrope/Noto Sans — VIS-01 considerado satisfeito com as fontes atuais (Space Grotesk / JetBrains Mono).
- Versão desktop da /unidades (grid de cards, sidebar de filtros) — atual é mobile-first, versão desktop seria nova capacidade.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-01 | `/unidades` redesenhada com design Obsidian Blueprint (paleta Romma: roxo `#370085`, dourado `#C5A059`; fontes Space Grotesk via next/font; `<img>` migrados para next/image) | CSS vars `--indigo` e `--color-highlight` já mapeiam as cores corretas; Space Grotesk já carregada em `layout.js`; next/image já instalado no projeto |
</phase_requirements>

---

## Summary

A Fase 4 é uma fase de migração UI pura — o stack (Next.js 16, Tailwind v4, shadcn, next/font, next/image) já está instalado e em uso em outras partes do projeto. Não há novas dependências para instalar. O trabalho é: (1) remover JetBrains Mono de layout e CSS; (2) migrar tags `<img>` nativas para `<Image>` em dois arquivos; (3) reescrever `unidades/page.js` em Tailwind v4 com subcomponentes extraídos; (4) reescrever `UnidadeCard.js` com design system completo (CRUD visual: leitura + edição inline com shadcn); (5) implementar edição de locatário em `LocatariosDesktop.js`.

O design "Obsidian Blueprint" já existe como live reference em `src/app/login/page.js` e `src/components/features/portal/ContratoCard.js`. Os tokens de paleta (`--indigo`, `--fg-*`, `--border-*`, `var(--font-space-grotesk)`) já estão definidos em `globals.css`. O risco principal é a discrepância entre o que o CONTEXT.md descreve para D-09 e o estado real do código em `LocatariosDesktop.js`.

**Primary recommendation:** Seguir a ordem de menor risco para maior: fontes → img tags → UnidadeCard → UnidadePublicaCard/Sheet → UnidadesPublicas completo → botão editar locatário.

---

## Discrepâncias Críticas: CONTEXT.md vs Codebase Real

> Estas discrepâncias foram descobertas durante a leitura da codebase e DEVEM ser consideradas pelo planejador.

### Discrepância D-09: Estado de edição de locatário

**CONTEXT.md afirma:** `LocatariosDesktop.js` já tem a lógica de edição implementada (`editandoId`, `formEdit`, `handleEditarLocatario`) e só falta o botão trigger.

**Realidade verificada:** `LocatariosDesktop.js` não contém nenhuma dessas variáveis ou handlers. Zero matches no grep. A lógica de edição existe em `src/components/features/Locatarios.js` (componente mobile abandonado, sem design system). O botão "VER →" em `LocatariosDesktop.js` navega para `/dashboard/locatarios/${l.id}` — essa rota existe como page.js de 414 bytes que é apenas a listagem geral, não uma página de detalhe/edição.

**Implicação:** D-09 requer **implementar** a lógica de edição em `LocatariosDesktop.js` (copiando de `Locatarios.js` e portando para Tailwind v4 + shadcn), não apenas adicionar um botão. O Server Action `editarLocatario` já existe em `src/actions/locatarios.js` e está correto.

**Padrão a seguir:** `Unidades.js` tem o padrão mais maduro: `editandoId` (useState separado) + `formEdit` (objeto único) + callbacks `handleEditarUnidade`/`handleSalvarUnidade` delegados ao card. Replicar este padrão em `LocatariosDesktop.js`.

### Discrepância D-05: `UnidadeCardPublico.js` já existe

**CONTEXT.md propõe criar:** `src/components/features/UnidadePublicaCard.js`

**Realidade verificada:** Já existe `src/components/ui/UnidadeCardPublico.js` — um componente antigo com design diferente (usa `font-headline-hanken`, Tailwind de landing page, não o design Obsidian Blueprint). Não está em uso na página `/unidades` atual.

**Decisão para o planejador:** Ignorar o componente antigo — criar `src/components/features/UnidadePublicaCard.js` (novo, Obsidian Blueprint, Tailwind v4 + design tokens) e deixar `src/components/ui/UnidadeCardPublico.js` como dead code para remoção posterior (fora de escopo desta fase).

### Descuido adjacente: Public_Sans importado mas não usado

`src/app/layout.js` importa `Public_Sans` de `next/font/google` mas nunca atribui a variável resultante. É dead import. Pode ser removido junto com o JetBrains_Mono em D-01 sem custo extra.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Font loading (D-01) | Frontend Server (layout.js) | CSS (globals.css) | next/font roda em Server Component; CSS vars propagam para todo o app |
| next/image migration (D-02, D-03) | Browser/Client | — | Componentes já são Client Components; Image é componente React passivo |
| /unidades rewrite (D-04, D-05, D-06) | Browser/Client | API (queries-client.js) | Já é 'use client'; queries existentes mantidas sem alteração |
| UnidadeCard dashboard (D-07, D-08) | Browser/Client | — | Componente de UI puro; estado de edição gerenciado pelo parent Unidades.js |
| Botão editar locatário (D-09) | Browser/Client | API (actions/locatarios.js) | Lógica de edição é client-side; Server Action já existe |

---

## Standard Stack

Esta fase não instala novas dependências. Stack existente:

### Core (já instalado)

| Biblioteca | Versão | Propósito | Referência no projeto |
|-----------|--------|-----------|----------------------|
| next/image | bundled com Next.js ^16.2.4 | Otimização de imagens, lazy loading automático, prevenção de CLS | `src/app/login/page.js` — `<Image src="/hero-building.png" fill priority />` |
| next/font | bundled com Next.js ^16.2.4 | Carregamento de fontes Google sem layout shift, CSS vars | `src/app/layout.js` — `Space_Grotesk({ variable: "--font-space-grotesk" })` |
| tailwindcss ^4 | ^4 | Utility classes; `@theme` para tokens; `font-mono`, `font-display` como utilities | `src/app/globals.css` — `@theme { ... }` + `@utility font-mono` |
| shadcn/ui | ^4.2.0 | Button, Input, Select já instalados e em uso | `src/components/ui/button.jsx`, `input.jsx`, `select.jsx` |

### Instalação

Nenhuma instalação necessária.

---

## Package Legitimacy Audit

Nenhum pacote novo a instalar nesta fase.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| — | — | — | — | — | — | Não aplicável |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
Browser
  └── /unidades route
        └── page.js (Server Component thin shell)
              └── UnidadesPublicas.js ('use client')
                    ├── useEffect → getUnidades() + getEdificios() [queries-client.js]
                    ├── Realtime subscription → supabase-browser.js channel 'public-unidades'
                    ├── UnidadePublicaCard.js (card individual, onClick → setSelected)
                    └── UnidadeDetailSheet.js (bottom sheet, onSimular callback)

Browser
  └── /dashboard/unidades route
        └── Unidades.js ('use client') [existente, não alterado no shell]
              └── UnidadeCard.js (reescrito com design system)
                    ├── modo leitura → exibe dados + botões Editar/Remover
                    └── modo edição → shadcn Input/Select/Button (CRUD visual completo)

Browser
  └── /dashboard/locatarios route
        └── page.js (Server Component) → LocatariosDesktop.js
              └── LocatariosDesktop.js (implementar estado editandoId + formEdit + modal de edição)
```

### Recommended Project Structure (novos arquivos)

```
src/
├── app/
│   └── unidades/
│       └── page.js                      # reescrever (thin shell → importa UnidadesPublicas)
├── components/
│   └── features/
│       ├── UnidadesPublicas.js          # Client Component principal (extraído)
│       ├── UnidadePublicaCard.js        # card individual da listagem pública (novo)
│       └── UnidadeDetailSheet.js        # bottom sheet de detalhes (novo)
public/
└── images/
    └── (placeholder asset — ver Detalhes do Asset Placeholder abaixo)
```

### Padrão 1: thin shell page.js → feature component

Canônico no projeto. `page.js` é Server Component que importa um único Client Component.

```javascript
// src/app/unidades/page.js — após reescrita
import UnidadesPublicas from '@/components/features/UnidadesPublicas'

export default function UnidadesPage() {
  return <UnidadesPublicas />
}
```

[ASSUMED] — padrão inferido dos outros `page.js` do projeto, sem fonte externa.

### Padrão 2: next/image com fill para containers de altura fixa

Padrão existente no projeto (`login/page.js`):

```javascript
// Quando o container define o tamanho (height + relative):
<div className="relative h-40 border border-border-3">
  <Image
    src="/Detalhe_Arquitetonico.png"
    alt=""
    fill
    className="object-cover opacity-10"
    sizes="100vw"
  />
</div>
```

`fill` requer que o elemento pai tenha `position: relative` e dimensões definidas. [ASSUMED] baseado em comportamento padrão do next/image — verificar via docs oficiais se necessário.

### Padrão 3: next/image para SVGs e PNGs com dimensões conhecidas

Para os 8 `<img>` em `src/app/page.js`:
- SVGs de ícone (`icon_qr_01.svg` etc.) → `<Image width={28} height={28} src="..." alt="" />`
- PNGs de conteúdo (`Detalhe_Arquitetonico.png`, `data_regional_demand_graph.png`) → `<Image width={W} height={H} src="..." alt="..." />` com dimensões reais ou `fill` em container relativo

```javascript
// Substituição de <img src="/icon_qr_01.svg" alt="" className="w-7">
import Image from 'next/image'
<Image src="/icon_qr_01.svg" alt="" width={28} height={28} />
```

[ASSUMED] — comportamento padrão do next/image.

### Padrão 4: Design tokens em Tailwind v4

Canônico no projeto. CSS vars de `globals.css` mapeadas para classes Tailwind via `@theme inline`:

```javascript
// CSS vars → classes Tailwind (via @theme inline em globals.css)
// var(--indigo) → text-indigo, bg-indigo, border-indigo
// var(--fg-1) → text-fg-1
// var(--font-space-grotesk) → font-body (via @theme)

// Exemplo de uso (padrão LocatariosDesktop.js / ContratoCard.js):
<span className="font-mono text-[9px] text-fg-5 tracking-[1.5px] uppercase">
  ETIQUETA
</span>
<h2 className="font-body font-bold text-[32px] tracking-[-1.6px] text-fg-1">
  Título
</h2>
```

[VERIFIED pelo código da codebase]

### Padrão 5: estado de edição inline (Unidades.js como modelo)

O `Unidades.js` já tem o padrão maduro para edição inline via UnidadeCard:
- `editandoId` (useState separado, nunca consolidado em `form`)
- `formEdit` (objeto único com todos os campos)
- Handlers `handleEditar`, `handleSalvar` no parent, delegados via props ao card

```javascript
// Em LocatariosDesktop.js — a implementar conforme este padrão:
const [editandoId, setEditandoId] = useState(null)
const [formEdit, setFormEdit] = useState({
  nome_razao_social: '', tipo: '', documento: '', email: '', telefone: ''
})

function handleEditarLocatario(locatario) {
  setFormEdit({ nome_razao_social: locatario.nome_razao_social, ... })
  setEditandoId(locatario.id)
}

async function handleSalvarLocatario() {
  const { status, erroMessage } = await editarLocatario(editandoId, formEdit)
  if (status === 200) {
    setEditandoId(null)
    setLocatarios(await getLocatarios() ?? [])
  } else {
    setErro(erroMessage ?? 'Erro ao salvar.')
  }
}
```

[VERIFIED pelo código de Unidades.js e actions/locatarios.js]

### Anti-Patterns a Evitar

- **Inline styles em unidades/page.js:** D-04 proíbe explicitamente. Substituir 100% por classes Tailwind v4. Exceção canônica do projeto: `style={{ all: "unset" }}` para reset de botões (documentado em CLAUDE.md — não é inline style de layout).
- **SVG inline como placeholder de imagem:** Substituir pelo asset estático + `<Image>` (D-03).
- **Props individuais para estado de edição:** UnidadeCard atual tem 14 props individuais de setter. D-08 deixa a abordagem em aberto — executor decide entre props individuais vs. objeto único. Ambas são válidas; escolher a mais limpa no contexto da reescrita.
- **Criar `middleware.js`:** CLAUDE.md proíbe. Roteamento/auth via `proxy.js`.
- **Inline styles de layout em novos componentes:** CLAUDE.md D-01 da Fase 1 proíbe. Usar Tailwind v4 utility classes.

---

## Don't Hand-Roll

| Problema | Não construir | Usar | Motivo |
|----------|--------------|------|--------|
| Otimização de imagem | Tag `<img>` com `loading="lazy"` manual | `<Image>` do `next/image` | Lazy loading, prevenção de CLS, preload automático com `priority`, otimização de formato |
| Carregamento de fontes sem FOUT | Font stylesheet manual, `@font-face` | `next/font/google` | Zero layout shift, preconnect automático, CSS var injetada no `<html>` |
| Bottom sheet overlay | Position fixed + onOutsideClick custom | Padrão existente em `unidades/page.js` (manter comportamento) | Já funciona; reescrever em Tailwind sem alterar a lógica de interação |

---

## Cascata de Remoção do JetBrains Mono (D-01)

Esta é a mudança mais ampla da fase mas com impacto zero nos componentes:

**Arquivos a modificar:**
1. `src/app/layout.js` — remover import `JetBrains_Mono` + remover `jetbrainsMono.variable` do className do `<html>` + remover import `Public_Sans` (dead import)
2. `src/app/globals.css` linha 20 (`@theme`): `--font-mono: var(--font-jetbrains-mono), monospace` → `var(--font-space-grotesk), sans-serif`
3. `src/app/globals.css` linha 129 (`:root`): `--font-mono: var(--font-jetbrains-mono), monospace` → `var(--font-space-grotesk), sans-serif`

**Componentes — nenhuma mudança necessária:** Todos os ~50 usos de `className="font-mono ..."` e `style={{ fontFamily: 'var(--font-mono)' }}` herdam automaticamente o novo valor via CSS var. Zero edições nos componentes.

**`--font-display-arch`:** Já aponta para `var(--font-body)` = Space Grotesk (linha 97 de globals.css). Nenhuma mudança necessária.

---

## Detalhes do Asset Placeholder (D-03)

**Pasta a criar:** `/public/images/` (não existe)

**Recomendação (Claude's Discretion):** Usar `Detalhe_Arquitetonico.png` existente (já em `/public/`, 163KB) com referência direta — zero arquivo novo necessário, estética blueprint preservada. O caminho seria `/Detalhe_Arquitetonico.png` (raiz do public). Criar `/public/images/` apenas se o planejador preferir organização em subpasta para o placeholder.

**Se o planejador optar por novo arquivo:** `/public/images/unidade-placeholder.webp` — next/image serve em webp automaticamente de qualquer formato de origem, então jpg ou webp são equivalentes em termos de performance final.

---

## Detalhamento D-05: UnidadeCard localização

**Situação atual de cards no projeto:**
- `src/components/ui/UnidadeCard.js` — dashboard (será reescrito, D-07)
- `src/components/ui/UnidadeCardPublico.js` — antigo, sem uso (dead code)
- `src/components/features/portal/ContratoCard.js` — portal

**Convenção observada:** Cards com lógica de negócio ou dados específicos de domínio vivem em `features/`. `ui/` tem componentes genéricos (Button, Input, StatusBadge).

**Recomendação:** Manter `UnidadeCard.js` em `src/components/ui/` (contexto de dashboard, importado por `Unidades.js` que vive em `features/`). Criar novos componentes públicos em `src/components/features/`. Esta é área de Claude's Discretion — executor pode mover para `features/` se considerar mais consistente.

---

## Common Pitfalls

### Pitfall 1: next/image sem dimensões em container sem altura definida

**O que falha:** `<Image src="..." fill />` em container sem `height` definida — imagem some ou tem tamanho 0.
**Por que acontece:** `fill` usa `position: absolute` relativo ao pai; sem altura, o pai colapsa.
**Como evitar:** Sempre definir `height` ou `min-height` no container pai + `position: relative`. Usar `className="relative h-40"` no pai.
**Sinal de alerta:** Imagem invisível na página sem erros no console.

### Pitfall 2: `sizes` prop ausente com `fill` gera warning de performance

**O que falha:** Next.js 16 loga aviso sobre `sizes` não especificado quando usando `fill`.
**Por que acontece:** Sem `sizes`, o browser baixa a imagem no tamanho máximo.
**Como evitar:** Adicionar `sizes="100vw"` para fullscreen ou `sizes="(max-width: 768px) 100vw, 50vw"` para containers responsivos.

### Pitfall 3: `--font-jetbrains-mono` residual em globals.css

**O que falha:** Após remover o import em `layout.js`, a CSS var `--font-jetbrains-mono` se torna vazia/undefined mas ainda é referenciada em globals.css linhas 20 e 129.
**Por que acontece:** next/font injeta a variável CSS via o className no `<html>`. Sem o className, a var some.
**Como evitar:** Atualizar **ambas** as linhas em globals.css (linha 20 em `@theme` E linha 129 em `:root`) para apontar para `var(--font-space-grotesk)`.

### Pitfall 4: bottom sheet — mudança de posicionamento é intencional

**Contexto:** O `UnitDetailSheet` atual usa `position: absolute` no container pai com `overflow: hidden` e `height: 100dvh`. Ao reescrever em Tailwind com `fixed inset-0`, o overlay passa a cobrir o viewport inteiro (não apenas o container pai). Esta é uma mudança de comportamento intencional — o modal de detalhe deve ser uma sobreposição real sobre o viewport, não restrito ao container.
**Como evitar regressão:** Verificar que `z-index` (`z-50`) não conflita com elementos fixos existentes na página pública (header, se houver). Testar no mobile onde a diferença entre `absolute` e `fixed` é mais perceptível.

### Pitfall 5: D-09 subestimado — edição de locatário requer implementação completa

**O que vai errado:** Planejar apenas "adicionar um botão" quando na verdade é necessário implementar toda a lógica de estado de edição em `LocatariosDesktop.js`.
**Escopo real:** useState `editandoId` + `formEdit` + handlers `handleEditarLocatario` + `handleSalvarLocatario` + modal/form de edição seguindo o padrão do modal de convite já existente no mesmo componente.
**Estimativa de impacto:** ~50-80 linhas adicionais em `LocatariosDesktop.js`.

---

## Code Examples

### Tailwind v4 — card de unidade (padrão Obsidian Blueprint)

```javascript
// Baseado em ContratoCard.js e LocatariosDesktop.js (padrões verificados)
// Source: src/components/features/portal/ContratoCard.js (codebase)
// Nota: style={{ all: 'unset' }} é a exceção canônica do projeto para reset de botão
// (documentado em CLAUDE.md — não viola D-04 que proíbe inline styles de layout)
function UnidadePublicaCard({ unidade, edificio, onSelect }) {
  return (
    <button
      style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', boxSizing: 'border-box' }}
      className="px-5 py-5 border-t border-border-3 hover:bg-surface-hi transition-colors"
      onClick={() => onSelect(unidade)}
    >
      <div className="flex justify-between items-start gap-3 mb-2">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[9px] text-fg-5 tracking-[0.8px] uppercase">
            UN-{unidade.id.slice(0, 6).toUpperCase()}
          </span>
          <span className="font-body font-bold text-[22px] tracking-[-0.8px] text-fg-1 leading-tight">
            {unidade.nome}
          </span>
          {edificio && (
            <span className="text-[12px] text-fg-3">{edificio.nome}</span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {unidade.area_m2 && (
            <span className="font-mono text-[9px] text-fg-5 tracking-[0.5px] uppercase whitespace-nowrap">
              {unidade.area_m2}m²
            </span>
          )}
          <StatusBadge status="disponivel" />
        </div>
      </div>
    </button>
  )
}
```

### next/image com fill (padrão do projeto)

```javascript
// Source: src/app/login/page.js — LeftPanel (codebase)
// Reutilizando Detalhe_Arquitetonico.png já existente em /public/
<div className="relative h-40 border border-border-3 overflow-hidden">
  <Image
    src="/Detalhe_Arquitetonico.png"
    alt=""
    fill
    className="object-cover opacity-10"
    sizes="100vw"
  />
</div>
```

### Remoção de JetBrains Mono (globals.css)

```css
/* ANTES (linha 20 em @theme): */
--font-mono: var(--font-jetbrains-mono), monospace;

/* DEPOIS: */
--font-mono: var(--font-space-grotesk), sans-serif;

/* ANTES (linha 129 em :root): */
--font-mono:     var(--font-jetbrains-mono), monospace;

/* DEPOIS: */
--font-mono:     var(--font-space-grotesk), sans-serif;
```

---

## Estado da Arte

| Abordagem antiga | Abordagem atual | Motivo |
|-----------------|-----------------|--------|
| `<img>` nativa | `<Image>` do next/image | Performance: lazy loading, prevenção de CLS, conversão de formato automática |
| inline styles (`style={{...}}`) de layout | Tailwind v4 utility classes | Decisão D-01 Fase 1 — proibido inline styles (exceto `style={{ all: "unset" }}` para reset de botão) |
| Props individuais de estado (14 props) | Interface a definir pelo executor (D-08) | D-08 deixa aberta a abordagem — props individuais ou objeto único |
| Componentes monolíticos (tudo em page.js) | Thin shell + feature component | Padrão estabelecido pela Fase 1 |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `fill` requer container pai com `position: relative` e dimensões definidas | Architecture Patterns — Padrão 2 | Imagem invisível — verificar docs oficiais se comportamento diferir no Next 16 |
| A2 | `<Image width={28} height={28}>` funciona para SVGs de ícone | Architecture Patterns — Padrão 3 | SVG pode não renderizar corretamente — considerar `next/image` com `unoptimized` para SVGs ou usar inline SVG |
| A3 | Reaproveitamento de `Detalhe_Arquitetonico.png` como placeholder visual é esteticamente adequado | Detalhes do Asset Placeholder | Caso o design requeira outro asset, precisará criar novo arquivo |

---

## Open Questions

1. **SVGs de ícone com `<Image>`**
   - O que sabemos: `next/image` pode ter comportamento especial com SVGs (sanitização, tamanho)
   - O que está incerto: se `width`/`height` fixos funcionam bem para todos os 4 SVGs de ícone em `page.js`
   - Recomendação: Usar `<Image width={28} height={28} unoptimized>` para SVGs — ou manter os SVGs como elementos `<img>` e justificar no lint (`eslint-disable-next-line @next/next/no-img-element`) apenas para SVGs, aplicando `<Image>` apenas para imagens raster. Decisão de baixo risco.

2. **Localização do modal de edição em LocatariosDesktop.js (D-09)**
   - O que sabemos: O componente já tem um modal de convite (showInviteForm) com padrão bem estabelecido
   - O que está incerto: Se a edição deve ser inline na linha da tabela ou em modal separado
   - Recomendação: Modal separado, seguindo o padrão do modal de convite — `showEditForm` + `editandoId` — consistente com o componente existente.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| next/image | D-02, D-03 | ✓ | bundled Next.js ^16.2.4 | — |
| next/font | D-01 | ✓ | bundled Next.js ^16.2.4 | — |
| Space_Grotesk (Google Font) | D-01 | ✓ | já carregada em layout.js | — |
| shadcn Button/Input/Select | D-07, D-09 | ✓ | já instalado | — |
| /public/images/ directory | D-03 (opcional) | ✗ (não existe) | — | Usar /public/ raiz com Detalhe_Arquitetonico.png |

**Missing dependencies with no fallback:**
- Nenhum.

**Missing dependencies with fallback:**
- `/public/images/` directory: fallback é usar `Detalhe_Arquitetonico.png` existente na raiz de `/public/`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright ^1.60.0 |
| Config file | `playwright.config.js` (existente) |
| Quick run command | `npm run lint` |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIS-01 | Zero tags `<img>` nativas após migração | lint (grep) | `grep -rn '<img' src/app/page.js src/app/unidades 2>/dev/null | wc -l` (esperado: 0) | N/A |
| VIS-01 | Zero inline styles de layout em `unidades/page.js` | lint (grep) | `grep -c 'style={{' src/app/unidades/page.js` (esperado: 0 ou apenas reset de botão) | N/A |
| VIS-01 | Zero referências a JetBrains Mono | lint (grep) | `grep -r 'JetBrains\|jetbrains' src/ --include="*.js" --include="*.css"` (esperado: 0) | N/A |
| VIS-01 | Build limpo sem erros | build | `npm run lint && npm run build` | N/A |
| VIS-01 | Visual fidelity Obsidian Blueprint | manual UAT | — (inspeção visual obrigatória) | N/A |

> **Nota:** Esta é uma fase essencialmente visual. A verificação automática cobre ausência de padrões proibidos (img nativa, JetBrains). Fidelidade visual é manual UAT — Playwright não cobre aqui (isso é fase 5).

### Sampling Rate

- **Por commit de task:** `npm run lint` (< 30 segundos)
- **Por merge de wave:** `npm run build` completo
- **Phase gate:** `npm run lint && npm run build` verde + inspeção visual das 3 páginas afetadas (`/unidades`, `/dashboard/unidades`, `/dashboard/locatarios`)

### Wave 0 Gaps

Nenhum — infraestrutura de lint e build existente cobre as verificações automáticas desta fase.

---

## Security Domain

Esta fase é puramente de UI/migração visual. Sem novas superfícies de ataque.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | não | — |
| V3 Session Management | não | — |
| V4 Access Control | não | — |
| V5 Input Validation | parcialmente | `editarLocatario` Server Action já tem validação UUID e whitelist de campos |
| V6 Cryptography | não | — |

**D-09 — segurança:** O Server Action `editarLocatario` já faz whitelist de campos (`{ nome_razao_social, tipo, documento, email, telefone }` — não passa id/usuario_id do form). Guard de proprietário existente. Nenhuma mudança de segurança necessária.

---

## Sources

### Primary (HIGH confidence)

- Leitura direta de `src/app/unidades/page.js` — estado atual do componente a reescrever
- Leitura direta de `src/app/layout.js` — fontes carregadas, dead imports identificados
- Leitura direta de `src/app/globals.css` — tokens CSS vars, linhas 20 e 129 com `--font-mono`
- Leitura direta de `src/components/ui/UnidadeCard.js` — 14 props individuais confirmadas
- Leitura direta de `src/components/features/LocatariosDesktop.js` — ausência confirmada de lógica de edição
- Leitura direta de `src/actions/locatarios.js` — `editarLocatario` Server Action existente e correto
- Leitura direta de `src/app/login/page.js` — padrão canônico de Tailwind v4 + next/image
- Leitura direta de `src/components/features/portal/ContratoCard.js` — padrão canônico de card em Tailwind v4

### Secondary (MEDIUM confidence)

- Comportamento de `next/image` com `fill` — baseado em padrão observado em `login/page.js` + conhecimento de treinamento sobre next/image

### Tertiary (LOW confidence)

- Comportamento de `next/image` com SVGs — inferido, não verificado contra docs Next.js 16

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — tudo já instalado, verificado na codebase
- Architecture: HIGH — padrões verificados nos arquivos do projeto
- Pitfalls: HIGH — baseados em leitura direta do código atual
- D-09 scope: HIGH — discrepância confirmada por grep com zero matches

**Research date:** 2026-05-25
**Valid until:** 2026-06-18 (deadline do TCC — stack estável, sem mudanças esperadas)
