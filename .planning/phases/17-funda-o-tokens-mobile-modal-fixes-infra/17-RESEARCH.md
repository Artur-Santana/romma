# Phase 17: Fundação — Tokens, Mobile/Modal Fixes & Infra - Research

**Researched:** 2026-06-13
**Domain:** CSS design tokens, Supabase Storage RLS, Next.js image config, mobile flex scroll, animation retrofits
**Confidence:** HIGH (CSS/scroll/animation verified in-codebase; Supabase Storage patterns cited from official docs + community; Next.js image config verified from official v16 docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Token names/values copied 1:1 from `.planning/design/styles/app.css`: `--rt-metric/title/title-sm/section/subhead/body/data/label/meta` + `--rd-gutter/gutter-m/page-y/block/block-sm/panel/cell/row-y/row-x`
- **Density: ONLY "Regular" (`:root` block).** Do NOT implement `[data-density="compact"]`, `[data-density="comfy"]`, toggle, or any code that assumes multiple densities exist. REFINO-F1 is deferred entirely.
- Place tokens in a clearly marked new section inside `src/app/globals.css` (additive, zero regression).
- Port `.r-*` helper classes (`.r-metric/.r-title/.r-section/.r-subhead/.r-body/.r-data/.r-label/.r-meta/.r-eyebrow`, `.r-panel/.r-divtop/.r-divrt`) + keyframes (`rFade` etc.) — screens consume directly.
- Migration via versioned SQL file in `supabase/migrations/` AND apply to remote hosted project now (demo must be live).
- `proprietarios.nome/sobrenome/telefone`: TEXT nullable (existing row stays null; Phase 18 populates on signup).
- `unidades.foto_url`: TEXT nullable.
- Bucket Storage `unidades-fotos`: PRIVATE + RLS policies by ownership chain (unidade → edificio → proprietario_id); display via signed URLs.
- `next.config.mjs`: add `images.remotePatterns` for `vfymttcajeyhrmsyhrtj.supabase.co`.
- Scroll fix applied to the 3 existing shells now: dashboard layout, portal layout, public listing — `min-height:0` chain + height on html/body/root; mobile bottom bar stays visible.
- Utility `romma-modal-backdrop` (fixed inset:0, centers in full-viewport on mobile) AND retrofit existing modals to use it.
- Retrofit existing entrance animations: base state VISIBLE, animation plays in only (no `fill: both`), `@media print` safeguard, `prefers-reduced-motion`. Pattern: `.r-fade` from handoff.
- `height:100%` + overflow management scoped to layout SHELLS (NOT global html/body) to avoid breaking static public pages.

### Claude's Discretion

- Exact px density values come from the handoff; fine adjustments if they conflict with existing layout are at discretion.
- Exact structure of bucket RLS policies.

### Deferred Ideas (OUT OF SCOPE)

- REFINO-F1: density variants compact/comfy + user toggle — deferred post-v1.5. Do NOT implement anything related in this phase.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REFINO-01 | CSS type scale (8 levels: metric 40 / title 32→24 mobile / section 20 / subhead 16 / body 14 / data-mono 14 / label-mono-caps 11 / meta-mono 10) via `--rt-*` tokens | Token values verified in `.planning/design/styles/app.css`; placement strategy mapped against existing `globals.css` |
| REFINO-02 | Density system via `--rd-*` tokens at "regular" level only | Values verified in `.planning/design/styles/app.css`; compact/comfy NOT implemented |
| REFINO-03 | Mobile scroll fixed in all scrollable areas (`min-height:0` chain + height in shells) | Shell components identified; exact `min-height:0` pattern and current DashboardShell structure verified in-codebase |
| REFINO-04 | Modals center in full viewport on mobile (`position:fixed; inset:0`) | Existing modal implementations inventoried; `romma-modal-backdrop` utility pattern defined |
| REFINO-05 | Entrance animations with visible base state (no `opacity:0` fill-both), `prefers-reduced-motion`, `@media print` safeguard | Existing `romma-page` + `rommaFadeIn` animation identified; exact fix pattern documented |
</phase_requirements>

---

## Summary

Phase 17 is a pure infrastructure/foundation phase — it touches CSS, SQL migrations, and config but builds no new screens. Every deliverable it produces is additive over the current Obsidian Blueprint `globals.css` and existing schema, meaning zero visual regression in the screens not yet refactored (Phases 18-25 will apply the tokens).

The five deliverable areas are tightly scoped and largely independent: (1) CSS token block in `globals.css`, (2) SQL migration for two `ALTER TABLE` + `INSERT INTO storage.buckets` + RLS policies, (3) `next.config.mjs` `images.remotePatterns`, (4) mobile scroll + modal CSS + utility class, (5) animation retrofits on `.romma-page`. The only non-trivial design decision is the Storage RLS ownership chain, where the correct pattern (SECURITY DEFINER function + `storage.foldername()` extraction) is well-established in Supabase community practice.

The most important constraint: the `app.css` design file references `--dur-base` and `--dur-fast` but does NOT define them — they live in the design system bundle (`_ds/*/tokens/animations.css`) which is NOT ported to the repo. These tokens must be defined in `globals.css` alongside the `--rt-*`/`--rd-*` block for the `.r-*` helper classes to work. Reasonable values are `--dur-base: 220ms` and `--dur-fast: 120ms` (matching the prototype's feel — current `romma-page` uses `320ms`). `--neutral` is also referenced in `app.css` but already maps to `--background` (`oklch(0.2393 0 0)`) which exists in `:root`.

**Primary recommendation:** Write the migration SQL first (idempotent, safe to run on hosted remote), then inject the CSS token block as a clearly delimited additive section, then fix the shells and animations. No new npm packages required.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Type + density tokens | Frontend (CSS) | — | Pure CSS custom properties; consumed at render time |
| Mobile scroll fix | Frontend (CSS + layout shells) | — | `min-height:0` is a CSS constraint on flex containers; shells are Client Components |
| Modal centering utility | Frontend (CSS utility class) | — | `position:fixed` contexts are browser-enforced; no server involvement |
| Animation retrofit | Frontend (CSS) | — | `@keyframes` + `animation` property; `prefers-reduced-motion` is a browser media query |
| Schema migration (`proprietarios`, `unidades`) | Database | — | Additive `ALTER TABLE … ADD COLUMN IF NOT EXISTS`; no application code changes until Phases 18/19 |
| Storage bucket + RLS | Database (Supabase Storage) | Backend (signed URL generation) | Bucket creation + RLS is PostgreSQL-side; signed URL generation is server-action code using `supabaseAdmin` |
| `images.remotePatterns` | Build config | — | Statically parsed by Next.js at build time; no runtime logic |

---

## Standard Stack

### Core

No new npm packages required for this phase. All work is within the existing stack.

| Concern | Mechanism | Where |
|---------|-----------|-------|
| CSS tokens | CSS custom properties in `globals.css` | `src/app/globals.css` |
| DB migration | SQL file in `supabase/migrations/` | `supabase/migrations/20260601000000_v15_foundation.sql` |
| Image config | `next.config.mjs` `images.remotePatterns` | `next.config.mjs` |
| Signed URLs | `supabaseAdmin.storage.from('unidades-fotos').createSignedUrl(path, expiresIn)` | Server Actions |
| Storage upload | `supabase.storage.from('unidades-fotos').upload(path, file)` | Client component (Phase 19) |

### Package Legitimacy Audit

No external packages are installed in this phase. No audit required.

---

## Architecture Patterns

### System Architecture Diagram

```
globals.css (additive token block)
  └── --rt-* type tokens   → consumed by .r-* helper classes → Phases 18-25 screens
  └── --rd-* density tokens → consumed by .r-* helper classes → Phases 18-25 screens
  └── --dur-base / --dur-fast → consumed by .r-* animation classes
  └── romma-modal-backdrop utility → retrofitted modals (LocatariosDesktop, ConfirmDialog, Contratos)
  └── .r-fade class → replaces .romma-page animation declaration

Layout shells (CSS-only scroll fix)
  DashboardShell.js:
    div[height:100vh, flex-col]          ← outer shell, already correct
      TopStrip/MobileTopBar              ← fixed height, shrinks
      div[flex:1, overflow:hidden]       ← content row, flex-row
        OwnerSidebar                     ← fixed width
        main[flex:1, overflow:auto]      ← scrollable region — ADD min-height:0
          div[maxWidth, margin, padding] ← content wrapper — ADD min-height:0
      MobileBottomNav                    ← fixed height, shrinks

  PortalLayout.js:
    div[flex-col, h-screen]
      TopStrip                           ← fixed height
      main[flex:1, overflow:auto]        ← ADD min-height:0

  UnidadesPublicas.js (feature component, not a layout.js):
    div.bg-background.h-dvh.flex.flex-col  ← outer
      header (filters/tabs)               ← fixed height
      div.flex-1.overflow-auto            ← scrollable — ADD min-height:0

supabase/migrations/20260601000000_v15_foundation.sql
  ├── ALTER TABLE proprietarios ADD COLUMN IF NOT EXISTS nome TEXT
  ├── ALTER TABLE proprietarios ADD COLUMN IF NOT EXISTS sobrenome TEXT
  ├── ALTER TABLE proprietarios ADD COLUMN IF NOT EXISTS telefone TEXT
  ├── ALTER TABLE unidades ADD COLUMN IF NOT EXISTS foto_url TEXT
  ├── INSERT INTO storage.buckets (id, name, public) VALUES ('unidades-fotos', 'unidades-fotos', false) ON CONFLICT (id) DO NOTHING
  ├── CREATE OR REPLACE FUNCTION storage_private.unidade_belongs_to_proprietario(path_name text)
  │     → SECURITY DEFINER: joins storage path segment → unidade → edificio → proprietario_id → auth.uid()
  └── RLS policies on storage.objects for bucket 'unidades-fotos':
        INSERT / SELECT / DELETE for authenticated users via the helper function

next.config.mjs
  images.remotePatterns → { protocol: 'https', hostname: 'vfymttcajeyhrmsyhrtj.supabase.co', pathname: '/storage/v1/object/**' }
  (object format without `search` key = any query params allowed → covers signed URL tokens)
```

### Recommended File Touches

```
src/app/globals.css                          (additive token block + .r-* classes + .romma-modal-backdrop)
src/app/dashboard/layout.js                 (no change — DashboardShell owns layout)
src/components/ui/DashboardShell.js          (add min-height:0 to main and inner wrapper)
src/app/portal/layout.js                    (add min-height:0 to main)
src/components/features/UnidadesPublicas.js  (add min-height:0 to scrollable div)
src/components/features/LocatariosDesktop.js (retrofit modals to romma-modal-backdrop)
src/components/ui/ConfirmDialog.js           (retrofit to romma-modal-backdrop)
next.config.mjs                             (images.remotePatterns)
supabase/migrations/20260601000000_v15_foundation.sql  (new file)
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Storage access control | Custom auth middleware or URL tokens | Supabase RLS on `storage.objects` | RLS is atomic, server-enforced, and already the pattern in this codebase |
| Signed URL expiry | Rolling your own token scheme | `supabaseAdmin.storage.from('unidades-fotos').createSignedUrl(path, 3600)` | Supabase handles token signing, HMAC, expiry enforcement |
| Flex scroll on 375px | Calculating heights with JS | `min-height: 0` on flex children | CSS-only; JS height calculation breaks on keyboard popup and rotation |
| Animation visible-base | Setting initial `opacity:1` inline | Remove `fill: both` from animation shorthand; use `animation-fill-mode: none` | `both` is the bug — it applies `from` styles before play and `to` styles after; removing it restores the element's natural (visible) state |

---

## Common Pitfalls

### Pitfall 1: `animation fill-mode: both` makes content invisible on print/projector/slow render

**What goes wrong:** `.romma-page { animation: rommaFadeIn 320ms ease both; }` — the `both` keyword applies the `from` keyframe state (`opacity:0`) before the animation plays AND keeps the final `to` state after. In a print context, paused render, or when JS is slow, the element is permanently `opacity:0` and invisible.

**Current state in codebase:** Line 350 of `globals.css` already has this bug: `.romma-page { animation: rommaFadeIn 320ms var(--ease-crisp) both; }`. The `rommaFadeIn` keyframe goes `from { opacity:0 }` to `to { opacity:1 }` — this is a dual problem.

**How to fix:** The handoff pattern (`rFade`) only animates `transform: translateY` — no opacity. Base state is naturally visible. Replace `rommaFadeIn` usage (or add the `.r-fade` class) with a transform-only keyframe: `@keyframes rFade { from { transform: translateY(8px); } to { transform: translateY(0); } }` without `fill: both`. Add `@media print { .r-fade, .romma-page { animation: none; } }` and `@media (prefers-reduced-motion: reduce) { .r-fade, .romma-page { animation: none; } }`.

**Warning signs:** Content that disappears on Google Slides presentation, printed page shows blank panels, animation inspector shows element stuck at `opacity:0`.

### Pitfall 2: `min-height:0` missing on flex children prevents scroll

**What goes wrong:** In a flex container, flex children have an implicit `min-height: auto`. This means a child with `overflow: auto` will expand to fit all its content instead of scrolling. On a 375px viewport with a long list, the container overflows the viewport and the bottom nav is pushed off-screen.

**Current state in codebase:** `DashboardShell.js` — the `<main>` has `flex:1, overflow:auto` but no `min-height:0`. The inner content `<div>` also lacks it. On desktop this is masked by the `1570px` max-width and enough height; on mobile (375px) lists of cards overflow.

**How to fix:** Add `minHeight: 0` (inline) or `min-h-0` (Tailwind) to every flex child that wraps a scrollable region: the `<main>` element and its immediate child `<div>` in DashboardShell, the `<main>` in PortalLayout, and the `flex-1 overflow-auto` div in UnidadesPublicas.

**Warning signs:** Content scrollable on desktop but overflows on 375px emulator, bottom nav disappears behind content.

### Pitfall 3: `position:fixed` modals rendered inside a transformed ancestor

**What goes wrong:** CSS `position:fixed` is positioned relative to the viewport — UNLESS an ancestor has `transform`, `perspective`, `filter`, or `will-change` applied. Inside a transformed container, `fixed` behaves like `absolute`.

**Current state in codebase:** `LocatariosDesktop.js` modals already use `fixed inset-0 z-50` (Tailwind). `ConfirmDialog.js` uses `fixed inset-0 bg-[…] flex items-center justify-center z-[100]`. These are already correct patterns. The `romma-modal-backdrop` utility class just standardizes the repeated inline pattern into a reusable class.

**How to fix:** Define `.romma-modal-backdrop { position:fixed; inset:0; z-index:50; background:oklch(0 0 0/0.7); display:flex; align-items:center; justify-content:center; }` in `globals.css`. Refactor existing modals to use this class instead of repeated Tailwind one-liners. Avoid placing modals inside animated or transformed parent elements.

**Warning signs:** Modal appears offset or partially off-screen on mobile, especially in landscape; modal not centered when soft keyboard is open.

### Pitfall 4: `storage.objects` RLS JOIN ambiguous column reference

**What goes wrong:** Writing an RLS policy on `storage.objects` that joins to public tables and using `name` unqualified causes PostgreSQL to throw "column reference 'name' is ambiguous" — because both `storage.objects` and the joined table may have a `name` column.

**How to fix:** Always qualify the path column explicitly: `storage.objects.name` (not just `name`) when passing it to `storage.foldername()`. Use a `SECURITY DEFINER` function (in a private schema) to perform the join, which also avoids recursive RLS on the joined tables.

**Warning signs:** `ERROR: column reference "name" is ambiguous` when creating RLS policy; 403 on uploads even with correct bucket configuration.

### Pitfall 5: Signed URLs and `next/image` — search params not covered by narrow pathname pattern

**What goes wrong:** Supabase signed URLs have the format `https://[project].supabase.co/storage/v1/object/sign/[bucket]/[path]?token=...`. If `remotePatterns` specifies `search: ''` (empty string), it rejects URLs with query params. If `pathname` is too narrow (e.g., `/storage/v1/object/public/**`), it misses the `/sign/` path for private/signed objects.

**How to fix:** Use the object form of `remotePatterns` and omit the `search` key entirely — this allows any query parameter. Set `pathname` to `/storage/v1/object/**` to cover both `/public/` and `/sign/` paths.

```js
// next.config.mjs
export default {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vfymttcajeyhrmsyhrtj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
        // NO `search` key → any query params (signed URL tokens) are allowed
      },
    ],
  },
}
```

**Warning signs:** `Error: Invalid src prop … hostname "vfymttcajeyhrmsyhrtj.supabase.co" is not configured under images in your next.config.js` in the browser console.

### Pitfall 6: Bucket creation SQL must target `storage.buckets`, not `public.`

**What goes wrong:** Mistakenly creating the bucket via `supabase.storage.createBucket()` from client-side code, or using the wrong schema in SQL.

**How to fix:** In the migration file: `INSERT INTO storage.buckets (id, name, public) VALUES ('unidades-fotos', 'unidades-fotos', false) ON CONFLICT (id) DO NOTHING;`. The `public` column is `false` for private buckets. RLS policies go on `storage.objects` (not `storage.buckets`).

### Pitfall 7: `--dur-base` and `--dur-fast` undefined tokens break `.r-*` transitions

**What goes wrong:** `app.css` helper classes like `.r-fade`, `.r-rowlink`, `.r-cell`, `.r-ghostbtn` reference `var(--dur-base)` and `var(--dur-fast)`, which are defined in the design system's `tokens/animations.css` bundle — NOT in `app.css` itself and NOT in `globals.css`. Porting `.r-*` classes without defining these tokens causes all transitions to fall back to `0s` (instant) in the browser.

**How to fix:** Define alongside the `--rt-*`/`--rd-*` block in `globals.css`:
```css
--dur-base: 220ms;
--dur-fast: 120ms;
```
These values are inferred from the prototype's animation feel (the current `romma-page` uses `320ms`; `220ms` for base transitions and `120ms` for hover states is standard for "crisp" design systems). [ASSUMED — exact values not in a written spec; adjust if the prototype's animation speed is measured differently]

### Pitfall 8: `--neutral` referenced in `app.css` body reset

**What goes wrong:** `app.css` body reset includes `background: var(--neutral)` — `--neutral` is not defined in `globals.css`. However, this body reset is a prototype-only rule (the `* { box-sizing: border-box }` + `html, body { margin:0; height:100% }` block in `app.css` is a reset for the standalone HTML prototype, NOT for the Next.js app). This block must NOT be ported.

**How to fix:** When porting `app.css` to `globals.css`, port ONLY: the `:root { --rt-* / --rd-* }` block, the `.r-*` helper classes, the keyframes (`rFade`, `rPulse`, `rUnitOut`, `rBar`, `rSheetUp`, `rGrow`), the scrollbar utilities (`.r-scroll`, `.r-noscroll`), the hover affordances (`.r-rowlink`, `.r-cell`, `.r-ghostbtn`), and the realtime dot (`.r-dot`). Skip the `* { box-sizing }`, `html/body/button/a` reset block, and the `[data-accent="indigo"]` toggle (not a v1.5 concern).

---

## Code Examples

### Token Block Placement in globals.css

```css
/* ── v1.5 Design Refinement Tokens ─────────────────────────────────────────
   Additive over Obsidian Blueprint. Zero regression on unreleased screens.
   Source: .planning/design/styles/app.css
   Decision: ONLY "regular" density. Compact/comfy: DEFERRED (REFINO-F1).
   ────────────────────────────────────────────────────────────────────────── */
/* Source: .planning/design/styles/app.css [VERIFIED: in-codebase] */
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

  /* Density — Regular only */
  --rd-gutter:   32px;
  --rd-gutter-m: 20px;
  --rd-page-y:   28px;
  --rd-block:    24px;
  --rd-block-sm: 16px;
  --rd-panel:    20px;
  --rd-cell:     20px;
  --rd-row-y:    12px;
  --rd-row-x:    16px;

  /* Duration tokens (required by .r-* classes; not in app.css but in DS bundle) */
  --dur-base: 220ms;   /* [ASSUMED: inferred from design prototype animation feel] */
  --dur-fast: 120ms;   /* [ASSUMED: inferred from design prototype animation feel] */
}
```

### `.r-fade` Replacement (visible base state)

```css
/* Source: .planning/design/styles/app.css line 93-102 [VERIFIED: in-codebase] */
@keyframes rFade { from { transform: translateY(8px); } to { transform: translateY(0); } }

/* Base state is VISIBLE — no opacity in keyframe, no fill:both */
.r-fade { animation: rFade var(--dur-base) var(--ease-crisp); }

@media (prefers-reduced-motion: reduce) { .r-fade { animation: none; } }
@media print { .r-fade, .romma-page { animation: none; } }

/* Retrofit existing .romma-page: remove `both` fill-mode */
/* Before: .romma-page { animation: rommaFadeIn 320ms var(--ease-crisp) both; } */
/* After:  .romma-page { animation: rFade 320ms var(--ease-crisp); } */
```

### `romma-modal-backdrop` Utility

```css
/* New utility — consolidates repeated "fixed inset-0 z-50 bg-black/70 flex center" pattern */
/* Verified pattern already used in LocatariosDesktop.js line 240, 337 and ConfirmDialog.js line 23 */
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

### DashboardShell.js Scroll Fix

```jsx
// Source: src/components/ui/DashboardShell.js [VERIFIED: in-codebase]
// Add minHeight:0 to main and its content wrapper

// Before:
<main style={{ flex: 1, overflow: "auto", background: "var(--background)" }}>
  <div style={{ maxWidth: "1570px", margin: "0 auto", padding: "0 24px" }}>

// After:
<main style={{ flex: 1, overflow: "auto", minHeight: 0, background: "var(--background)" }}>
  <div style={{ maxWidth: "1570px", margin: "0 auto", padding: "0 24px", minHeight: 0 }}>
```

### PortalLayout.js Scroll Fix

```jsx
// Source: src/app/portal/layout.js [VERIFIED: in-codebase]
// Before:
<main className="flex-1 overflow-auto">
// After:
<main className="flex-1 overflow-auto min-h-0">
```

### UnidadesPublicas Scroll Fix

```jsx
// Source: src/components/features/UnidadesPublicas.js line 123 [VERIFIED: in-codebase]
// The outer container already uses h-dvh which is correct for viewport height
// Before:
<div className="flex-1 overflow-auto">
// After:
<div className="flex-1 overflow-auto min-h-0">
```

### Storage Migration SQL

```sql
-- supabase/migrations/20260601000000_v15_foundation.sql
-- ── Schema additions ──────────────────────────────────────────────────────

ALTER TABLE public.proprietarios
  ADD COLUMN IF NOT EXISTS nome      TEXT,
  ADD COLUMN IF NOT EXISTS sobrenome TEXT,
  ADD COLUMN IF NOT EXISTS telefone  TEXT;

ALTER TABLE public.unidades
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- ── Storage bucket (private) ──────────────────────────────────────────────
-- Bucket is private by default (public = false)
INSERT INTO storage.buckets (id, name, public)
VALUES ('unidades-fotos', 'unidades-fotos', false)
ON CONFLICT (id) DO NOTHING;

-- ── RLS helper function ────────────────────────────────────────────────────
-- Uses SECURITY DEFINER to bypass RLS on joined tables (avoids recursive RLS).
-- File path convention: {unidade_id}/{filename}  e.g. "abc-uuid/foto.jpg"
-- storage.foldername(name)[1] extracts the first path segment = unidade_id.
-- [CITED: https://github.com/orgs/supabase/discussions/28160]
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
  -- Extract unidade_id from first path segment
  v_unidade_id := (storage.foldername(obj_name))[1]::UUID;
  -- Verify the authenticated user is the proprietário that owns this unidade
  SELECT e.proprietario_id INTO v_prop_id
  FROM public.unidades u
  JOIN public.edificios e ON e.id = u.edificio_id
  WHERE u.id = v_unidade_id;
  RETURN v_prop_id = (SELECT auth.uid());
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.storage_unidade_owned_by_auth(TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION public.storage_unidade_owned_by_auth(TEXT) TO authenticated;

-- ── Storage RLS policies ───────────────────────────────────────────────────
-- Policies on storage.objects are the correct table (not storage.buckets).
-- [CITED: https://supabase.com/docs/guides/storage/security/access-control]

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
GRANT ALL ON public.proprietarios TO service_role, authenticated;
GRANT ALL ON public.unidades      TO service_role, authenticated;
```

### Signed URL Generation (Server Action pattern)

```js
// In a Server Action (src/actions/unidades.js or similar — Phase 19 concern,
// but the infra for it is established here)
// Uses supabaseAdmin to generate signed URLs for private bucket objects.
// Path convention: '{unidade_id}/{filename}'
import supabaseAdmin from '@/lib/supabaseAdmin'

// Generate a signed URL valid for 1 hour (3600 seconds)
const { data, error } = await supabaseAdmin.storage
  .from('unidades-fotos')
  .createSignedUrl(`${unidadeId}/${filename}`, 3600)
// data.signedUrl is the URL to pass to next/image src
// [CITED: https://supabase.com/docs/guides/storage/buckets/fundamentals]
```

### next.config.mjs remotePatterns

```js
// Source: https://nextjs.org/docs/messages/next-image-unconfigured-host [CITED]
// Object form without `search` key = any query params allowed (covers signed URL tokens)
// Pathname `/storage/v1/object/**` covers both /public/ and /sign/ paths

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
}

export default nextConfig
```

---

## Token Mapping: Handoff vs Existing globals.css

| Handoff token (app.css) | Status in globals.css | Action |
|------------------------|----------------------|--------|
| `--rt-metric` through `--rt-meta` | NOT PRESENT | ADD in new section |
| `--rd-gutter` through `--rd-row-x` | NOT PRESENT | ADD in new section |
| `--dur-base` | NOT PRESENT (in DS bundle, not globals.css) | ADD (inferred value) |
| `--dur-fast` | NOT PRESENT (in DS bundle, not globals.css) | ADD (inferred value) |
| `--ease-crisp` | PRESENT (line 131: `cubic-bezier(0.22, 1, 0.36, 1)`) | NO ACTION |
| `--neutral` | NOT PRESENT by name — `app.css` uses it in prototype reset block | DO NOT PORT body reset block; `--neutral` maps to `--background` contextually |
| `--font-display` | `--font-display-arch` present (alias for `--font-body`); `app.css` uses `var(--font-display)` | ADD alias: `--font-display: var(--font-display-arch)` OR update `.r-*` classes to use `--font-display-arch` |
| `--highlight` | PRESENT via `--ds-highlight` chain | NO ACTION |
| `--surface-hi` | PRESENT (line ~106) | NO ACTION |
| `--fg-1..5` | PRESENT | NO ACTION |
| `--fg-4`, `--fg-3` etc | PRESENT | NO ACTION |
| `--indigo` | PRESENT | NO ACTION |
| `--border-3` | PRESENT | NO ACTION |
| `--success`, `--warning`, `--danger` | PRESENT | NO ACTION |
| `--primary-hover` | PRESENT as `oklch(from var(--ds-primary) calc(l + 0.25) c h)` via Tailwind `@theme` | NO ACTION |

**Key gap:** `--font-display` used in `.r-title`, `.r-metric`, `.r-section` in `app.css`. Globals.css has `--font-display-arch` (same semantic). Simplest fix: add `--font-display: var(--font-display-arch)` to the new `:root` block.

---

## Existing Modal Inventory

Modals to retrofit with `romma-modal-backdrop` class:

| File | Lines | Current Pattern | Status |
|------|-------|-----------------|--------|
| `src/components/features/LocatariosDesktop.js` | 240, 337 | `className="fixed inset-0 z-50 bg-[oklch(0_0_0/0.7)] flex items-center justify-center"` | Replace with `.romma-modal-backdrop` |
| `src/components/ui/ConfirmDialog.js` | 23 | `className="fixed inset-0 bg-[oklch(0_0_0/0.7)] flex items-center justify-center z-[100]"` | Replace with `.romma-modal-backdrop` (keep `z-[100]` override if needed) |
| `src/components/features/UnidadeDetailSheet.js` | 9 | `className="fixed inset-0 z-50 bg-[oklch(0_0_0/0.65)] flex items-end"` | Bottom sheet — keep `items-end`, NOT a candidate for `romma-modal-backdrop` (different alignment) |
| `src/components/features/Unidades.js` | — | No modal/backdrop found | Unidades form appears to be inline, not modal-style |
| `src/components/features/Contratos.js` | — | No modal/backdrop found | Contratos new-contract form appears to be a sidebar/panel, not a modal overlay |

**Finding:** Only 2 files (LocatariosDesktop, ConfirmDialog) need modal class retrofit. The UnidadeDetailSheet is a bottom sheet (items-end) and should remain distinct. Contratos and Unidades do not currently use overlay modals.

---

## Existing Animation Inventory

Files using `.romma-page` class (must have animation fix applied):

| File | Line | Usage |
|------|------|-------|
| `src/app/dashboard/page.js` | 80, 156 | `className="romma-page p-12 bg-background min-h-full"` |
| `src/app/dashboard/locatarios/loading.js` | 5 | `className="romma-page p-12 bg-background min-h-full"` |
| `src/app/dashboard/loading.js` | 5 | `className="romma-page p-12 bg-background min-h-full"` |
| `src/components/features/Parcelas.js` | 65 | `className="romma-page bg-background min-h-full px-4 sm:px-12 pt-6 sm:pt-12 pb-20"` |
| `src/components/features/LocatariosDesktop.js` | 112 | `className="romma-page px-4 sm:px-12 pt-6 sm:pt-12 pb-20 bg-background min-h-full"` |

The fix is in `globals.css` only (changing `.romma-page` animation definition + adding `@media print` safeguard). No per-file JSX changes needed.

---

## Migration Convention

Last migration timestamp: `20260524000000`. New migration should use: `20260601000000`.

Filename: `supabase/migrations/20260601000000_v15_foundation.sql`

Apply to remote: `supabase db push` (uses `SUPABASE_ACCESS_TOKEN` + project ID `vfymttcajeyhrmsyhrtj`). The `supabase` CLI is available at `/usr/bin/supabase` (version 2.84.2).

Idempotency: `ALTER TABLE … ADD COLUMN IF NOT EXISTS` is safe to run multiple times. `INSERT INTO storage.buckets … ON CONFLICT (id) DO NOTHING` is safe. `CREATE OR REPLACE FUNCTION` replaces existing. `CREATE POLICY` will fail if policy name already exists — use `DROP POLICY IF EXISTS` before each `CREATE POLICY` OR name them to match the new convention.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `supabase` CLI | `supabase db push` | ✓ | 2.84.2 | Manual SQL via Supabase Studio |
| Node.js | Next.js build | ✓ | v24.13.0 | — |
| Supabase hosted project | DB migration apply | ✓ (project vfymttcajeyhrmsyhrtj) | — | — |
| Playwright | E2E tests | ✓ (v1.60.0 in package.json) | — | — |

No missing blocking dependencies.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright 1.60.0 |
| Config file | `playwright.config.js` (root) |
| Quick run command | `npx playwright test --project=chromium tests/phase17-tokens.spec.js` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REFINO-01 | CSS custom props `--rt-*` present in `:root` | Smoke (CSS property check) | `npx playwright test tests/phase17-tokens.spec.js -x` | ❌ Wave 0 |
| REFINO-02 | CSS custom props `--rd-*` present in `:root` | Smoke (CSS property check) | `npx playwright test tests/phase17-tokens.spec.js -x` | ❌ Wave 0 |
| REFINO-03 | Dashboard/portal page scrolls without overflow on 375px viewport | Visual/Functional | `npx playwright test tests/phase17-scroll.spec.js -x` | ❌ Wave 0 |
| REFINO-04 | Modal centers on 375px viewport (LocatariosDesktop invite modal) | Visual/Functional | `npx playwright test tests/phase17-modal.spec.js -x` | ❌ Wave 0 |
| REFINO-05 | `.romma-page` element has `opacity` > 0 immediately after render (no fill-both) | Functional | `npx playwright test tests/phase17-animation.spec.js -x` | ❌ Wave 0 |
| Schema | `proprietarios` has `nome/sobrenome/telefone` columns; `unidades` has `foto_url` | DB integration | Manual SQL check or Playwright `supabase.from` test | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** CSS property presence check (`phase17-tokens.spec.js`) on chromium
- **Per wave merge:** Full suite `npx playwright test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/phase17-tokens.spec.js` — CSS var presence in `:root` for all `--rt-*` and `--rd-*`; confirms `--dur-base`, `--dur-fast` defined; no compact/comfy variants
- [ ] `tests/phase17-scroll.spec.js` — viewport 375px, dashboard and portal pages: assert no horizontal/vertical overflow; bottom nav visible without scroll
- [ ] `tests/phase17-modal.spec.js` — viewport 375px, trigger invite modal in Locatários; assert modal covers full viewport with centered content
- [ ] `tests/phase17-animation.spec.js` — check `window.getComputedStyle(el).opacity` is not `'0'` immediately after navigation to dashboard page

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | yes | RLS policies on `storage.objects` via SECURITY DEFINER function; ownership chain enforced at DB level |
| V5 Input Validation | no | No new input fields in this phase |
| V6 Cryptography | no | Signed URL token generation handled by Supabase internals |

### Known Threat Patterns for Supabase Storage

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized file access (IDOR on storage) | Information Disclosure | Private bucket + RLS policy checking ownership chain (unidade → edificio → proprietario_id) |
| Cross-proprietário file upload | Tampering | INSERT policy checks `public.storage_unidade_owned_by_auth()` before allowing upload |
| Signed URL leakage | Information Disclosure | URLs expire (3600s); private bucket prevents direct URL access without token; RLS prevents re-generation by non-owners |
| Path traversal in file path construction | Tampering | File path structured as `{uuid}/{filename}` where uuid comes from DB (not user input); validate uuid format in Server Action before upload |

**Critical:** The `storage_unidade_owned_by_auth` function uses `SECURITY DEFINER` to bypass RLS on the tables it reads. The `search_path` is explicitly set to `public, storage` to prevent search path injection. [CITED: Supabase community pattern from discussion #28160]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `--dur-base: 220ms` and `--dur-fast: 120ms` are appropriate values for the design system animation feel | Code Examples — Token Block; Pitfall 7 | If prototype uses different values, hover/transition speed will differ from design; adjust on inspection |
| A2 | `storage.foldername(name)[1]` extracts the first path segment correctly when path is `{unidade_id}/{filename}` | Code Examples — Storage Migration SQL | If storage.foldername returns 0-indexed or differently structured array, RLS function returns wrong UUID and all storage operations fail; verify with a test upload |
| A3 | `supabase db push` will apply the migration to the remote project without extra flags when run with credentials configured | Environment Availability | If remote project requires `--linked` or different auth, the push will fail; fall back to Supabase Studio SQL editor |
| A4 | Contratos.js and Unidades.js do not have overlay modals to retrofit (inline/sidebar pattern) | Existing Modal Inventory | If other modal patterns exist in these files that weren't found by grep, they would be missed from the retrofit; a full file read before execution confirms |

---

## Open Questions

1. **`--font-display` alias**
   - What we know: `app.css` `.r-title`, `.r-metric`, `.r-section` use `var(--font-display)`. Globals.css has `--font-display-arch` pointing to Space Grotesk.
   - What's unclear: Prefer adding `--font-display: var(--font-display-arch)` alias to `:root`, or update the ported `.r-*` class definitions to reference `--font-display-arch` directly?
   - Recommendation: Add the alias `--font-display: var(--font-display-arch)` to the new `:root` block — this matches the handoff exactly and future-proofs if the design system changes the display font.

2. **`rommaFadeIn` keyframe fate**
   - What we know: `.romma-page` currently uses `rommaFadeIn` which has `opacity:0` as start. The fix is to switch to `rFade` (transform-only). But 5 files in the repo reference `.romma-page`.
   - What's unclear: Should `rommaFadeIn` be deleted or kept for other potential users?
   - Recommendation: Keep `rommaFadeIn` (it's also used by `rommaUnitOut` sibling keyframe context), but change `.romma-page` to use `rFade` instead. If no other code uses `rommaFadeIn` directly, it becomes orphaned but harmless.

3. **`supabase db push` credential verification**
   - What we know: `supabase` CLI 2.84.2 is available. Supabase project ID is `vfymttcajeyhrmsyhrtj`.
   - What's unclear: Whether the CLI is linked to the remote project or needs `--project-ref` flag.
   - Recommendation: Run `supabase status` or `supabase projects list` before `db push` to confirm linkage. If not linked: `supabase db push --project-ref vfymttcajeyhrmsyhrtj`.

---

## Sources

### Primary (HIGH confidence)
- `.planning/design/styles/app.css` [VERIFIED: in-codebase] — exact token names and values for `--rt-*`, `--rd-*`, `.r-*` classes, keyframes
- `src/app/globals.css` [VERIFIED: in-codebase] — existing token inventory, animation definitions, confirmed `--ease-crisp` present, confirmed `both` fill-mode bug on `.romma-page`
- `src/components/ui/DashboardShell.js` [VERIFIED: in-codebase] — scroll structure, flex chain, `min-height:0` missing from `<main>`
- `src/app/portal/layout.js` [VERIFIED: in-codebase] — `flex-1 overflow-auto` on main, missing `min-h-0`
- `src/components/features/UnidadesPublicas.js` [VERIFIED: in-codebase] — `h-dvh flex-col`, `flex-1 overflow-auto` div confirmed
- Modal grep across `src/components` [VERIFIED: in-codebase] — LocatariosDesktop.js + ConfirmDialog.js are the 2 overlay modals; Contratos.js and Unidades.js have no overlay modals
- `supabase/migrations/20260518000000_proprietarios_rls.sql` [VERIFIED: in-codebase] — migration convention, RLS pattern, `is_proprietario()` SECURITY DEFINER precedent
- [Next.js official docs — images.remotePatterns](https://nextjs.org/docs/messages/next-image-unconfigured-host) [CITED] — exact `remotePatterns` object syntax, `search` key semantics, `pathname` glob rules
- [Next.js image config reference](https://nextjs.org/docs/app/api-reference/config/next-config-js/images) [CITED] — version 16.2.9 confirmed, loader patterns

### Secondary (MEDIUM confidence)
- [Supabase Storage Access Control docs](https://supabase.com/docs/guides/storage/security/access-control) [CITED] — RLS policy SQL patterns, `bucket_id`, `name`, `owner_id` fields, `storage.foldername()` usage
- [Supabase Storage Ownership docs](https://supabase.com/docs/guides/storage/security/ownership) [CITED] — `owner_id` stores JWT `sub` claim; service_key creates ownerless objects
- [Supabase Storage RLS with table join community discussion](https://github.com/orgs/supabase/discussions/28160) [CITED] — SECURITY DEFINER function pattern for joining `storage.objects` to public tables; column ambiguity fix

### Tertiary (LOW confidence)
- `--dur-base: 220ms`, `--dur-fast: 120ms` inferred from design prototype animation feel [ASSUMED]

---

## Metadata

**Confidence breakdown:**
- CSS tokens: HIGH — values verified 1:1 from `app.css`; placement strategy verified against `globals.css`
- Scroll fix: HIGH — shell components verified in-codebase; `min-height:0` pattern is established CSS
- Modal retrofit: HIGH — inventory complete via grep; pattern verified in existing files
- Animation fix: HIGH — `both` fill-mode bug confirmed in codebase; `rFade` pattern verified in `app.css`
- Storage RLS: MEDIUM — SQL pattern cited from official docs + community; SECURITY DEFINER join pattern is established but not verified in this exact schema
- Next.js remotePatterns: HIGH — verified from official Next.js 16 docs

**Research date:** 2026-06-13
**Valid until:** 2026-07-13 (stable CSS/SQL domain; Next.js image config is stable between minor versions)
