# Phase 17: Fundação — Tokens, Mobile/Modal Fixes & Infra - Pattern Map

**Mapped:** 2026-06-13
**Files analyzed:** 9 (5 modified, 1 new SQL, 1 new migration, plus globals.css and next.config)
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/globals.css` (token block + utilities) | config/utility | transform | `src/app/globals.css` lines 308–362 (existing utility classes) | exact — additive section |
| `src/components/ui/DashboardShell.js` | component (layout shell) | request-response | self (lines 45–49 — current `<main>` + inner `<div>`) | exact — 2-line inline style addition |
| `src/app/portal/layout.js` | config (layout shell) | request-response | self (line 13 — `<main className="flex-1 overflow-auto">`) | exact — 1 class addition |
| `src/components/features/UnidadesPublicas.js` | component (feature) | request-response | self (line 123 — `<div className="flex-1 overflow-auto">`) | exact — 1 class addition |
| `src/components/features/LocatariosDesktop.js` | component (feature) | CRUD | `src/components/ui/ConfirmDialog.js` line 23 (same backdrop pattern) | exact — class swap |
| `src/components/ui/ConfirmDialog.js` | component (ui) | event-driven | self (line 23 — inline backdrop) | exact — class swap |
| `next.config.mjs` | config | build | self (current 6-line file) | exact — additive `images` key |
| `supabase/migrations/20260601000000_v15_foundation.sql` | migration | CRUD | `supabase/migrations/20260518000000_proprietarios_rls.sql` (SECURITY DEFINER + policy pattern) + `supabase/migrations/20260521000000_multi_tenant_proprietario_id.sql` (ALTER TABLE ADD COLUMN IF NOT EXISTS) | role-match |

---

## Pattern Assignments

### `src/app/globals.css` — Token block + utility classes + animation retrofit

**Analog:** `src/app/globals.css` lines 36–131 (existing `:root` block) and lines 308–362 (existing utility section)

**Section delimiter pattern** (lines 36–39 and lines 95–96 — how existing sections are marked):
```css
/* ── Prototype tokens (00-css-foundation) ──────────────────────────────── */
/* comment describing what lives below */
```

**Existing `:root` structure to add into** (lines 36, 131 — open and close of block to extend):
```css
:root {
  /* ... existing tokens ... */
  --ease-crisp:    cubic-bezier(0.22, 1, 0.36, 1);  /* line 130 — already present */
}
```
The new token block goes as a NEW `:root { }` block AFTER the existing one (CSS custom properties cascade — multiple `:root` blocks are additive).

**New `:root` block to add** (pattern from `.planning/design/styles/app.css` lines 9–31, filtered per CONTEXT.md decisions):
```css
/* ── v1.5 Design Refinement Tokens ─────────────────────────────────────────
   Additive over Obsidian Blueprint. Zero regression on unreleased screens.
   Source: .planning/design/styles/app.css
   Decision: ONLY "regular" density. Compact/comfy: DEFERRED (REFINO-F1).
   ────────────────────────────────────────────────────────────────────────── */
:root {
  /* Type scale */
  --rt-metric:   40px;
  --rt-title:    32px;
  --rt-title-sm: 24px;
  --rt-section:  20px;
  --rt-subhead:  16px;
  --rt-body:     14px;
  --rt-data:     14px;
  --rt-label:    11px;
  --rt-meta:     10px;

  /* Density — Regular only (compact/comfy: DEFERRED REFINO-F1) */
  --rd-gutter:   32px;
  --rd-gutter-m: 20px;
  --rd-page-y:   28px;
  --rd-block:    24px;
  --rd-block-sm: 16px;
  --rd-panel:    20px;
  --rd-cell:     20px;
  --rd-row-y:    12px;
  --rd-row-x:    16px;

  /* Duration tokens — required by .r-* classes; defined in DS bundle, not app.css */
  --dur-base: 220ms;
  --dur-fast: 120ms;

  /* Font display alias — app.css uses --font-display; globals.css has --font-display-arch */
  --font-display: var(--font-display-arch);
}
```

**New utility classes to add** (pattern from `.planning/design/styles/app.css` lines 71–124, EXCLUDING: prototype reset block lines 57–68, `[data-density]` blocks lines 33–54, `[data-accent]` block line 90):
```css
/* ── v1.5 Type + Density helper classes ──────────────────────────────────── */
/* Source: .planning/design/styles/app.css lines 71-124 */
.r-metric  { font-family: var(--font-display); font-weight: 700; font-size: var(--rt-metric);  line-height: 1; letter-spacing: -2px;  color: var(--fg-1); margin: 0; }
.r-title   { font-family: var(--font-display); font-weight: 700; font-size: var(--rt-title);   line-height: 1; letter-spacing: -1.6px; color: var(--fg-1); margin: 0; }
.r-section { font-family: var(--font-display); font-weight: 700; font-size: var(--rt-section); line-height: 1.05; letter-spacing: -0.6px; color: var(--fg-1); margin: 0; }
.r-subhead { font-family: var(--font-body); font-weight: 600; font-size: var(--rt-subhead); line-height: 1.2; color: var(--fg-1); margin: 0; }
.r-body    { font-family: var(--font-body); font-weight: 400; font-size: var(--rt-body); line-height: 1.5; color: var(--fg-3); }
.r-data    { font-family: var(--font-mono); font-size: var(--rt-data); color: var(--fg-2); }
.r-label   { font-family: var(--font-mono); font-weight: 700; font-size: var(--rt-label); letter-spacing: 1px; text-transform: uppercase; color: var(--fg-4); }
.r-meta    { font-family: var(--font-mono); font-size: var(--rt-meta); letter-spacing: 0.5px; color: var(--fg-4); }
.r-eyebrow { font-family: var(--font-body); font-weight: 700; font-size: var(--rt-meta); letter-spacing: 1.5px; text-transform: uppercase; color: var(--fg-4); display: block; }
.r-eyebrow.indigo  { color: var(--indigo); }
.r-eyebrow.warning { color: var(--warning); }
.r-eyebrow.gold    { color: var(--highlight); }

.r-panel  { background: var(--surface); border: 1px solid var(--border-3); }
.r-divtop { border-top: 1px solid var(--border-3); }
.r-divrt  { border-right: 1px solid var(--border-3); }

/* Hover affordances */
.r-rowlink  { transition: background var(--dur-fast) var(--ease-crisp); cursor: pointer; }
.r-rowlink:hover { background: var(--surface-hi); }
.r-cell     { transition: background var(--dur-fast) var(--ease-crisp); cursor: pointer; }
.r-cell:hover    { background: var(--surface-hi); }
.r-ghostbtn { transition: color var(--dur-fast), border-color var(--dur-fast), background var(--dur-fast); cursor: pointer; }
.r-ghostbtn:hover { color: var(--fg-1); border-color: var(--fg-4); }

/* Scrollbars */
.r-scroll::-webkit-scrollbar       { width: 9px; height: 9px; }
.r-scroll::-webkit-scrollbar-track { background: var(--background); }
.r-scroll::-webkit-scrollbar-thumb { background: var(--border-3); }
.r-scroll::-webkit-scrollbar-thumb:hover { background: var(--fg-5); }
.r-noscroll::-webkit-scrollbar { display: none; }
.r-noscroll { scrollbar-width: none; }

/* Realtime dot */
.r-dot   { position: relative; width: 6px; height: 6px; display: inline-block; flex-shrink: 0; }
.r-dot i { position: absolute; inset: 0; background: var(--success); display: block; }
.r-dot i:last-child { animation: rPulse 2s var(--ease-crisp) infinite; }
```

**New keyframes to add** (pattern from `.planning/design/styles/app.css` lines 93–98):
```css
/* ── v1.5 Motion keyframes ────────────────────────────────────────────────── */
@keyframes rFade    { from { transform: translateY(8px); } to { transform: translateY(0); } }
@keyframes rPulse   { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.2; transform: scale(2); } }
@keyframes rUnitOut { to { opacity: 0; transform: translateX(40px); filter: blur(4px); } }
@keyframes rBar     { 0% { transform: translateX(-100%); } 100% { transform: translateX(260%); } }
@keyframes rSheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes rGrow    { from { transform: scaleX(0); } to { transform: scaleX(1); } }

.r-fade { animation: rFade var(--dur-base) var(--ease-crisp); }
@media (prefers-reduced-motion: reduce) { .r-fade, .romma-page { animation: none; } }
@media print { .r-fade, .romma-page { animation: none; } }
```

**Animation retrofit — modify existing line 350** (analog: existing `.romma-page` line 350 — bug confirmed):
```css
/* BEFORE (line 350 — bug: `both` applies opacity:0 as fill state): */
.romma-page { animation: rommaFadeIn 320ms var(--ease-crisp) both; }

/* AFTER (switch to transform-only rFade, remove fill-both): */
.romma-page { animation: rFade 320ms var(--ease-crisp); }
```

**Modal backdrop utility to add** (analog: `src/components/ui/ConfirmDialog.js` line 23 — current inline pattern):
```css
/* ── Modal backdrop utility ──────────────────────────────────────────────── */
/* Consolidates the repeated "fixed inset-0 z-50 bg-black/70 flex center" pattern */
/* Verified sources: LocatariosDesktop.js lines 240,337 + ConfirmDialog.js line 23 */
.romma-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: oklch(0 0 0 / 0.70);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

### `src/components/ui/DashboardShell.js` — Scroll fix

**Analog:** self — lines 45–49 (current `<main>` and inner `<div>` inline styles)

**Current pattern** (lines 45–49):
```jsx
<main style={{ flex: 1, overflow: "auto", background: "var(--background)" }}>
  <div style={{ maxWidth: "1570px", margin: "0 auto", padding: "0 24px" }}>
    {children}
  </div>
</main>
```

**Target pattern** (add `minHeight: 0` to both elements — inline style convention already used in this file):
```jsx
<main style={{ flex: 1, overflow: "auto", minHeight: 0, background: "var(--background)" }}>
  <div style={{ maxWidth: "1570px", margin: "0 auto", padding: "0 24px", minHeight: 0 }}>
    {children}
  </div>
</main>
```

**Inline style convention** (confirmed at line 31, 41, 45, 46 — this file uses inline `style={{}}` objects, not Tailwind classes):
```jsx
<div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>  {/* line 31 */}
<div style={{ display: "flex", flex: 1, overflow: "hidden" }}>              {/* line 41 */}
```

---

### `src/app/portal/layout.js` — Scroll fix

**Analog:** self — line 13 (current `<main>` className)

**Current pattern** (line 13):
```jsx
<main className="flex-1 overflow-auto">
```

**Target pattern** (Tailwind class convention already used in this file — add `min-h-0`):
```jsx
<main className="flex-1 overflow-auto min-h-0">
```

**File uses Tailwind classes** (confirmed lines 11, 13 — contrast with DashboardShell which uses inline styles; follow the convention of the file being modified):
```jsx
<div className="flex flex-col h-screen bg-background">  {/* line 11 */}
<main className="flex-1 overflow-auto">                  {/* line 13 */}
```

---

### `src/components/features/UnidadesPublicas.js` — Scroll fix

**Analog:** self — line 123 (current scrollable `<div>` className)

**Current pattern** (line 123):
```jsx
<div className="flex-1 overflow-auto">
```

**Target pattern** (Tailwind class convention — add `min-h-0`):
```jsx
<div className="flex-1 overflow-auto min-h-0">
```

---

### `src/components/features/LocatariosDesktop.js` — Modal backdrop retrofit

**Analog:** `src/components/ui/ConfirmDialog.js` line 23 (same inline pattern, same retrofit needed)

**Current pattern** (lines 240 and 337 — identical in both modal instances):
```jsx
<div
  className="fixed inset-0 z-50 bg-[oklch(0_0_0/0.7)] flex items-center justify-center"
  onClick={e => { if (e.target === e.currentTarget) handleCancelarEdit() }}
>
```

**Target pattern** (replace long Tailwind one-liner with utility class):
```jsx
<div
  className="romma-modal-backdrop"
  onClick={e => { if (e.target === e.currentTarget) handleCancelarEdit() }}
>
```

**Note:** The `onClick` prop stays unchanged — only the `className` changes. Apply to both occurrences (lines 240 and 337).

**Do NOT retrofit** `src/components/features/UnidadeDetailSheet.js` line 9 — it uses `items-end` (bottom sheet alignment), not `items-center`. That is a distinct pattern and must remain unchanged.

---

### `src/components/ui/ConfirmDialog.js` — Modal backdrop retrofit

**Analog:** self — line 23 (inline backdrop, same pattern being standardized)

**Current pattern** (line 23):
```jsx
<div
  onClick={onCancel}
  className="fixed inset-0 bg-[oklch(0_0_0/0.7)] flex items-center justify-content z-[100]"
>
```

**Target pattern** (replace with utility class; note: `z-[100]` is HIGHER than the utility's `z-index:50` — keep the override if ConfirmDialog needs to sit above LocatariosDesktop modals):
```jsx
<div
  onClick={onCancel}
  className="romma-modal-backdrop z-[100]"
>
```

The `z-[100]` Tailwind override stays because ConfirmDialog is used as a confirmation layer on top of other overlays. The utility provides position/background/flex; the override provides the z-index escalation.

---

### `next.config.mjs` — images.remotePatterns

**Analog:** self — current 6-line file

**Current pattern** (lines 1–7 — full file):
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
```

**Target pattern** (add `images.remotePatterns`; `search` key omitted intentionally — allows signed URL query params):
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vfymttcajeyhrmsyhrtj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
        // Omit `search` key → any query params (signed URL ?token=…) are allowed
      },
    ],
  },
};

export default nextConfig;
```

---

### `supabase/migrations/20260601000000_v15_foundation.sql` — New migration file

**Analog 1:** `supabase/migrations/20260521000000_multi_tenant_proprietario_id.sql` lines 13–18 (ALTER TABLE ADD COLUMN IF NOT EXISTS pattern)

**ALTER TABLE pattern** (lines 13–18 of analog):
```sql
ALTER TABLE public.edificios
  ADD COLUMN IF NOT EXISTS proprietario_id uuid REFERENCES auth.users(id);

ALTER TABLE public.locatarios
  ADD COLUMN IF NOT EXISTS proprietario_id uuid REFERENCES auth.users(id);
```

**Analog 2:** `supabase/migrations/20260518000000_proprietarios_rls.sql` lines 16–27 (SECURITY DEFINER function + REVOKE/GRANT pattern)

**SECURITY DEFINER function pattern** (lines 16–27 of analog):
```sql
CREATE OR REPLACE FUNCTION public.is_proprietario()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.proprietarios WHERE usuario_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_proprietario() FROM anon;
GRANT  EXECUTE ON FUNCTION public.is_proprietario() TO authenticated;
```

**RLS policy naming convention** (lines 49–54 of analog — `{table}_{operation}_{role}` pattern):
```sql
CREATE POLICY "edificios_insert_proprietario" ON public.edificios
  FOR INSERT TO authenticated WITH CHECK (public.is_proprietario());
CREATE POLICY "edificios_update_proprietario" ON public.edificios
  FOR UPDATE TO authenticated USING (public.is_proprietario());
```

**Analog 3:** `supabase/migrations/20260524000000_grant_table_privileges.sql` lines 5–13 (GRANT pattern at end of migration):
```sql
GRANT ALL ON public.edificios    TO service_role, authenticated;
GRANT SELECT ON public.edificios TO anon;
```

**Idempotency pattern** (from `20260521000000` and `20260518000000` — established conventions):
- `ALTER TABLE … ADD COLUMN IF NOT EXISTS` — always use `IF NOT EXISTS`
- `CREATE OR REPLACE FUNCTION` — always use `OR REPLACE`
- `CREATE POLICY` — must `DROP POLICY IF EXISTS` first, OR use unique names that don't exist yet
- `INSERT INTO storage.buckets … ON CONFLICT (id) DO NOTHING` — safe re-run

**Full migration file target structure** (apply all analog patterns above):
```sql
-- supabase/migrations/20260601000000_v15_foundation.sql
-- Phase 17 foundation: schema additions + Storage bucket + RLS

-- ── Schema additions ──────────────────────────────────────────────────────
ALTER TABLE public.proprietarios
  ADD COLUMN IF NOT EXISTS nome      TEXT,
  ADD COLUMN IF NOT EXISTS sobrenome TEXT,
  ADD COLUMN IF NOT EXISTS telefone  TEXT;

ALTER TABLE public.unidades
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- ── Storage bucket (private) ──────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('unidades-fotos', 'unidades-fotos', false)
ON CONFLICT (id) DO NOTHING;

-- ── RLS helper function ────────────────────────────────────────────────────
-- SECURITY DEFINER pattern from: 20260518000000_proprietarios_rls.sql lines 16-24
-- Joins storage path → unidade → edificio → proprietario_id; avoids recursive RLS.
-- File path convention: {unidade_id}/{filename}
-- storage.foldername(name)[1] = first path segment = unidade_id UUID
CREATE OR REPLACE FUNCTION public.storage_unidade_owned_by_auth(obj_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_unidade_id UUID;
  v_prop_id    UUID;
BEGIN
  v_unidade_id := (storage.foldername(obj_name))[1]::UUID;
  SELECT e.proprietario_id INTO v_prop_id
  FROM public.unidades u
  JOIN public.edificios e ON e.id = u.edificio_id
  WHERE u.id = v_unidade_id;
  RETURN v_prop_id = (SELECT auth.uid());
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;

-- REVOKE/GRANT pattern from: 20260518000000_proprietarios_rls.sql lines 26-27
REVOKE EXECUTE ON FUNCTION public.storage_unidade_owned_by_auth(TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION public.storage_unidade_owned_by_auth(TEXT) TO authenticated;

-- ── Storage RLS policies ───────────────────────────────────────────────────
-- Policy naming: {bucket_short}_{operation}_{role} (mirrors table policy convention)
-- Always qualify storage.objects.name to avoid column ambiguity (Pitfall 4)
CREATE POLICY "unidades_fotos_insert_proprietario"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'unidades-fotos'
  AND public.storage_unidade_owned_by_auth(storage.objects.name)
);

CREATE POLICY "unidades_fotos_select_proprietario"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'unidades-fotos'
  AND public.storage_unidade_owned_by_auth(storage.objects.name)
);

CREATE POLICY "unidades_fotos_delete_proprietario"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'unidades-fotos'
  AND public.storage_unidade_owned_by_auth(storage.objects.name)
);

-- ── Table grants ──────────────────────────────────────────────────────────
-- Pattern from: 20260524000000_grant_table_privileges.sql lines 5-11
GRANT ALL ON public.proprietarios TO service_role, authenticated;
GRANT ALL ON public.unidades      TO service_role, authenticated;
```

---

## Shared Patterns

### Inline Style vs Tailwind — Follow the File's Convention

**Critical:** This codebase has a split convention. Never mix within a file.

| File | Convention | Evidence |
|---|---|---|
| `DashboardShell.js` | Inline `style={{}}` objects | Lines 31, 41, 45, 46 |
| `portal/layout.js` | Tailwind classes | Lines 11, 13 |
| `UnidadesPublicas.js` | Tailwind classes | Lines 123+ |
| `LocatariosDesktop.js` | Tailwind classes | Lines 240, 337 |
| `ConfirmDialog.js` | Tailwind classes | Line 23 |

Therefore:
- DashboardShell scroll fix uses `minHeight: 0` (inline)
- All other scroll/modal fixes use `min-h-0` or class swap (Tailwind)

### CSS Section Delimiter Pattern

**Source:** `src/app/globals.css` lines 95–96, 36–39

All new CSS sections must open with a framed comment matching this style:
```css
/* ── Section name ──────────────────────────────────────────────────────────── */
```

### SECURITY DEFINER Function Pattern

**Source:** `supabase/migrations/20260518000000_proprietarios_rls.sql` lines 16–27

All helper functions that read tables with RLS enabled must use:
```sql
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
```
(or `plpgsql` for multi-statement functions with `SET search_path = public, storage`)

### Policy Naming Convention

**Source:** `supabase/migrations/20260518000000_proprietarios_rls.sql` lines 49–86

Pattern: `"{table}_{operation}_{role}"` — e.g., `"edificios_insert_proprietario"`, `"locatarios_delete_proprietario"`. For storage: `"unidades_fotos_insert_proprietario"`.

### `CREATE OR REPLACE` + `IF NOT EXISTS` Idempotency

**Source:** All migrations — established invariant

- Functions: always `CREATE OR REPLACE FUNCTION`
- Columns: always `ADD COLUMN IF NOT EXISTS`
- Bucket inserts: always `ON CONFLICT (id) DO NOTHING`
- Policies: `CREATE POLICY` will error if name exists — use unique names matching the project convention OR add `DROP POLICY IF EXISTS` guards

---

## No Analog Found

No files in this phase are without an analog. All patterns are grounded in existing codebase files.

| File | Closest Analog | Gap |
|---|---|---|
| `supabase/migrations/20260601000000_v15_foundation.sql` (storage RLS section) | `20260518000000_proprietarios_rls.sql` | Storage-specific: `storage.objects` table + `storage.foldername()` function are Supabase-managed; the SECURITY DEFINER function shape is identical but the join chain is new. RESEARCH.md SQL is authoritative for this section. |

---

## Metadata

**Analog search scope:** `src/app/`, `src/components/ui/`, `src/components/features/`, `supabase/migrations/`, `next.config.mjs`, `.planning/design/styles/`
**Files read:** 12
**Pattern extraction date:** 2026-06-13
