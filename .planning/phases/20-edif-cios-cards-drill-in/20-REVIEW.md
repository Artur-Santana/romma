---
phase: 20-edif-cios-cards-drill-in
reviewed: 2026-06-15T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/components/features/GestaoEdificios.js
  - src/components/ui/UnifiedUnidadeModal.js
  - e2e/crud-edificios.spec.js
findings:
  critical: 2
  warning: 4
  info: 2
  total: 8
status: issues_found
---

# Phase 20: Code Review Report

**Reviewed:** 2026-06-15
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Phase 20 restructures `GestaoEdificios` into a 2-column card grid with per-building stat aggregation, a proportional occupation bar, an accordion drill-in, and reuses `UnifiedUnidadeModal` with a new `lockEdificio` prop. The core layout and `lockEdificio` wiring are structurally sound. Two blockers require fixing before this ships: numeric type coercion in `computeStats` produces garbage MRR/area values when Supabase returns `numeric` columns as strings, and the create+upload split in `UnifiedUnidadeModal` can permanently orphan units in the database on photo-upload failure. Four warnings cover a missing delete-confirmation guard (diverges from established project pattern), a double-border rendering defect in the accordion, and two e2e test reliability gaps.

---

## Critical Issues

### CR-01: `computeStats` produces string-concatenation garbage for MRR and `areaTotal` when Supabase returns `numeric` columns as strings

**File:** `src/components/features/GestaoEdificios.js:29-33`

**Issue:** Postgres `numeric` columns (`area_m2`, `valor_mensal`) are returned by `@supabase/supabase-js` v2 as JavaScript strings, not numbers. The `reduce` accumulator starts at `0` (a number) and then adds a string, which JavaScript resolves via string concatenation rather than addition. With two units having `valor_mensal = "1500"` and `area_m2 = "20.5"`, `mrr` becomes `"01500"` and `areaTotal` becomes `"020.530"`. This corrupts the MRR and Área total cells in every stat row, and `fmtBRLk` will then call `"01500".toLocaleString()` — which fails at runtime because String has no `toLocaleString` that behaves like Number's. The rendered stat card will either show `NaN` or throw.

**Fix:** Parse both numeric fields inside `computeStats`:

```js
function computeStats(lista) {
  const total = lista.length
  const alugadas = lista.filter(u => u.status === "alugada").length
  const disponiveis = total - alugadas
  const ocupacaoPct = total > 0 ? Math.round((alugadas / total) * 100) : 0
  const mrr = lista
    .filter(u => u.status === "alugada")
    .reduce((s, u) => s + (parseFloat(u.valor_mensal) || 0), 0)
  const areaTotal = lista.reduce((s, u) => s + (parseFloat(u.area_m2) || 0), 0)
  return { total, alugadas, disponiveis, ocupacaoPct, mrr, areaTotal }
}
```

Alternatively (and more robustly), cast in `getUnidades` so the fix is applied once for the entire app:

```js
// queries-client.js getUnidades — map after fetch
return data?.map(u => ({
  ...u,
  area_m2: u.area_m2 != null ? parseFloat(u.area_m2) : null,
  valor_mensal: u.valor_mensal != null ? parseFloat(u.valor_mensal) : null,
})) ?? []
```

---

### CR-02: Unit permanently orphaned in database when photo upload fails after successful `criarUnidade`

**File:** `src/components/ui/UnifiedUnidadeModal.js:335-353`

**Issue:** In create mode the action proceeds in three steps: (1) `criarUnidade` inserts the unit row and returns its `id`; (2) if `fileToUpload` is set, the file is uploaded to Supabase Storage; (3) if the upload succeeds, `editarUnidade` patches `foto_url`. If step 2 fails (`uploadErr` is truthy), the function sets an error message and `return`s early. The unit created in step 1 now exists permanently in the database with no photo and no reference to it from the modal. The modal remains open and the user's next click of "Criar Unidade" calls `criarUnidade` again, creating a second orphan unit. There is no rollback or deduplication guard.

**Fix:** Either delete the orphaned unit on upload failure, or call `onSaved()` (without closing) after step 1 so the data layer reflects the new unit before the upload error is surfaced. The cleanest approach is a compensating delete:

```js
if (uploadErr) {
  // Roll back — delete the unit we just created so it does not orphan
  await deletarUnidade(unidadeId)
  setErro("Erro ao enviar foto. A unidade não foi criada.")
  return
}
```

Import `deletarUnidade` from `@/actions/unidades` at the top of the file.

---

## Warnings

### WR-01: Destructive "Remover" fires immediately with no confirmation dialog — diverges from project pattern

**File:** `src/components/features/GestaoEdificios.js:327-333`

**Issue:** Clicking "Remover" on a building card calls `handleDeletar(edificio.id)` directly (line 327). Deletion is irreversible. Every other destructive action in the codebase (`Unidades.js:84`, `Contratos.js:70`) uses a `confirmDialog` / `confirmDelete` state pattern with a modal confirmation step. `GestaoEdificios` is the only destructive surface that skips this guard. A misclick cannot be recovered from.

**Fix:** Follow the same pattern as `Unidades.js`:

```js
const [confirmDeleteId, setConfirmDeleteId] = useState(null)

// Replace the inline onClick:
onClick={() => setConfirmDeleteId(edificio.id)}

// Render a ConfirmDialog (or equivalent) driven by confirmDeleteId
```

---

### WR-02: Accordion top produces a visible 2px double border on the first unit row

**File:** `src/components/features/GestaoEdificios.js:403-411`

**Issue:** The accordion container `<div>` has `borderTop: "1px solid var(--border-3)"` (line 403). Every unit row inside it also unconditionally renders `borderTop: "1px solid var(--border-3)"` (line 411). For the first row this places two consecutive 1px borders with no gap — rendering as a visually thicker 2px line at the top of the accordion panel.

**Fix:** Remove `borderTop` from the outer accordion container and keep it only on the rows, which already provides the separator after the "Ver N unidades" button:

```js
// line 403 — remove borderTop from container
<div style={{ marginTop: 16 }}>
  {lista.map((u) => (
    <div
      key={u.id}
      // borderTop stays here — first row then creates the separator from the button above
      style={{ ..., borderTop: "1px solid var(--border-3)", ... }}
    >
```

---

### WR-03: `data-testid="unidade-row"` referenced in e2e tests but never set on the DOM element

**File:** `e2e/crud-edificios.spec.js:124,145,162` / `src/components/features/GestaoEdificios.js:404-420`

**Issue:** Three test locations use `page.locator('[data-testid="unidade-row"]')`. The accordion row `<div>` in `GestaoEdificios.js` (line 404) has no `data-testid` attribute. The tests fall through to fragile fallbacks that match on `/m²/` text — which also matches the "Área total" stat cell visible before accordion expansion (line 347: `` `${stats.areaTotal} m²` ``). When the fallback fires, the click lands on the stats row, not a unit row, and the modal never opens, causing the drill-in and lockEdificio tests to produce a false-negative pass or a visible false-positive failure depending on race conditions.

**Fix:** Add `data-testid="unidade-row"` to the accordion row element:

```js
// GestaoEdificios.js line 404
<div
  key={u.id}
  data-testid="unidade-row"
  onClick={() => setModalState({ unidade: u })}
  ...
>
```

---

### WR-04: `getByText('E2E-Edifício Alpha').locator('../..')` DOM traversal is structurally fragile

**File:** `e2e/crud-edificios.spec.js:48`

**Issue:** The edit test anchors to the building name `<p>` element and traverses two levels up (`../..`) assuming a fixed parent depth. In the current DOM the path is: card `<div>` > (else fragment) > "Card Header Row" `<div>` > name `<div>` > `<p>`. Two levels up from `<p>` reaches the name `<div>`, not the flex row containing the Editar button. The Editar button lives one level higher (in the Card Header Row flex div). Any inner-wrapper addition breaks this silently; the locator already targets the wrong ancestor for the buttons. If the test passes now it is because `getByRole('button', { name: 'Editar' })` searches descendants of the resolved ancestor broadly enough — but the traversal depth assumption is wrong and will break on any DOM restructure.

**Fix:** Use a `data-testid` on the card or the header row, or use `page.getByText('E2E-Edifício Alpha').locator('xpath=ancestor::div[@data-testid="edificio-card"]').getByRole('button', { name: 'Editar' })`. Add `data-testid="edificio-card"` to the card root `<div>` (line 256).

---

## Info

### IN-01: `unidadesPorEdificio` map rebuilt on every render without memoization

**File:** `src/components/features/GestaoEdificios.js:168-172`

**Issue:** The `reduce` that builds `unidadesPorEdificio` runs on every re-render (every keystroke in the inline edit inputs, every state update). At small scale this is unnoticeable. The comment "Derived map — computed inline before render" acknowledges the choice. No bug, but worth a `useMemo` if the building/unit count grows.

**Fix:** `const unidadesPorEdificio = useMemo(() => unidades.reduce(...), [unidades])`

---

### IN-02: `fmtBRLk` silently renders `"R$ undefined"` if passed a non-number

**File:** `src/components/features/GestaoEdificios.js:13-22`

**Issue:** `fmtBRLk` has no guard for `null`, `undefined`, or `NaN`. If CR-01 is fixed via `parseFloat`, `parseFloat(null)` returns `NaN` and `NaN >= 1000` is `false`, so execution falls to `NaN.toLocaleString("pt-BR")` which returns `"NaN"`, rendering as `"R$ NaN"` in the MRR cell. Once CR-01 is fixed the `|| 0` guard in `computeStats` ensures `mrr` is always a finite number, so the direct code path is safe — but the helper is not defensive on its own.

**Fix:** Add a null/NaN guard at the top:

```js
function fmtBRLk(v) {
  if (v == null || isNaN(v)) return "—"
  ...
}
```

---

_Reviewed: 2026-06-15_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
