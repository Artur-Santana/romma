# Phase 14: Animações & Feedback - Pattern Map

**Mapped:** 2026-06-12
**Files analyzed:** 6 files to modify (+ 1 unreachable — see note)
**Analogs found:** 5 / 6 (from the files themselves; sonner/removingIds have no codebase precedent)

---

## File Classification

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `src/app/layout.js` | config/provider | request-response | itself + SpeedInsights import pattern (lines 1-2) | self-analog |
| `src/components/features/Contratos.js` | component | CRUD (UPDATE mutation) | itself — handlers lines 137–155, map lines 314–399 | self-analog |
| `src/components/features/Unidades.js` | component | CRUD (DELETE mutation) | itself — handler lines 83–92, map lines 283–297 | self-analog |
| `src/components/features/LocatariosDesktop.js` | component | CRUD (DELETE mutation) | itself — handler lines 91–99, map lines 133–200 | self-analog |
| `src/components/features/Locatarios.js` | component | CRUD (DELETE mutation) | itself — handler lines 66–71, map lines 112–168 | self-analog (see mount warning) |
| `src/components/features/Parcelas.js` | component | CRUD (UPDATE mutation) | itself — handler lines 49–57 | self-analog |

**Exit-animation variant assignment:**

| File | Variant | Reason |
|------|---------|--------|
| `Contratos.js` (cancelar, encerrar) | OPTIMISTIC FILTER — `setContratos(prev => prev.filter(...))`, NO re-fetch of contratos, DO re-fetch unidades | Server Action is `.update()` — row persists; `getContratos()` returns all statuses and would bring item back |
| `Unidades.js` | RE-FETCH AFTER TIMEOUT — `getUnidades()` inside `setTimeout(200)` | Server Action is `.delete()` — row gone from DB; re-fetch safe |
| `LocatariosDesktop.js` | RE-FETCH AFTER TIMEOUT — `getLocatarios()` inside `setTimeout(200)` | Server Action is `.delete()` — row gone from DB; re-fetch safe |
| `Locatarios.js` | RE-FETCH AFTER TIMEOUT — `getLocatarios()` inside `setTimeout(200)` | Same DELETE pattern |
| `Parcelas.js` | NO EXIT ANIMATION — item stays in list with new status | `marcarParcelaComoPaga` is UPDATE, not DELETE |

---

## Pattern Assignments

### `src/app/layout.js` (config, provider mount)

**Analog:** SpeedInsights import on line 2 of the same file — imported from an external package with `'use client'` internally, rendered as a child of `<body>` in a Server Component.

**Current state (lines 1–34):**
```javascript
import { Space_Grotesk, Hanken_Grotesk } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css";
// ...fonts + metadata...
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${HankenGrotesks.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

**IMPORTANT:** `SpeedInsights` is imported (line 2) but **not rendered** in the current file. The planner must add `<Toaster>` only — do not add `<SpeedInsights />` to the body (it is intentionally absent).

**Change — add import + render `<Toaster>` with full UI-SPEC props:**
```javascript
import { Toaster } from "sonner"

// inside <body>:
<body className="min-h-full flex flex-col">
  {children}
  <Toaster
    theme="dark"
    richColors
    position="bottom-right"
    mobileOffset={{ bottom: "80px" }}
    style={{
      "--normal-bg": "var(--surface)",
      "--normal-text": "var(--fg-1)",
      "--normal-border": "var(--border-2)",
      "--success-bg": "var(--surface)",
      "--success-text": "var(--fg-1)",
      "--success-border": "var(--success)",
      "--border-radius": "0px",
    }}
  />
</body>
```

`mobileOffset={{ bottom: "80px" }}` clears the MobileBottomNav (~62px) added in phase 13. `--border-radius: "0px"` matches the design system `--radius: 0`. Do NOT import `Toaster` in any feature component — single mount point only.

---

### `src/components/features/Contratos.js` (component, CRUD UPDATE — OPTIMISTIC FILTER variant)

**Analog:** The file itself. Existing handler pattern and map structure are the base.

**State to add (after line 69 `const [confirmDialog, setConfirmDialog] = useState(null)`):**
```javascript
const [removingIds, setRemovingIds] = useState(new Set())
```

**Import to add:**
```javascript
import { toast } from "sonner"
```

**Current `confirmarCancelamento` (lines 137–145) — replace entirely:**
```javascript
// CURRENT (lines 137–145):
async function confirmarCancelamento(contrato) {
  setConfirmDialog(null)
  const result = await cancelarContrato(contrato.id)
  if (result.status !== 200) { setErro(result.erroMessage); return }
  setErro(null)
  const [c, u] = await Promise.all([getContratos(), getUnidades()])
  setContratos(c ?? [])
  setUnidades(u ?? [])
}
```
```javascript
// NEW — OPTIMISTIC FILTER (do NOT re-fetch contratos; getContratos() returns all statuses):
async function confirmarCancelamento(contrato) {
  setConfirmDialog(null)
  setRemovingIds(prev => new Set([...prev, contrato.id]))  // start fade-out
  const result = await cancelarContrato(contrato.id)
  if (result.status !== 200) {
    setErro(result.erroMessage)
    setRemovingIds(prev => { const n = new Set(prev); n.delete(contrato.id); return n })  // rollback
    return
  }
  setErro(null)
  toast.success("Contrato cancelado")                      // immediate, does not wait for animation
  setTimeout(() => {
    setContratos(prev => prev.filter(c => c.id !== contrato.id))  // optimistic — NO getContratos()
    getUnidades().then(u => setUnidades(u ?? []))          // re-fetch unidades (status changed)
    setRemovingIds(prev => { const n = new Set(prev); n.delete(contrato.id); return n })
  }, 200)
}
```

**Current `confirmarEncerramento` (lines 147–155) — same transformation:**
```javascript
// CURRENT (lines 147–155):
async function confirmarEncerramento(contrato) {
  setConfirmDialog(null)
  const res = await encerrarContrato(contrato.id)
  if (res.status !== 200) { setErro(res.erroMessage); return }
  setErro(null)
  const [c, u] = await Promise.all([getContratos(), getUnidades()])
  setContratos(c ?? [])
  setUnidades(u ?? [])
}
```
```javascript
// NEW — identical structure as confirmarCancelamento, different action + message:
async function confirmarEncerramento(contrato) {
  setConfirmDialog(null)
  setRemovingIds(prev => new Set([...prev, contrato.id]))
  const result = await encerrarContrato(contrato.id)
  if (result.status !== 200) {
    setErro(result.erroMessage)
    setRemovingIds(prev => { const n = new Set(prev); n.delete(contrato.id); return n })
    return
  }
  setErro(null)
  toast.success("Contrato encerrado")
  setTimeout(() => {
    setContratos(prev => prev.filter(c => c.id !== contrato.id))
    getUnidades().then(u => setUnidades(u ?? []))
    setRemovingIds(prev => { const n = new Set(prev); n.delete(contrato.id); return n })
  }, 200)
}
```

**Current `handleCriarContrato` (lines 90–111) — add toast only, no animation:**
```javascript
// ADD after line 105 (after setShowForm(false)) inside the status === 200 branch:
toast.success("Contrato criado")
```

**Map — add conditional style to the existing `<div>` at line 323.**
The current row `<div>` already uses `style={COL_STYLE}` (line 325). Merge the removing style:
```javascript
// CURRENT (lines 322–327):
return (
  <div
    key={contrato.id}
    style={COL_STYLE}
    className={cn("grid items-center", i > 0 ? "border-t border-border-3" : "")}
  >
```
```javascript
// NEW — derive isRemoving, spread removingStyle into existing style:
const isRemoving = removingIds.has(contrato.id)
return (
  <div
    key={contrato.id}
    style={{
      ...COL_STYLE,
      opacity: isRemoving ? 0 : 1,
      transform: isRemoving ? "scale(0.97)" : "scale(1)",
      transition: "opacity 200ms ease, transform 200ms ease",
    }}
    className={cn("grid items-center", i > 0 ? "border-t border-border-3" : "")}
  >
```

**D-07 — filter contratos to `ativo` only:** The existing `contratos` state holds all statuses after re-fetch. With the optimistic-filter approach, cancelled/encerrado items are removed on action. For the initial load and reload, the CONTEXT decision D-07 requires displaying only `status === 'ativo'`. The cleanest place is a derived variable just before the map (consistent with the existing `ativos` / `encerrados` derivation pattern on line 157):
```javascript
// ADD before the map (existing derivations at line 157 for reference):
const contratosAtivos = contratos.filter(c => c.status === "ativo")
// Then change the map from: contratos.map((contrato, i) => {
// to:                        contratosAtivos.map((contrato, i) => {
```

---

### `src/components/features/Unidades.js` (component, CRUD DELETE — RE-FETCH AFTER TIMEOUT variant)

**Analog:** The file itself. Handler at lines 83–92, map at lines 283–297.

**CRITICAL — no wrapping div in current map.** Current map (lines 283–296) renders `<UnidadeCard>` directly with `key` on the component:
```javascript
// CURRENT (lines 283–296):
{unidades.map((unidade) => (
  <UnidadeCard
    key={unidade.id}
    unidade={unidade}
    // ...props
  />
))}
```
`UnidadeCard` is an opaque child component — the animation `style` cannot be injected into it. The fix is to wrap it with a `<div>` that owns the `key` and the animation style. `UnidadeCard` itself is unchanged:
```javascript
// NEW — wrapper div owns key + animation style; UnidadeCard untouched:
{unidades.map((unidade) => {
  const isRemoving = removingIds.has(unidade.id)
  return (
    <div
      key={unidade.id}
      style={{
        opacity: isRemoving ? 0 : 1,
        transform: isRemoving ? "scale(0.97)" : "scale(1)",
        transition: "opacity 200ms ease, transform 200ms ease",
      }}
    >
      <UnidadeCard
        unidade={unidade}
        editandoId={editandoId}
        formEdit={formEdit}
        onEditar={handleEditarUnidade}
        onSalvar={handleSalvarUnidade}
        onDeletar={handleDeletarUnidade}
        onFormChange={setFormEdit}
        onCancelar={() => { setEditandoId(null); resetFormEdit() }}
        erro={erroEdit}
      />
    </div>
  )
})}
```

**State to add (after existing `useState` declarations, e.g., after line 37):**
```javascript
const [removingIds, setRemovingIds] = useState(new Set())
```

**Import to add:**
```javascript
import { toast } from "sonner"
```

**Current `handleDeletarUnidade` (lines 83–92) — replace entirely:**
```javascript
// CURRENT (lines 83–92):
async function handleDeletarUnidade(id) {
  setErroDelete(null)
  setErroEdit(null)
  const result = await deletarUnidade(id);
  if (result.status === 200) {
    setUnidades(await getUnidades() ?? []);
  } else {
    setErroDelete(result.erroMessage)
  }
}
```
```javascript
// NEW — RE-FETCH AFTER TIMEOUT (delete removes row, re-fetch is safe):
async function handleDeletarUnidade(id) {
  setErroDelete(null)
  setErroEdit(null)
  setRemovingIds(prev => new Set([...prev, id]))           // start fade-out before await
  const result = await deletarUnidade(id)
  if (result.status !== 200) {
    setErroDelete(result.erroMessage)
    setRemovingIds(prev => { const n = new Set(prev); n.delete(id); return n })  // rollback
    return
  }
  toast.success("Unidade removida")                        // D-08 — message confirmed
  setTimeout(() => {
    getUnidades().then(u => setUnidades(u ?? []))           // re-fetch inside timeout
    setRemovingIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }, 200)
}
```

---

### `src/components/features/LocatariosDesktop.js` (component, CRUD DELETE — RE-FETCH AFTER TIMEOUT variant)

**Analog:** The file itself. Handler at lines 91–99, map at lines 133–200.

**State to add (after line 36 `const [loading, setLoading] = useState(false)`):**
```javascript
const [removingIds, setRemovingIds] = useState(new Set())
```

**Import to add:**
```javascript
import { toast } from "sonner"
```

**Current `handleRevogar` (lines 91–99) — replace entirely:**
```javascript
// CURRENT (lines 91–99):
async function handleRevogar(id) {
  setErro("")
  const { status, erroMessage } = await revogarConvite(id)
  if (status === 200) {
    setLocatarios(await getLocatarios() ?? [])
  } else {
    setErro(erroMessage ?? "Erro ao revogar convite.")
  }
}
```
```javascript
// NEW — RE-FETCH AFTER TIMEOUT:
async function handleRevogar(id) {
  setErro("")
  setRemovingIds(prev => new Set([...prev, id]))
  const { status, erroMessage } = await revogarConvite(id)
  if (status !== 200) {
    setErro(erroMessage ?? "Erro ao revogar convite.")
    setRemovingIds(prev => { const n = new Set(prev); n.delete(id); return n })  // rollback
    return
  }
  toast.success("Acesso revogado")
  setTimeout(() => {
    getLocatarios().then(l => setLocatarios(l ?? []))
    setRemovingIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }, 200)
}
```

**Map — add conditional style to the existing `<div>` at line 140.**
The current row div already has inline `style={{ display: "grid", gridTemplateColumns: GRID }}`:
```javascript
// CURRENT (line 140):
<div key={l.id} style={{ display: "grid", gridTemplateColumns: GRID }} className={cn("px-5 py-4 items-center", i > 0 ? "border-t border-border-3" : "")}>
```
```javascript
// NEW — merge animation style; derive isRemoving before or inside map:
const isRemoving = removingIds.has(l.id)
return (
  <div
    key={l.id}
    style={{
      display: "grid",
      gridTemplateColumns: GRID,
      opacity: isRemoving ? 0 : 1,
      transform: isRemoving ? "scale(0.97)" : "scale(1)",
      transition: "opacity 200ms ease, transform 200ms ease",
    }}
    className={cn("px-5 py-4 items-center", i > 0 ? "border-t border-border-3" : "")}
  >
```

---

### `src/components/features/Locatarios.js` (component, CRUD DELETE — RE-FETCH AFTER TIMEOUT variant)

**MOUNT WARNING:** `grep -rn "Locatarios" src/app` confirms this component is **not imported or mounted in any route**. `/dashboard/locatarios/page.js` mounts `LocatariosDesktop` only. This is a legacy mobile component. CONTEXT.md D-05 lists it for modification; modifications should be applied as specified, but the executor should be aware changes will have no visible effect until the component is routed.

**Analog:** The file itself. Handler at lines 66–71, map at lines 112–168.

**State to add (after line 19 `const [locatarios, setlocatarios] = useState([])`):**
```javascript
const [removingIds, setRemovingIds] = useState(new Set())
```
Note: existing state setter is `setlocatarios` (lowercase `l`) — preserve this spelling per CLAUDE.md "do not replicate inconsistencies but do not correct them either" (breaking the setter name would break the component).

**Import to add:**
```javascript
import { toast } from "sonner"
```

**Current `handleDeletarLocatario` (lines 66–71) — replace entirely:**
```javascript
// CURRENT (lines 66–71):
async function handleDeletarLocatario(id) {
  const { status } = await deletarLocatario(id);
  if (status === 200) {
    setlocatarios(await getLocatarios());
  }
}
```
```javascript
// NEW — RE-FETCH AFTER TIMEOUT:
async function handleDeletarLocatario(id) {
  setRemovingIds(prev => new Set([...prev, id]))
  const { status } = await deletarLocatario(id)
  if (status !== 200) {
    setRemovingIds(prev => { const n = new Set(prev); n.delete(id); return n })  // rollback
    return
  }
  toast.success("Acesso revogado")
  setTimeout(() => {
    getLocatarios().then(l => setlocatarios(l ?? []))      // preserve lowercase setter
    setRemovingIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }, 200)
}
```

**Map — add conditional style to the `<div key={locatario.id}>` at line 113:**
```javascript
// CURRENT (line 113):
<div key={locatario.id}>
```
```javascript
// NEW:
{locatarios.map((locatario) => {
  const isRemoving = removingIds.has(locatario.id)
  return (
    <div
      key={locatario.id}
      style={{
        opacity: isRemoving ? 0 : 1,
        transform: isRemoving ? "scale(0.97)" : "scale(1)",
        transition: "opacity 200ms ease, transform 200ms ease",
      }}
    >
      {/* existing content unchanged */}
```

---

### `src/components/features/Parcelas.js` (component, CRUD UPDATE — TOAST ONLY, no exit animation)

**Analog:** The file itself. Handler at lines 49–57.

**Import to add:**
```javascript
import { toast } from "sonner"
```

**Current `marcarComoPaga` (lines 49–57) — add one line only:**
```javascript
// CURRENT (lines 49–57):
async function marcarComoPaga(parcela) {
  const result = await marcarParcelaComoPaga(parcela.id)
  if (result.status === 200) {
    setErro(null)
    setParcelas(await getParcelasByContrato(contratoId))
  } else {
    setErro(result.erroMessage)
  }
}
```
```javascript
// NEW — add toast.success only; re-fetch is immediate (item stays in list, status changes):
async function marcarComoPaga(parcela) {
  const result = await marcarParcelaComoPaga(parcela.id)
  if (result.status === 200) {
    setErro(null)
    toast.success("Parcela marcada como paga")             // ADD this line
    setParcelas(await getParcelasByContrato(contratoId))
  } else {
    setErro(result.erroMessage)
  }
}
```

No `removingIds` state. No `setTimeout`. The parcela row changes status in place — it does not leave the list.

---

## Shared Patterns

### Conditional inline style merge (all components with exit animation)

**Source:** The existing `style={{}}` spread pattern already in `Contratos.js` line 325 (`style={COL_STYLE}`) and `LocatariosDesktop.js` line 140 (`style={{ display: "grid", gridTemplateColumns: GRID }}`). The animation style is merged into the existing object — not a second `style` prop.

**Apply to:** `Contratos.js` row div, `LocatariosDesktop.js` row div, `Locatarios.js` row div.

```javascript
// Derive before the JSX:
const isRemoving = removingIds.has(item.id)

// Merge into existing style object:
style={{
  ...existingStyleObj,                        // COL_STYLE or display:grid obj
  opacity: isRemoving ? 0 : 1,
  transform: isRemoving ? "scale(0.97)" : "scale(1)",
  transition: "opacity 200ms ease, transform 200ms ease",
}}
```

### Conditional expression pattern (existing codebase precedent)

**Source:** `Contratos.js` line 358 — `cn(..., expiring ? "text-warning" : "text-fg-3")`. Same ternary idiom applied to style values for the removing state.

### `removingIds` Set mutation rule (new — no codebase precedent)

Always create a new Set; never mutate in place:
```javascript
// ADD:
setRemovingIds(prev => new Set([...prev, id]))
// REMOVE:
setRemovingIds(prev => { const n = new Set(prev); n.delete(id); return n })
```
`prev.add(id); return prev` would not trigger re-render — always spread into a new Set.

### Server Action return shape (existing — all handlers)

**Source:** All existing handlers in the codebase. Toast fires only in the `status === 200` branch. Error uses `result.erroMessage` (Portuguese spelling — established project convention).

```javascript
if (result.status !== 200) {
  setErro(result.erroMessage)   // "erroMessage" not "errorMessage"
  // rollback removingIds here
  return
}
toast.success("message")        // only reached on success
```

---

## No Analog Found

| File / Pattern | Role | Reason |
|----------------|------|--------|
| `removingIds` Set state | state pattern | No existing component uses `Set` in `useState`. The `.romma-unit-out` keyframe in `globals.css` is an unrelated, pre-existing pattern explicitly not used here (UI-SPEC line 141). |
| `import { toast } from "sonner"` | external library call | `sonner` is not installed. No existing toast system. First use in the codebase. |
| `<Toaster>` in `layout.js` | provider mount | The only precedent (`SpeedInsights` import) is imported but **not rendered** in the current file. Pattern applies for the import approach; the render placement (inside `<body>`) is net-new. |

---

## Key Notes for Planner

1. **`Locatarios.js` is not mounted** — no route imports it. Apply changes as specified (D-05), but annotate in the plan that the changes have no visible effect until the component is wired to a route.

2. **Never re-fetch `getContratos()` after cancelar/encerrar** — `getContratos()` returns all statuses. Re-fetching after UPDATE would bring the item back with status='cancelado'. Use optimistic filter only: `setContratos(prev => prev.filter(c => c.id !== contrato.id))`.

3. **`Unidades.js` map requires a wrapper div** — `<UnidadeCard>` is an opaque component. The animation `style` must go on a wrapper `<div key={unidade.id}>` that owns the `key`. Move `key` from the component to the wrapper. `UnidadeCard.js` itself is not modified.

4. **Single `<Toaster>` mount** — in `layout.js` only. Feature components import only `{ toast }` (the function), never `{ Toaster }`.

5. **`SpeedInsights` is imported but not rendered** in current `layout.js` — do not start rendering it as a side effect of this change.

6. **`setlocatarios` lowercase** in `Locatarios.js` — existing inconsistency. Preserve as-is per CLAUDE.md guidelines.

---

## Metadata

**Analog search scope:** `src/app/`, `src/components/features/`, `src/components/ui/`
**Files read:** 7 (layout.js, Contratos.js, Unidades.js, LocatariosDesktop.js, Locatarios.js, Parcelas.js, UnidadeCard.js)
**Pattern extraction date:** 2026-06-12
