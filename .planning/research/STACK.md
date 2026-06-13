# Technology Stack — v1.5 System Improvement & Design Augmentation

**Project:** Romma
**Researched:** 2026-06-13
**Milestone:** v1.5 — new capabilities layered on existing Next.js 16 + Supabase + Tailwind v4 + shadcn/ui app

---

## Default Position: No New Dependencies Unless Proven Necessary

The existing stack covers most v1.5 features. Each capability below is analyzed for whether the platform + existing deps are sufficient before any new package is recommended.

---

## Capability 1: Supabase Storage — Unit Cover Photo Upload

### Verdict: Platform-native. No new dependency.

`@supabase/supabase-js ^2.99.2` (already in `package.json`) includes the full Storage API. No additional library is needed.

### How it works

**Upload:** `supabase.storage.from('unit-covers').upload(path, file)` — accepts a `File` object directly from an `<input type="file">` or drag-and-drop event.

**Public URL:** `supabase.storage.from('unit-covers').getPublicUrl(path)` — returns a permanent URL for use in the `foto_url` column of `unidades`.

**Preview before upload:** `URL.createObjectURL(file)` — browser native, no library. Revoke with `URL.revokeObjectURL()` on unmount.

**Drag-and-drop:** HTML5 `onDragOver` / `onDrop` events on a `<div>` — no library. The prototype (`js/console2.jsx`) already shows this pattern as a faux-QR div with drag state; the production implementation follows the same pattern.

### Bucket + RLS Design

- **Bucket name:** `unit-covers` — public bucket (anyone with the URL can read; fits the `/unidades` public listing)
- **RLS on `storage.objects`:** INSERT/UPDATE/DELETE restricted to authenticated users where `owner` = current `auth.uid()` scoped through the `proprietario_id` on the related unidade. Use `storage.objects` RLS policy referencing `auth.uid()` for writes; reads are open because the bucket is public.
- **Multi-tenant scoping:** The Server Action that saves `foto_url` to the `unidades` table must verify `proprietario_id = auth.uid()` before persisting the URL (same pattern as all other Server Actions in `src/actions/`). The upload itself is done client-side with the anon key (`lib/supabase-browser.js`); the DB write is server-side with `supabaseAdmin` after ownership check.

### next/image Integration

Add `vfymttcajeyhrmsyhrtj.supabase.co` to `remotePatterns` in `next.config.mjs`. Then use `<Image src={foto_url} ... />` normally. Supabase's image transformation URL parameter (`?width=800&quality=80`) is available for public buckets on Pro plan; on Free plan, serve the raw URL and let next/image do the optimization on Vercel's side.

**Confidence:** HIGH — fully documented in `@supabase/supabase-js` storage API; `getPublicUrl` + `upload` are stable methods unchanged since v2.

### What NOT to add
- `react-dropzone` — HTML5 drag-and-drop is sufficient for this single-field use case
- `filepond` / `uppy` — overkill for a single image per unit
- Any image CDN SDK — Supabase Storage is the CDN

---

## Capability 2: Client-Side PDF — Payment Receipt (Comprovante)

### Verdict: `jsPDF ^4.2.1` — one new dependency, loaded dynamically only when "Baixar PDF" is clicked.

### Reasoning

Three approaches were evaluated:

| Approach | Bundle Cost | Layout Control | Fit for Romma |
|---|---|---|---|
| `window.print()` + `@media print` CSS | 0 KB added | Full CSS, but download UX is OS-dependent (print dialog, not direct download) | Awkward UX: user sees print dialog instead of a `.pdf` file download |
| `@react-pdf/renderer` | ~400 KB | Flexbox-like proprietary API — cannot reuse existing HTML/CSS | Confirmed broken with Next.js 15+ due to `__SECRET_INTERNALS` React API usage; React 19 compatibility unclear |
| `jsPDF` | ~250 KB | Imperative coordinate-based API | Works purely client-side; zero SSR; loaded on demand via dynamic import |

**jsPDF wins** for this use case because:
1. The receipt is a simple structured document (value, installment number, tenant name, unit, dates, PIX label, auth code) — no complex CSS layout needed. jsPDF's imperative API handles this cleanly.
2. The prototype receipt (`js/portal.jsx ComprovanteModal`) is a flat list of labeled rows — maps directly to jsPDF's `text()` and `line()` primitives.
3. `@react-pdf/renderer` has known React 19 + Next.js 15/16 compatibility issues (uses `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`); this is a hard blocker.
4. `window.print()` produces a print dialog, not a direct `.pdf` download — wrong UX for "Baixar PDF".

**Current version:** `jspdf ^4.2.1` (latest as of June 2026; v4.0.0 was Jan 2026, v4.2.1 was March 2026)

### Integration Pattern

```js
// src/components/features/portal/ComprovanteModal.js  ('use client')
async function handleDownload() {
  const { jsPDF } = await import('jspdf'); // dynamic import — loads only on click
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  // ... doc.text(), doc.line(), doc.save('comprovante.pdf')
}
```

**No SSR risk:** `jsPDF` uses `window`/`document` — the dynamic import inside an event handler means it never runs server-side. No `ssr: false` wrapper needed for the component itself (the component is already `'use client'`); the `import()` inside the handler is sufficient.

**No font embedding needed:** The receipt uses monospace system font for numbers and a simple sans-serif for labels — acceptable for a payment comprovante. Space Grotesk cannot be embedded in jsPDF without the font tool workflow; use the built-in Helvetica/Courier for the receipt.

**Confidence:** MEDIUM-HIGH — jsPDF v4.x is current and well-maintained; dynamic import pattern is confirmed working with Next.js App Router + client components. `@react-pdf/renderer` exclusion is HIGH confidence (confirmed blocking issues with React 19 internals).

### What NOT to add
- `@react-pdf/renderer` — React 19 + Next.js 16 compatibility broken (uses internal React APIs)
- `html2canvas` — adds another ~200 KB on top of jsPDF; screenshot-based PDFs are blurry and non-selectable; no benefit for a text receipt
- `puppeteer` / `playwright` server-side PDF — massive Vercel dependency, wrong tier for a client-downloadable receipt
- `react-to-print` — only wraps `window.print()`, wrong UX for a download

---

## Capability 3: Typography Scale + Density Token System

### Verdict: Platform-native. CSS vars + Tailwind v4 `@theme` + `@utility`. No new dependency.

### The Reference Implementation

The design prototype already defines the exact tokens in `.planning/design/styles/app.css`:

```css
:root {
  /* Type scale */
  --rt-metric: 40px;
  --rt-title: 32px; --rt-title-sm: 24px;
  --rt-section: 20px;
  --rt-subhead: 16px;
  --rt-body: 14px;
  --rt-data: 14px;   /* mono, was 18px */
  --rt-label: 11px;  /* mono uppercase */
  --rt-meta: 10px;   /* mono sub-caption */

  /* Density — "regular" level */
  --rd-gutter: 32px;   --rd-gutter-m: 20px;
  --rd-page-y: 28px;
  --rd-block: 24px;    --rd-block-sm: 16px;
  --rd-panel: 20px;    --rd-cell: 20px;
  --rd-row-y: 12px;    --rd-row-x: 16px;
}
```

### Implementation Approach

**Add these CSS vars directly to `src/app/globals.css`** in the `:root` block (after the existing tokens). The naming convention follows the `--rt-*` / `--rd-*` pattern from the prototype to make porting the prototype's JSX straightforward.

**Expose as Tailwind utilities via `@utility`** in `globals.css` (already established pattern — see `@utility font-mono` and `@utility animacao-underscore`):

```css
/* In globals.css — @utility block */
@utility text-metric  { font-size: var(--rt-metric);  font-weight: 700; line-height: 1; letter-spacing: -2px; }
@utility text-title   { font-size: var(--rt-title);   font-weight: 700; line-height: 1; letter-spacing: -1.6px; }
@utility text-section { font-size: var(--rt-section); font-weight: 700; line-height: 1.05; letter-spacing: -0.6px; }
@utility text-subhead { font-size: var(--rt-subhead); font-weight: 600; line-height: 1.2; }
@utility text-body    { font-size: var(--rt-body);    line-height: 1.5; }
@utility text-data    { font-size: var(--rt-data);    font-family: var(--font-mono); }
@utility text-label   { font-size: var(--rt-label);   font-family: var(--font-mono); font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
@utility text-meta    { font-size: var(--rt-meta);    font-family: var(--font-mono); letter-spacing: 0.5px; }
```

**Do NOT use `@theme` for the type scale** — `@theme` in Tailwind v4 generates utility classes from CSS variable prefixes (e.g., `--text-*` → `text-[name]` utilities with responsive variants). This is useful but also heavier-weight; it generates classes Romma doesn't need. The `@utility` approach gives explicit, predictable class names that exactly match the prototype's `.r-metric`, `.r-title`, etc. — making porting deterministic.

**Density tokens stay as CSS vars in `:root`** and are consumed inline (`style={{ padding: 'var(--rd-panel)' }}` or as arbitrary Tailwind values `p-[var(--rd-panel)]`). They do NOT need utility classes — they're used on structural layout elements, not typography.

**Density variants (compact/comfy):** Copy the `[data-density="compact"]` and `[data-density="comfy"]` override blocks from the prototype CSS verbatim. Implement `[data-density="regular"]` as the default in `:root`. For the TCC, "regular" is the only runtime value; compact/comfy are in the DOM for easy demo-time toggling without a JS store.

### Existing `.eyebrow` class

The `.eyebrow` class in `globals.css` already implements the `meta`-level token (10px, 700 weight, uppercase, letter-spacing: 1.5px). The new `text-meta` utility should be consistent with it but without the `display: block` and color — `.eyebrow` remains as the higher-specificity variant with color tone modifiers.

**Confidence:** HIGH — Tailwind v4 `@utility` is well-documented; the CSS var definitions are exact values from the design prototype; no external dependency involved.

### What NOT to add
- `@tailwindcss/typography` — this is for prose/Markdown rendering, irrelevant here
- Any CSS-in-JS (styled-components, etc.) — incompatible with existing approach
- A separate font-size plugin — `@utility` in Tailwind v4 is the native mechanism

---

## Capability 4: Cash-Flow Bar Chart (Dashboard)

### Verdict: Custom CSS/flex bars. No new dependency.

### Reasoning

The prototype's `CashFlowChart` component (`js/overview.jsx`) is already implemented as pure CSS flexbox bars:

```js
// From the prototype — this IS the production approach
<div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height }}>
  {data.map((f, i) => (
    <div key={f.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', ... }}>
      {/* ghost bar: position absolute, opacity 0.5, --secondary */}
      <div style={{ position: 'absolute', bottom: 0, width: '62%', height: `${f.previsto}%`, background: 'var(--secondary)', opacity: 0.5 }} />
      {/* solid bar: var(--primary-hover) or var(--highlight) on peak */}
      <div style={{ width: '62%', height: `${f.recebido}%`, background: f.peak ? 'var(--highlight)' : 'var(--primary-hover)' }} />
      <span className="r-meta">{f.mes}</span>
    </div>
  ))}
</div>
```

This approach:
- Is **exactly what the design handoff specifies** — ghost bars (forecast) overlaid by solid bars (received), with the peak bar in gold (`--highlight`). Radius-0 corners. No axes, no tooltips. A brutalist chart.
- **Uses existing CSS vars** — no new colors, no chart color palette to define.
- **Adds 0 KB** to the bundle.
- **Is already tested visually** in the HTML prototype.
- The `rGrow` CSS animation (`transform: scaleX(0) → scaleX(1)` with staggered delay) is already defined in the prototype CSS and maps to the existing `@keyframes` pattern in `globals.css`.

A chart library like Recharts adds ~150-250 KB to the client bundle. Recharts also requires `react-is` override for React 19 peer dep compatibility. The design is a flat bar chart with no interactivity required — there is no problem that justifies that cost.

**Data source:** The chart needs 6-12 months of aggregated `parcelas` data (sum of `valor_mensal` by `data_fechamento` month, split by `status = 'paga'` vs all). This is a simple GROUP BY query against the existing `parcelas` and `contratos` tables — no new backend infrastructure.

**Confidence:** HIGH — the prototype implements this in ~15 lines of JSX; it is a direct port, not a design decision.

### What NOT to add
- `recharts` — bundle cost unjustified for a 6-bar flat chart; React 19 peer dep friction
- `visx` — D3-based, heavy, designed for complex data visualization
- `tremor` — brings its own component system that conflicts with the existing DS
- `chart.js` / `react-chartjs-2` — canvas-based; conflicts with radius-0 sharp-corner DS

---

## Capability 5: PIX Static QR + Copy-to-Clipboard

### Verdict: Platform-native. No new dependency.

### QR Code

The spec (PROJECT.md + design/README.md) explicitly states: **use a single static QR image**. Not a generated BR Code. The `FauxQR` component in the prototype (`js/portal.jsx`) uses a deterministic CSS grid — a visual mock, not a scannable QR.

**Production implementation options (in order of preference):**

1. **Static PNG asset in `public/`** — a real-looking but non-scannable QR image (or the actual Pix key QR if the proprietário provides one). Zero code, zero dependency.
2. **Port the prototype's `FauxQR` deterministic grid** — ~25 lines of JSX that renders a convincing-looking QR grid with finder patterns. Still not scannable, but visually correct for the TCC demo.

Either approach requires no library. The QR is purely decorative — the actual payment path is copy-paste PIX string.

### Copy-to-Clipboard

`navigator.clipboard.writeText(pixString)` — browser-native Clipboard API. Baseline status reached March 2025; supported in all modern browsers (Chrome, Firefox, Safari, Edge). Requires HTTPS (Vercel provides this). Requires the window to have focus (always true when a modal button is clicked).

Pattern:
```js
async function handleCopy() {
  await navigator.clipboard.writeText(pixCode);
  setCopied(true);
  setTimeout(() => setCopied(false), 1800);
}
```

No fallback `execCommand` needed — Vercel serves HTTPS, target browsers are modern, corporate rental audience.

**Confidence:** HIGH — MDN documented; Baseline 2025; no library needed.

### What NOT to add
- `qrcode` / `qr.js` / `react-qr-code` — spec explicitly says static QR only; real BR Code generation is out of scope
- Any clipboard library — navigator.clipboard.writeText is native and sufficient

---

## Complete New Dependency Decision Table

| Capability | New Package | Version | Justification |
|---|---|---|---|
| Image upload (Supabase Storage) | None | — | `@supabase/supabase-js` storage API covers upload + getPublicUrl |
| Image preview before upload | None | — | `URL.createObjectURL()` browser native |
| Drag-and-drop upload zone | None | — | HTML5 drag events on `<div>` |
| next/image with Supabase URLs | None | — | `remotePatterns` config in `next.config.mjs` |
| PDF receipt download | **`jspdf`** | **`^4.2.1`** | Only viable client-side PDF download option for React 19 + Next.js 16 |
| Typography scale tokens | None | — | CSS vars in `globals.css` + `@utility` declarations |
| Density tokens | None | — | CSS vars in `globals.css`, `[data-density]` attribute overrides |
| Cash-flow bar chart | None | — | Pure CSS flexbox bars (per prototype design) |
| PIX QR code | None | — | Static asset or port deterministic CSS grid |
| PIX copy-to-clipboard | None | — | `navigator.clipboard.writeText()` native |

**Net new runtime dependency for v1.5: 1 package (`jspdf ^4.2.1`)**

---

## Installation

```bash
npm install jspdf
```

No dev-only dependencies needed for v1.5.

### next.config.mjs — remotePatterns addition

```js
// Add to images.remotePatterns
{
  protocol: 'https',
  hostname: 'vfymttcajeyhrmsyhrtj.supabase.co',
  pathname: '/storage/v1/object/public/**',
}
```

---

## Integration with Existing 5-Client Supabase Setup

| Operation | Which Client | Rationale |
|---|---|---|
| `storage.from('unit-covers').upload(path, file)` | `lib/supabase-browser.js` (anon) | Client-side upload from `<input>` or drag zone — happens in `'use client'` component |
| `storage.from('unit-covers').getPublicUrl(path)` | `lib/supabase-browser.js` (anon) | Client-side, synchronous, returns URL object |
| `unidades UPDATE SET foto_url = ...` | `lib/supabaseAdmin.js` (service role) | Server Action in `src/actions/unidades.js` — RLS bypass for trusted write; ownership verified via `proprietario_id` check before write |
| Bucket + RLS setup | Supabase Dashboard / migration | One-time setup; not a code dependency |

The upload flow is: client uploads file → gets public URL → calls Server Action with URL → Server Action verifies ownership → writes `foto_url` to `unidades` row.

---

## What NOT to Add (Complete Exclusion List)

| Package | Why Excluded |
|---|---|
| `@react-pdf/renderer` | Broken with React 19 + Next.js 15/16 (`__SECRET_INTERNALS` usage); ~400 KB bundle |
| `html2canvas` | Screenshot-based = blurry PDFs; +200 KB on top of jsPDF; no benefit for text receipts |
| `react-to-print` | Only wraps `window.print()` — produces print dialog, not file download |
| `puppeteer` / `playwright` PDF | Server-side binary; wrong approach for client-downloadable comprovante |
| `recharts` | ~150-250 KB; React 19 peer dep override needed; overkill for a 6-bar flat chart |
| `chart.js` / `react-chartjs-2` | Canvas-based; conflicts with radius-0 DS; heavier than necessary |
| `visx` | D3-based; complex API for a simple bar chart |
| `tremor` | Own component system conflicts with existing shadcn/ui + Tailwind v4 DS |
| `react-dropzone` | HTML5 drag-and-drop events on `<div>` are sufficient for single-image upload |
| `filepond` / `uppy` | Enterprise multi-file upload suite; massively over-engineered for one unit photo |
| `qrcode` / `react-qr-code` | Real QR generation is explicitly out of scope; static asset or CSS grid sufficient |
| Any clipboard library | `navigator.clipboard.writeText()` is native Baseline 2025 |
| `@tailwindcss/typography` | For prose rendering; irrelevant to token system |
| Any CSS-in-JS | Incompatible with existing Tailwind v4 + CSS vars approach |

---

## Sources

- `package.json` — verified existing deps and versions
- `.planning/design/styles/app.css` — reference implementation of `--rt-*` / `--rd-*` token system
- `.planning/design/js/overview.jsx` — `CashFlowChart` pure CSS flexbox implementation
- `.planning/design/js/portal.jsx` — `FauxQR`, `PixModal`, `ComprovanteModal` reference
- `src/app/globals.css` — existing Obsidian Blueprint tokens, `@utility` pattern, `@keyframes`
- npm: `jspdf` — v4.2.1 latest (March 2026); [npmjs.com/package/jspdf](https://www.npmjs.com/package/jspdf)
- pdf4.dev: bundle size comparison jsPDF (~250 KB) vs @react-pdf/renderer (~400 KB): [pdf4.dev/blog/pdf-generation-nextjs](https://pdf4.dev/blog/pdf-generation-nextjs)
- GitHub diegomura/react-pdf issue #2964 — React 19 compatibility concerns with `__SECRET_INTERNALS`
- MDN: `navigator.clipboard.writeText()` — [MDN Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText)
- web.dev: Clipboard API Baseline March 2025 — [web.dev Baseline ClipboardItem](https://web.dev/blog/baseline-clipboard-item-supports)
- Supabase Docs: Storage buckets, public URL, RLS — [supabase.com/docs/guides/storage](https://supabase.com/docs/guides/storage)
- Tailwind v4 `@utility` pattern — [tailwindcss.com/docs/adding-custom-styles](https://tailwindcss.com/docs/adding-custom-styles)
