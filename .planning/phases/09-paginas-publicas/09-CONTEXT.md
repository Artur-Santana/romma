# Phase 9: Páginas Públicas - Context

**Gathered:** 2026-06-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Fazer a landing page e /unidades transmitirem credibilidade ao avaliador na banca: CTAs do hero funcionais com hierarquia correta, botões quebrados corrigidos, card de unidade exibindo as informações especificadas (PUB-01), e tap targets no mobile em conformidade (PUB-03). Nenhuma tela nova — apenas ajustes nas páginas públicas existentes.

</domain>

<decisions>
## Implementation Decisions

### CTAs do hero — src/app/page.js
- **D-01:** "INICIE GRATUITAMENTE" (primeiro botão, gradiente) → converter para `<Link href="/login">`, texto "ACESSAR DASHBOARD". Mantém estilo primário (gradiente `from-primary to-primary-hover`). Satisfaz LP-02.
- **D-02:** "VER PROJETOS" (segundo botão, bg-background) → renomear para "VER UNIDADES", href="/unidades" já correto. Mantém estilo secundário. Satisfaz LP-01.
- **D-03:** Hierarquia visual: "ACESSAR DASHBOARD" é o CTA primário (gradiente), "VER UNIDADES" é secundário — essa é a ordem correta para o avaliador.

### Botão "ACESSE ANALITYCS" — seção SISTEMA.04 (Painel do Proprietário)
- **D-04:** Converter `<button type="button">` para `<Link href="/login">`, corrigir label para "ACESSAR PAINEL" (corrige typo "ANALITYCS" e torna o label mais preciso). Mantém estilos visuais do botão. Satisfaz LP-03.

### Card de unidade — src/components/features/UnidadePublicaCard.js
- **D-05:** Trocar texto "Valor sob consulta" → "Consulte o Proprietário" quando `valor_visivel = false`. Alinha com terminologia do CLAUDE.md e requisito PUB-01.

### Mobile tap targets — src/components/features/UnidadesPublicas.js
- **D-06:** Aumentar padding dos tab buttons de `py-2` → `py-3` para atingir ≥44px de tap target. Satisfaz PUB-03.

### Header — src/components/ui/Header.js
- **D-07:** Header.js — converter botões "COMEÇAR AGORA" (desktop e mobile, atualmente `<button type="button">` sem href) para `<Link href="/login">`. Aprovado via UI-SPEC.md (branch docs/phase-09-ui-spec). Resolve: 2 botões mortos que violam LP-03 critério #3.

### Claude's Discretion
- Implementação técnica: `<button>` → `<Link>` (Next.js) para todos os CTAs que são navegação; implementar como Server Component (landing page já é Server Component).
- Verificação de overflow horizontal em /unidades (PUB-03): validar que o grid de tabs não causa overflow com muitos edifícios — ajustar se necessário.
- PUB-03: verificar tamanho dos card buttons (`py-5` = ~44px) — se necessário adicionar `min-h-[44px]`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Arquivos a modificar
- `src/app/page.js` — landing page (hero CTAs + botão ACESSE ANALITYCS)
- `src/components/features/UnidadePublicaCard.js` — texto "Valor sob consulta" → "Consulte o Proprietário"
- `src/components/features/UnidadesPublicas.js` — padding dos tab buttons (py-2 → py-3)
- `src/components/ui/Header.js` — botões "COMEÇAR AGORA" → `<Link href="/login">` (D-07, via UI-SPEC)

### Design e convenções
- `CLAUDE.md` — terminologia (Proprietário, Locatário, Unidade), padrões de código
- `src/app/globals.css` — CSS vars: --fg-1..5, --border-1..3, --surface, --indigo, --primary, --primary-hover

### Requirements
- `.planning/REQUIREMENTS.md` — LP-01, LP-02, LP-03, PUB-01, PUB-02, PUB-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `next/link` (`<Link>`) — já usado em `UnidadesPublicas.js` para "← Voltar". Usar o mesmo padrão para converter `<button>` → `<Link>` na landing page.
- `StatusBadge.js` — já mostra badge "Disponível" corretamente no card. Não modificar.

### Established Patterns
- Landing page (`src/app/page.js`): Server Component, usa Tailwind + fonts Hanken Grotesk/Manrope. Botões de navegação devem ser `<Link>` (não `<button>`).
- `/unidades` (`UnidadesPublicas.js`): Client Component com estilo Obsidian Blueprint (CSS vars inline + classes font-mono/font-body). Tab buttons usam `style={{ all: 'unset' }}` + className Tailwind.
- `UnidadePublicaCard.js`: Client Component; segue padrão de card Obsidian Blueprint com `font-mono`, `font-body`, CSS vars `--fg-*`.

### Integration Points
- `src/proxy.js` — guarda `/dashboard/**`. Link `href="/login"` redireciona para login sem problema. Link `href="/dashboard"` também funciona (proxy.js redireciona para /login se não autenticado).
- `src/app/page.js` usa `Header` e `Footer` de `@/components/ui/`.

</code_context>

<specifics>
## Specific Ideas

- Botão da seção SISTEMA.04: label "ACESSAR PAINEL" (mais preciso que "ACESSAR ANALYTICS" — a seção descreve o painel/dashboard, não analytics isoladamente).
- Hero: "ACESSAR DASHBOARD" como CTA primário para que o avaliador vá direto ao produto.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 09-paginas-publicas*
*Context gathered: 2026-06-06*
