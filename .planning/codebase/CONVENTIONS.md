# CONVENTIONS
_Last updated: 2026-05-21 | Focus: quality_

## Summary
Romma uses a Server/Client split pattern enforced by Next.js 16 App Router. Feature components are all Client Components (`"use client"`). Styling is primarily inline CSS custom properties — Tailwind is used only in auth pages. Several inconsistencies exist between older and newer files.

---

## Component Classification

**Server Components** (no directive): thin page shells only
- `src/app/dashboard/page.js`
- `src/app/dashboard/layout.js`
- `src/app/dashboard/contratos/[id]/page.js` (thin wrapper)

**Client Components** (`"use client"` first line): all feature components
- `src/components/features/*.js`
- All files using hooks, event handlers, or Supabase browser client

Pattern: page.js → imports one feature component → feature component owns all state/logic.

---

## Form State

Enforced rules (do not deviate):
- Single `useState` object, never per-field: `const [form, setForm] = useState({ ... })`
- Spread-update: `setForm({ ...form, key: value })`
- Reset via named function (two variants in codebase):
  - Factory-return: `const resetForm = () => ({ campo: '' })` → `setForm(resetForm())`
  - Setter-call: `const resetForm = () => setForm({ campo: '' })`

---

## Data Fetching

| Context | Pattern |
|---------|---------|
| Client | `useEffect` → `queries-client.js` functions |
| Server | direct `await` → `queries-server.js` functions (uses `'server-only'`) |
| After mutation | re-call query function directly (no cache invalidation layer) |
| Null safety | always `?? []` on array returns |

---

## Server Actions (`src/actions/`)

- Return `{ status: 200 }` or `{ status: 4xx|5xx, erroMessage: '...' }`
- **`erroMessage`** (not `errorMessage`) — established project spelling
- Auth guard pattern: local `authGuard()` function declared in each file
- UUID validated with `/^[0-9a-f]{8}-.../i` regex — redeclared per file (not shared)
- Mutations use `supabaseAdmin` (server-only, never import in client components)

---

## Styling

Primary approach: inline `style={}` + CSS custom properties
- CSS vars defined in `src/app/globals.css`: `--fg-1..5`, `--border-1..3`, `--surface`, `--indigo`, `--success`, `--warning`, `--danger`, `--font-mono/body/display`
- Utility CSS classes: `eyebrow eyebrow--indigo`, `romma-page`, `romma-desktop-only`, `romma-mobile-only`
- Button reset pattern: `style={{ all: "unset", cursor: "pointer", ... }}`

Tailwind: used only in `login/page.js` (not in feature components).

No shadcn/ui component imports in feature code. `cn()` used only in `login/page.js`.

---

## Naming Conventions

| Category | Pattern | Example |
|----------|---------|---------|
| Event handlers | `handle` prefix | `handleCriarContrato` |
| Query functions | `get` prefix | `getContratos` |
| Server Actions | Portuguese verb+noun | `criarUnidade`, `cancelarContrato` |
| Error state | `erro` (Portuguese) | `const [erro, setErro] = useState(null)` |
| Loading state | `loading` (English) | `const [loading, setLoading] = useState(false)` |
| Component files | PascalCase | `ContratosDesktop.js` |
| Action files | camelCase | `contratos.js` |
| Lib files | kebab-case | `queries-client.js` |

---

## Inconsistencies (do not replicate)

| Area | Canon | Exception |
|------|-------|-----------|
| Styling | Inline + CSS vars | `Locatarios.js` uses Tailwind classes |
| Quote style | Double `"` | `unidades.js`, `parcelas.js` use single `'` |
| Indentation | 2 spaces | `locatarios.js` uses 4 spaces |
| Auth guard | Local function | `gerarParcelas` inlines the check |
| Naming | Portuguese error vars | Some files mix `error`/`erro` |

Legacy components `Locatarios.js` and `Unidades.js` are unstyled (old design system) — do not follow their patterns.
