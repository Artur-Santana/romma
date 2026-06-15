# Phase 20: Edifícios — Cards & Drill-in - Research

**Researched:** 2026-06-15
**Domain:** Frontend restructure — building cards, stat aggregation, occupation bar, accordion drill-in, modal prop extension
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Stats derivados client-side juntando `getUnidades()` com `getEdificios()`, agrupando por `edificio_id`. Sem query/RPC server-side dedicada.

**D-02:** Por edifício: ocupação % = alugadas/total (0 se total=0); MRR = soma `valor_mensal` das unidades `alugada`; área total = soma `area_m2` de todas as unidades; nº de unidades = contagem total.

**D-03:** Barra de ocupação como segmentos proporcionais em container flex, alugadas primeiro, depois disponíveis, sem buracos. Dois tokens de cor distintos. Legenda textual: "X alugada(s) · Y disponível(is)".

**D-04:** Edifício com 0 unidades → barra vazia/neutra, legenda "0 alugada(s) · 0 disponível(is)", botão "Ver 0 unidades" desabilitado.

**D-05:** "Ver N unidade(s)" faz expansão inline (accordion) dentro do card. Toggle abre/fecha.

**D-06:** Cada linha de unidade na lista expandida é clicável (linha inteira) e abre `UnifiedUnidadeModal` em `mode="edit"` com `initial` = a unidade clicada. Após `onSaved`, recarrega unidades e recomputa stats.

**D-07:** Adicionar prop `lockEdificio` (boolean) ao `UnifiedUnidadeModal`. Quando `true`, o `FSelect` de edifício é desabilitado/somente-leitura. API estendida: `{ mode, initial, edificios, onClose, onSaved, lockEdificio }`. Default `false` para não quebrar call-sites existentes.

**D-08:** Passar `edificios` completo + `initial.edificio_id` já preenchido. Quando `lockEdificio=true`, select mostra só o edifício corrente travado.

**D-09:** Reestruturar `GestaoEdificios.js` de lista vertical para grade de cards 2 colunas. Preservar Server Actions `criarEdificio`/`editarEdificio`/`deletarEdificio` e seus fluxos existentes.

### Claude's Discretion

- Layout exato dos cards, hierarquia visual dos stats, formatação de MRR/área.
- Tokens de cor exatos da barra de ocupação (ocupado vs disponível) e tratamento de hover/clicável nas linhas de unidade.
- Onde posicionar os controles de criar/editar/remover edifício no novo layout de cards.
- Forma exata de buscar/agrupar unidades por edifício (memo client-side).

### Deferred Ideas (OUT OF SCOPE)

- Dashboard com agregados globais (ocupação/MRR consolidados) — Phase 21 (DASH-04..06).
- Exibição de foto de capa da unidade nas linhas expandidas do drill-in.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EDIF-01 | Edifícios exibidos em cards de 2 colunas com stats por edifício (ocupação %, MRR, área total, nº de unidades) | D-01/D-02 locked — `getUnidades()` + `getEdificios()` already return all needed fields; client-side grouping by `edificio_id` |
| EDIF-02 | Barra de ocupação contígua (alugadas primeiro, disponíveis depois, sem buracos) com legenda "X alugada(s) · Y disponível(is)" | D-03/D-04 locked — flex proportion bar, two CSS var tokens, empty state defined |
| EDIF-03 | "Ver N unidade(s)" expande lista de unidades; cada unidade clicável abre modal unificado de edição | D-05/D-06/D-07/D-08 locked — accordion inline, `UnifiedUnidadeModal` reuse with `lockEdificio` prop |
</phase_requirements>

---

## Summary

Phase 20 is a pure frontend restructure of `GestaoEdificios.js`. No schema changes, no new tables, no new Server Actions. The existing CRUD actions (`criarEdificio`, `editarEdificio`, `deletarEdificio`) are preserved intact.

The primary work is: (1) restructure the vertical list into a 2-column card grid where each card computes and displays per-building stats; (2) render a contiguous flex occupation bar per card; (3) add an accordion drill-in that expands the building's unit list and opens `UnifiedUnidadeModal` on unit click; (4) extend `UnifiedUnidadeModal` with a `lockEdificio` boolean prop that disables the `FSelect` for edifício when set to true.

All data needed (`edificio_id`, `status`, `valor_mensal`, `area_m2`) is already returned by `getUnidades()` and `getEdificios()` as currently written. No query extension is required.

**Primary recommendation:** Load both `getEdificios()` and `getUnidades()` in a single `Promise.all` (same pattern as `Unidades.js` line 92), group unidades by `edificio_id` with `useMemo`/derived state, compute stats inline, and render each card with its own `expandido` toggle state managed via a `Set` or `Map` in a single `useState`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Building card grid (2-col layout) | Browser / Client | — | Pure rendering — JSX + inline styles, no server needed |
| Per-building stat aggregation | Browser / Client | — | D-01 locked: client-side from loaded arrays |
| Contiguous occupation bar | Browser / Client | — | Flex segment rendering, pure CSS |
| Accordion drill-in expand/collapse | Browser / Client | — | Toggle state managed locally in component |
| Unit list inside expanded card | Browser / Client | — | Filtered subset of already-loaded `getUnidades()` result |
| UnifiedUnidadeModal edit (drill-in) | Browser / Client | API / Backend (Server Actions) | Modal renders client-side; mutations go via existing `editarUnidade` Server Action |
| `lockEdificio` prop on modal | Browser / Client | — | Prop-controlled UI disable on `FSelect` — no backend involvement |
| Building CRUD (create/edit/delete) | API / Backend | Browser / Client | Server Actions (`edificios.js`) — unchanged |

---

## Standard Stack

### Core (all already in project — no new installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React `useState` | 19.2.4 | Accordion expand state, modal open state | Project standard |
| React `useEffect` | 19.2.4 | Data fetch on mount | Project standard (queries-client pattern) |
| `getEdificios()` / `getUnidades()` | n/a (project functions) | Data source for cards and drill-in | Already returns all needed fields |
| Inline styles + CSS vars | — | Card layout, bar segments, hover states | Project convention; `--indigo`, `--border-3`, `--fg-*`, `--surface` |
| `UnifiedUnidadeModal` | Phase 19 | Reused in drill-in with `lockEdificio` extension | D-07 locked |
| `PageHeader` | shadcn/ui wrapper | Page header (eyebrow, title, CTA) | Used in current `GestaoEdificios.js` |
| `Skeleton` | shadcn/ui | Loading state — adapt existing `SkeletonEdificios` | Used in current `GestaoEdificios.js` |

### No New Packages Required

This phase installs zero new dependencies. Everything needed exists in the current stack.

---

## Package Legitimacy Audit

No external packages are installed in this phase. Section not applicable.

---

## Architecture Patterns

### System Architecture Diagram

```
useEffect (mount)
  └─ Promise.all([getEdificios(), getUnidades()])
        │
        ├─ setEdificios([...])
        └─ setUnidades([...])
               │
               ▼
        derived: unidadesPorEdificio = Map<edificio_id, unidade[]>
               │
               ▼
        [GestaoEdificios render]
               │
        ┌──────┴──────────────────────────┐
        │  "Novo Edifício" form (existing) │
        └──────────────────────────────────┘
               │
        ┌──────┴──────────────────────────────────────────────────────┐
        │  grid 2 colunas — edificios.map(ed => <EdificioCard2Col/>)  │
        │    ├── Stats row: nUnidades, ocupação%, MRR, área             │
        │    ├── OccupationBar: flex segments (alugadas | disponíveis) │
        │    ├── Legenda: "X alugada(s) · Y disponível(is)"            │
        │    ├── Botão "Ver N unidade(s)" → toggle expandido           │
        │    │      (disabled se N=0)                                   │
        │    │                                                           │
        │    └── [expandido=true] UnidadesDrillIn                       │
        │              │                                                │
        │              └─ unidades deste edifício.map(u =>             │
        │                   <DrillInRow onClick → setModalState>)      │
        └──────────────────────────────────────────────────────────────┘
               │
        [modalState !== null]
               └─ <UnifiedUnidadeModal
                     mode="edit"
                     initial={modalState.unidade}
                     edificios={edificios}
                     lockEdificio={true}
                     onClose={() => setModalState(null)}
                     onSaved={() => { carregarDados(); setModalState(null) }}
                  />
```

### Recommended Project Structure

No new files required. All changes are in:

```
src/
├── components/
│   ├── features/
│   │   └── GestaoEdificios.js     ← restructure: list → 2-col cards, add stats + drill-in
│   └── ui/
│       └── UnifiedUnidadeModal.js ← extend: add lockEdificio prop, disable FSelect when true
└── (no other file changes)
```

`EdificioCard.js` in `src/components/ui/` is a legacy unstyled stub — it can be ignored or replaced with logic inlined into `GestaoEdificios.js` (consistent with how `GestaoEdificios.js` currently inlines its card rows).

### Pattern 1: Per-Building Stat Aggregation (client-side grouping)

**What:** Group the loaded `unidades` array by `edificio_id`, compute derived stats per building.
**When to use:** After `Promise.all` resolves, before render.

```javascript
// Source: [ASSUMED] — mirrors Unidades.js lines 114-124 pattern
// Derived state computed inline (no useMemo needed for TCC dataset size)

const unidadesPorEdificio = unidades.reduce((acc, u) => {
  if (!acc[u.edificio_id]) acc[u.edificio_id] = []
  acc[u.edificio_id].push(u)
  return acc
}, {})

// Per-building stats (call inside .map over edificios)
function computeStats(listaDoEdificio) {
  const total = listaDoEdificio.length
  const alugadas = listaDoEdificio.filter(u => u.status === "alugada").length
  const disponiveis = total - alugadas
  const ocupacaoPct = total > 0 ? Math.round((alugadas / total) * 100) : 0
  const mrr = listaDoEdificio
    .filter(u => u.status === "alugada")
    .reduce((s, u) => s + (u.valor_mensal || 0), 0)
  const areaTotal = listaDoEdificio.reduce((s, u) => s + (u.area_m2 || 0), 0)
  return { total, alugadas, disponiveis, ocupacaoPct, mrr, areaTotal }
}
```

### Pattern 2: Contiguous Occupation Bar (flex proportion)

**What:** Two flex children whose `flex` values are proportional to count. Alugadas first (D-03).
**When to use:** Inside each card, below the stats row.

```javascript
// Source: [ASSUMED] — standard CSS flex proportion technique
// EDIF-02 requires: alugadas first, no gaps, no rounded corners (--radius: 0)

function OccupationBar({ alugadas, disponiveis }) {
  const total = alugadas + disponiveis
  if (total === 0) {
    return (
      <div style={{ height: 6, background: "var(--border-3)", width: "100%" }} />
    )
  }
  return (
    <div style={{ display: "flex", height: 6, width: "100%", overflow: "hidden" }}>
      {alugadas > 0 && (
        <div style={{ flex: alugadas, background: "var(--indigo)" }} />
      )}
      {disponiveis > 0 && (
        <div style={{ flex: disponiveis, background: "var(--border-3)" }} />
      )}
    </div>
  )
}
```

Color choices (Claude's discretion): `--indigo` (var(--primary), oklch 0.339 0.1793 301.68) for alugadas; `--border-3` (oklch 0.387 0 0 / 0.4) for disponíveis. This matches existing color usage for "active/occupied" vs "inactive/available" throughout the codebase.

### Pattern 3: Accordion Drill-in (expand/collapse toggle)

**What:** A single `useState<Set<string>>` tracks which building IDs are expanded. Toggle on button click.
**When to use:** "Ver N unidade(s)" button handler.

```javascript
// Source: [ASSUMED] — React accordion pattern via Set state
const [expandidos, setExpandidos] = useState(new Set())

function toggleExpandido(edificioId) {
  setExpandidos(prev => {
    const next = new Set(prev)
    next.has(edificioId) ? next.delete(edificioId) : next.add(edificioId)
    return next
  })
}

// In card render:
const isExpanded = expandidos.has(edificio.id)
const listaDoEdificio = unidadesPorEdificio[edificio.id] ?? []
```

Button label: `"Ver ${listaDoEdificio.length} unidade${listaDoEdificio.length !== 1 ? "s" : ""}"`
Disabled state: `listaDoEdificio.length === 0`

### Pattern 4: UnifiedUnidadeModal — lockEdificio Extension

**What:** Add optional `lockEdificio` prop that disables the edifício `FSelect` inside the modal.
**Current signature (verified):** `({ mode, initial, edificios, onClose, onSaved })`
**New signature:** `({ mode, initial, edificios, onClose, onSaved, lockEdificio = false })`

The `FSelect` for "Edifício" is at `UnifiedUnidadeModal.js` line 432–439:

```javascript
// Current code (lines 431-439):
<FormField label="Edifício">
  <FSelect
    value={form.edificio_id}
    onChange={(e) => setForm({ ...form, edificio_id: e.target.value })}
  >
    {edificios.map((ed) => (
      <option key={ed.id} value={ed.id}>{ed.nome}</option>
    ))}
  </FSelect>
</FormField>
```

**Change required:** Pass `disabled={lockEdificio}` to `FSelect` and render only the current building's option when locked (D-08):

```javascript
// Source: [ASSUMED] — minimal prop pass-through
<FormField label="Edifício">
  <FSelect
    value={form.edificio_id}
    onChange={(e) => !lockEdificio && setForm({ ...form, edificio_id: e.target.value })}
    disabled={lockEdificio}
  >
    {lockEdificio
      ? edificios.filter(ed => ed.id === form.edificio_id).map(ed => (
          <option key={ed.id} value={ed.id}>{ed.nome}</option>
        ))
      : edificios.map((ed) => (
          <option key={ed.id} value={ed.id}>{ed.nome}</option>
        ))
    }
  </FSelect>
</FormField>
```

`FSelect` does not currently accept a `disabled` prop — its inner `<select>` needs the prop forwarded. Extend `FSelect` to spread `...rest` or add explicit `disabled` param.

### Pattern 5: Data Loading (Promise.all — mirrors Unidades.js)

**What:** Load both resources in parallel on mount, re-load after any mutation.
**Canonical reference:** `Unidades.js` lines 91-112.

```javascript
// Source: [CITED] — Unidades.js lines 91-104
async function carregarDados() {
  const [edificiosList, unidadesList] = await Promise.all([
    getEdificios() ?? [],
    getUnidades() ?? [],
  ])
  setEdificios(edificiosList ?? [])
  setUnidades(unidadesList ?? [])
}

useEffect(() => {
  async function fetchDados() {
    await carregarDados()
    setLoadingInicial(false)
  }
  fetchDados()
}, [])
```

After `onSaved` from the modal: call `carregarDados()` to refresh both lists and recompute stats.

### Pattern 6: MRR and Area Formatting

The existing `Unidades.js` defines `fmtBRLk(v)` (lines 62-71) for compact money formatting (e.g., "R$ 12k"). The same formatter or a similar one should be used for MRR display on cards. Area should be formatted as `X m²` (no compact needed for typical values).

```javascript
// Source: [CITED] — Unidades.js lines 62-71
function fmtBRLk(v) {
  if (v >= 1000) {
    const k = v / 1000
    const formatted = k % 1 === 0
      ? k.toLocaleString("pt-BR")
      : k.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    return `R$ ${formatted}k`
  }
  return `R$ ${v.toLocaleString("pt-BR")}`
}
```

This can be imported from `Unidades.js` (if exported) or copied into `GestaoEdificios.js`. Currently it is a local function — simplest to redeclare locally.

### Anti-Patterns to Avoid

- **Separate fetches per building:** Do NOT call `getUnidades()` per edificio. Fetch once, group client-side (D-01).
- **Hardcoded column widths on occupation bar:** Do NOT use `width: X%` calculated with `style`. Use `flex: N` — handles zero-width segments cleanly without gaps.
- **Conditional render of zero-flex segment:** A flex child with `flex: 0` still occupies space. Conditionally render the `<div>` when count is 0 (see Pattern 2 above with `{alugadas > 0 && ...}`).
- **Importing `supabaseAdmin` in this component:** All mutations go through existing Server Actions. No direct DB access in client component.
- **Breaking existing Unidades.js call-site:** `lockEdificio` must default to `false`. Do not add it as a required prop.
- **Navigating to a new route for drill-in:** D-05 is locked as inline accordion. No routing change.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Edifício select disable | Custom disabled overlay | `disabled` attribute on `<select>` + pointer-events:none on `FSelect` | Native HTML — zero complexity |
| Proportional bar | Canvas / SVG chart | CSS flex with `flex: N` | Exactly what flex proportion is for; no library needed |
| Accordion animation | JS height animation | CSS `overflow: hidden` + `max-height` transition OR just conditional render (no animation required by spec) | Spec says "expande lista" — animation is discretion, not requirement |
| Stat computation | Server-side RPC | Client-side reduce/filter on loaded array | D-01 is locked; dataset is small (TCC) |
| Modal lock overlay | Separate locked-view modal | `lockEdificio` prop on existing `UnifiedUnidadeModal` | D-07 is locked; minimal prop addition |

---

## Existing Code Inventory (Verified)

### GestaoEdificios.js — Current State

**File:** `src/components/features/GestaoEdificios.js` (247 lines)
**Current rendering:** Vertical `flex-col` list inside a single `border border-border-3 bg-surface` container.
**State:**
- `edificios` (array) — loaded from `getEdificios()` only (currently does NOT load unidades)
- `loadingInicial`, `showForm`, `form`, `editandoId`, `formEdit`, `loading`, `erro`, `erroEdit`

**Key gap to fill in Phase 20:** Current `GestaoEdificios.js` does NOT call `getUnidades()`. This must be added in `carregarDados()`.

**CRUD logic to preserve (verified in `src/actions/edificios.js`):**
- `criarEdificio(form)` — inserts with `proprietario_id` guard
- `editarEdificio(id, form)` — updates with `.eq('proprietario_id', user.id)`
- `deletarEdificio(id)` — blocks if building has units (count > 0 check)

**SkeletonEdificios** (lines 12-25): currently 3 rows of single-column skeleton. Should be adapted to 2-column card skeletons.

### UnifiedUnidadeModal.js — Current State

**File:** `src/components/ui/UnifiedUnidadeModal.js` (534 lines)
**Current signature (verified, line 272):**
```javascript
export default function UnifiedUnidadeModal({ mode, initial, edificios, onClose, onSaved })
```

**FSelect component (verified, lines 40-67):** Does NOT currently accept `disabled` prop. Needs extension:
```javascript
function FSelect({ value, onChange, children, disabled }) {
  // ... existing focus state ...
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        style={{
          // ... existing styles ...
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "default" : "pointer",
        }}
      >
        {children}
      </select>
      {/* existing chevron span */}
    </div>
  )
}
```

**Edifício select location (verified, lines 431-439):** The `FSelect` for "Edifício" is the first field in the grid. Add `lockEdificio` filter there.

**Call-sites of `UnifiedUnidadeModal` (verified):**
- `src/components/features/Unidades.js` line 361 — passes `{ mode, initial, edificios, onClose, onSaved }`. With `lockEdificio` defaulting to `false`, this call-site requires no change.

### EdificioCard.js — Legacy Stub

**File:** `src/components/ui/EdificioCard.js` (19 lines)
**Status:** Unstyled, prop-drilling-heavy legacy stub not used by `GestaoEdificios.js`. Can be ignored. The planner should NOT attempt to extend this component — implement the new card layout inline in `GestaoEdificios.js` (or as a local function component within the same file), consistent with project convention.

### queries-client.js — Current Shapes (Verified)

**`getEdificios()`** returns: `id, nome, endereco`
**`getUnidades()`** returns: `id, edificio_id, nome, descricao, area_m2, valor_mensal, valor_visivel, status, foto_url`

All fields needed for D-02 stats (`edificio_id`, `status`, `valor_mensal`, `area_m2`) are already selected. **No query extension needed.**

---

## Common Pitfalls

### Pitfall 1: Flex Segment Gap When Count Is Zero

**What goes wrong:** A `<div style={{ flex: 0 }}>` renders as a zero-width element but may still affect flex layout in some browsers, or a conditional `{alugadas > 0 && ...}` is omitted so there is a visible gap between segments.
**Why it happens:** EDIF-02 specifies "sem buracos" — zero-count segment must not appear.
**How to avoid:** Conditionally render each segment only when its count > 0. When total is 0, render a single neutral bar.
**Warning signs:** Bar shows a visible gap in the middle when alugadas=0 or disponiveis=0.

### Pitfall 2: accordion toggle state reset on data reload

**What goes wrong:** After `onSaved` triggers `carregarDados()`, all accordions collapse because `expandidos` state is reset.
**Why it happens:** If `expandidos` is reset inside `carregarDados` — it shouldn't be. `carregarDados` only updates `edificios` and `unidades` state; `expandidos` is separate and survives the re-render.
**How to avoid:** Keep `expandidos` (Set state) as its own `useState` separate from data state. Do NOT reset it in `carregarDados`.
**Warning signs:** User clicks a unit, saves, accordion collapses — disorienting UX.

### Pitfall 3: Modal Opens With Wrong edificio_id

**What goes wrong:** When `lockEdificio=true`, the `FSelect` shows all buildings but only the current one should appear. If the `edificios.filter` is missing, the user sees all options but can't change them (select is disabled) — the first option may render as a different building.
**Why it happens:** `form.edificio_id` is set from `initial.edificio_id` (correct), but if no filtering is applied to the option list, and the first option happens to be a different building, the visual display may mismatch.
**How to avoid:** When `lockEdificio=true`, filter `edificios` to only the current `form.edificio_id` option (D-08). This ensures the displayed value is always correct.
**Warning signs:** Select shows "Edifício A" but the unit belongs to "Edifício B".

### Pitfall 4: Missing `?? []` on getUnidades return

**What goes wrong:** `getUnidades()` can return `undefined` if Supabase returns no data. Calling `.reduce()` or `.filter()` on `undefined` throws a runtime error.
**Why it happens:** Project convention is to always use `?? []` on array returns.
**How to avoid:** `setUnidades(await getUnidades() ?? [])` — same as all existing patterns in the codebase.

### Pitfall 5: 2-column grid breaks on mobile

**What goes wrong:** A `grid-cols-2` or `display: grid; grid-template-columns: 1fr 1fr` shows two narrow cards on mobile (375px).
**Why it happens:** Hardcoded 2-column grid ignores screen width.
**How to avoid:** Use Tailwind responsive: `grid grid-cols-1 sm:grid-cols-2` or CSS `grid-template-columns: repeat(auto-fill, minmax(340px, 1fr))` with a 2-column minimum. The spec says "2 colunas" but does not specify mobile behavior — defaulting to single column on mobile is the correct responsive decision (Claude's discretion).

### Pitfall 6: Occupation bar total uses wrong denominator

**What goes wrong:** Occupation % calculated as alugadas/total gives 0% for buildings with all units available, not "0 unidades alugadas".
**Why it happens:** D-02 defines: ocupação % = alugadas/total, 0 if total=0. This is correct.
**How to avoid:** Ensure `total > 0` guard before division. The bar itself has no NaN issue because flex segments are computed from counts, not percentages.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright 1.60.0 |
| Config file | `playwright.config.js` / `playwright.validation.config.js` |
| Quick run command | `npx playwright test e2e/crud-edificios.spec.js --project=chromium` |
| Full suite command | `npx playwright test --project=chromium` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EDIF-01 | Cards 2 colunas com stats visíveis por edifício | E2E | `npx playwright test e2e/crud-edificios.spec.js --project=chromium` | ✅ (extend existing) |
| EDIF-02 | Barra de ocupação contígua com legenda | E2E | `npx playwright test e2e/crud-edificios.spec.js --project=chromium` | ✅ (extend existing) |
| EDIF-03 | Accordion expand + modal abre ao clicar unidade | E2E | `npx playwright test e2e/crud-edificios.spec.js --project=chromium` | ✅ (extend existing) |

### Existing Test Coverage

`e2e/crud-edificios.spec.js` (61 lines) currently tests: criar edifício, editar edifício, deletar edifício. It does NOT test the new features (cards layout, stats, occupation bar, accordion, drill-in modal). Tests for EDIF-01..03 must be added to this file in Wave 0 or as a new test spec.

### Sampling Rate

- **Per task commit:** `npx playwright test e2e/crud-edificios.spec.js --project=chromium`
- **Per wave merge:** `npx playwright test --project=chromium`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `e2e/crud-edificios.spec.js` — add tests for: cards 2-col layout visible, stat values present (ocupação, MRR, área, nº unidades), occupation bar segments present, accordion toggle ("Ver N unidade(s)" shows/hides list), unit row click opens modal, lockEdificio hides other buildings in select.

---

## Security Domain

Phase 20 makes no changes to Server Actions, RLS policies, or auth flows.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | CRUD actions preserved with existing `authGuard()` + `proprietario_id` checks |
| V5 Input Validation | no | No new user inputs beyond existing create/edit edificio form |
| V6 Cryptography | no | — |

No new attack surface introduced. The `lockEdificio` prop is UI-only and does not bypass any server-side ownership check — `editarUnidade` in the Server Action still validates `proprietario_id`. A malicious user cannot bypass `lockEdificio` to change a unit's building via this UI, but even if they could send a crafted request, the Server Action's ownership check prevents unauthorized updates.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — pure frontend restructure, no new CLIs, services, or runtimes required beyond existing Next.js dev server and Supabase project).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `fmtBRLk` from Unidades.js is not exported; should be redeclared locally in GestaoEdificios.js | Code Examples | Low — just copy the 10-line function |
| A2 | Accordion animate with CSS max-height transition is optional (spec says "expande", no animation spec) | Architecture Patterns | Low — if animation is desired, add `max-height` transition, zero breaking risk |
| A3 | `EdificioCard.js` legacy stub is not referenced anywhere and can be safely ignored | Existing Code Inventory | Low — grep confirms it is not imported by any current file |

---

## Open Questions

1. **Inline edit form inside 2-col card layout**
   - What we know: The current edit form expands inline within each list row. In a 2-column card grid, the inline edit form needs to fit inside its card without breaking grid layout.
   - What's unclear: Should the edit form span both columns when active, or stay within the card's column? The spec does not specify.
   - Recommendation: Keep edit form within the card (no spanning). The form is 2 fields (nome + endereco) which fit in a single-column inline layout inside the card. This is Claude's discretion.

2. **CRUD form position in new card layout**
   - What we know: Currently there is a "Novo Edifício" form panel that opens above the list. In a card grid, positioning is less obvious.
   - What's unclear: Whether the create form should remain a top panel or become a dedicated card/modal.
   - Recommendation: Keep as top panel (same position as current `showForm` implementation) — zero behavior change, minimal restructuring. This is Claude's discretion.

---

## Sources

### Primary (HIGH confidence)

- `src/components/features/GestaoEdificios.js` — verified current implementation: list layout, state shape, CRUD handlers, SkeletonEdificios
- `src/components/ui/UnifiedUnidadeModal.js` — verified current API signature (line 272), `FSelect` definition (lines 40-67), edifício field (lines 431-439)
- `src/lib/queries-client.js` — verified `getEdificios()` (id, nome, endereco) and `getUnidades()` (id, edificio_id, nome, descricao, area_m2, valor_mensal, valor_visivel, status, foto_url)
- `src/actions/edificios.js` — verified CRUD actions with authGuard pattern
- `src/app/globals.css` — verified CSS tokens: `--indigo`, `--border-3`, `--fg-*`, `--surface`, `--surface-hi`, `--border-2`
- `src/components/features/Unidades.js` — verified `Promise.all` pattern (lines 91-112), stat derivation pattern (lines 114-124), `UnifiedUnidadeModal` invocation (lines 360-368)
- `.planning/phases/20-edif-cios-cards-drill-in/20-CONTEXT.md` — all decisions D-01..D-09 verified
- `.planning/REQUIREMENTS.md` — EDIF-01..03 verified
- `e2e/crud-edificios.spec.js` — verified current test coverage scope
- `playwright.config.js` — verified test runner setup

### Secondary (MEDIUM confidence)

- CSS flex proportion technique for occupation bar — standard CSS behavior, well-established

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components verified by reading source files
- Architecture: HIGH — clear from existing patterns; all locked decisions well-specified
- Pitfalls: HIGH — identified from direct code inspection
- Test coverage gaps: HIGH — direct inspection of crud-edificios.spec.js

**Research date:** 2026-06-15
**Valid until:** 2026-07-15 (stable stack)
