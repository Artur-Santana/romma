# Phase 1: Dashboard Completions — Research

**Researched:** 2026-05-21
**Domain:** Migração de estilos (inline → Tailwind v4) + verificação de métricas de dashboard
**Confidence:** HIGH — baseado em leitura direta do código-fonte

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Regra Absoluta de Styling (override de CLAUDE.md e UI-SPEC)**
- **D-01:** PROIBIDO inline styles em qualquer arquivo deste projeto. Toda estilização usa Tailwind v4 classes exclusivamente. Esta regra override qualquer instrução do CLAUDE.md ou UI-SPEC que diga o contrário.
- **D-02:** CSS vars já estão mapeados em `globals.css` para Tailwind v4 (`@theme`). Usar como tokens Tailwind — não usar arbitrary values `bg-[var(--surface)]`. Os tokens são classes nativas Tailwind neste projeto.
- **D-03:** shadcn/ui deve ser usado onde fizer sentido: Table, Badge, Button, Card. Componentes shadcn substituem implementações customizadas quando disponíveis.
- **D-04:** Responsividade via breakpoints Tailwind (`md:hidden`, `md:block`, etc.). As classes `.romma-mobile-only` e `.romma-desktop-only` de `globals.css` devem ser substituídas por breakpoints Tailwind nos componentes migrados.

**Migração VIS-02 — Escopo Completo**
- **D-05:** Migrar TODOS os feature components do dashboard de inline styles para Tailwind v4 + shadcn/ui. Componentes alvo:
  - `src/components/features/Contratos.js`
  - `src/components/features/GestaoEdificios.js` (**ATENÇÃO: não está em uso em nenhuma rota — ver seção Descobertas Críticas**)
  - `src/components/features/LocatariosDesktop.js` (ativo em `/dashboard/locatarios`)
  - `src/components/features/Parcelas.js`
  - `src/app/dashboard/page.js` (tiles de métricas)
- **D-06:** Componentes de UI shell em `src/components/ui/` que estejam sendo usados no dashboard também devem ser migrados se tiverem inline styles.

**Dashboard Tiles (DASH-01, DASH-02, DASH-03)**
- **D-07:** Grid de 4 tiles inalterado. Nenhum tile novo é adicionado.
- **D-08:** DASH-01 (MRR) — tile já existe. Verificar se a fórmula é `SUM(unidades.valor_mensal WHERE contratos.status = 'ativo')` e se o label/formato está correto.
- **D-09:** DASH-02 (Receita Esperada) — tile "Parcelas Pendentes" já mostra valor equivalente. Verificar fórmula, ajustar label para "Receita Esperada". Usar `fmtBRL()` para exibição.
- **D-10:** DASH-03 (alerta vencendo em 7 dias) — já implementado. Verificar apenas que funciona corretamente.

### Claude's Discretion
- Qual dos dois componentes (`Locatarios.js` vs `LocatariosDesktop.js`) está ativamente em uso na rota `/dashboard/locatarios` — verificar no código e migrar o ativo.
- Escolha específica de componentes shadcn para cada elemento.
- Estrutura de queries para MRR/Receita Esperada.

### Deferred Ideas (OUT OF SCOPE)
- Migração de `src/app/unidades/` para Tailwind — Fase 4.
- Migração de `src/app/page.js` (homepage pública) para Tailwind — Fase 4.
- Componentes legacy `Contratos.js` e `Unidades.js` não-Desktop — verificar se ainda em uso; se não, deletar na Fase 3.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-01 | Proprietário visualiza MRR em R$ (soma de valor_mensal dos contratos ativos) no dashboard | Fórmula verificada em `page.js:53-55` — CORRETA. Label atual: "Contratos Ativos" com subline mostrando o valor. Conforme UI-SPEC, o tile idx=02 deve exibir MRR como valor principal (48px) — requer reestruturação do tile. |
| DASH-02 | Proprietário visualiza receita esperada em R$ (soma de parcelas com status pendente + vencida) no dashboard | Tile idx=03 atual: label "Parcelas Pendentes", valor = `parcelas.length` (contagem). Deve virar: label "Receita Esperada", valor = `fmtBRL(totalPendente)`. Fórmula atual (`page.js:56-60`) soma `unidade.valor_mensal` por parcela — aprovada como aproximação TCC. |
| DASH-03 | Dashboard exibe alerta com lista de contratos vencendo nos próximos 7 dias | Implementado e funcional (`page.js:61-65`, `page.js:205-229`). Apenas verificação/limpeza de estilo. |
| VIS-02 | Dashboard com consistência visual Obsidian Blueprint em todas as telas | Escopo: migrar 4 feature components + dashboard/page.js de inline styles para Tailwind v4 + shadcn. |
</phase_requirements>

---

## Summary

Esta fase é primariamente uma **migração de estilos** + **pequenos ajustes de métricas**. O trabalho de código novo é mínimo — quase toda a lógica já está implementada e funcional. O valor da fase está em eliminar o débito técnico de inline styles e garantir que as métricas do dashboard exibam os valores corretos com os labels corretos.

**Descoberta crítica de escopo:** CONTEXT.md menciona `ContratosDesktop.js` — este arquivo NÃO EXISTE. O componente ativo é `Contratos.js`. Também, `GestaoEdificios.js` não está conectado a nenhuma rota do dashboard — o `/dashboard/unidades` usa `Unidades.js` (não o GestaoEdificios).

**Status atual dos tiles:**
- Tile 01 (Ocupação): Correto como está.
- Tile 02 ("Contratos Ativos"): Conforme UI-SPEC, deve ser reestruturado para exibir MRR como valor principal (48px) e renomear para label "MRR". A fórmula de cálculo já está correta.
- Tile 03 ("Parcelas Pendentes"): Label deve mudar para "Receita Esperada". O valor deve mudar de contagem (`parcelas.length`) para valor monetário (`fmtBRL(totalPendente)`). Subline: `{N} parcela(s) em aberto`.
- Tile 04 ("Vencendo em 7 dias"): Funcional, manter.

**Conflito UI-SPEC vs CONTEXT.md resolvido:** UI-SPEC §Design System (linha 29) diz "feature components use inline styles + CSS vars". CONTEXT.md D-01 explicitamente override esta instrução. **A regra vigente é D-01 — migrar para Tailwind v4, proibido inline styles.**

**Primary recommendation:** Migrar componente a componente: começar pelo mais complexo (`Contratos.js`, ~17KB) e usar o padrão estabelecido em `src/app/login/page.js` como referência de como Tailwind v4 tokens são usados neste projeto.

---

## Arquitetura de Responsabilidade

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Cálculo de MRR | Frontend Server (page.js) | — | Server Component, dados agregados no servidor |
| Cálculo de Receita Esperada | Frontend Server (page.js) | — | Já implementado com getParcelasByContratos |
| Alerta de contratos vencendo | Frontend Server (page.js) | — | Filtro client-side após fetch server |
| Listagem de Contratos | Client Component (Contratos.js) | Server (queries-client.js) | Mutations interativas requerem client |
| Listagem de Locatários | Client Component (LocatariosDesktop.js) | Server (queries-client.js) | Formulário de convite requer client |
| Listagem de Parcelas | Client Component (Parcelas.js) | Server (queries-client.js) | Ação "Marcar Paga" requer client |
| Gestão de Edifícios | Client Component (GestaoEdificios.js) | — | **NÃO CONECTADO a nenhuma rota — código morto** |

---

## Descobertas Críticas (lidas diretamente do código-fonte)

### 1. Arquivos Ativos vs Listados em CONTEXT.md

| Referência em CONTEXT.md | Arquivo Real | Rota Ativa | Status |
|--------------------------|-------------|------------|--------|
| `ContratosDesktop.js` | `Contratos.js` | `/dashboard/contratos` | Ativo — nome errado no CONTEXT.md |
| `GestaoEdificios.js` | `GestaoEdificios.js` | Nenhuma | CÓDIGO MORTO — não importado em nenhuma rota |
| `LocatariosDesktop.js` | `LocatariosDesktop.js` | `/dashboard/locatarios` | Ativo e confirmado |
| `Locatarios.js` | `Locatarios.js` | Nenhuma | CÓDIGO MORTO — não importado em nenhuma rota |
| `Parcelas.js` | `Parcelas.js` | `/dashboard/contratos/[id]` | Ativo |
| `Unidades.js` | `Unidades.js` | `/dashboard/unidades` | Ativo — usa HTML sem estilo (ver abaixo) |

**Decisão para o planner:** `GestaoEdificios.js` não está em uso. Migrar seria esforço sem impacto visual. Recomenda-se registrar como código morto (candidato à deleção na Fase 3/REF) e EXCLUIR do escopo de migração da Fase 1.

### 2. Estado de Estilização por Componente

| Arquivo | Estilo Atual | Escopo de Trabalho |
|---------|-------------|-------------------|
| `src/app/dashboard/page.js` | 100% inline styles + CSS vars | Migrar para Tailwind v4. Ajustar tile 02 (MRR) e tile 03 (Receita Esperada). |
| `Contratos.js` | 100% inline styles + CSS vars | Maior componente (~17KB). Migração completa. |
| `LocatariosDesktop.js` | 100% inline styles + CSS vars | Migração completa. |
| `Parcelas.js` | 100% inline styles + CSS vars | Migração completa. |
| `Unidades.js` | HTML sem estilo algum (inputs, selects, form puro) | Migração completa para Tailwind v4 + shadcn. MAIOR esforço unitário pois precisa de UI do zero. |
| `GestaoEdificios.js` | HTML sem estilo algum | CÓDIGO MORTO — excluir do escopo. |

### 3. Status das Métricas (DASH-01, DASH-02, DASH-03)

**DASH-01 (MRR):**
- Fórmula (`page.js:53-55`): `contratos.filter(c => c.status === "ativo").reduce((sum, c) => sum + (unidades.find(u => u.id === c.unidade_id)?.valor_mensal ?? 0), 0)` — CORRETA per requisito.
- Tile atual: idx=02, label="Contratos Ativos", value=`ativos` (CONTAGEM), sub=`${fmtBRL(mrr)} / mês`.
- **Mudança necessária:** Tile deve exibir `fmtBRL(mrr)` como valor principal (48px), label "MRR", subline "/ mês". A contagem de contratos ativos pode ir para a subline.
- Desktop não abrevia; mobile abrevia com `R$${(mrr/1000).toFixed(1)}k` quando `mrr >= 1000`. UI-SPEC pede alinhamento.

**DASH-02 (Receita Esperada):**
- Fórmula atual (`page.js:56-60`): soma `unidade.valor_mensal` por cada parcela pendente/vencida — APROVADA como aproximação para TCC.
- Tile atual: idx=03, label="Parcelas Pendentes", value=`parcelas.length` (CONTAGEM), sub=`fmtBRL(totalPendente)`.
- **Mudança necessária:** label → "Receita Esperada", value → `fmtBRL(totalPendente)`, subline → `${parcelas.length} parcela(s) em aberto`.
- A query `getParcelasByContratos` já filtra `status IN ('pendente', 'vencida')` — CORRETA.

**DASH-03 (Alerta vencendo):**
- Banner implementado em `page.js:205-229` (desktop) e `page.js:383-396` (mobile). Funcional.
- Tile 04: usa `warn: true` → `--warning-bg` e `--warning` text. Funcional.
- **Mudança necessária:** Nenhuma na lógica. Apenas migração de inline styles para Tailwind no contexto da migração geral do `page.js`.

### 4. shadcn — Componentes Instalados

Verificado via `ls src/components/ui/` — **nenhum componente shadcn primitivo está instalado** (Button, Table, Badge, Card, Input, Select, etc.). O diretório `ui/` contém apenas componentes customizados do projeto:

- `ConfirmDialog.js`, `EdificioCard.js`, `Footer.js`, `Header.js`, `HeaderDashboard.js`
- `MobileNav.js`, `OwnerSidebar.js`, `PageHeader.js`, `RealtimeDot.js`
- `StatusBadge.js`, `TopStrip.js`, `UnidadeCard.js`, `UnidadeCardPublico.js`

`components.json` confirma shadcn inicializado (style: `radix-lyra`, tsx: false, cssVariables: true), mas nenhum componente foi adicionado via `shadcn add`.

**Implicação para o planner:** Cada componente shadcn (Button, Table, Badge, Card, Input, Select) precisa ser instalado com `npx shadcn@latest add <component>` antes do uso. Isso deve ser Wave 0.

### 5. Padrão Tailwind v4 do Projeto (login/page.js)

A referência canônica `src/app/login/page.js` usa:
- Classes utilitárias Tailwind padrão: `className="flex items-center gap-2 mb-4"`
- Tokens de cor como classes: `text-primary-accent`, `bg-surface`, `text-fg-2`, `border-danger-fg`, `text-success`
- Breakpoints: `hidden lg:block`, `lg:text-[56px]`
- `cn()` de `lib/utils.js` para classes condicionais
- `font-mono`, `font-body`, `font-headline-hanken` como classes utilitárias
- Arbitrary values apenas em casos sem token disponível: `bg-[rgba(18,18,18,0.95)]`, `border-[rgba(255,255,255,0.08)]`

**Nota:** `login/page.js` ainda usa `style={{}}` inline em um campo de input (bordas dinâmicas condicionais no focus/error). Isso é uma exceção justificada por estado dinâmico que não pode ser expresso com classes estáticas. A regra D-01 permite exceções para valores verdadeiramente dinâmicos em runtime.

---

## Mapeamento CSS Vars → Tailwind Classes

Gerado a partir do `@theme inline` em `globals.css`. **Usar estas classes — nunca `bg-[var(--surface)]`.**

| CSS Var | Tailwind Class | Uso |
|---------|---------------|-----|
| `var(--background)` | `bg-background` | Fundo de página |
| `var(--surface)` | `bg-surface` | Cards, tabelas, sidebar |
| `var(--surface-hi)` | `bg-surface-hi` | Header de tabela, hover, avatares |
| `var(--fg-1)` | `text-fg-1` | Texto primário (branco) |
| `var(--fg-2)` | `text-fg-2` | Texto secundário |
| `var(--fg-3)` | `text-fg-3` | Texto terciário / ações |
| `var(--fg-4)` | `text-fg-4` | Labels de tabela, sublabels |
| `var(--fg-5)` | `text-fg-5` | Texto ghost / desabilitado |
| `var(--indigo)` | `text-indigo` / `bg-indigo` / `border-indigo` | Accent primário / CTA |
| `var(--primary)` | `text-primary` / `bg-primary` | Alias de indigo (shadcn) |
| `var(--border-3)` | `border-border-3` | Bordas de tabela e cards |
| `var(--warning)` | `text-warning` / `border-warning` | Badges/textos de aviso |
| `var(--warning-bg)` | `bg-warning-bg` | Fundo de banners de aviso |
| `var(--danger)` | `text-danger` | Badges/textos de erro (não mapeado no @theme inline — usar CSS var diretamente ou verificar) |
| `var(--success)` | `text-success` | Badges de sucesso |
| `var(--destructive)` | `text-destructive` / `bg-destructive` | Ações destrutivas (shadcn) |
| `var(--muted-foreground)` | `text-muted-foreground` | Texto atenuado (shadcn) |

**Tokens NÃO mapeados no @theme inline (usar CSS var com arbitrary value como exceção):**
- `--danger` (existe como `--danger-fg` no @theme: `text-danger-fg`)
- `--danger-bg`, `--danger-bg2`
- `--border-1`, `--border-2`
- `--indigo-soft`

**Classes de fonte (utilitários definidos em globals.css):**

| Classe | Fonte |
|--------|-------|
| `font-mono` | JetBrains Mono |
| `font-display` | Space Grotesk (via `--font-display-arch`) |
| `font-headline-hanken` | Hanken Grotesk |

**Classes responsivas de visibilidade (substituição de `.romma-desktop-only`/`.romma-mobile-only`):**

| Classe CSS atual | Tailwind equivalente |
|-----------------|---------------------|
| `.romma-desktop-only` | `hidden md:block` |
| `.romma-mobile-only` | `flex flex-col h-screen md:hidden` |

**Nota:** `.romma-page` (animação fadeIn) deve ser mantida como classe CSS global — não há equivalente Tailwind direto para keyframes customizados. Adicionar `romma-page` como classe complementar em componentes migrados.

---

## Receitas de Migração por Elemento

### Tabela de dados

**Antes (inline styles):**
```jsx
<div style={{ background: "var(--surface)", border: "1px solid var(--border-3)" }}>
  <div style={{ display: "grid", gridTemplateColumns: COL, padding: "12px 20px", background: "oklch(0.26 0 0)" }}>
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-4)", letterSpacing: 1, textTransform: "uppercase" }}>Col</span>
  </div>
</div>
```

**Depois (Tailwind + shadcn ou grid Tailwind):**
```jsx
<div className="bg-surface border border-border-3">
  <div style={{ display: "grid", gridTemplateColumns: COL }} className="px-5 py-3 bg-[oklch(0.26_0_0)]">
    <span className="font-mono text-[10px] text-fg-4 tracking-widest uppercase">Col</span>
  </div>
</div>
```

**Observação sobre `<Table>` shadcn:** O shadcn `<Table>` é adequado para tabelas com colunas fixas padrão. Para o layout `display: grid` com colunas customizadas (ex: `COL = "100px 1.6fr 1.6fr 1fr 1fr 1.2fr 80px"`), grid CSS com Tailwind é mais direto. **Decisão para o planner:** usar `<Table>` para colunas simples (Unidades, Locatários), manter grid CSS com Tailwind para colunas complexas (Contratos, Parcelas).

### Botão de ação de linha

**Antes:**
```jsx
<button style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: 0.5, color: "var(--fg-3)", fontWeight: 700 }}>VER →</button>
```

**Depois (shadcn Button variant ghost):**
```jsx
<Button variant="ghost" size="sm" className="font-mono text-[10px] text-fg-3 uppercase tracking-[0.5px] font-bold p-0 h-auto">VER →</Button>
```

### Botão de ação destrutiva

**Antes:**
```jsx
<button style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--danger)", fontWeight: 700 }}>REVOGAR</button>
```

**Depois:**
```jsx
<Button variant="ghost" size="sm" className="font-mono text-[10px] text-danger-fg uppercase font-bold p-0 h-auto">REVOGAR</Button>
```

### Input de formulário

**Antes (`inputStyle` em Contratos.js):**
```jsx
const inputStyle = {
  background: "var(--surface-hi)", border: "1px solid var(--border-3)",
  color: "var(--fg-1)", padding: "10px 14px", fontSize: 13, fontFamily: "var(--font-mono)",
  width: "100%", boxSizing: "border-box",
}
<input style={inputStyle} />
```

**Depois (shadcn Input):**
```jsx
// shadcn Input component sobrescreve sua classe base — adicionar className para overrides:
<Input className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[13px] rounded-none" />
```

**Nota:** shadcn `<Input>` usa `--radius` (0 neste projeto) — corners já serão sharp sem override manual.

### Select de formulário

**Antes:** `<select>` HTML puro sem estilo.

**Depois:** shadcn `<Select>` com className de override para tokens do projeto.

### Badge de status

**StatusBadge.js** usa inline styles com CSS vars para o mapeamento de status (12 status diferentes). **Recomendação:** manter `StatusBadge.js` como está — é wrapper de lógica de negócio, não componente visual puro. O UI-SPEC (linha 110) bloqueia expansão do mapa de status na Fase 1. Refatoração para shadcn `<Badge>` seria Fase 3.

### Eyebrow (labels de seção)

Manter classe CSS global `.eyebrow .eyebrow--indigo` — definida em `globals.css`. **Não reescrever com Tailwind** — é uma classe utilitária global válida e não viola D-01 (que proíbe inline `style={{}}`).

---

## Don't Hand-Roll

| Problema | Não Construir | Usar em vez | Por quê |
|----------|--------------|------------|---------|
| Botões (ação de linha, CTAs) | `<button style={{ all: "unset", ... }}>` | shadcn `<Button>` (variant ghost, outline, default) | Acessibilidade, estados (hover/focus/disabled), consistência |
| Inputs de texto/número | `<input style={inputStyle}>` | shadcn `<Input>` | Focus ring, acessibilidade, dark mode compat |
| Selects de formulário | `<select>` puro sem estilo | shadcn `<Select>` | Aparência consistente cross-browser |
| Tabelas simples | div-grid customizado | shadcn `<Table>` + Tailwind | Semântica HTML, acessibilidade, responsividade |
| Dialog de confirmação | Modal customizado | `ConfirmDialog.js` existente (já usa CSS vars) | Já implementado e funcional |

**Insight chave:** `Unidades.js` e `GestaoEdificios.js` são HTML puro sem estilo. São candidatos a receber shadcn completo (Input, Select, Button) — não somente Tailwind classes.

---

## Padrões de Arquitetura

### Estrutura Atual do Dashboard

```
src/app/dashboard/
├── page.js              ← Server Component — métricas + tiles + banner
├── layout.js            ← Server Component — sidebar + nav (NÃO mexer na Fase 1)
├── contratos/
│   └── page.js          ← importa Contratos.js (client)
│       └── [id]/
│           └── page.js  ← importa Parcelas.js (client)
├── locatarios/
│   └── page.js          ← importa LocatariosDesktop.js (client)
└── unidades/
    └── page.js          ← importa Unidades.js (client)

src/components/features/
├── Contratos.js         ← ATIVO — migrar
├── LocatariosDesktop.js ← ATIVO — migrar
├── Parcelas.js          ← ATIVO — migrar
├── Unidades.js          ← ATIVO — migrar (HTML puro sem estilo!)
├── Locatarios.js        ← CÓDIGO MORTO — não mexer na Fase 1
└── GestaoEdificios.js   ← CÓDIGO MORTO — não mexer na Fase 1
```

### Padrão de Migração por Componente

Ordem recomendada (menor risco → maior risco):
1. `Parcelas.js` — componente mais simples, sem formulários complexos, só tabela + botão de ação
2. `LocatariosDesktop.js` — tabela + formulário de invite (já tem estrutura de inline styles organizada)
3. `Contratos.js` — maior arquivo, formulário complexo, ConfirmDialog integrado
4. `Unidades.js` — HTML puro, requer criação de UI do zero com shadcn
5. `src/app/dashboard/page.js` — ajustes de tiles + migração de inline styles (Server Component)

### Anti-Padrões a Evitar

- **Arbitrary values quando token existe:** usar `bg-[var(--surface)]` em vez de `bg-surface` — viola D-02
- **Manter `.romma-desktop-only`/`.romma-mobile-only` nos componentes migrados** — substituir por `hidden md:block` / `flex md:hidden` conforme D-04
- **Reescrever StatusBadge** — o mapa de status é locked per UI-SPEC, manter como está
- **Adicionar arredondamento** — `--radius: 0` é constraint de design, shadcn respeitará automaticamente
- **Arbitrários para valores de grid:** `gridTemplateColumns` complexos (ex: `"100px 1.6fr 1.6fr 1fr 1fr 1.2fr 80px"`) não têm equivalente Tailwind — usar `style={{ gridTemplateColumns: COL }}` somente para esse valor é aceitável como exceção justificada

---

## Pitfalls Comuns

### Pitfall 1: Token `--danger` não mapeado no @theme inline
**O que dá errado:** `text-danger` não existe — `--danger` não está no `@theme inline`. Usar `text-danger-fg` (que existe: `--color-danger-fg`).
**Como evitar:** Verificar o `@theme inline` em `globals.css` antes de usar qualquer token. Para danger backgrounds, usar arbitrary value como exceção: `bg-[var(--danger-bg)]`.
**Sinais de aviso:** Classe Tailwind sem efeito visual durante desenvolvimento.

### Pitfall 2: shadcn `<Input>` e `<Select>` têm radius de 0 mas podem ter outras classes de base que conflitam
**O que dá errado:** shadcn components têm seu próprio `className` base; adicionar classes no `className` prop pode não ter precedência.
**Como evitar:** Usar `cn()` para merge de classes. Verificar que `tailwind-merge` está configurado para dar precedência às classes passadas.

### Pitfall 3: `gridTemplateColumns` customizados sem suporte Tailwind
**O que dá errado:** Tentativa de expressar `"100px 1.6fr 1.6fr 1fr 1fr 1.2fr 80px"` com Tailwind — impossível sem arbitrary values feia.
**Como evitar:** Manter como `style={{ gridTemplateColumns: COL }}` onde COL é uma constante de string. Isso é uma exceção justificada ao D-01 — valores de grid complexos são o caso de uso legítimo para style inline residual.

### Pitfall 4: `Unidades.js` é HTML puro — escopo maior que parece
**O que dá errado:** O arquivo tem 150+ linhas de `<input>`, `<select>`, `<button>` sem nenhum estilo. Migrar significa construir uma UI inteira do zero, não apenas substituir inline styles.
**Como evitar:** Alocar mais tempo para este componente. Usar `Contratos.js` como referência de estrutura (formulário + tabela + ações).

### Pitfall 5: `page.js` é Server Component — sem hooks, sem estado
**O que dá errado:** Tentar usar `useState` ou hooks em `page.js` para interatividade nos tiles.
**Como evitar:** `page.js` é `async function Dashboard()` sem `"use client"`. Toda lógica interativa fica em componentes client. Tiles são estáticos.

### Pitfall 6: `getContratos()` não seleciona `locatario_id` como coluna direta
**O que dá errado:** `dashboard/page.js` tem fallback `locatarios.find(l => l.id === c.locatario_id)` — esse fallback nunca funciona porque `locatario_id` não está no select de `getContratos()`.
**Como evitar:** O path primário `c.locatarios?.nome_razao_social` (join relacional) funciona. O fallback é código morto silencioso. Não é blocking para Fase 1, mas pode ser registrado como REF para Fase 3.

---

## Exemplos de Código — Padrão de Referência

### Token Tailwind em login/page.js (fonte: leitura direta do arquivo)
```jsx
// Cores como classes Tailwind
<div className="bg-[rgba(18,18,18,0.95)] border-b border-[rgba(255,255,255,0.08)]">
<span className="text-primary-accent tracking-[2px]">
<span className="text-fg-2">
<div className="bg-[rgba(147,0,10,0.22)] border-l-2 border-danger-fg">
// Fontes como classes
<span className="font-mono text-xs">
<span className="font-body font-bold">
// Responsividade
<div className="hidden lg:block">
// cn() para condicional
<label className={cn("font-body font-bold text-xs", focused ? "text-primary" : "text-muted-foreground")}>
```

### Tile de métrica migrado (exemplo para DASH-01/02)
```jsx
// Antes (inline styles):
<div style={{ padding: 28, background: m.warn ? "var(--warning-bg)" : "transparent" }}>
  <div style={{ fontSize: 11, color: "var(--fg-4)" }}>{m.label}</div>
  <div style={{ fontWeight: 700, fontSize: 48, color: "var(--fg-1)" }}>{m.value}</div>
</div>

// Depois (Tailwind v4):
<div className={cn("p-7", m.warn ? "bg-warning-bg" : "bg-transparent")}>
  <div className="font-mono text-[11px] text-fg-4 uppercase tracking-wide">{m.label}</div>
  <div className="font-display font-bold text-[48px] text-fg-1 leading-none tracking-[-2.4px]">{m.value}</div>
</div>
```

### Estrutura de tile DASH-02 após mudança
```jsx
// page.js — array metricas (após ajuste):
{ idx: "03", label: "Receita Esperada", value: fmtBRL(totalPendente), sub: `${parcelas.length} parcela(s) em aberto` },
// Antes: { idx: "03", label: "Parcelas Pendentes", value: parcelas.length, sub: fmtBRL(totalPendente) }
```

### Estrutura de tile DASH-01 após ajuste
```jsx
// page.js — array metricas (após ajuste):
{ idx: "02", label: "MRR", value: mrr >= 1000 ? `R$${(mrr/1000).toFixed(1)}k` : fmtBRL(mrr), sub: `${ativos} contrato(s) ativo(s)` },
// Antes: { idx: "02", label: "Contratos Ativos", value: ativos, sub: `${fmtBRL(mrr)} / mês` }
```

---

## Instalação de Componentes shadcn Necessários

Nenhum componente shadcn primitivo está instalado. Wave 0 deve incluir:

```bash
# Componentes necessários para a migração:
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add table    # Para tabelas simples (Unidades, Locatários se aplicável)
# Badge: StatusBadge.js existente é mantido — não instalar shadcn Badge na Fase 1
# Card: não necessário — cards são divs com bg-surface border-border-3
```

**Verificação pós-install:** Confirmar que os componentes estão em `src/components/ui/` e que o estilo base respeita `--radius: 0`.

---

## Package Legitimacy Audit

> Nenhum pacote externo novo é instalado nesta fase. Todos os componentes shadcn são adicionados via CLI `shadcn` que já está configurado no projeto. Não há npm install de pacotes de terceiros.

**Pacotes removidos por slopcheck:** nenhum (não aplicável)
**Pacotes suspeitos:** nenhum (não aplicável)

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js runtime | ✓ | >=20 (presumido) | — |
| Supabase project | Queries de dados | ✓ | Hosted | — |
| shadcn CLI | Adicionar componentes | ✓ | via npx | — |
| Tailwind v4 | Estilização | ✓ | ^4 (já no package.json) | — |

**Dependências ausentes com fallback:** nenhuma
**Dependências ausentes sem fallback:** nenhuma

---

## Validation Architecture

> `workflow.nyquist_validation` não está explicitamente definido em `.planning/config.json` — tratado como habilitado.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright |
| Config file | playwright.config.js (verificar existência) |
| Quick run command | `npx playwright test --grep @smoke` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | Dashboard exibe MRR como valor principal do tile 02 | smoke/e2e | `npx playwright test --grep "DASH-01"` | ❌ Wave 0 |
| DASH-02 | Dashboard exibe "Receita Esperada" em BRL no tile 03 | smoke/e2e | `npx playwright test --grep "DASH-02"` | ❌ Wave 0 |
| DASH-03 | Banner de alerta aparece quando há contratos vencendo em 7 dias | smoke/e2e | `npx playwright test --grep "DASH-03"` | ❌ Wave 0 |
| VIS-02 | Nenhum inline style em feature components do dashboard | lint/visual | `grep -rn "style={{" src/components/features/` | N/A — verificação manual |

### Wave 0 Gaps
- [ ] `tests/dashboard.spec.js` — testes E2E para DASH-01, DASH-02, DASH-03
- [ ] Verificar `playwright.config.js` — configurar baseURL e auth

---

## Security Domain

> Esta fase não introduce novos endpoints, autenticação, ou fluxos de dados. A migração é puramente de estilo (inline → Tailwind) com pequenos ajustes de label/valor em componentes existentes.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | não | — |
| V3 Session Management | não | — |
| V4 Access Control | não | — |
| V5 Input Validation | não (sem novos inputs) | — |
| V6 Cryptography | não | — |

**Nenhum risco de segurança introduzido nesta fase.**

---

## Open Questions (RESOLVED)

1. **`Unidades.js` — migração de escopo total ou substituição por novo componente?**
   - O que sabemos: é HTML puro, sem estilo, sem shadcn. A migração exige construir UI completa.
   - RESOLVED: Migrar para o padrão visual de `Contratos.js` (tabela + formulário inline). Plan 01-06 cobre este escopo.

2. **`GestaoEdificios.js` — deletar ou apenas ignorar?**
   - O que sabemos: não está em nenhuma rota do dashboard. É código morto.
   - RESOLVED: Ignorar na Fase 1. Excluído do escopo de migração. Candidato à deleção na Fase 3 (REF-01).

---

## Assumptions Log

| # | Claim | Section | Risk se Errado |
|---|-------|---------|---------------|
| A1 | `gridTemplateColumns` complexos são exceção justificada ao D-01 (inline style residual) | Receitas de Migração | Se não aceito, requer arbitrary values Tailwind de difícil manutenção |
| A2 | `StatusBadge.js` não precisa ser migrado para shadcn `<Badge>` na Fase 1 | Don't Hand-Roll | UI inconsistente com shadcn se o restante migrar para shadcn Badge |
| A3 | Aproximação de Receita Esperada (soma `valor_mensal` por parcela, não valor real da parcela) é aceitável para TCC | DASH-02 | Valor pode divergir do valor real se houver reajustes; impacto mínimo para TCC |
| A4 | `.romma-page` (animação CSS) deve ser mantida como classe complementar após migração | Mapeamento CSS vars | Sem animação de entrada nos componentes migrados se esquecida |

---

## Sources

### Primary (HIGH confidence)
- Leitura direta de `src/app/dashboard/page.js` — estado atual dos tiles, fórmulas de MRR/Receita Esperada, implementação do alerta
- Leitura direta de `src/components/features/Contratos.js`, `LocatariosDesktop.js`, `Parcelas.js`, `Unidades.js`, `GestaoEdificios.js` — estado de estilização atual
- Leitura direta de `src/app/globals.css` — tokens CSS vars e mapeamento @theme inline para Tailwind
- Leitura direta de `src/app/login/page.js` — padrão canônico de uso de Tailwind v4 + CSS vars no projeto
- Leitura direta de `components.json` — confirmar shadcn inicializado, style radix-lyra, tsx: false
- Leitura direta de `src/app/dashboard/locatarios/page.js` — confirmar LocatariosDesktop como ativo
- `grep -rn "GestaoEdificios" src/` — confirmar código morto

### Secondary (MEDIUM confidence)
- `.planning/phases/01-dashboard-completions/01-CONTEXT.md` — decisões do usuário
- `.planning/phases/01-dashboard-completions/01-UI-SPEC.md` — contrato visual (sobrescrito por D-01 para authoring convention)
- `.planning/REQUIREMENTS.md` — definições formais de DASH-01, DASH-02, DASH-03, VIS-02

---

## Metadata

**Confidence breakdown:**
- Fórmulas de métricas (DASH-01/02/03): HIGH — lido diretamente do código
- Escopo de migração (VIS-02): HIGH — grep e ls confirmaram estado de cada arquivo
- Tokens Tailwind disponíveis: HIGH — derivado do @theme inline em globals.css
- shadcn componentes instalados: HIGH — ls confirma nenhum primitivo instalado
- Receitas de migração: MEDIUM — padrão inferido de login/page.js, pode precisar ajuste por componente

**Research date:** 2026-05-21
**Valid until:** 2026-06-18 (banca — stack não muda neste período)
