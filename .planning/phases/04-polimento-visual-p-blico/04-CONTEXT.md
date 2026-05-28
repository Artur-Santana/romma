# Phase 4: Polimento Visual Público - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Fase 4 entrega: (1) redesign completo da `/unidades` pública — Tailwind v4 + Obsidian Blueprint, extração de subcomponentes, substituição do SVG placeholder por `<Image>` do next/image com placeholder estático; (2) correção dos 8 `<img>` nativos em `src/app/page.js` para next/image (deferido da Fase 3, limpa lint/build); (3) redesign do `UnidadeCard.js` — o componente do dashboard que foi deixado como skeleton propositalmente no Plano 01-06; (4) botão de editar Locatário ausente em `LocatariosDesktop.js` (UAT Fase 3, issue deferido).

**Fora de escopo:** redesign completo da landing page `/` (VIS-04 — deferred v2), novas funcionalidades de negócio.

</domain>

<decisions>
## Implementation Decisions

### Fontes (VIS-01)
- **D-01:** JetBrains Mono removido do projeto. Space Grotesk passa a cobrir todos os usos, incluindo os spots que antes usavam `--font-mono`. Remover `JetBrains_Mono` de `layout.js` e `--font-jetbrains-mono` de `globals.css`. `--font-mono` passa a referenciar `var(--font-space-grotesk)` (ou ser removido se não houver usos restantes). VIS-01 sobre Manrope/Noto Sans satisfeito com Space Grotesk.

### Imagens e next/image
- **D-02:** 8 tags `<img>` nativas em `src/app/page.js` devem ser substituídas por `<Image>` do `next/image`. Corrige os 8 warnings `@next/next/no-img-element` deferidos da Fase 3. Necessário para DEPL-03 limpo.
- **D-03:** A `/unidades` pública não tem `<img>` nativas — o SVG grid placeholder deve ser substituído por uma `<Image>` com asset estático em `/public` (ex: `/images/unidade-placeholder.jpg`). Adicionar asset ao repositório.

### Redesign /unidades pública
- **D-04:** Reescrever `src/app/unidades/page.js` completamente em Tailwind v4 — sem inline styles. Consistente com D-01 da Fase 1 ("PROIBIDO inline styles").
- **D-05:** Extrair subcomponentes: `src/components/features/UnidadesPublicas.js` (Client Component principal), `src/components/features/UnidadePublicaCard.js`, `src/components/features/UnidadeDetailSheet.js`. Padrão consistente com portal e dashboard.
- **D-06:** Paleta Obsidian Blueprint (`roxo #370085 = var(--indigo)`, `dourado #C5A059`) aplicada via CSS vars + tokens Tailwind já existentes em `globals.css`.

### UnidadeCard no Dashboard (leftover Fase 1)
- **D-07:** `src/components/ui/UnidadeCard.js` — reescrever com design system Tailwind v4 + shadcn. O plano 01-06 explicitamente adiou a migração ("não migrar agora"). Implementar CRUD visual completo: modo leitura com dados formatados, modo edição inline com shadcn Input/Select/Button.
- **D-08:** A interface de props do `UnidadeCard` pode ser simplificada durante a reescrita — atualmente recebe ~14 props individuais (padrão arcaico). Subdelegar ao executor qual abordagem é mais limpa (props individuais vs. objeto único).

### Botão Editar Locatário (leftover UAT Fase 3)
- **D-09:** Adicionar botão "Editar" em `LocatariosDesktop.js`. O componente já tem a lógica de edição implementada (`editandoId`, `formEdit`, `handleEditarLocatario`) mas o botão não aparecia na UI. Verificar exatamente o que está faltando e adicionar de forma consistente com os outros botões de ação do componente.

### Claude's Discretion
- Nome exato do arquivo de placeholder de imagem em `/public` e formato (jpg vs webp).
- Estrutura exata de props do `UnidadePublicaCard.js` (os dados disponíveis são: `unidade`, `edificio`, `onSelect`).
- Se o `UnidadeCard.js` do dashboard deve permanecer em `src/components/ui/` ou mover para `src/components/features/` — checar onde outros cards do projeto vivem.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Escopo e Requisitos
- `.planning/ROADMAP.md` — Phase 4 goal, success criteria, VIS-01
- `.planning/REQUIREMENTS.md` — definição formal de VIS-01

### Decisões de Fases Anteriores
- `.planning/phases/01-dashboard-completions/01-CONTEXT.md` — D-01 (proibição inline styles), D-02 (CSS vars como tokens Tailwind), D-03 (shadcn/ui), D-04 (breakpoints)
- `.planning/phases/01-dashboard-completions/01-06-PLAN.md` — confirmação de que UnidadeCard foi intencionalmente adiado ("não migrar agora")
- `.planning/phases/03-refatora-o-e-qualidade/03-CONTEXT.md` — D-02: 8 warnings no-img-element deferidos para cá

### Arquivos a Modificar / Reescrever
- `src/app/unidades/page.js` — reescrever em Tailwind v4 + extrair subcomponentes
- `src/app/page.js` — substituir 8 `<img>` por `<Image>` (next/image)
- `src/components/ui/UnidadeCard.js` — reescrever com design system completo
- `src/components/features/LocatariosDesktop.js` — adicionar botão editar locatário

### Arquivos a Criar
- `src/components/features/UnidadesPublicas.js` — Client Component principal da /unidades
- `src/components/features/UnidadePublicaCard.js` — card individual da listagem pública
- `src/components/features/UnidadeDetailSheet.js` — bottom sheet de detalhes
- `public/images/unidade-placeholder.jpg` (ou .webp) — asset estático para next/image

### Padrões e Design System
- `src/app/globals.css` — tokens CSS vars + @theme Tailwind (paleta, fontes, bordas)
- `src/app/login/page.js` — referência canônica de Tailwind v4 + shadcn neste projeto
- `src/components/features/portal/ContratoCard.js` — referência de card migrado para Tailwind v4 (Fase 2)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RealtimeDot` (`src/components/ui/RealtimeDot.js`) — já usado na /unidades atual, manter
- `StatusBadge` (`src/components/ui/StatusBadge.js`) — reuso nos cards de unidade (status `disponivel`)
- `fmtBRL()`, `fmtData()` em `src/lib/utils.js` — formatação de valor mensal
- `getUnidades()`, `getEdificios()` em `src/lib/queries-client.js` — queries já existentes, não alterar
- `createClient` de `supabase-browser.js` — usado para Realtime (manter subscription existente)
- Shadcn: `Button`, `Input`, `Select` já instalados e usados no dashboard

### Established Patterns
- Server Component thin shell em `page.js` que importa um único feature component (padrão do projeto)
- `"use client"` + `useEffect` para data fetching em feature components públicos
- `form` e `formEdit` como objetos únicos de estado (não per-field)
- `editandoId` como useState separado (não consolidar em form object)
- Realtime via `supabase.channel().on().subscribe()` com cleanup `removeChannel` no return do useEffect

### Integration Points
- `/unidades` tem Realtime subscription (INSERT + DELETE em `unidades`) — preservar ao reescrever
- `UnidadeCard.js` recebe ~14 props de `Unidades.js` — interface pode ser simplificada na reescrita
- `LocatariosDesktop.js` já tem lógica de edição implementada (`editandoId`, `formEdit`, Server Action `editarLocatario`) — só falta o botão trigger

</code_context>

<specifics>
## Specific Ideas

- O design atual de `/unidades` tem uma estética blueprint/arquitetônica com dark background, grid SVG, mono type para refs de unidade — preservar esta direção ao reescrever em Tailwind.
- O `UnitDetailSheet` atual é um bottom sheet mobile-first com overlay — manter este padrão de interação.
- Para `UnidadeCard` no dashboard: o modo edição inline atual passa dados via setState individual para o parent — avaliar se é mais limpo manter o estado de edição dentro do card ou no parent (padrão atual mantém no parent via `editandoId`).

</specifics>

<deferred>
## Deferred Ideas

- Redesign completo da Landing Page `/` (VIS-04) — pós-banca ou pós-TCC.
- Troca de fontes para Manrope/Noto Sans — VIS-01 considerado satisfeito com as fontes atuais (Space Grotesk / JetBrains Mono).
- Versão desktop da /unidades (grid de cards, sidebar de filtros) — atual é mobile-first, versão desktop seria nova capacidade.

</deferred>

---

*Phase: 04-polimento-visual-p-blico*
*Context gathered: 2026-05-25*
