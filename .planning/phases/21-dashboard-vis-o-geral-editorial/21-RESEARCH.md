# Phase 21: Dashboard — Visão Geral Editorial — Research

**Researched:** 2026-06-15
**Domain:** Next.js 16 Server Component reorganization, CSS div-bar chart, cash-flow aggregation, token mapping
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Nova query de leitura `getParcelasFluxo()` em `queries-server.js` — retorna parcelas de **todos os contratos** com `status, data_vencimento, data_pagamento, contrato_id` dentro da janela do gráfico.
- **D-02:** Parcela não tem coluna de valor — derivar de `unidade.valor_mensal` via `contrato.unidade_id`, usando listas já carregadas.
- **D-03:** Recebido = parcelas `paga` agrupadas por `data_pagamento` (mês). Previsto = todas as parcelas agrupadas por `data_vencimento` (mês). Barra sólida desenhada sobre a fantasma.
- **D-04:** Pico em dourado = mês com maior valor `recebido` → `f.peak = true` → cor `--highlight` + glow. Demais barras sólidas usam `--primary-hover` (mapeado abaixo).
- **D-05:** Janela rolante 6 meses: mês atual −3 até +2. 6 barras. Rótulo abreviado (`jan`, `fev` …).
- **D-06:** OccupancyBar: 1 célula por unidade (m.total células flex, gap 3px); primeiras `alugadas` coloridas (`--primary-hover`), restantes com `--surface-hi` + borda `--border-3`. Numeral grande 56px ao lado.
- **D-07:** 4 métricas empilhadas reutilizam cálculos de page.js:48-74 sem recálculo divergente.
- **D-08:** Sem biblioteca de chart — barras `div` CSS. Fantasma `position:absolute`, sólido `position:relative`. Animação `rGrow` com `prefers-reduced-motion`.
- **D-09:** Manter Server Component. Sem `'use client'`, sem Realtime para fluxo/ocupação.
- **D-10:** Preservar atalhos rápidos existentes (desktop 4×1, mobile 2×2).
- **D-11:** Bloco de ocupação + métricas no mobile. Gráfico de fluxo: versão compacta (altura reduzida, mesmas 6 barras). Contratos recentes e atalhos preservados.

### Claude's Discretion

- Mapeamento dos tokens do design (`--highlight`, `--primary-hover`, `--secondary`, `--surface-hi`) para tokens reais do `globals.css`.
- Nome exato e assinatura da nova query de fluxo.
- Altura exata das barras no mobile e ordenação/limite das tabelas.

### Deferred Ideas (OUT OF SCOPE)

- Drill-in / timeline de parcelas e registrar pagamento — Phase 22.
- Realtime para fluxo/ocupação — não promover a tempo real.
- Filtro/seleção de período do gráfico — pós-banca.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-04 | Dashboard exibe bloco de ocupação em destaque (numeral grande de % + barra dividida por unidade) e métricas empilhadas | Token mapping + OccupancyBar port pattern documented in §5 |
| DASH-05 | Dashboard exibe gráfico de fluxo de caixa (barras: recebido sólido vs. previsto fantasma, com pico em dourado), alimentado por agregação mensal de parcelas | New query shape + aggregation algorithm + CashFlowChart port documented in §6 and §7 |
| DASH-06 | Dashboard tem tabela de contratos recentes, painel de parcelas e atalhos rápidos que navegam para as seções | Existing code preserved — patterns documented in §10 |
</phase_requirements>

---

## Summary

Phase 21 reorganizes the existing `src/app/dashboard/page.js` (async Server Component) into the editorial Variant B layout, adding two new visual components — `OccupancyBar` and `CashFlowChart` — and one new server query `getParcelasFluxo()`. No schema changes, no new npm packages, no `'use client'` boundary.

The design canonical is `.planning/design/js/overview.jsx`. Both components are fully specified there and need only to be ported to production code, replacing mock data (`D.fluxo`, `D.unidades`) with server-derived data.

The single non-trivial algorithmic piece is the 6-month cash-flow aggregation: bucket all parcelas by month key, derive their value from `contrato.unidade_id → unidade.valor_mensal`, split into recebido (by `data_pagamento`) and previsto (by `data_vencimento`), normalize to percentages for bar height, and mark the peak month. This is a pure function with no side effects and should live in a utility file so it can be tested independently.

**Primary recommendation:** Port design components verbatim, implement `getParcelasFluxo()` as a thin Supabase query, write the aggregation as a pure function in `src/lib/fluxo.js`, extend the `Promise.all` in page.js to include the new query, and reorganize the desktop layout to match Variant B's `1.55fr 1fr` hero grid.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Cash-flow aggregation | Frontend Server (SSR) — page.js | — | Pure data derivation from DB lists; no client interactivity needed |
| OccupancyBar render | Frontend Server (SSR) — page.js | — | Static render from `unidades` list already in scope |
| CashFlowChart render | Frontend Server (SSR) — page.js | — | D-09 locks no `'use client'`; bar heights are `%` strings from server aggregation |
| `rGrow` animation | Browser | — | CSS keyframe via `globals.css`, no JS required |
| getParcelasFluxo query | Database / Storage | API (queries-server.js) | New SELECT on parcelas, same RLS |
| Atalhos rápidos | Frontend Server (SSR) | — | `<Link>` — already server-renderable |

---

## Standard Stack

### Core (no new packages)

| File | Purpose | Change Type |
|------|---------|-------------|
| `src/app/dashboard/page.js` | Server Component — layout reorganization + new blocks | **Modify** |
| `src/lib/queries-server.js` | Add `getParcelasFluxo()` | **Modify** |
| `src/lib/fluxo.js` | Pure aggregation helper (new file) | **Create** |

**No npm packages to install.** Zero new dependencies.

---

## Package Legitimacy Audit

Not applicable — this phase installs no external packages.

---

## 1. Token Mapping Table

Read from `.planning/design/styles/app.css` (design canonical) vs `src/app/globals.css` (production).

| Design Token | Value in app.css | Maps to (globals.css) | Production Value | Notes |
|---|---|---|---|---|
| `--highlight` | `oklch(0.7245 0.0998 82.35)` | `--color-highlight` → `--highlight` | `oklch(0.7245 0.0998 82.35)` | **SAME value**. `globals.css:415` defines `--highlight: var(--color-highlight)`. Gold/dourado. Use for peak bar + glow. [VERIFIED: globals.css line 415] |
| `--primary-hover` | `oklch(from var(--color-primary-2) calc(l + 0.25) c h)` | No direct production alias | Derived from `--ds-primary` via `--color-primary-hover` defined at @theme (globals.css:10) | In production, use `var(--color-primary-hover)`. The design uses `var(--primary-hover)` which resolves identically because globals.css @theme exports it. **Primary-hover = indigo lightened (+0.25 L)**. Use for occupied cells + regular solid bars. |
| `--secondary` | `oklch(0.3012 0 0)` | `--secondary` in globals.css | `oklch(from var(--ds-secondary) l c h)` where `--ds-secondary: oklch(0.3012 0 0)` | Dark neutral. Used for ghost (previsto) bars at opacity 0.5. In production: `var(--secondary)`. Already available. |
| `--surface-hi` | `oklch(0.218 0 0)` | `--surface-hi` | `oklch(0.218 0 0)` | **Identical**. Used for available unit cells background. In production: `var(--surface-hi)`. [VERIFIED: globals.css line 106] |

**Summary for implementer:**
- Peak bar (gold): `background: var(--highlight)` + `boxShadow: "0 0 6px 0 var(--highlight)"`
- Normal solid bars + occupied cells: `background: var(--color-primary-hover)` (or equivalently `var(--primary-hover)` since globals.css @theme line 10 defines the CSS custom property `--color-primary-hover` and it is exported to `--primary-hover` via app.css design bundle — **but production page.js cannot use Tailwind's `@theme` token shorthand directly in inline styles; must use `var(--color-primary-hover)` or the computed OKLCH literal**)

**Recommendation:** Use `var(--color-primary-hover)` in inline styles for occupied/solid-bar color. This is the production-safe reference exported in @theme and used nowhere else yet.

**No missing tokens.** All four design tokens resolve in globals.css without additions.

---

## 2. Cash-Flow Aggregation Algorithm

### Step 1: Build the 6-month window array

```js
// Pure function — no Date.now() inside; pass today as argument for testability
function buildWindow(todayStr) {
  // todayStr = "YYYY-MM-DD" string (ISO date from server)
  const [y, m] = todayStr.split("-").map(Number)
  const months = []
  for (let delta = -3; delta <= 2; delta++) {
    let mm = m + delta
    let yy = y
    if (mm < 1)  { mm += 12; yy-- }
    if (mm > 12) { mm -= 12; yy++ }
    months.push({ key: `${yy}-${String(mm).padStart(2, "0")}`, label: SHORT_MONTHS[mm - 1] })
  }
  return months // length always 6
}
const SHORT_MONTHS = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"]
```

### Step 2: Month key format

`"YYYY-MM"` — e.g., `"2026-01"`. Extracted from a date string via `dateStr.slice(0, 7)`.

### Step 3: Date parsing pattern

The project parses display dates with `T00:00:00` suffix (see `src/lib/utils.js:14`). For month bucketing, no `Date` object is needed at all — slice the ISO date string directly:

```js
const monthKey = dateStr.slice(0, 7)   // "2026-03-15" → "2026-03"
```

No `new Date()` needed for bucketing; avoids UTC off-by-one entirely. Use `T12:00:00` only if arithmetic on the date is required (e.g., Phase 22 date math). For this phase, slicing is sufficient and safer. [ASSUMED — based on codebase pattern; T12:00:00 pattern documented in `.planning/research/PITFALLS.md:131` for date arithmetic, not needed here]

### Step 4: Derive value per parcela

```js
function getValorParcela(parcela, contratos, unidades) {
  const contrato = contratos.find(c => c.id === parcela.contrato_id)
  const unidade  = unidades.find(u => u.id === contrato?.unidade_id)
  return unidade?.valor_mensal ?? 0
}
```

This mirrors the existing dashboard pattern at `page.js:56-59`.

### Step 5: Bucket into recebido + previsto maps

```js
function bucketParcelas(parcelas, contratos, unidades, windowKeys) {
  const windowSet = new Set(windowKeys)
  const recebido = Object.fromEntries(windowKeys.map(k => [k, 0]))
  const previsto = Object.fromEntries(windowKeys.map(k => [k, 0]))

  for (const p of parcelas) {
    const valor = getValorParcela(p, contratos, unidades)
    // Previsto: all parcelas by data_vencimento
    const kv = p.data_vencimento?.slice(0, 7)
    if (kv && windowSet.has(kv)) previsto[kv] += valor
    // Recebido: only paga parcelas by data_pagamento
    if (p.status === "paga" && p.data_pagamento) {
      const kr = p.data_pagamento.slice(0, 7)
      if (windowSet.has(kr)) recebido[kr] += valor
    }
  }
  return { recebido, previsto }
}
```

### Step 6: Normalize to percentages

```js
function normalizeFluxo(windowMonths, recebido, previsto) {
  const maxVal = Math.max(...windowMonths.map(({ key: k }) => Math.max(recebido[k] ?? 0, previsto[k] ?? 0)), 1)
  const peakRecebido = Math.max(...windowMonths.map(({ key: k }) => recebido[k] ?? 0))

  return windowMonths.map(({ key, label }) => ({
    mes: label,
    key,
    recebido: Math.round(((recebido[key] ?? 0) / maxVal) * 100),
    previsto:  Math.round(((previsto[key]  ?? 0) / maxVal) * 100),
    peak: peakRecebido > 0 && (recebido[key] ?? 0) === peakRecebido,
  }))
}
```

### Step 7: Edge cases

- **No parcelas paga:** all `recebido` = 0 → all bars are ghost (previsto only). `peak` is `false` for all months (peakRecebido = 0 guard above). No bar renders as gold.
- **All recebido equal (tie):** first month matching `peakRecebido` gets `peak = true`. Acceptable for TCC.
- **No parcelas at all:** previsto also 0 → `maxVal` clamps to 1 → all heights = 0. Chart renders with 6 empty columns.
- **Month with no parcelas in window:** initialized to 0, renders as zero-height bar.

### Complete helper signature (suggested file: `src/lib/fluxo.js`)

```js
// src/lib/fluxo.js
// Pure functions — no imports, testable with plain objects

export function buildFluxoWindow(todayStr) { ... }
export function aggregateFluxo(parcelasFluxo, contratos, unidades, todayStr) {
  const windowMonths = buildFluxoWindow(todayStr)
  const windowKeys = windowMonths.map(m => m.key)
  const { recebido, previsto } = bucketParcelas(parcelasFluxo, contratos, unidades, windowKeys)
  return normalizeFluxo(windowMonths, recebido, previsto)
}
```

---

## 3. New Query Shape: `getParcelasFluxo()`

**Location:** `src/lib/queries-server.js` (additive, after existing functions)

**Which columns:**

```js
export async function getParcelasFluxo() {
  const supabase = await createServer()
  const { data } = await supabase
    .from('parcelas')
    .select('id, contrato_id, data_vencimento, data_pagamento, status')
    // No status filter — need ALL statuses (paga for recebido, all for previsto)
    // No date range filter — aggregateFluxo() filters to window client-side
    //   Rationale: dataset is small for a TCC; avoids complex date range SQL
    .order('data_vencimento', { ascending: true })
  return data ?? []
}
```

**Contract status filter:** ALL contracts (ativo + encerrado + cancelado) — the query hits `parcelas` directly, not `contratos`, so no join filter needed. The aggregation derives value via the already-loaded `contratos` list in page.js. Parcelas from encerrado/cancelado contracts still contribute to historical recebido.

**Date range filter:** None in SQL. The window filtering happens in `aggregateFluxo()` via `windowSet`. For a TCC dataset (tens to low hundreds of parcelas), a full table scan is acceptable and simpler.

**RLS:** Same as existing queries — `createServer()` uses anon key + Supabase Auth session for RLS evaluation. Existing RLS on `parcelas` table governs access (proprietário sees only their parcelas via contract ownership chain). [ASSUMED — RLS policy specifics not verified in this session; same pattern as `getParcelasByContratos` which works]

**Aggregation location:** Server-side in `page.js`, using `aggregateFluxo(parcelasFluxo, contratos, unidades, todayStr)`. No join inside Supabase select — derivation happens in JS from already-loaded lists.

---

## 4. Server Component Data Loading

**Current `Promise.all` in page.js:27-29:**

```js
;[unidades, contratos, locatarios, edificios] = await Promise.all([
  getUnidades(), getContratos(), getLocatarios(), getEdificios(),
])
// Then: parcelas = await getParcelasByContratos(contratosAtivosIds)
```

**Extended pattern:**

```js
let parcelasFluxo = []
;[unidades, contratos, locatarios, edificios, parcelasFluxo] = await Promise.all([
  getUnidades(), getContratos(), getLocatarios(), getEdificios(), getParcelasFluxo(),
])
// getParcelasByContratos stays sequential (needs contratosAtivosIds derived from contratos)
const contratosAtivosIds = contratos.filter(c => c.status === "ativo").map(c => c.id)
parcelas = await getParcelasByContratos(contratosAtivosIds)
```

**Today string for aggregation:**

```js
const todayStr = new Date().toISOString().slice(0, 10) // "2026-06-15"
const fluxoData = aggregateFluxo(parcelasFluxo, contratos, unidades, todayStr)
```

`aggregateFluxo` is imported from `@/lib/fluxo`. It runs synchronously in the Server Component, producing the array that `CashFlowChart` consumes.

---

## 5. OccupancyBar Port

**Canonical source:** `overview.jsx:48-55`

**Production JSX (inline styles, no Tailwind for new elements per convention):**

```jsx
function OccupancyBar({ alugadas, total }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 28,
            background: i < alugadas ? "var(--color-primary-hover)" : "var(--surface-hi)",
            border:     i < alugadas ? "none" : "1px solid var(--border-3)",
          }}
        />
      ))}
    </div>
  )
}
```

**Props sourced from page.js existing variables:**
- `alugadas` ← `alugadas` (line 50, already computed)
- `total` ← `unidades.length` (already in scope)

**Numeral display (from overview.jsx:233):**

```jsx
<div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
  <span className="r-metric" style={{ fontSize: 56 }}>{pctOcupacao}%</span>
  <span className="r-data" style={{ color: "var(--fg-4)" }}>{alugadas}/{unidades.length} unidades</span>
</div>
```

The `r-metric` class (globals.css:419) uses `--rt-metric: 40px` but the design overrides it to 56px inline — this is intentional per the canonical design (overview.jsx:233 `fontSize: 56`).

---

## 6. CashFlowChart Port

**Canonical source:** `overview.jsx:29-44`

**Production JSX:**

```jsx
function CashFlowChart({ fluxo, height = 132 }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height }}>
      {fluxo.map((f, i) => (
        <div
          key={f.key}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            height: "100%",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              flex: 1,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            {/* previsto ghost — behind solid */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                width: "62%",
                height: `${f.previsto}%`,
                background: "var(--secondary)",
                opacity: 0.5,
              }}
            />
            {/* recebido solid — in front */}
            <div
              style={{
                position: "relative",
                width: "62%",
                height: `${f.recebido}%`,
                background: f.peak ? "var(--highlight)" : "var(--color-primary-hover)",
                boxShadow: f.peak ? "0 0 6px 0 var(--highlight)" : "none",
                transformOrigin: "bottom",
                animation: `rGrow var(--dur-base) var(--ease-crisp)`,
                animationDelay: `${i * 60}ms`,
                animationFillMode: "none",  // safeguard per REFINO-05
              }}
            />
          </div>
          <span className="r-meta" style={{ fontSize: 9 }}>{f.mes}</span>
        </div>
      ))}
    </div>
  )
}
```

**Key rendering notes:**
- Ghost bar uses `position: absolute, bottom: 0` — the parent must be `position: relative` (it is: `position: "relative"` set on wrapper).
- Solid bar uses `position: relative` to stack in normal flow above the absolute ghost.
- Heights are `%` of the wrapper `flex: 1` area — bar container must have a fixed `height` prop to give the `%` reference.
- `animationFillMode: "none"` (no `both`) ensures content is visible if animation is paused — matches REFINO-05 pattern in globals.css:467-468.

**`rGrow` animation in globals.css (already defined at line 463):**

```css
@keyframes rGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
```

Note: `rGrow` in globals.css uses `scaleX` (horizontal grow from left), while `overview.jsx:38` uses the same name but assumes vertical bars. For vertical bars the correct animation should use `scaleY` with `transformOrigin: "bottom"`. However, the design file uses `rGrow` with no explicit axis — the bar in the design is vertical so it visually grows upward. **The existing `rGrow` keyframe (`scaleX`) will scale horizontally, not vertically.**

**Action required:** Add a `rGrowY` keyframe to globals.css for vertical bar grow:

```css
@keyframes rGrowY { from { transform: scaleY(0); } to { transform: scaleY(1); } }
```

Use `rGrowY` in the chart bars and keep `rGrow` unchanged (used elsewhere). `transformOrigin: "bottom"` must be set on the bar div.

**`prefers-reduced-motion` pattern:** `rGrow`/`rGrowY` are in-animations; globals.css line 467 already has `@media (prefers-reduced-motion: reduce) { .r-fade, .romma-page { animation: none; } }`. The chart bars use inline `animation:` style, not CSS classes. Add a wrapper class or use the `r-fade` parent to disable animations — the simplest approach: apply `@media (prefers-reduced-motion: reduce) { .chart-bar { animation: none !important; } }` to globals.css, where `.chart-bar` is a class added to each solid bar div.

---

## 7. Desktop + Mobile Dual Layout

### Desktop layout (Variant B — `romma-desktop-only`)

**Hero grid (overview.jsx:229):**

```jsx
<div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: "var(--rd-block-sm)", marginBottom: "var(--rd-block)" }}>
  {/* Left: OccupancyBar + divider + CashFlowChart */}
  <div className="r-panel" style={{ padding: "var(--rd-panel)" }}>
    {/* occupancy numeral + OccupancyBar */}
    {/* <hr divider> */}
    {/* CashFlowChart height={130} */}
  </div>
  {/* Right: stacked metrics (MRR, Receita Esperada, Vencendo em 7 dias) */}
  <div style={{ display: "flex", flexDirection: "column", gap: "var(--rd-block-sm)" }}>
    {/* MetricCell 02 + 03 in border grid */}
    {/* MetricCell 04 warn */}
  </div>
</div>
```

The existing 4-column metrics grid (`repeat(4, 1fr)`) at page.js:173 is **replaced** by this 2-column hero grid. Metric 01 (Ocupação) is now displayed as the big numeral inside the hero panel, not in the 4-cell grid.

### Mobile layout (`md:hidden`)

**Current mobile stats (page.js:328-356):** 2×2 grid of Ocupação, Contratos, MRR, Receita Esperada. **These are preserved** (D-11 keeps existing mobile stats).

**New mobile addition:** CashFlowChart at reduced height. Insert between the vencendo banner and contratos recentes:

```jsx
{/* Gráfico de fluxo — mobile */}
<div className="mx-5 mb-6">
  <span className="r-eyebrow indigo mb-[10px]">FLUXO · PREVISÃO 2026</span>
  <div className="r-panel" style={{ padding: "16px 14px" }}>
    <CashFlowChart fluxo={fluxoData} height={108} />
  </div>
</div>
```

Height: **108px** for mobile (same as canonical `overview.jsx:204`), vs **130px** desktop.

**OccupancyBar on mobile:** The design (overview.jsx mobile, lines 190-209) does NOT include OccupancyBar — only the 2×2 metric grid. Per D-11 "bloco de ocupação em destaque + métricas aparecem no mobile". Implement: add OccupancyBar under the 2×2 mobile metric grid with a reduced-height cell variant, or simply add it in a compact form between the metric grid and the vencendo banner. Suggested: add a small `<OccupancyBar>` block (height 20px cells) in mobile after the 2×2 stats, inside the `mx-5 mb-6` container.

---

## 8. rGrow Animation — Correction

**Existing in globals.css line 463:**
```css
@keyframes rGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
```

This is a **horizontal** scale. For vertical bars growing upward, a new keyframe `rGrowY` is needed:

```css
@keyframes rGrowY { from { transform: scaleY(0); } to { transform: scaleY(1); } }
```

**Usage on solid bar div:**
```js
animation: `rGrowY var(--dur-base) var(--ease-crisp)`,
animationDelay: `${i * 60}ms`,
transformOrigin: "bottom",
animationFillMode: "none",
```

**prefers-reduced-motion:** Add to globals.css:
```css
@media (prefers-reduced-motion: reduce) {
  .chart-bar { animation: none !important; }
}
@media print {
  .chart-bar { animation: none !important; }
}
```

Add `className="chart-bar"` to the solid bar `<div>`.

---

## 9. File Breakdown for Planner

| File | Action | What Changes |
|------|--------|-------------|
| `src/lib/queries-server.js` | **Modify** | Add `getParcelasFluxo()` function (5-8 lines) |
| `src/lib/fluxo.js` | **Create** | Pure aggregation helpers: `buildFluxoWindow`, `aggregateFluxo` |
| `src/app/globals.css` | **Modify** | Add `@keyframes rGrowY` + `.chart-bar` reduced-motion rule |
| `src/app/dashboard/page.js` | **Modify** | (1) Extend Promise.all; (2) Import `aggregateFluxo`; (3) Inline `OccupancyBar` + `CashFlowChart` components or extract as local function components at top of file; (4) Replace 4-col metric grid with Variant B hero layout (desktop); (5) Insert CashFlowChart mobile block; (6) Preserve all other sections verbatim |

**No new component files required.** `OccupancyBar` and `CashFlowChart` are small enough (< 30 lines each) to live as plain functions in page.js (Server Component file), matching the project's pattern of defining small helpers inline (e.g., `getInitials` at page.js:16).

---

## Architecture Patterns

### Recommended Project Structure (unchanged)

```
src/
├── app/dashboard/page.js    # Modified — Server Component, reorganized layout
├── lib/
│   ├── queries-server.js    # Modified — add getParcelasFluxo()
│   └── fluxo.js             # New — pure aggregation helpers
└── app/globals.css          # Modified — rGrowY keyframe + chart-bar class
```

### Pattern: Server Component with inline helpers

Existing page.js already defines `getInitials()` inline. `OccupancyBar` and `CashFlowChart` should follow the same pattern: plain JS functions above the `export default async function Dashboard()`.

```js
// src/app/dashboard/page.js (top of file, after imports)
function OccupancyBar({ alugadas, total }) { /* ... */ }
function CashFlowChart({ fluxo, height = 132 }) { /* ... */ }
```

This avoids creating unnecessary component files for what are essentially render helpers with no shared usage elsewhere (yet).

### Pattern: Pure aggregation in lib/fluxo.js

```js
// src/lib/fluxo.js — no 'server-only' guard needed (pure functions, no Supabase)
export function buildFluxoWindow(todayStr) { ... }
export function aggregateFluxo(parcelasFluxo, contratos, unidades, todayStr) { ... }
```

Testable with plain arrays — no mocking required.

### Anti-Patterns to Avoid

- **Adding `'use client'` to page.js:** D-09 locks this as Server Component. The chart is static HTML; no client state needed.
- **Calling `getParcelasFluxo()` after the parallel `Promise.all`:** Include it in the same `Promise.all` to avoid sequential waterfall.
- **Using `new Date(dateStr)` without suffix for month bucketing:** Use `.slice(0, 7)` directly on ISO strings. Avoids timezone issues.
- **Using existing `rGrow` for vertical bars:** It scales horizontally (`scaleX`). Must use new `rGrowY`.
- **Joining contratos/unidades inside the Supabase `getParcelasFluxo()` select:** Unnecessary complexity; the lists are already in scope in page.js.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS bar charts | Custom SVG or canvas | CSS `div` bars per design (D-08) | Design is already specified; div bars are production pattern for TCC |
| Date range filtering in SQL | Complex `.gte().lte()` on parcelas | JS window filter in `aggregateFluxo` | Small dataset; simpler; avoids SQL date serialization edge cases |
| Month label formatting | Custom locale lookup | Static `SHORT_MONTHS` array | Only 12 values, deterministic, no `Intl` dependency |

---

## Common Pitfalls

### Pitfall 1: `rGrow` scales horizontally, not vertically

**What goes wrong:** Using `animation: rGrow` on vertical bars produces a horizontal wipe, not an upward grow.
**Why it happens:** `globals.css` defines `rGrow` with `scaleX`, appropriate for the horizontal loading bar (rBar). The design file reuses the name loosely.
**How to avoid:** Add `rGrowY` keyframe. Use `transformOrigin: "bottom"` on bar div.
**Warning signs:** Bar appears to wipe left-to-right instead of growing upward.

### Pitfall 2: Ghost bar hidden behind solid bar due to z-index

**What goes wrong:** The ghost (previsto) bar, taller than the solid (recebido) bar, gets clipped by the solid bar's stacking context.
**Why it happens:** `position: relative` on the solid bar creates a stacking context that can obscure the `position: absolute` ghost.
**How to avoid:** Ghost is `position: absolute, bottom: 0` inside the relative container. Solid is `position: relative` but rendered **after** the ghost in DOM order. Since ghost is `absolute` and solid is in-flow `relative`, they stack correctly (ghost below, solid above). The ghost is wider (conceptually) but the `62%` width and `opacity: 0.5` make the visual layering work. Confirm: ghost renders first in JSX, solid second.
**Warning signs:** Ghost bar not visible at all when previsto > recebido.

### Pitfall 3: CashFlowChart bar heights all 0% when no `paga` parcelas exist

**What goes wrong:** `maxVal` = 0 causes division by zero → all heights NaN → bars render as 0%.
**Why it happens:** Normalization divides by max value; with no data, max is 0.
**How to avoid:** `Math.max(...values, 1)` clamps `maxVal` to minimum 1. Already specified in algorithm §2 Step 6.

### Pitfall 4: Metric 01 (Ocupação) duplicated in hero panel AND old 4-column grid

**What goes wrong:** Developer keeps the existing `metricas` array render AND adds the new hero block, showing Ocupação twice.
**Why it happens:** The old 4-col grid (page.js:173-186) renders all 4 metrics including Ocupação (idx "01").
**How to avoid:** Remove the 4-col metrics grid entirely. Metric 01 moves to the hero panel as the 56px numeral. Metrics 02/03/04 move to the stacked right column. The `metricas` array definition can be kept for reference or simplified.

### Pitfall 5: OccupancyBar with 0 total units causes zero-length array

**What goes wrong:** `Array.from({ length: 0 })` renders nothing — acceptable. But if `total` is undefined, `Array.from({ length: undefined })` throws.
**Why it happens:** Edge case when `unidades` is empty array.
**How to avoid:** Guard: `<OccupancyBar alugadas={alugadas} total={unidades.length ?? 0} />` — `unidades` is always an array (initialized as `[]` in page.js:22), so `unidades.length` is always a number. Additionally, the `isEmpty` check at page.js:67 returns early before reaching the new blocks, so `unidades.length === 0` implies `isEmpty === true` and the chart blocks are never rendered.

---

## State of the Art

| Old Approach (current page.js) | New Approach (Phase 21) | Impact |
|---|---|---|
| 4-column metrics grid (all 4 metrics equal weight) | Hero panel (Ocupação prominent at 56px) + stacked 3 metrics right | Variant B editorial layout per design |
| No cash-flow visualization | CSS div-bar chart with 6-month window | DASH-05 fulfilled |
| OccupancyBar not present (metric only) | Granular per-unit cells | DASH-04 fulfilled |
| `getParcelasByContratos` filters `pendente/vencida` only | New `getParcelasFluxo()` fetches all statuses | Enables recebido (paga) + previsto (all) |

---

## Validation Architecture

**nyquist_validation: true** (config.json, key present and not false).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright (E2E only) — `^1.60.0` |
| Config file | `playwright.config.js` (exists — Phase 15) |
| Quick run command | `npx playwright test --grep "dashboard"` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-04 | OccupancyBar renders cells equal to unidade count | E2E | `npx playwright test --grep "DASH-04"` | ❌ Wave 0 |
| DASH-04 | Numeral 56px % occupancy visible | E2E (visual) | `npx playwright test --grep "ocupacao"` | ❌ Wave 0 |
| DASH-05 | CashFlowChart renders 6 bars | E2E | `npx playwright test --grep "DASH-05"` | ❌ Wave 0 |
| DASH-05 | Peak month bar has gold color | Manual only (color assertion fragile in E2E) | — | Manual |
| DASH-06 | Quick actions navigate to correct routes | E2E | `npx playwright test --grep "quick-action"` | Partial — existing |
| `aggregateFluxo` | Buckets recebido/previsto correctly | Unit (pure function) | `node -e "require('./src/lib/fluxo.js')"` or Jest if added | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx playwright test --grep "dashboard" --reporter=dot`
- **Per wave merge:** `npx playwright test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/dashboard-editorial.spec.js` — covers DASH-04/05/06 E2E
- [ ] `src/lib/fluxo.test.js` (if Jest added) — unit tests for `aggregateFluxo`; alternatively, add integration coverage via E2E with seeded data

Note: `aggregateFluxo` is a pure function — the highest-value test. The project has no Jest setup; E2E with Playwright and known-state data (existing seed scripts) can cover the aggregation indirectly by asserting bar count and structure.

---

## Security Domain

Phase 21 is a read-only reorganization. No new write paths, no new auth boundaries, no new input surfaces.

| ASVS Category | Applies | Note |
|---|---|---|
| V2 Authentication | No | No auth change |
| V3 Session Management | No | No session change |
| V4 Access Control | Existing | `getParcelasFluxo()` uses same RLS as other queries (createServer anon key) |
| V5 Input Validation | No | No user input in this phase |
| V6 Cryptography | No | No crypto |

**No new security concerns.** The new Supabase query uses the same `createServer()` + anon key pattern as all other server queries.

---

## Environment Availability

| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| Node.js ≥20 | Next.js 16 | ✓ | Existing project runs |
| Supabase project (vfymttcajeyhrmsyhrtj) | getParcelasFluxo | ✓ | Active — used by all phases |
| Playwright | E2E tests | ✓ | ^1.60.0 installed (Phase 15) |

No missing dependencies.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | RLS on `parcelas` allows proprietário to read all their parcelas (including encerrado/cancelado contract chains) | §3 New Query | getParcelasFluxo() returns empty or partial data; cash-flow chart shows incorrect history |
| A2 | `T12:00:00` pattern not needed for month-key bucketing (slicing ISO string is sufficient) | §2 Step 3 | No risk — slicing is always correct for month key extraction; the suffix only matters for `new Date()` arithmetic |
| A3 | `var(--color-primary-hover)` resolves correctly in inline styles in Next.js 16 Server Component output | §1 Token Mapping | Occupied cells / solid bars render wrong color; fallback: use hardcoded OKLCH value |
| A4 | `aggregateFluxo` pure function is testable without Playwright E2E | §Validation | Only detectable at runtime; mitigation: manual verification of output in browser with seeded data |

---

## Open Questions

1. **Does RLS on `parcelas` include rows from `encerrado`/`cancelado` contracts?**
   - What we know: `getParcelasByContratos` fetches by explicit `contrato_id` list; RLS on parcelas is not directly inspected in this research session.
   - What's unclear: Whether the parcelas RLS policy is `parcela → contrato → proprietario_id` (would include all) or `parcela → contrato WHERE status = ativo` (would exclude historical).
   - Recommendation: In Wave 0, test `getParcelasFluxo()` immediately after creation with a Supabase query in the dashboard — if recebido months all show 0, the RLS is excluding paid parcelas from encerrado contracts. Mitigation: restrict `getParcelasFluxo` to contratos in `contratosIds` (all of them, not just ativos) — the list of all contrato ids is already available from `getContratos()`.

2. **Mobile OccupancyBar — exact size and placement**
   - What we know: D-11 says bloco de ocupação "aparece no mobile". Design mobile layout (overview.jsx:190-209) shows the 2×2 metric grid but no explicit `OccupancyBar` component there.
   - What's unclear: Cell height (28px is desktop; 20px mobile?), exact position relative to metric grid.
   - Recommendation: Render `OccupancyBar` with `height: 20` cells directly below the 2×2 mobile metric grid, inside `mx-5 mb-4` container. This is a planner/implementer call — mark as Claude's Discretion.

---

## Sources

### Primary (HIGH confidence — verified by reading production files)

- `src/app/dashboard/page.js` — full read; current implementation baseline
- `src/lib/queries-server.js` — full read; `getParcelasByContratos` pattern at line 53
- `src/app/globals.css` — full read; token definitions, `rGrow` keyframe at line 463, `--highlight` alias at line 415, `--color-primary-hover` at @theme line 10, `--surface-hi` at line 106, `--secondary` at line 61
- `.planning/design/js/overview.jsx` — full read; `CashFlowChart` (lines 29-44), `OccupancyBar` (lines 48-55), Variant B desktop layout (lines 213-260)
- `.planning/design/styles/app.css` — full read; token definitions matching globals.css
- `.planning/phases/21-dashboard-vis-o-geral-editorial/21-CONTEXT.md` — full read; locked decisions D-01 through D-11
- `src/lib/utils.js` — full read; `T00:00:00` date parse pattern confirmed at line 14
- `.planning/research/PITFALLS.md` — lines 131-134; `T12:00:00` pattern documented for arithmetic

### Secondary (MEDIUM confidence)

- `.planning/ROADMAP.md` Phase 21 section — success criteria confirmed
- `.planning/REQUIREMENTS.md` DASH-04/05/06 — requirement text confirmed

---

## Metadata

**Confidence breakdown:**

- Standard Stack: HIGH — no new packages; production code fully read
- Token mapping: HIGH — both CSS files fully read; values cross-verified
- Architecture: HIGH — design file fully read; patterns are direct ports
- Aggregation algorithm: HIGH — derived from locked decisions + codebase patterns
- RLS behavior of new query: LOW (A1) — not verified against Supabase policies in this session

**Research date:** 2026-06-15
**Valid until:** 2026-06-25 (stable stack; only risk is RLS policy verification)
