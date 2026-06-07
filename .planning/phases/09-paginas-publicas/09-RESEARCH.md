# Phase 9: Páginas Públicas - Research

**Researched:** 2026-06-06
**Domain:** Next.js App Router — JSX copy edits, `<button>` → `<Link>` conversions, Tailwind tap-target fixes (public pages only)
**Confidence:** HIGH — todas as decisões são cirúrgicas sobre código-fonte verificado nesta sessão

---

## Summary

Esta fase é exclusivamente de ajustes pontuais em três (na verdade quatro) arquivos já existentes.
Não há nova tela, nenhuma nova biblioteca, nenhuma migração de estado. O design system
(Obsidian Blueprint) está estabelecido e documentado em `src/app/globals.css`. Os padrões de
`<Link>` do Next.js e de classes Tailwind em uso são conhecidos e verificados in-repo.

A maior parte do trabalho para PUB-01 e PUB-02 **já está implementada**: o card exibe nome,
edifício, área m², preço e badge "Disponível" — e o empty state (linhas 124–135 de
`UnidadesPublicas.js`) existe. As tarefas são de **verificação + ajuste mínimo**, não de
construção.

O risco real desta fase é escopo-gatilho: UI-SPEC (D-06 + D-07 + Voltar link fix) expande
além do que CONTEXT.md lista como canônico. O planner deve usar o **union** dos dois
documentos como escopo autoritativo.

**Recomendação principal:** Dividir em uma tarefa por arquivo modificado (4 tarefas de
implementação + 1 de testes E2E). Verificar D-06 com `min-h-[44px]` adicional além de
`py-3`, conforme UI-SPEC.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Hero CTA primário `<button>INICIE GRATUITAMENTE</button>` → `<Link href="/login">ACESSAR DASHBOARD</Link>`. Mantém estilo gradiente. Satisfaz LP-02.
- **D-02:** Hero CTA secundário `<Link href="/unidades">VER PROJETOS</Link>` → renomear label para `VER UNIDADES`. href já correto. Satisfaz LP-01.
- **D-03:** Hierarquia: "ACESSAR DASHBOARD" é CTA primário (gradiente); "VER UNIDADES" é secundário. Já correto após D-01/D-02.
- **D-04:** Botão SISTEMA.04 `<button>ACESSE ANALITYCS</button>` → `<Link href="/login">ACESSAR PAINEL</Link>`. Mantém estilos. Satisfaz LP-03.
- **D-05:** `UnidadePublicaCard.js` — trocar `"Valor sob consulta"` → `"Consulte o Proprietário"` quando `valor_visivel = false`. Satisfaz PUB-01.
- **D-06:** `UnidadesPublicas.js` — tab buttons: `py-2` → `py-3`. Satisfaz PUB-03.
- **D-07:** `Header.js` — converter os dois `<button>COMEÇAR AGORA</button>` (desktop e mobile) para `<Link href="/login">`. Aprovado via UI-SPEC.md (branch docs/phase-09-ui-spec). Satisfaz LP-03 (critério #3).

### Claude's Discretion

- Implementação técnica: `<button>` → `<Link>` (Next.js) para todos os CTAs que são navegação.
- Verificação de overflow horizontal em /unidades (PUB-03): validar que grid de tabs não causa overflow com muitos edifícios.
- PUB-03: verificar tamanho dos card buttons (`py-5` ≈ 44px) — se necessário adicionar `min-h-[44px]`.

### Deferred Ideas (OUT OF SCOPE)

Nenhum item deferido identificado na discussão.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LP-01 | Landing page tem CTA funcional "Ver Unidades" → `/unidades` | D-02: renomear label em `page.js` linha 47. href já correto. |
| LP-02 | Landing page tem CTA "Acessar Dashboard" → `/login` | D-01: converter `<button>` → `<Link>` em `page.js` linha 44–46. |
| LP-03 | Todos os botões existentes na LP têm destinos corretos | D-04 (`page.js` linha 146–148) + D-07 (`Header.js` linhas 47–52 e 95–99). |
| PUB-01 | Card `/unidades`: nome, edifício, área m², preço ou "Consulte o Proprietário", badge Disponível | 4 dos 5 campos já implementados. D-05: trocar texto em `UnidadePublicaCard.js` linha 45. |
| PUB-02 | Empty state quando zero unidades disponíveis | Já implementado em `UnidadesPublicas.js` linhas 124–135. Tarefa: verificar. |
| PUB-03 | Mobile-friendly: tap targets ≥44px, sem overflow horizontal em 375px | D-06 + `min-h-[44px]` em tab buttons; `py-3 min-h-[44px]` no link Voltar. |

</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Landing page CTAs | Browser / Client (Next.js `<Link>`) | Frontend Server (SSR, Server Component) | `page.js` é Server Component; `<Link>` renderiza como `<a>` no browser |
| Card de unidade — texto | Browser / Client | — | Componente Client existente; troca de string JSX |
| Tap targets mobile | Browser / Client | — | Tailwind classes, sem lógica de servidor |
| Dados de unidades | Database / Storage → API Supabase | Frontend (useEffect + queries-client) | Leitura pública via RLS; dados não mudam nesta fase |

---

## Standard Stack

### Existente (nenhuma instalação nova)

| Componente | Padrão em uso | Localização verificada |
|-----------|---------------|----------------------|
| Navegação interna | `next/link` (`<Link>`) | `UnidadesPublicas.js` linha 9; `Header.js` linha 1 |
| Estilos | Tailwind v4 + CSS vars Obsidian Blueprint | `globals.css` + classNames em todos os arquivos |
| Ícones/SVG | Inline SVG + glyphs de texto (`←`, `→`, `◼`) | `UnidadesPublicas.js`, `UnidadePublicaCard.js` |
| Dados | `getUnidadesDisponiveis`, `getEdificios` via `queries-client.js` | `UnidadesPublicas.js` linha 4 |

**Nenhuma instalação de pacote nova nesta fase.** [VERIFIED: leitura direta dos arquivos fonte]

---

## Package Legitimacy Audit

Não aplicável — esta fase não instala nenhum pacote externo.

---

## Scope Reconciliation (Descoberta Crítica)

O CONTEXT.md lista 3 arquivos canônicos. A UI-SPEC (aprovada) expande para **4 arquivos** e
acrescenta elementos adicionais. O planner DEVE usar o union abaixo como escopo autoritativo.

| Arquivo | CONTEXT.md | UI-SPEC | Delta |
|---------|-----------|---------|-------|
| `src/app/page.js` | D-01, D-02, D-04 | D-01, D-02, D-03, D-04 | D-03 é verificação visual, sem alteração de código |
| `src/components/features/UnidadePublicaCard.js` | D-05 | D-05 | Idêntico |
| `src/components/features/UnidadesPublicas.js` | D-06 (py-2→py-3) | D-06 (py-3 + `min-h-[44px]`) + Voltar link fix | **UI-SPEC aumenta D-06; adiciona fix no link Voltar** |
| `src/components/ui/Header.js` | **D-07 (adicionado pós-UI-SPEC)** | D-07 (dois `<button>` mortos → `<Link href="/login">`) | **Arquivo no escopo via D-07** |

**Regra:** UI-SPEC prevalece sobre CONTEXT onde há conflito. D-06 exige AMBOS: `py-3` E
`min-h-[44px]`. `py-3` sozinho resulta em ~38-40px — abaixo do mínimo de 44px.

---

## Architecture Patterns

### Padrão: `<button>` → `<Link>` (Next.js App Router)

**O quê:** Trocar elemento de navegação sem semântica (`<button>`) por elemento de navegação
nativo (`<Link>` do Next.js, que renderiza como `<a>`).

**Quando usar:** Sempre que um `<button>` realiza navegação de página em vez de ação no mesmo
contexto. Server Components e Client Components ambos aceitam `<Link>`.

**Padrão in-repo verificado:**
```jsx
// ANTES (src/app/page.js linha 44 — verificado 2026-06-06)
<button type="button" className="py-4 px-10 bg-linear-45 from-primary to-primary-hover ...">
  INICIE GRATUITAMENTE
</button>

// DEPOIS (D-01)
<Link href="/login" className="py-4 px-10 bg-linear-45 from-primary to-primary-hover ...">
  ACESSAR DASHBOARD
</Link>
```

**Nota de importação:** `Link` já está importado em `page.js` linha 1 — nenhuma adição de
import necessária.

Para `Header.js`: `Link` também já importado (linha 1). Os dois `<button>COMEÇAR AGORA</button>`
(desktop linha 47–52 e mobile linha 95–99) tornam-se `<Link href="/login">` mantendo todas as
classNames existentes.

### Padrão: Tap Targets ≥44px

**O quê:** Garantir que elementos interativos tenham área de toque mínima de 44×44px em
dispositivos móveis (WCAG 2.5.5 / Apple HIG).

**Técnica Tailwind:** `py-{n}` define padding vertical; `min-h-[44px]` garante a altura mínima
independentemente do conteúdo.

**Verificação matemática para D-06:**
- `py-2` = 8px top + 8px bottom = 16px padding + ~14px text ≈ 30px → **FALHA**
- `py-3` = 12px top + 12px bottom = 24px padding + ~14px text ≈ 38px → ainda **FALHA** sem `min-h-[44px]`
- `py-3 min-h-[44px]` = garante 44px mínimo → **PASSA**

**className final para tab buttons (D-06):**
```
px-3.5 py-3 min-h-[44px] inline-flex gap-2 font-body font-bold text-[10px] uppercase tracking-[0.5px] items-center border [estado-condicional]
```

**Link "← Voltar" (UnidadesPublicas.js linha 82):**
```jsx
// ANTES
<Link href="/" className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase hover:text-fg-2 transition-colors">← Voltar</Link>

// DEPOIS
<Link href="/" className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase hover:text-fg-2 transition-colors py-3 inline-flex items-center min-h-[44px]">← Voltar</Link>
```

---

## Don't Hand-Roll

| Problema | Não construir | Usar | Por quê |
|----------|--------------|------|---------|
| Navegação interna | `<a href>` manual | `next/link` (`<Link>`) | Prefetch automático, client-side navigation, hidratação correta |
| Tap target mínima | JavaScript calculado | `min-h-[44px]` Tailwind | CSS nativo; sem overhead de JS |

---

## Runtime State Inventory

Não aplicável — esta fase envolve apenas JSX e string literal copy. Nenhuma chave de banco de
dados, ID de usuário, nome de coleção, workflow externo, tarefa de OS ou artefato de build
referencia "Valor sob consulta", "INICIE GRATUITAMENTE", "ACESSE ANALITYCS" ou "VER PROJETOS".
As trocas são puramente apresentacionais.

**Nenhum dado de runtime afetado — verificado por leitura dos arquivos fonte.**

---

## Common Pitfalls

### Pitfall 1: D-06 incompleto — `py-3` sem `min-h-[44px]`

**O que falha:** `py-3` gera ~38-40px de altura total — insuficiente para PUB-03.
**Por que acontece:** A decisão bloqueada em CONTEXT.md menciona apenas `py-3`. A UI-SPEC
(documento de maior detalhamento técnico) corrige isso.
**Como evitar:** Sempre aplicar AMBOS: `py-3 min-h-[44px]`.
**Sinal de alerta:** Viewport 375px no DevTools mostra elemento interativo abaixo de 44px no
inspetor de acessibilidade.

### Pitfall 2: Esquecer Header.js no escopo (D-07)

**O que falha:** LP-03 não estará completo — "COMEÇAR AGORA" no Header ainda é `<button>`
morto sem href em desktop e mobile.
**Por que acontece:** CONTEXT.md originalmente não listava `Header.js`; D-07 foi adicionado ao
CONTEXT.md após aprovação da UI-SPEC.
**Como evitar:** Escopo definitivo = union CONTEXT + UI-SPEC. Header tem **dois** `<button>`
para converter: desktop (linha 47) e mobile (linha 95).

### Pitfall 3: UnidadeDetailSheet — tap targets não auditados

**O que falha:** PUB-03 afirma "todos os tap targets ≥44px" mas o sheet overlay contém:
- Botão fechar (✕): `width: 32, height: 32` → **32px — falha ≥44px** [VERIFIED: linha 31 de UnidadeDetailSheet.js]
- "Tenho interesse →": `py-[14px]` = 28px padding + ~13px texto ≈ 41px → **marginalmente abaixo**
- "Fechar": `py-[14px]` = mesmo cálculo → **marginalmente abaixo**

A UI-SPEC não cobriu esses elementos. O planner tem duas opções:
1. Incluir UnidadeDetailSheet como 5.º arquivo com tap-target fixes (escopo mais correto)
2. Documentar como gap fora do escopo desta fase (aceitar risco de falha no critério #6)

Recomendação: incluir correção mínima no botão ✕ (`width: 44, height: 44`) e adicionar
`min-h-[44px]` nos dois botões do sheet. Impacto visual mínimo, risco eliminado.

### Pitfall 4: UnidadeDetailSheet já tem texto correto — não retocar D-05

**O que é:** `UnidadeDetailSheet.js` linha 59 já usa `'Consulte o Proprietário'` (sem o trecho
"Valor sob consulta"). D-05 aplica-se **somente** a `UnidadePublicaCard.js` linha 45.
**Como evitar:** Ler o arquivo antes de editar. O sheet está correto; apenas o card precisa de
troca.

### Pitfall 5: Overflow horizontal com muitos tabs

**O que falha:** Tab row de edifícios com nomes longos pode causar overflow horizontal em 375px
mesmo com `overflow-x-auto`.
**Por que acontece:** `[scrollbar-width:none]` oculta a scrollbar — o overflow existe mas fica
invisível. O problema surge se o container pai não tiver `overflow-hidden`.
**Como evitar:** Verificar no DevTools (375px) que o `<body>` e `.bg-background` não crescem
além de 375px. O container já tem `overflow-x-auto` — verificar que `h-dvh` e `flex-col` não
quebram o confinamento.

---

## Code Examples

### D-01 / D-02 — Hero CTAs (src/app/page.js)

```jsx
// Source: leitura direta de src/app/page.js — verificado 2026-06-06

// ANTES (linhas 44–49)
<button type="button" className="py-4 px-10 bg-linear-45 from-primary to-primary-hover cursor-pointer">
  INICIE GRATUITAMENTE
</button>
<Link href="/unidades" className="py-4 px-10 bg-background cursor-pointer text-center">
  VER PROJETOS
</Link>

// DEPOIS (D-01 + D-02)
<Link href="/login" className="py-4 px-10 bg-linear-45 from-primary to-primary-hover cursor-pointer text-center">
  ACESSAR DASHBOARD
</Link>
<Link href="/unidades" className="py-4 px-10 bg-background cursor-pointer text-center">
  VER UNIDADES
</Link>
```

### D-04 — Botão SISTEMA.04 (src/app/page.js)

```jsx
// Source: leitura direta de src/app/page.js linha 146–148 — verificado 2026-06-06

// ANTES
<button type="button" className="py-4 px-10 bg-linear-45 from-primary to-primary-hover font-headline-hanken font-semibold tracking-[0.2em] text-white text-sm cursor-pointer">
  ACESSE ANALITYCS
</button>

// DEPOIS (D-04)
<Link href="/login" className="py-4 px-10 bg-linear-45 from-primary to-primary-hover font-headline-hanken font-semibold tracking-[0.2em] text-white text-sm cursor-pointer text-center">
  ACESSAR PAINEL
</Link>
```

### D-05 — Fallback de preço (src/components/features/UnidadePublicaCard.js)

```jsx
// Source: leitura direta de UnidadePublicaCard.js linha 44–46 — verificado 2026-06-06

// ANTES
<span className="font-mono text-[11px] text-fg-3 tracking-[1px] uppercase">
  Valor sob consulta
</span>

// DEPOIS (D-05)
<span className="font-mono text-[11px] text-fg-3 tracking-[1px] uppercase">
  Consulte o Proprietário
</span>
```

### D-06 + D-07 — Tap targets e Header (resumo das trocas)

```jsx
// D-06: UnidadesPublicas.js — tab button className (trecho relevante)
// py-2 → py-3 min-h-[44px]
className={`px-3.5 py-3 min-h-[44px] inline-flex gap-2 font-body font-bold text-[10px] uppercase tracking-[0.5px] items-center border ${isActive ? '...' : '...'}`}

// D-06 adicional: link "← Voltar" — adicionar py-3 inline-flex items-center min-h-[44px]
<Link href="/" className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase hover:text-fg-2 transition-colors py-3 inline-flex items-center min-h-[44px]">← Voltar</Link>

// D-07: Header.js — desktop (linha 47) e mobile (linha 95)
// ANTES: <button type="button" className="... py-4 px-10 ...">COMEÇAR AGORA</button>
// DEPOIS:
<Link href="/login" className="content-center text-white font-semibold tracking-4 bg-linear-45 from-primary to-primary-hover py-4 px-10 cursor-pointer">
  COMEÇAR AGORA
</Link>
```

---

## Status de Implementação por Requisito

Esta seção poupa o planner de re-auditar o código — distingue o que precisa ser **construído**
do que precisa ser **verificado**.

| REQ-ID | Campo / Comportamento | Status atual | Ação da fase |
|--------|----------------------|--------------|--------------|
| LP-01 | CTA "Ver Unidades" → /unidades | PARCIAL — Link existe, label errado ("VER PROJETOS") | CORRIGIR label (D-02) |
| LP-02 | CTA "Acessar Dashboard" → /login | AUSENTE — button sem href | CONVERTER button → Link (D-01) |
| LP-03 | Todos botões LP com destinos | PARCIAL — 3 buttons sem href | D-04 (page.js) + D-07 (Header.js ×2) |
| PUB-01 | Card: nome, edifício, área m², preço/"Consulte", badge | 4/5 corretos — apenas texto "Consulte" errado | D-05 (1 linha) |
| PUB-01 | Badge "Disponível" | PRESENTE — StatusBadge.js correto | VERIFICAR |
| PUB-02 | Empty state | PRESENTE — UnidadesPublicas.js:124–135 | VERIFICAR |
| PUB-03 | Tab buttons ≥44px | AUSENTE — py-2 ≈ 30px | D-06 (py-3 + min-h-[44px]) |
| PUB-03 | Link "← Voltar" ≥44px | AUSENTE — sem padding vertical | Adicionar py-3 inline-flex min-h-[44px] |
| PUB-03 | Sem overflow horizontal 375px | PRESUMÍVEL — overflow-x-auto existe | VERIFICAR no DevTools |

---

## Assumptions Log

| # | Claim | Section | Risco se errado |
|---|-------|---------|-----------------|
| A1 | Links `href="#"` no Header nav (CONTRATOS/PORTAIS/DASHBOARD) são "aceitáveis" para LP-03 porque ficam na página e não retornam 404 | Pitfall implícito em UI-SPEC | Critério #3 ("destinos corretos") pode ser interpretado de forma mais estrita pelo avaliador; aceitabilidade foi decidida internamente na UI-SPEC, não pelo usuário |
| A2 | UnidadeDetailSheet.js está fora do escopo de tap-target fixes desta fase | Common Pitfalls | Se avaliador testa sheet em 375px, botão ✕ (32px) falha PUB-03; recomenda-se incluir |

---

## Open Questions (RESOLVED)

1. **Escopo do UnidadeDetailSheet para PUB-03** — **RESOLVED:** Plano 03 Task 3 inclui o fix (botão ✕ → 44×44px; `min-h-[44px]` nos dois botões do sheet). O sheet entra no escopo de tap-target da fase, eliminando o risco do critério #6.
   - O que sabemos: botão ✕ tem 32×32px (abaixo de 44px); "Tenho interesse" e "Fechar" têm ~41px
   - O que estava incerto: a UI-SPEC não cobria o sheet; o critério diz "todos os tap targets" sem especificar se sheet é incluído
   - Resolução: incluir fix mínimo (botão ✕ → 44×44px; `min-h-[44px]` nos dois botões do sheet) como tarefa do Plano 03 — não opcional.

2. **`href="#"` nav links — interpretação de LP-03** — **RESOLVED:** UI-SPEC.md audita e aceita os nav `href="#"` como placeholders aceitáveis (permanecem na página, não retornam 404). Decisão registrada na UI-SPEC aprovada (branch docs/phase-09-ui-spec); documentada como risco baixo em A1.
   - O que sabemos: Footer tem `aria-disabled="true"` explícito; Header nav não tem
   - O que estava incerto: se "destinos corretos" inclui "#" como aceitável ou exige rota real
   - Resolução: manter decisão da UI-SPEC (aceitável para demo de banca); documentado como risco (A1).

---

## Environment Availability

Fase code-only. Nenhuma dependência externa além do projeto existente.

| Dependência | Requerida por | Disponível | Observação |
|------------|--------------|-----------|------------|
| Next.js dev server | Desenvolvimento local | ✓ (projeto já funcionando) | `npm run dev` |
| Playwright + Chromium | Testes E2E | ✓ (playwright.config.js presente, e2e/ existente) | `npx playwright test` |
| Viewport 375px | Verificação PUB-03 | ✓ | Playwright `devices['iPhone SE']` ou DevTools |

---

## Validation Architecture

### Test Framework

| Propriedade | Valor |
|-------------|-------|
| Framework | Playwright ^1.60.0 |
| Config file | `playwright.config.js` (raiz do projeto) |
| Quick run command | `npx playwright test e2e/public-pages.spec.js` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Comportamento | Tipo de teste | Comando automatizado | Arquivo existe? |
|--------|--------------|---------------|----------------------|-----------------|
| LP-01 | Clicar "VER UNIDADES" navega para /unidades | E2E smoke | `npx playwright test e2e/public-pages.spec.js -g "LP-01"` | ❌ Wave 0 |
| LP-02 | Clicar "ACESSAR DASHBOARD" navega para /login | E2E smoke | `npx playwright test e2e/public-pages.spec.js -g "LP-02"` | ❌ Wave 0 |
| LP-03 | Todos botões ativos LP não retornam 404 | E2E smoke | `npx playwright test e2e/public-pages.spec.js -g "LP-03"` | ❌ Wave 0 |
| PUB-01 | Card mostra todos 5 campos (incl. "Consulte o Proprietário") | E2E smoke | `npx playwright test e2e/public-pages.spec.js -g "PUB-01"` | ❌ Wave 0 |
| PUB-02 | Empty state renderiza quando zero unidades disponíveis | E2E smoke | `npx playwright test e2e/public-pages.spec.js -g "PUB-02"` | ❌ Wave 0 |
| PUB-03 | Viewport 375px: sem overflow-x; tap targets ≥44px | E2E viewport | `npx playwright test e2e/public-pages.spec.js -g "PUB-03"` | ❌ Wave 0 |

**Nota PUB-02:** O teste de empty state requer que a base de dados tenha zero unidades disponíveis
OU que o teste mocke a resposta de `getUnidadesDisponiveis`. A abordagem mais simples:
usar `page.route()` do Playwright para interceptar a chamada Supabase e retornar lista vazia.

**Nota PUB-03 (viewport):** Playwright suporta `{ viewport: { width: 375, height: 812 } }` ou
`devices['iPhone SE']`. Verificar `scrollWidth <= clientWidth` via `page.evaluate()` é o
padrão para detectar overflow-x.

### Sampling Rate

- **Por commit de tarefa:** `npx playwright test e2e/public-pages.spec.js`
- **Por merge de wave:** `npx playwright test`
- **Phase gate:** Suite completa verde antes de `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `e2e/public-pages.spec.js` — cobre LP-01, LP-02, LP-03, PUB-01, PUB-02, PUB-03
- [ ] Fixture/mock para PUB-02 (empty state) — `page.route()` intercept de Supabase anon key

*(Infra de testes existente cobre auth/crud/dashboard — nenhuma mudança em config.)*

---

## Security Domain

Fase de páginas públicas read-only sem autenticação, sem input do usuário, sem mutations.
RLS já governa quais dados Supabase retorna (somente `status = 'disponivel'`).

| ASVS Category | Aplica? | Controle |
|---------------|---------|---------|
| V2 Authentication | não | — |
| V3 Session Management | não | — |
| V4 Access Control | não | — |
| V5 Input Validation | não | Nenhum input nesta fase |
| V6 Cryptography | não | — |

Nenhum vetor de segurança novo introduzido. `<Link href="/login">` é navegação padrão; sem
dados sensíveis expostos.

---

## Sources

### Primary (HIGH confidence — leitura direta dos arquivos fonte)

- `src/app/page.js` — CTAs hero (linhas 44–49, 146–148), imports Link (linha 1)
- `src/components/features/UnidadePublicaCard.js` — texto "Valor sob consulta" (linha 45), campos do card (linhas 13–52)
- `src/components/features/UnidadesPublicas.js` — tab buttons (linhas 97–110), link Voltar (linha 82), empty state (linhas 124–135)
- `src/components/ui/Header.js` — buttons "COMEÇAR AGORA" desktop (linha 47) e mobile (linha 95)
- `src/components/features/UnidadeDetailSheet.js` — botão ✕ (linha 31, 32×32px), buttons do sheet (linhas 82–95)
- `.planning/phases/09-paginas-publicas/09-CONTEXT.md` — decisões D-01..D-07 bloqueadas
- `.planning/phases/09-paginas-publicas/09-UI-SPEC.md` — D-01..D-07 com cálculos de tap target e auditoria LP-03
- `.planning/REQUIREMENTS.md` — LP-01..LP-03, PUB-01..PUB-03
- `playwright.config.js` — configuração do framework de testes E2E

### Secondary (MEDIUM confidence)

- Cálculos de tap target: WCAG 2.5.5 (44×44px CSS) + Apple HIG — alinhados com valor do UI-SPEC

---

## Metadata

**Confidence breakdown:**
- Escopo das mudanças: HIGH — verificado linha a linha nos arquivos fonte
- Cálculos de tap target: HIGH — matemática direta de px
- Teste E2E (wave 0): MEDIUM — estrutura especificada, implementação a ser criada
- A1 (href="#" aceitável): LOW — interpretação interna, não confirmada pelo usuário

**Research date:** 2026-06-06
**Valid until:** 2026-06-18 (banca) — stack estável, sem dependências externas voláteis
