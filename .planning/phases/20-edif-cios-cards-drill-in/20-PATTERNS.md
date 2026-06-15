# Phase 20: Edifícios — Cards & Drill-in - Pattern Map

**Mapped:** 2026-06-15
**Files analyzed:** 2 (modified)
**Analogs found:** 2 / 2

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/features/GestaoEdificios.js` | component (feature) | CRUD + request-response | `src/components/features/Unidades.js` | exact — same role, same data flow, same modal integration |
| `src/components/ui/UnifiedUnidadeModal.js` | component (ui) | request-response | `src/components/ui/UnifiedUnidadeModal.js` (self — prop extension only) | self-extension — add `lockEdificio` to existing API |

---

## Pattern Assignments

### `src/components/features/GestaoEdificios.js` (feature component, CRUD + request-response)

**Analog:** `src/components/features/Unidades.js`

**Imports pattern** (lines 1–12 of GestaoEdificios.js, lines 1–12 of Unidades.js):

Current GestaoEdificios.js imports:
```javascript
"use client"

import { useEffect, useState } from "react";
import { criarEdificio, editarEdificio, deletarEdificio } from "@/actions/edificios";
import { getEdificios } from "@/lib/queries-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
```

**Add these imports** (from Unidades.js lines 6, 8):
```javascript
import { getEdificios, getUnidades } from "@/lib/queries-client"; // extend existing import
import UnifiedUnidadeModal from "@/components/ui/UnifiedUnidadeModal"; // new
```

---

**State shape to add** (new state beyond existing GestaoEdificios state):

Existing state (lines 28–36 of GestaoEdificios.js) — preserve all:
```javascript
const [edificios, setEdificios] = useState([]);
const [loadingInicial, setLoadingInicial] = useState(true);
const [showForm, setShowForm] = useState(false);
const [form, setForm] = useState({ nome: "", endereco: "" });
const [editandoId, setEditandoId] = useState(null);
const [formEdit, setFormEdit] = useState({ nome: "", endereco: "" });
const [loading, setLoading] = useState(false);
const [erro, setErro] = useState(null);
const [erroEdit, setErroEdit] = useState(null);
```

**New state to add** (mirrors Unidades.js line 75, accordion + modal patterns from RESEARCH.md):
```javascript
const [unidades, setUnidades] = useState([]);
// accordion: Set<string> of expanded edificio IDs — survives data reload
const [expandidos, setExpandidos] = useState(new Set());
// modal: null | { unidade: object } — opened from drill-in row click
const [modalState, setModalState] = useState(null);
```

---

**Promise.all data load pattern** (Unidades.js lines 91–112 — canonical):

Replace existing `carregarEdificios` (GestaoEdificios.js lines 42–44) and `useEffect` (lines 46–52) with:
```javascript
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

Replace every `carregarEdificios()` call in handlers (lines 62, 83, 94) with `carregarDados()`.

---

**MRR formatter** (Unidades.js lines 62–71 — copy verbatim, not exported):
```javascript
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

---

**Per-building stat derivation pattern** (Unidades.js lines 114–124 adapted for per-edificio grouping):
```javascript
// Derived map — computed inline before render, no useMemo needed (TCC dataset)
const unidadesPorEdificio = unidades.reduce((acc, u) => {
  if (!acc[u.edificio_id]) acc[u.edificio_id] = []
  acc[u.edificio_id].push(u)
  return acc
}, {})

// Call inside edificios.map:
function computeStats(lista) {
  const total = lista.length
  const alugadas = lista.filter(u => u.status === "alugada").length
  const disponiveis = total - alugadas
  const ocupacaoPct = total > 0 ? Math.round((alugadas / total) * 100) : 0
  const mrr = lista
    .filter(u => u.status === "alugada")
    .reduce((s, u) => s + (u.valor_mensal || 0), 0)
  const areaTotal = lista.reduce((s, u) => s + (u.area_m2 || 0), 0)
  return { total, alugadas, disponiveis, ocupacaoPct, mrr, areaTotal }
}
```

---

**Metrics cell pattern** (Unidades.js lines 199–251 — adapt for per-card stats row):

The 4-cell metrics bar pattern from Unidades.js:
```javascript
// Unidades.js lines 194-251: grid 4 cols, each cell has r-label + display value + r-meta sub-label
<div style={{
  display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
  border: "1px solid var(--border-3)",
  marginBottom: "var(--rd-block)",
}}>
  {[
    { l: "LABEL", v: "VALUE", s: "sub-label", gold: false },
    // ...
  ].map((m, i) => (
    <div key={m.l} style={{
      padding: "14px var(--rd-cell)",
      borderRight: i < 3 ? "1px solid var(--border-3)" : "none",
    }}>
      <div className="r-label" style={{
        fontSize: 9.5, marginBottom: 7,
        color: m.gold ? "var(--highlight)" : "var(--fg-4)",
      }}>
        {m.l}
      </div>
      <div style={{
        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26,
        letterSpacing: "-1px",
        color: m.gold ? "var(--highlight)" : "var(--fg-1)",
      }}>
        {m.v}
      </div>
      <div className="r-meta" style={{ marginTop: 4 }}>{m.s}</div>
    </div>
  ))}
</div>
```

For each EdificioCard, apply with `fontSize: 20` (per UI-SPEC) and stats: `[Nº Unidades, Ocupação %, MRR (gold), Área total]`.

---

**Card grid layout pattern** (Unidades.js lines 321–326):
```javascript
<div style={{
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", // 340px min per UI-SPEC
  gap: 16,  // 16px per UI-SPEC (md)
  alignItems: "start",
}}>
```

---

**Occupation bar pattern** (RESEARCH.md Pattern 2 — no existing analog, standard CSS flex):
```javascript
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
// Legenda below bar (r-meta, fg-4):
// `${alugadas} alugada${alugadas !== 1 ? "s" : ""} · ${disponiveis} disponível${disponiveis !== 1 ? "is" : ""}`
```

Colors: `var(--indigo)` = alugadas (occupied); `var(--border-3)` = disponíveis (available). No border-radius (`--radius: 0`). Height: 6px.

---

**Accordion toggle pattern** (RESEARCH.md Pattern 3 — no direct analog, Set state):
```javascript
function toggleExpandido(edificioId) {
  setExpandidos(prev => {
    const next = new Set(prev)
    next.has(edificioId) ? next.delete(edificioId) : next.add(edificioId)
    return next
  })
}

// In card render:
const listaDoEdificio = unidadesPorEdificio[edificio.id] ?? []
const isExpanded = expandidos.has(edificio.id)
const n = listaDoEdificio.length
// Button label:
`Ver ${n} unidade${n !== 1 ? "s" : ""}`
// Disabled when n === 0
```

Expand button style — mirror ghost button pattern from GestaoEdificios.js lines 224–237:
```javascript
<button
  onClick={() => toggleExpandido(edificio.id)}
  disabled={n === 0}
  style={{ all: "unset", cursor: n === 0 ? "not-allowed" : "pointer" }}
  className="font-mono text-[11px] text-fg-3 px-3 py-1.5 border border-indigo hover:text-fg-1"
  // opacity-40 when disabled
>
  {`Ver ${n} unidade${n !== 1 ? "s" : ""}`}
</button>
```

---

**Modal invocation pattern** (Unidades.js lines 360–368 — canonical):
```javascript
// Unidades.js lines 360-368:
{modal && (
  <UnifiedUnidadeModal
    mode={modal.mode}
    initial={modal.initial}
    edificios={listaEdificios}
    onClose={() => setModal(null)}
    onSaved={() => { carregarDados(); setModal(null) }}
  />
)}
```

**Phase 20 variant** — add `lockEdificio={true}`, keep accordion open (do NOT reset expandidos):
```javascript
{modalState && (
  <UnifiedUnidadeModal
    mode="edit"
    initial={modalState.unidade}
    edificios={edificios}
    lockEdificio={true}
    onClose={() => setModalState(null)}
    onSaved={() => { carregarDados(); setModalState(null) }}
  />
)}
// Note: expandidos state is NOT reset in onSaved — accordion stays open (Pitfall 2 avoidance)
```

---

**Skeleton pattern for 2-col card grid** (adapt from GestaoEdificios.js lines 12–25):

Current skeleton is a vertical list. Replace with:
```javascript
function SkeletonEdificios() {
  return (
    <div className="romma-page r-fade" style={{ padding: "var(--rd-page-y) var(--rd-gutter)", paddingBottom: 64 }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
        gap: 16,
        marginTop: 32,
      }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ border: "1px solid var(--border-3)", background: "var(--surface)", padding: 20 }}>
            <Skeleton className="h-5 w-1/3 rounded-none" />
            <Skeleton className="h-3 w-2/3 mt-2 rounded-none" />
            <Skeleton className="h-8 w-full mt-4 rounded-none" />
            <Skeleton className="h-1.5 w-full mt-4 rounded-none" />
            <Skeleton className="h-8 w-32 mt-4 rounded-none" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

**Error banner pattern** (GestaoEdificios.js lines 140–144 and 160–164 — keep verbatim):
```javascript
// Inside form (showForm context):
{erro && (
  <div className="bg-[var(--danger-bg2)] border-l-2 border-l-danger-fg px-4 py-3 font-mono text-[12px] text-danger-fg mb-4">
    {erro}
  </div>
)}

// Outside form (page-level, e.g. delete errors):
{erro && !showForm && (
  <div className="bg-[var(--danger-bg2)] border-l-2 border-l-danger-fg px-4 py-3 font-mono text-[13px] text-danger-fg mb-4">
    {erro}
  </div>
)}
```

---

**Existing CRUD handlers** (GestaoEdificios.js lines 54–98 — preserve exactly):

`handleCriar`, `handleEditar`, `handleSalvar`, `handleDeletar` — no changes. Only update the inner `carregarEdificios()` call sites to `carregarDados()`.

**Inline edit form inside card** (GestaoEdificios.js lines 175–215 — preserve exactly, reposition inside card boundary):

The `editandoId === edificio.id` branch replaces the card header row. The 2-field grid + erroEdit banner + Salvar/Cancelar buttons remain unchanged. They now render inside the card's `padding: 20px` container (no column spanning).

---

**Unit row (drill-in) pattern** — no direct analog; compose from existing button-reset pattern:

Clickable row pattern mirrors GestaoEdificios.js line 209 (`style={{ all: "unset", cursor: "pointer" }}`):
```javascript
// Each unit row inside expanded accordion
<div
  key={u.id}
  onClick={() => setModalState({ unidade: u })}
  style={{
    padding: "12px 16px",     // --rd-row-y / --rd-row-x per UI-SPEC
    cursor: "pointer",
    borderTop: "1px solid var(--border-3)",
    background: "transparent",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    transition: "background var(--dur-fast)",
  }}
  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hi)"}
  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
>
  <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--fg-1)" }}>
    {u.nome}
  </span>
  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
    {/* Status pill */}
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: "0.5px",
      textTransform: "uppercase", padding: "3px 7px",
      background: u.status === "alugada"
        ? "oklch(0.339 0.179 301.68 / 0.4)"
        : "oklch(0.696 0.17 162.5 / 0.15)",
      color: u.status === "alugada" ? "var(--fg-1)" : "var(--success)",
    }}>
      {u.status === "alugada" ? "Alugada" : "Disponível"}
    </span>
    {/* Area */}
    <span className="r-meta" style={{ color: "var(--fg-4)" }}>
      {u.area_m2 ? `${u.area_m2} m²` : "—"}
    </span>
  </div>
</div>
```

---

### `src/components/ui/UnifiedUnidadeModal.js` (ui component, request-response — prop extension)

**Analog:** Self (prop extension only — no structural change)

**Current signature** (line 272):
```javascript
export default function UnifiedUnidadeModal({ mode, initial, edificios, onClose, onSaved }) {
```

**New signature** — add `lockEdificio = false` with default:
```javascript
export default function UnifiedUnidadeModal({ mode, initial, edificios, onClose, onSaved, lockEdificio = false }) {
```

---

**FSelect component** (lines 40–67 — currently does NOT accept `disabled`):

Current:
```javascript
function FSelect({ value, onChange, children }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          all: "unset", boxSizing: "border-box", width: "100%",
          padding: "10px 34px 10px 12px", fontSize: 13,
          fontFamily: "var(--font-mono)", color: "var(--fg-1)",
          background: "var(--surface-hi)", cursor: "pointer",
          border: `1px solid ${focused ? "var(--primary)" : "var(--border-3)"}`,
          transition: "border-color var(--dur-fast)"
        }}
      >
        {children}
      </select>
      <span style={{
        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
        pointerEvents: "none", fontFamily: "var(--font-mono)", fontSize: 10,
        color: "var(--fg-4)"
      }}>▾</span>
    </div>
  )
}
```

**Change:** Add `disabled` prop and forward to `<select>` + adjust visual state:
```javascript
function FSelect({ value, onChange, children, disabled }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        style={{
          all: "unset", boxSizing: "border-box", width: "100%",
          padding: "10px 34px 10px 12px", fontSize: 13,
          fontFamily: "var(--font-mono)", color: "var(--fg-1)",
          background: "var(--surface-hi)",
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.5 : 1,
          border: `1px solid ${focused ? "var(--primary)" : "var(--border-3)"}`,
          transition: "border-color var(--dur-fast)"
        }}
      >
        {children}
      </select>
      <span style={{
        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
        pointerEvents: "none", fontFamily: "var(--font-mono)", fontSize: 10,
        color: "var(--fg-4)"
      }}>▾</span>
    </div>
  )
}
```

---

**Edifício FSelect field** (lines 431–439 — the only change inside the form body):

Current:
```javascript
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

**Change:** pass `disabled={lockEdificio}` and filter options when locked (D-08, Pitfall 3 avoidance):
```javascript
<FormField label="Edifício">
  <FSelect
    value={form.edificio_id}
    onChange={(e) => !lockEdificio && setForm({ ...form, edificio_id: e.target.value })}
    disabled={lockEdificio}
  >
    {(lockEdificio
      ? edificios.filter(ed => ed.id === form.edificio_id)
      : edificios
    ).map((ed) => (
      <option key={ed.id} value={ed.id}>{ed.nome}</option>
    ))}
  </FSelect>
</FormField>
```

All other fields (lines 1–271, 441–534) are unchanged.

---

## Shared Patterns

### Error Handling
**Source:** `src/components/features/GestaoEdificios.js` lines 140–144, 160–164
**Apply to:** GestaoEdificios.js (all mutation handlers)

Server Actions return `{ status: 200 }` or `{ status: 4xx|5xx, erroMessage: '...' }`. Check `result.status === 200` and set `setErro(result.erroMessage)` on failure. Pattern already in file — preserve unchanged.

### Button Reset Pattern
**Source:** `src/components/features/GestaoEdificios.js` lines 209–214
**Apply to:** All ghost/cancel buttons and drill-in row clickable areas

```javascript
style={{ all: "unset", cursor: "pointer" }}
```

### CSS Variable Usage
**Source:** `src/components/features/Unidades.js` (inline styles throughout)
**Apply to:** All new elements in GestaoEdificios.js

Inline styles using CSS vars: `var(--indigo)`, `var(--border-3)`, `var(--fg-1)`, `var(--fg-4)`, `var(--surface)`, `var(--surface-hi)`, `var(--highlight)`, `var(--danger-fg)`, `var(--danger-bg2)`, `var(--success)`. Classes `r-label`, `r-meta`, `r-section`, `eyebrow eyebrow--indigo` from globals.css.

### Page Layout Shell
**Source:** `src/components/features/Unidades.js` lines 164–169
**Apply to:** GestaoEdificios.js outer container

Replace current `className="romma-page p-12 bg-background min-h-full"` with:
```javascript
<div className="romma-page r-fade" style={{
  padding: "var(--rd-page-y) var(--rd-gutter)",
  paddingBottom: 64,
  minHeight: "100%",
}}>
```

### Null-safety on Array Returns
**Source:** Project convention (CLAUDE.md)
**Apply to:** Both `getEdificios()` and `getUnidades()` calls

Always `?? []` on array returns: `setEdificios(edificiosList ?? [])`, `setUnidades(unidadesList ?? [])`.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `OccupationBar` (local function) | ui primitive | render-only | No occupation/progress bar component exists in the codebase. Pattern from RESEARCH.md Pattern 2 (CSS flex proportion — standard technique). |
| Accordion `Set<string>` state | state pattern | event-driven | No accordion/expand pattern exists in codebase. Pattern from RESEARCH.md Pattern 3. |

---

## Key Pitfalls (from RESEARCH.md — implement defensively)

| Pitfall | Guard |
|---|---|
| Flex segment with count=0 leaving gap | Conditionally render each segment: `{alugadas > 0 && <div style={{ flex: alugadas }} />}` |
| Accordion collapses after `onSaved` | `expandidos` is separate state; `carregarDados()` only updates `edificios`/`unidades` — never touch `expandidos` in `carregarDados` |
| Modal shows wrong edificio when `lockEdificio=true` | Filter `edificios` to `form.edificio_id` only when locked |
| `getUnidades()` returns `undefined` | Always `?? []` — `setUnidades(unidadesList ?? [])` |
| 2-col grid breaks on mobile | `minmax(340px, 1fr)` collapses to 1-col naturally below ~720px |

---

## Metadata

**Analog search scope:** `src/components/features/`, `src/components/ui/`, `src/lib/`
**Files read:** GestaoEdificios.js (247 lines), UnifiedUnidadeModal.js (534 lines), Unidades.js (384 lines)
**Pattern extraction date:** 2026-06-15
