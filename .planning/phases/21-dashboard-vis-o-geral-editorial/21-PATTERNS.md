# Phase 21: Dashboard — Visão Geral Editorial - Pattern Map

**Mapped:** 2026-06-15
**Files analyzed:** 4
**Analogs found:** 4 / 4

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/dashboard/page.js` | Server Component (reorganize) | request-response, CRUD-read | itself (current file) | exact — reorganize, not rewrite |
| `src/lib/queries-server.js` | query layer (add function) | CRUD-read | itself — `getParcelasByContratos` (line 53) | exact role-match |
| `src/lib/fluxo.js` | pure utility (new file) | transform / batch | `src/lib/utils.js` (pure helpers, no imports) | role-match |
| `src/app/globals.css` | global styles (add keyframe) | — | itself — existing `@keyframes rGrow` (line 463) | exact |

---

## Pattern Assignments

### `src/app/dashboard/page.js` (Server Component, reorganize)

**Analog:** itself — the current production file is the base; Phase 21 reorganizes it in-place.

**Import block** (lines 1–12 of current file):
```js
import Link from "next/link"
import {
  getUnidades,
  getContratos,
  getLocatarios,
  getEdificios,
  getParcelasByContratos,
} from "@/lib/queries-server"
import { createServer } from "@/lib/supabase-server"
import { cn, fmtBRL, fmtData } from "@/lib/utils"
import StatusBadge from "@/components/ui/StatusBadge"
import RealtimeDot from "@/components/ui/RealtimeDot"
```

**Phase 21 addition — extend this import line:**
```js
import {
  getUnidades,
  getContratos,
  getLocatarios,
  getEdificios,
  getParcelasByContratos,
  getParcelasFluxo,           // NEW — add here
} from "@/lib/queries-server"
import { aggregateFluxo } from "@/lib/fluxo"  // NEW
```

**Inline helper pattern** (lines 16–19 — `getInitials`):
New `OccupancyBar` and `CashFlowChart` components must be declared as plain JS functions above `export default async function Dashboard()`, exactly as `getInitials` is now. They are NOT extracted to separate files.

```js
// Pattern: plain function above export default (no 'use client', no React import needed)
function getInitials(name) {
  if (!name) return "?"
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}
```

**New inline components to add above `export default`:**
```js
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

function CashFlowChart({ fluxo, height = 132 }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height }}>
      {fluxo.map((f, i) => (
        <div
          key={f.key}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}
        >
          <div style={{ position: "relative", width: "100%", flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            {/* previsto ghost — renders first in DOM so solid stacks on top */}
            <div style={{ position: "absolute", bottom: 0, width: "62%", height: `${f.previsto}%`, background: "var(--secondary)", opacity: 0.5 }} />
            {/* recebido solid */}
            <div
              className="chart-bar"
              style={{
                position: "relative",
                width: "62%",
                height: `${f.recebido}%`,
                background: f.peak ? "var(--highlight)" : "var(--color-primary-hover)",
                boxShadow: f.peak ? "0 0 6px 0 var(--highlight)" : "none",
                transformOrigin: "bottom",
                animation: `rGrowY var(--dur-base) var(--ease-crisp)`,
                animationDelay: `${i * 60}ms`,
                animationFillMode: "none",   // REQUIRED — REFINO-05: no opacity:0 fill
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

**Promise.all pattern** (lines 27–31 — current):
```js
;[unidades, contratos, locatarios, edificios] = await Promise.all([
  getUnidades(), getContratos(), getLocatarios(), getEdificios(),
])
const contratosAtivosIds = contratos.filter(c => c.status === "ativo").map(c => c.id)
parcelas = await getParcelasByContratos(contratosAtivosIds)
```

**Phase 21 replacement — add `parcelasFluxo` to same `Promise.all`:**
```js
let parcelasFluxo = []
;[unidades, contratos, locatarios, edificios, parcelasFluxo] = await Promise.all([
  getUnidades(), getContratos(), getLocatarios(), getEdificios(), getParcelasFluxo(),
])
const contratosAtivosIds = contratos.filter(c => c.status === "ativo").map(c => c.id)
parcelas = await getParcelasByContratos(contratosAtivosIds)

const todayStr = new Date().toISOString().slice(0, 10) // "2026-06-15"
const fluxoData = aggregateFluxo(parcelasFluxo, contratos, unidades, todayStr)
```

**Metrics derivation pattern** (lines 48–74 — preserve exactly, copy without change):
```js
const disponiveis = unidades.filter(u => u.status === "disponivel").length
const alugadas    = unidades.filter(u => u.status === "alugada").length
const ativos      = contratos.filter(c => c.status === "ativo").length
const mrr         = contratos
  .filter(c => c.status === "ativo")
  .reduce((sum, c) => sum + (unidades.find(u => u.id === c.unidade_id)?.valor_mensal ?? 0), 0)
const totalPendente = parcelas.reduce((s, p) => {
  const contrato = contratos.find(c => c.id === p.contrato_id)
  const unidade  = unidades.find(u => u.id === contrato?.unidade_id)
  return s + (unidade?.valor_mensal ?? 0)
}, 0)
const vencendoContratos = contratos.filter(c => {
  if (c.status !== "ativo") return false
  const diff = (new Date(c.data_fim) - new Date()) / MS_POR_DIA
  return diff >= 0 && diff <= 7
})
const pctOcupacao = unidades.length ? Math.round((alugadas / unidades.length) * 100) : 0
```

**Hero grid pattern** (from canonical `overview.jsx` lines 229–252, production-adapted):
```jsx
{/* Desktop — Hero grid: 1.55fr 1fr */}
<div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: "var(--rd-block-sm)" }} className="mb-12">
  {/* Left: OccupancyBar + divider + CashFlowChart */}
  <div className="bg-surface border border-border-3" style={{ padding: "var(--rd-panel)" }}>
    <div className="flex justify-between items-start mb-[18px]">
      <div>
        <span className="eyebrow eyebrow--indigo mb-2">Taxa de Ocupação</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span className="r-metric" style={{ fontSize: 56 }}>{pctOcupacao}%</span>
          <span className="r-data" style={{ color: "var(--fg-4)" }}>{alugadas}/{unidades.length} unidades</span>
        </div>
      </div>
      <div className="text-right">
        <span className="eyebrow mb-2">Disponíveis</span>
        <span className="r-metric" style={{ fontSize: 34, color: "var(--success)" }}>{disponiveis}</span>
      </div>
    </div>
    <OccupancyBar alugadas={alugadas} total={unidades.length} />
    <div style={{ height: 1, background: "var(--border-3)", margin: "20px 0 18px" }} />
    <div className="flex justify-between items-center mb-[14px]">
      <span className="eyebrow eyebrow--gold">Previsão de Fluxo · 2026</span>
    </div>
    <CashFlowChart fluxo={fluxoData} height={130} />
  </div>
  {/* Right: stacked metrics 02 + 03 + 04 */}
  <div style={{ display: "flex", flexDirection: "column", gap: "var(--rd-block-sm)" }}>
    <div className="border border-border-3" style={{ display: "grid", gridTemplateRows: "1fr 1fr" }}>
      {/* MetricCell 02 MRR — border-bottom separates from 03 */}
      <div className="border-b border-border-3 p-7 flex flex-col gap-2 relative">
        <span className="font-mono absolute top-4 right-4 text-[9px] text-fg-5">02</span>
        <div className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase">MRR</div>
        <div className="font-display font-bold text-[48px] leading-none tracking-[-2.4px] text-fg-1">
          {mrr >= 1000 ? `R$${(mrr/1000).toFixed(1)}k` : fmtBRL(mrr)}
        </div>
        <div className="font-mono text-[11px] text-fg-4">{ativos} contrato(s) ativo(s)</div>
      </div>
      {/* MetricCell 03 Receita Esperada */}
      <div className="p-7 flex flex-col gap-2 relative">
        <span className="font-mono absolute top-4 right-4 text-[9px] text-fg-5">03</span>
        <div className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase">Receita Esperada</div>
        <div className="font-display font-bold text-[48px] leading-none tracking-[-2.4px] text-fg-1">{fmtBRL(totalPendente)}</div>
        <div className="font-mono text-[11px] text-fg-4">{parcelas.length} parcela(s) em aberto</div>
      </div>
    </div>
    {/* MetricCell 04 Vencendo — separate box with warning background */}
    <div className="border border-border-3 bg-warning-bg p-7 flex flex-col gap-2 relative">
      <span className="font-mono absolute top-4 right-4 text-[9px] text-fg-5">04</span>
      <div className="font-mono text-[11px] text-warning tracking-[1px] uppercase">Vencendo em 7 dias</div>
      <div className="font-display font-bold text-[48px] leading-none tracking-[-2.4px] text-warning">{vencendoContratos.length}</div>
      <div className="font-mono text-[11px] text-warning">{vencendoContratos.length} contrato(s)</div>
    </div>
  </div>
</div>
```

**Mobile additions pattern** (insert after existing 2×2 stat rows, before vencendo banner):

Mobile OccupancyBar — add between 2×2 stats grid and vencendo banner (line ~356 of current file):
```jsx
{/* OccupancyBar mobile — compact, 20px cells */}
<div className="mx-5 mb-4">
  <OccupancyBar alugadas={alugadas} total={unidades.length} />
</div>
```

Mobile CashFlowChart — add after vencendo banner block (after line ~372, before contratos recentes at line 375):
```jsx
{/* Gráfico de fluxo — mobile */}
<div className="mx-5 mb-6">
  <span className="eyebrow eyebrow--indigo mb-[10px]">FLUXO · PREVISÃO 2026</span>
  <div className="bg-surface border border-border-3" style={{ padding: "16px 14px" }}>
    <CashFlowChart fluxo={fluxoData} height={108} />
  </div>
</div>
```

**Dual layout pattern** (current file, lines 155 / 325):
Every desktop section is inside `<div className="romma-desktop-only">` and the mobile equivalent is inside `<div className="flex flex-col md:hidden">`. New blocks must follow this exact split — OccupancyBar and CashFlowChart each need a desktop variant inside the `.romma-desktop-only` wrapper and a mobile variant inside the `md:hidden` wrapper.

**Empty-state guard** (lines 67, 76–147):
`isEmpty = edificios.length === 0` triggers a full early return. The new blocks (`OccupancyBar`, `CashFlowChart`) are never rendered in the empty state because the early return fires before reaching those sections. Do NOT add `isEmpty` guards inside the new components.

---

### `src/lib/queries-server.js` (query layer, CRUD-read — add function)

**Analog:** `getParcelasByContratos` (lines 53–62) — same table, same file, same `createServer()` call pattern.

**Existing pattern to copy from** (lines 53–62):
```js
export async function getParcelasByContratos(contratoIds) {
  if (!contratoIds?.length) return []
  const supabase = await createServer()
  const { data } = await supabase
    .from('parcelas')
    .select('id, contrato_id, numero, data_fechamento, data_vencimento, data_pagamento, status')
    .in('contrato_id', contratoIds)
    .in('status', ['pendente', 'vencida'])
  return data ?? []
}
```

**New function to add after line 62** — same structure, different columns and no filters:
```js
export async function getParcelasFluxo() {
  const supabase = await createServer()
  const { data } = await supabase
    .from('parcelas')
    .select('id, contrato_id, data_vencimento, data_pagamento, status')
    // No status filter — need ALL statuses (paga for recebido, all for previsto)
    // No date range filter — window filtering done in aggregateFluxo()
    .order('data_vencimento', { ascending: true })
  return data ?? []
}
```

**Key differences from analog:**
- No early-return guard (no input parameter)
- No `.in('contrato_id', ...)` filter (all contracts including encerrado/cancelado)
- No `.in('status', ...)` filter (all statuses needed)
- Fewer columns in SELECT (no `numero`, no `data_fechamento`)
- Returns `data ?? []` (same null-safety pattern)

**Import already present** (line 1–2): `'server-only'` guard and `createServer` are both at the top of the file; new function inherits them automatically.

---

### `src/lib/fluxo.js` (pure utility — new file)

**Analog:** `src/lib/utils.js` — pure functions, no framework imports, no `'server-only'` guard (pure data; no Supabase). The `fmtBRL` / `fmtData` functions in utils.js show the project's pattern for pure helpers: no class, just named exports.

**Pattern extracted from `src/lib/utils.js`:**
```js
// src/lib/utils.js — pure helpers, no 'server-only', no side effects
export function fmtBRL(valor) { ... }
export function fmtData(data) { ... }
```

**New file to create** — same pattern, pure exports, no imports:
```js
// src/lib/fluxo.js
// Pure functions — no imports, no side effects, testable with plain objects.
// No 'server-only' guard needed (pure math, no Supabase).

const SHORT_MONTHS = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"]

export function buildFluxoWindow(todayStr) {
  // todayStr = "YYYY-MM-DD" ISO date string from server
  const [y, m] = todayStr.split("-").map(Number)
  const months = []
  for (let delta = -3; delta <= 2; delta++) {
    let mm = m + delta
    let yy = y
    if (mm < 1)  { mm += 12; yy-- }
    if (mm > 12) { mm -= 12; yy++ }
    months.push({ key: `${yy}-${String(mm).padStart(2, "0")}`, label: SHORT_MONTHS[mm - 1] })
  }
  return months  // always exactly 6 entries
}

function getValorParcela(parcela, contratos, unidades) {
  const contrato = contratos.find(c => c.id === parcela.contrato_id)
  const unidade  = unidades.find(u => u.id === contrato?.unidade_id)
  return unidade?.valor_mensal ?? 0
}

function bucketParcelas(parcelas, contratos, unidades, windowKeys) {
  const windowSet = new Set(windowKeys)
  const recebido  = Object.fromEntries(windowKeys.map(k => [k, 0]))
  const previsto  = Object.fromEntries(windowKeys.map(k => [k, 0]))

  for (const p of parcelas) {
    const valor = getValorParcela(p, contratos, unidades)
    // Previsto: ALL parcelas bucketed by data_vencimento
    const kv = p.data_vencimento?.slice(0, 7)
    if (kv && windowSet.has(kv)) previsto[kv] += valor
    // Recebido: only paga parcelas bucketed by data_pagamento
    if (p.status === "paga" && p.data_pagamento) {
      const kr = p.data_pagamento.slice(0, 7)
      if (windowSet.has(kr)) recebido[kr] += valor
    }
  }
  return { recebido, previsto }
}

function normalizeFluxo(windowMonths, recebido, previsto) {
  const maxVal = Math.max(
    ...windowMonths.map(({ key: k }) => Math.max(recebido[k] ?? 0, previsto[k] ?? 0)),
    1  // clamp to 1 to avoid division by zero
  )
  const peakRecebido = Math.max(...windowMonths.map(({ key: k }) => recebido[k] ?? 0))

  return windowMonths.map(({ key, label }) => ({
    mes:      label,
    key,
    recebido: Math.round(((recebido[key] ?? 0) / maxVal) * 100),
    previsto:  Math.round(((previsto[key]  ?? 0) / maxVal) * 100),
    peak:     peakRecebido > 0 && (recebido[key] ?? 0) === peakRecebido,
  }))
}

export function aggregateFluxo(parcelasFluxo, contratos, unidades, todayStr) {
  const windowMonths = buildFluxoWindow(todayStr)
  const windowKeys   = windowMonths.map(m => m.key)
  const { recebido, previsto } = bucketParcelas(parcelasFluxo, contratos, unidades, windowKeys)
  return normalizeFluxo(windowMonths, recebido, previsto)
}
```

**Critical date-slicing pattern** (project convention from `src/lib/utils.js:14` and RESEARCH.md §2 Step 3):
Month key extraction must use `.slice(0, 7)` on the ISO string directly — do NOT use `new Date(dateStr)` for bucketing. This avoids UTC timezone off-by-one.
```js
const monthKey = dateStr.slice(0, 7)   // "2026-03-15" → "2026-03"
```

---

### `src/app/globals.css` (global styles — add keyframe + reduced-motion rule)

**Analog:** Existing `@keyframes rGrow` at line 463 and the `prefers-reduced-motion` block at lines 467–468.

**Existing keyframe pattern** (lines 457–463):
```css
/* ── v1.5 Motion keyframes ────────────────────────────────────────────────── */
@keyframes rFade    { from { transform: translateY(8px); } to { transform: translateY(0); } }
@keyframes rPulse   { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.2; transform: scale(2); } }
@keyframes rUnitOut { to { opacity: 0; transform: translateX(40px); filter: blur(4px); } }
@keyframes rBar     { 0% { transform: translateX(-100%); } 100% { transform: translateX(260%); } }
@keyframes rSheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes rGrow    { from { transform: scaleX(0); } to { transform: scaleX(1); } }
```

**Existing reduced-motion pattern** (lines 465–468):
```css
/* Entrance fade — base state is VISIBLE; animation plays in only (no fill:both) */
.r-fade { animation: rFade var(--dur-base) var(--ease-crisp); }
@media (prefers-reduced-motion: reduce) { .r-fade, .romma-page { animation: none; } }
@media print { .r-fade, .romma-page { animation: none; } }
```

**What to add** — append immediately after line 463 (`rGrow` line), before the comment on line 465:
```css
@keyframes rGrowY   { from { transform: scaleY(0); } to { transform: scaleY(1); } }
```

**What to add** — append after the existing `@media print` block (after line 468):
```css
/* Chart bar animations — vertical grow with reduced-motion + print guards */
@media (prefers-reduced-motion: reduce) { .chart-bar { animation: none !important; } }
@media print { .chart-bar { animation: none !important; } }
```

**Why `rGrowY` not `rGrow`:** `rGrow` uses `scaleX` (horizontal wipe — used for the rBar loading bar). Vertical bars need `scaleY` with `transformOrigin: "bottom"`. Using `rGrow` on vertical bars would produce a horizontal wipe, not an upward grow.

**Why `.chart-bar` class:** Chart bars use inline `animation:` styles, not CSS classes. The reduced-motion media query must target a class (`className="chart-bar"` on the solid bar `<div>`) to override inline styles. This matches how `.r-fade` / `.romma-page` are targeted for the page-level fade animation.

---

## Shared Patterns

### Server Component async pattern
**Source:** `src/app/dashboard/page.js` lines 21–38
**Apply to:** page.js (reorganization preserves this entirely)
```js
export default async function Dashboard() {
  let unidades = [], contratos = [], locatarios = [], edificios = [], parcelas = []
  let proprietarioNome = "—"
  let erro = null

  try {
    ;[unidades, contratos, locatarios, edificios] = await Promise.all([...])
    // sequential queries that depend on prior results go here
  } catch (e) {
    erro = e.message
  }

  if (erro) {
    return (
      <div className="p-12 text-danger-fg font-mono text-[13px]">
        Erro ao carregar dashboard. Tente novamente.
      </div>
    )
  }
  // ... render
}
```

### Supabase query function pattern
**Source:** `src/lib/queries-server.js` lines 4–8 (any function)
**Apply to:** new `getParcelasFluxo()` function
```js
export async function getXxx() {
  const supabase = await createServer()
  const { data } = await supabase
    .from('table')
    .select('col1, col2')
    // optional filters
  return data ?? []
}
```

### Null-safe array return
**Source:** `src/lib/queries-server.js` lines 7, 62, 80
**Apply to:** `getParcelasFluxo()` return
```js
return data ?? []
```

### Dual desktop/mobile layout split
**Source:** `src/app/dashboard/page.js` lines 155, 325
**Apply to:** both new blocks (OccupancyBar mobile, CashFlowChart mobile)
```jsx
<div className="romma-desktop-only">
  {/* desktop version */}
</div>
<div className="flex flex-col md:hidden">
  {/* mobile version */}
</div>
```

### Inline styles for new layout elements
**Source:** `src/app/dashboard/page.js` lines 173, 212, 297 — all use `style={{ display: "grid", ... }}`
**Apply to:** hero grid, stacked metrics column
All new layout elements follow the project pattern: `display: grid` and structural layout via inline `style={{}}`, semantic/color classes via `className`. Do NOT add new Tailwind utility classes for structural layout in new sections.

### Token color references in inline styles
**Source:** `src/app/dashboard/page.js` lines 165, 180, 351–353
**Apply to:** OccupancyBar cells, CashFlowChart bars
```js
// Inline style token references — always `var(--token-name)` strings
style={{ color: "var(--fg-4)" }}
style={{ background: "var(--surface-hi)" }}
style={{ border: "1px solid var(--border-3)" }}
// Phase 21 chart bars:
background: "var(--color-primary-hover)"   // solid bar (occupied cells, non-peak)
background: "var(--highlight)"             // peak bar (gold)
background: "var(--secondary)"             // ghost bar (previsto), opacity: 0.5
```

### Animation fill mode
**Source:** RESEARCH.md §6 (REFINO-05 contract), confirmed by existing `.r-fade` CSS (no `fill: both`)
**Apply to:** every solid bar `<div>` in `CashFlowChart`
```js
animationFillMode: "none"   // NOT "both" — content must be visible if animation is skipped
```

---

## Token Mapping (design → production)

| Design token (overview.jsx) | Production token (globals.css) | Usage |
|---|---|---|
| `var(--primary-hover)` | `var(--color-primary-hover)` | OccupancyBar alugadas cells; CashFlowChart solid bars |
| `var(--highlight)` | `var(--highlight)` | Peak bar gold color + glow |
| `var(--secondary)` | `var(--secondary)` | Ghost (previsto) bar, opacity 0.5 |
| `var(--surface-hi)` | `var(--surface-hi)` | OccupancyBar disponíveis cells |
| `var(--border-3)` | `var(--border-3)` | OccupancyBar cell borders, panel borders |

All four design tokens are already defined in `src/app/globals.css` — no new token additions needed.

---

## No Analog Found

None. All four files have direct analogs in the codebase.

---

## Critical Anti-Patterns (do not replicate)

| Anti-Pattern | Why Wrong | Correct Pattern |
|---|---|---|
| `animation: rGrow` on vertical bars | `rGrow` uses `scaleX` — horizontal wipe | `animation: rGrowY` + `transformOrigin: "bottom"` |
| `animationFillMode: "both"` | Hides bar if animation is paused (REFINO-05 violation) | `animationFillMode: "none"` |
| Adding `'use client'` to page.js | D-09 locks page as Server Component | No client boundary; chart is static HTML |
| Ghost bar after solid bar in JSX | Ghost (`position:absolute`) must render first so solid stacks on top | Ghost div first, solid div second in JSX |
| `new Date(dateStr)` for month key | UTC timezone off-by-one | `dateStr.slice(0, 7)` directly |
| `Math.max(...values) / 0` division | maxVal = 0 when no parcelas → NaN heights | `Math.max(...values, 1)` clamps to minimum 1 |
| Keeping the old 4-col metrics grid | Metric 01 (Ocupação) would appear twice | Remove 4-col grid entirely; Ocupação moves to hero panel as 56px numeral |
| Using `var(--primary-hover)` in inline styles | That alias is from design's `app.css` bundle, not guaranteed in production | Use `var(--color-primary-hover)` (defined at @theme in globals.css line 10) |

---

## Metadata

**Analog search scope:** `src/app/dashboard/`, `src/lib/`, `src/app/globals.css`, `.planning/design/js/`
**Files scanned:** 5 (page.js, queries-server.js, utils.js — implied, overview.jsx, globals.css)
**Pattern extraction date:** 2026-06-15
