# Architecture Research — v1.5 Integration Map

**Domain:** Corporate rental management SaaS — subsequent milestone feature integration
**Researched:** 2026-06-13
**Confidence:** HIGH (grounded in actual source files read during this session)

---

## Existing Architecture Baseline (confirmed from source)

The codebase follows a strict Server/Client split established over 16 prior phases. Every new v1.5 feature must slot into this pattern — no architectural deviations.

```
Browser
  │
  ├── Dashboard (CSR feature components)
  │     src/app/dashboard/*/page.js   → thin Server Component shell
  │     src/components/features/*.js  → Client Component, owns all state/fetch/events
  │                                   → calls queries-client.js in useEffect
  │                                   → calls Server Actions for mutations
  │
  ├── Portal (CSR, locatário-scoped)
  │     src/app/portal/dashboard/     → shell
  │     src/components/features/portal/*.js → Client Components
  │
  ├── Public pages (SSR)
  │     src/app/unidades/page.js      → Server Component → queries-server.js
  │
  └── Auth
        src/app/login/page.js
        src/app/signup/page.js        → exists (v1.1), needs field/mask expansion
        src/proxy.js                  → Next.js 16 middleware, protects /dashboard/*

Server Actions (src/actions/)
  └── authGuard() → supabaseAdmin writes → { status: 200 } or { status: NNN, erroMessage }

Edge Functions (Deno, supabase/functions/)
  └── gerar-parcelas/index.ts         → reads contrato.data_inicio + data_fim → INSERT parcelas

Supabase Postgres
  ├── Tables: edificios, unidades, locatarios, contratos, parcelas, proprietarios
  ├── RLS: all tables enabled; service role bypasses in Server Actions
  └── pg_cron: daily status transitions at 06:00/06:05 UTC
```

**Ownership chain for authorization** (multi-tenant pattern — required for all v1.5 writes):
```
proprietarios.usuario_id = auth.users.id
  └── edificios.proprietario_id = proprietarios.usuario_id
        └── unidades.edificio_id = edificios.id
              └── contratos.unidade_id = unidades.id
                    └── parcelas.contrato_id = contratos.id
```
Every Server Action traverses this chain to scope mutations. The pattern already exists in `criarUnidade`, `editarUnidade`, `cancelarContrato`, `encerrarContrato`, and `marcarParcelaComoPaga` — v1.5 actions must follow the same pattern.

---

## Feature 1: Supabase Storage for Unit Cover Photo

### Integration Points

**New infrastructure:**
- Supabase Storage bucket: `unidades-fotos` (create via migration or Supabase dashboard)
- Bucket path convention: `{proprietario_id}/{unidade_id}/{timestamp}.{ext}` — embeds ownership in the key, making server-side validation trivial
- Bucket RLS: public SELECT for the public listing page; INSERT/DELETE restricted to authenticated proprietário (verify via `proprietarios` table lookup in the RLS policy)

**Schema change:**
- `unidades` table needs a `foto_url TEXT` column (nullable)
- Migration: `ALTER TABLE unidades ADD COLUMN foto_url TEXT;`

**Upload flow — where it happens:**
Upload must happen in the Client Component. Server Actions cannot stream file data. The correct two-step pattern:

```
UnifiedUnidadeModal (Client Component)
  │
  ├── Step 1 (on file select): FileReader → local blob URL → preview (no network)
  │
  ├── Step 2 (on save — if file selected):
  │     supabase-browser.storage.from('unidades-fotos')
  │       .upload(`{proprietario_id}/{unidade_id}/{ts}.{ext}`, file)
  │     → returns publicUrl
  │
  └── Step 3: call criarUnidade(form) or editarUnidade(id, form)
        with foto_url: publicUrl in the form object
        (Server Action writes ONLY the URL string to the DB row)
```

The Server Action does NOT touch Storage — it only writes `foto_url` to `unidades`. Storage cleanup on photo removal is also client-side: call `supabase-browser.storage.remove([path])` before calling `editarUnidade({ foto_url: null })`.

**Files to modify:**
- `src/actions/unidades.js` — `criarUnidade`: accept `foto_url` in form, add it to the INSERT payload. `editarUnidade`: add `foto_url` to the `patch` object (allow null for removal).
- `src/lib/queries-client.js` — `getUnidades()`: add `foto_url` to the SELECT field list.
- `src/lib/queries-server.js` — `getUnidadesDisponiveis()`: add `foto_url` to the SELECT for public page cards.
- `next.config.mjs` — add `images.remotePatterns`: `{ protocol: 'https', hostname: 'vfymttcajeyhrmsyhrtj.supabase.co' }` to enable `<Image>` optimization for Storage CDN URLs.

**Files to create:**
- `supabase/migrations/YYYYMMDD_unidades_foto_url.sql`

**Reading the URL — next/image:**
- Dashboard card grid and modal: `<Image src={unidade.foto_url} ... />` — works once `remotePatterns` is configured.
- Public listing `UnidadePublicaCard.js`: same pattern.
- Always guard with `{unidade.foto_url && <Image ... />}` since the column is nullable.

---

## Feature 2: Unified Create/Edit Unit Modal

### Current state (confirmed from source)
`Unidades.js` has two separate form state objects (`form` for create, `formEdit` for edit) and two separate rendering sections. The two are not shared. `GestaoEdificios.js` has drill-in unit lists with no edit capability. There is no modal component — forms are rendered inline or as overlays within the component.

### Target state
One modal component (`UnifiedUnidadeModal`) for both create and edit, reused from `Unidades.js` AND `GestaoEdificios.js`.

### Component architecture

```
UnifiedUnidadeModal (new Client Component — src/components/features/UnifiedUnidadeModal.js)
  Props:
    mode: 'create' | 'edit'
    unidade?: { id, nome, descricao, area_m2, valor_mensal, valor_visivel, status, edificio_id, foto_url }
    edificios: Edificio[]           -- passed from parent (already loaded in parent useEffect)
    edificioIdFixed?: string        -- when opened from GestaoEdificios, lock the edificio selector
    onSuccess: () => void           -- triggers parent re-fetch (carregarDados / carregarUnidades)
    onClose: () => void
  Internal state:
    form: single useState object (project convention — never per-field)
    fotoFile: File | null           -- staged for upload
    fotoPreviewUrl: string | null   -- FileReader blob URL for local preview
    uploading: boolean
    loading: boolean
    erro: string | null
  On submit:
    1. if fotoFile → supabase-browser.storage.upload → publicUrl
    2. if mode === 'create' → criarUnidade({ ...form, foto_url: publicUrl ?? null })
    3. if mode === 'edit' → editarUnidade(unidade.id, { ...form, foto_url: publicUrl ?? existing })
    4. on { status: 200 } → onSuccess() → onClose()
```

**Modal positioning** (cross-cutting fix applied here from the start):
```js
// backdrop
style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex',
         alignItems: 'center', justifyContent: 'center',
         background: 'oklch(0 0 0 / 0.6)' }}
// inner dialog
style={{ position: 'relative', width: '100%', maxWidth: 540,
         background: 'var(--surface)', ... }}
```

**Files to create:**
- `src/components/features/UnifiedUnidadeModal.js`

**Files to modify:**
- `src/components/features/Unidades.js` — replace dual-form state with `modalState: null | { mode: 'create' | 'edit', unidade?: Unidade }`. Import and render `<UnifiedUnidadeModal>`. Remove `formEdit`, `resetFormEdit`, `handleEditarUnidade` form-populating logic (the modal initializes itself from the `unidade` prop).
- `src/components/features/GestaoEdificios.js` — add `modalUnidade: Unidade | null` state. On unit card click → `setModalUnidade(u)`. Render `<UnifiedUnidadeModal mode="edit" unidade={modalUnidade} edificioIdFixed={edificio.id} onSuccess={carregarDados} onClose={() => setModalUnidade(null)} edificios={[edificio]} />`.

---

## Feature 3: Renovar Contrato

### Decision: New Server Action, not Edge Function reuse

The existing `gerar-parcelas` Edge Function reads `contrato.data_inicio` and `contrato.data_fim` and generates ALL parcelas from scratch using upsert. After a renewal changes `data_fim`, calling the Edge Function would regenerate all existing parcelas — the upsert skips conflicts but overwrites `status` of already-paga rows. This is wrong.

**Correct approach:** A new Server Action `renovarContrato(contratoId, meses)` in `src/actions/contratos.js` that appends only the new parcelas:

```
renovarContrato(contratoId, meses) Server Action
  1. authGuard → get user
  2. Ownership chain: contrato → unidade → edificio.proprietario_id = user.id
  3. SELECT contrato.data_fim, highest parcela.numero for this contrato
  4. nova_data_fim = contrato.data_fim + meses months
  5. UPDATE contratos SET data_fim = nova_data_fim WHERE id = contratoId
  6. Generate new parcelas from (old_data_fim + 1 month) through nova_data_fim
     — same date arithmetic as gerar-parcelas, reimplemented in JS
     — INSERT via supabaseAdmin.from('parcelas').insert([...newParcelas])
     — numero starts from max(existing parcela.numero) + 1
  7. Return { status: 200 }
```

**Atomicity note:** UPDATE + INSERT happen in the same Server Action but are not wrapped in a Postgres transaction. If INSERT fails, `data_fim` is already extended. This is the same atomicity class as the existing `criarContrato` + `gerarParcelas` tech debt and is acceptable for TCC scope. Document in code comments.

**Files to modify:**
- `src/actions/contratos.js` — add `export async function renovarContrato(contratoId, meses)` following the exact same authGuard + ownership chain pattern as `cancelarContrato`.
- `src/components/features/Parcelas.js` — add "Renovar Contrato" button that opens an inline modal with +6/+12/+24 month options; calls `renovarContrato`; on success re-fetches `getParcelasByContrato(contratoId)` and the contrato.

**No schema changes.** `contratos.data_fim` and the `parcelas` table already support this.

---

## Feature 4: PIX Payment Sync — Locatário marks paid, Proprietário sees Paga

### Current state (confirmed from source)
- `marcarParcelaComoPaga(id)` in `src/actions/parcelas.js` exists for the proprietário. It traverses the full ownership chain (parcela → contrato → unidade → edificio → proprietario_id = user.id) before updating.
- The portal `PortalDashboard.js` has no mutation capability — it is read-only. `ParcelsTable.js` shows the table but has no payment action.
- No Server Action exists for portal-side mutations.

### Solution: New Server Action with locatário ownership chain

**New file to create:**
- `src/actions/portal.js` — Server Action `confirmarPagamentoPix(parcelaId)`:

```
confirmarPagamentoPix(parcelaId) Server Action
  1. supabase-server getUser() → user (not isProprietario — caller is locatário)
  2. if !user → { status: 401, erroMessage: 'Não autenticado.' }
  3. Ownership chain (locatário direction):
     parcela = supabaseAdmin.from('parcelas').select('contrato_id').eq('id', parcelaId).single()
     contrato = supabaseAdmin.from('contratos').select('locatario_id').eq('id', parcela.contrato_id).single()
     locatario = supabaseAdmin.from('locatarios').select('usuario_id').eq('id', contrato.locatario_id).single()
     if locatario.usuario_id !== user.id → { status: 403, erroMessage: 'Sem permissão.' }
  4. supabaseAdmin.from('parcelas')
       .update({ status: 'paga', data_pagamento: today })
       .eq('id', parcelaId)
       .in('status', ['pendente', 'vencida'])
  5. Return { status: 200 }
```

No new RLS policy needed — `supabaseAdmin` bypasses RLS; authorization is enforced in application code. This matches every other Server Action in the codebase.

**Files to modify:**
- `src/components/features/portal/PortalDashboard.js` — add `proximaParcela` computed from `parcelas` state; add PIX modal state (`showPix: boolean`, `parcelaAlvo: Parcela | null`); on "Pagar Agora" → open modal; on "Confirmar" → call `confirmarPagamentoPix(parcelaAlvo.id)` → re-fetch `getParcelasPortal(ct.id)`.
- `src/components/features/portal/ParcelsTable.js` — add "Baixar Comprovante" button for rows where `status === 'paga'`; this triggers the PDF generation (Feature 5).

**Proprietário side re-read:**
No Realtime subscription. When the proprietário navigates to `/dashboard/contratos/[id]`, the `useEffect` in `Parcelas.js` calls `getParcelasByContrato(contratoId)` — it will show the updated status. The existing Realtime UPDATE limitation (parcelas UPDATE not propagated via RLS) makes a live push approach unreliable. Document in the portal UI: "O proprietário verá o pagamento ao abrir o detalhe do contrato."

---

## Feature 5: Receipt PDF — Client-Side Only

### Architecture

Purely a Client Component concern. No Server Action, no new route, no new query.

**Where it lives:** A `handleDownloadPDF` function inside `ParcelsTable.js` (or a small helper in `src/lib/pdf.js`). It receives the parcela row data plus contrato/locatario/unidade data already in memory in `PortalDashboard` state (passed as props to `ParcelsTable`).

**Library:** `jspdf` — sufficient for a text receipt, no SSR complications, widely used. Import dynamically inside the handler to avoid including in the server bundle:
```js
const handleDownloadPDF = async (parcela) => {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  // populate from parcela + contrato + locatario props
  doc.save(`recibo-parcela-${parcela.numero}.pdf`)
}
```

**Files to modify:**
- `src/components/features/portal/ParcelsTable.js` — add "Baixar Comprovante" button; add `handleDownloadPDF`; accept `contrato` and `locatario` as props passed from `PortalDashboard`.

**Dependency:** `npm install jspdf` — add to `package.json`.

---

## Feature 6: Global UI Refino — Typography Scale + Density Tokens

### Architectural approach

**Single source of truth:** All token additions go in `src/app/globals.css`. No per-file definitions. Feature components consume via `var(--rt-*)` and `var(--rd-*)` in inline `style={{}}` — consistent with the established pattern (inline + CSS vars, not Tailwind classes in feature components).

**Token additions to `:root` in globals.css:**
```css
/* ── Typography scale v1.5 ─────────────────── */
--rt-metric:  40px;
--rt-title:   32px;   /* 24px mobile: apply via media query in component */
--rt-section: 20px;
--rt-subhead: 16px;
--rt-body:    14px;
--rt-data:    14px;   /* mono, table numbers */
--rt-label:   11px;   /* mono caps, table/column headers */
--rt-meta:    10px;   /* subcaptions, refs, eyebrow */

/* ── Density — regular level v1.5 ───────────── */
--rd-gutter:   32px;
--rd-gutter-m: 20px;
--rd-page-y:   28px;
--rd-block:    24px;
--rd-block-sm: 16px;
--rd-panel:    20px;
--rd-cell:     20px;
--rd-row-y:    12px;
--rd-row-x:    16px;
```

**New @utility classes in globals.css:**
```css
/* Scroll fix — all flex containers that must scroll */
@utility romma-scroll-area {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* Modal backdrop centering — fixed to viewport */
@utility romma-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: oklch(0 0 0 / 0.6);
}
```

**Rollout strategy:** Add tokens first (zero visual change — additive). Then replace hardcoded values per-screen as each screen is refactored for v1.5. Replace `fontSize: '18px'` with `fontSize: 'var(--rt-data)'`, `padding: '20px'` with `padding: 'var(--rd-panel)'`, etc. Never introduce new Tailwind classes in feature components (established inconsistency anti-pattern per CONVENTIONS.md).

**`min-height: 0` fix — concrete locations:**
- `src/app/dashboard/layout.js` — the scrollable main content area
- `src/app/portal/dashboard/layout.js` — same
- `src/components/features/portal/PortalDashboard.js` — inner scroll region
- `src/app/unidades/page.js` shell or its parent — public listing

**Modal centering audit (apply `romma-modal-backdrop` in each v1.5 screen pass):**
- `UnifiedUnidadeModal.js` (new — use from the start)
- Modals in `Contratos.js`, `LocatariosDesktop.js`, portal PIX modal — fix during their respective v1.5 screen passes

**`next.config.mjs` change (also in this step):**
```js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'vfymttcajeyhrmsyhrtj.supabase.co' }
  ]
}
```

---

## Feature 7: Cadastro de Proprietário — Field/Mask Expansion

### Current state (confirmed from source)
`src/app/signup/page.js` exists with a split-panel layout (left: building photo, right: form). It imports `cadastrarProprietario` from `src/actions/auth.js`. The current form fields and whether `sobrenome`/`telefone` are persisted to the `proprietarios` table are not confirmed — requires reading `src/actions/auth.js` and the proprietarios migration.

### What is new in v1.5
- Fields: `sobrenome` (new), `telefone` with mask `(11) 99999-9999` (new)
- `confirmar senha` field with match validation (new)
- Show/hide toggle on `senha` and `confirmar senha`
- Client-side validations: email format, phone ≥10 digits, senha ≥6, senhas coincidem
- Success state: banner "Verifique seu e-mail" instead of redirect
- Visual: bracket-style buttons, matching login screen pattern

**Files to modify:**
- `src/app/signup/page.js` — add `sobrenome`, `telefone`, `confirmarSenha` to form state; add phone mask handler (`handleTelefoneChange`); add show/hide toggle state; add validation logic before calling Server Action; replace `router.push` with success banner state.
- `src/actions/auth.js` — `cadastrarProprietario`: accept and persist `sobrenome` and `telefone` to `proprietarios` table.

**Schema conditional:** Read `supabase/migrations/20260518000000_proprietarios_rls.sql` to confirm current `proprietarios` columns. If the table only has `usuario_id`, create a migration: `ALTER TABLE proprietarios ADD COLUMN nome TEXT, ADD COLUMN sobrenome TEXT, ADD COLUMN telefone TEXT;`. If these columns already exist from a prior phase, no migration needed.

---

## New Files Summary

| File | Type | Purpose |
|------|------|---------|
| `src/components/features/UnifiedUnidadeModal.js` | New Client Component | Unified create/edit unit modal with photo upload |
| `src/actions/portal.js` | New Server Actions file | `confirmarPagamentoPix(parcelaId)` for locatário |
| `supabase/migrations/YYYYMMDD_unidades_foto_url.sql` | New migration | `ALTER TABLE unidades ADD COLUMN foto_url TEXT` |
| `supabase/migrations/YYYYMMDD_proprietarios_campos.sql` | New migration (conditional) | `nome`, `sobrenome`, `telefone` on proprietarios if missing |

## Modified Files Summary

| File | Nature of Change |
|------|-----------------|
| `src/actions/unidades.js` | `criarUnidade` + `editarUnidade`: accept + persist `foto_url` |
| `src/actions/contratos.js` | Add `renovarContrato(contratoId, meses)` export |
| `src/actions/auth.js` | `cadastrarProprietario`: accept + persist `sobrenome`, `telefone` |
| `src/app/globals.css` | Add `--rt-*` typography tokens, `--rd-*` density tokens, `romma-scroll-area` + `romma-modal-backdrop` utilities |
| `src/lib/queries-client.js` | `getUnidades()`: add `foto_url` to SELECT |
| `src/lib/queries-server.js` | `getUnidadesDisponiveis()`: add `foto_url` to SELECT |
| `src/components/features/Unidades.js` | Replace dual-form with `UnifiedUnidadeModal`; add search/filter/metrics bar; apply tokens |
| `src/components/features/GestaoEdificios.js` | Drill-in unit click → `UnifiedUnidadeModal mode="edit"`; apply tokens |
| `src/components/features/Contratos.js` | Search, "vencendo" filter, countdown, progress bar, archive section; apply tokens |
| `src/components/features/Parcelas.js` | Renovar button + modal, financial summary, timeline layout; apply tokens |
| `src/components/features/portal/PortalDashboard.js` | Próximo vencimento block, PIX modal, confirm flow |
| `src/components/features/portal/ParcelsTable.js` | "Baixar Comprovante" button + `handleDownloadPDF`; accepts contrato/locatario props |
| `src/components/features/portal/ContratoCard.js` | Progress bar, grade-resumo layout; apply tokens |
| `src/components/features/UnidadePublicaCard.js` | Render `foto_url` image |
| `src/components/features/UnidadeDetailSheet.js` | Show foto in bottom-sheet |
| `src/app/signup/page.js` | `sobrenome`, `telefone` with mask, `confirmarSenha`, validations, success banner |
| `src/app/dashboard/layout.js` | `min-height: 0` scroll fix on main content flex container |
| `src/app/portal/dashboard/layout.js` | `min-height: 0` scroll fix |
| `next.config.mjs` | `images.remotePatterns` for Supabase Storage CDN |

---

## Data Flow Changes (v1.5 Additions)

### Storage Upload + Persist URL
```
UnifiedUnidadeModal (Client)
  → FileReader → local blob URL preview (no network)
  → User clicks Salvar
  → supabase-browser.storage.from('unidades-fotos').upload(path, file)
  → publicUrl returned from Storage
  → criarUnidade({ ...form, foto_url: publicUrl }) [Server Action]
      → supabaseAdmin INSERT unidades with foto_url column
  → onSuccess() → parent calls carregarDados() → getUnidades() refetch
```

### Renovar Contrato
```
Parcelas.js (Client)
  → "Renovar Contrato" button → modal with +6/+12/+24 options
  → renovarContrato(contratoId, meses) [Server Action, contratos.js]
      → authGuard → ownership chain verify
      → UPDATE contratos SET data_fim = nova_data_fim
      → INSERT new parcelas (append-only, numero continues from max existing)
  → { status: 200 }
  → Client re-fetches getParcelasByContrato(contratoId) + contrato
```

### PIX Payment — Locatário to Both Sides
```
PortalDashboard.js (Client, locatário session)
  → "Pagar Agora" on próximo vencimento → PIX modal (QR + copia-e-cola)
  → "Confirmar Pagamento" → confirmarPagamentoPix(parcelaId) [Server Action, portal.js]
      → getUser() → locatario ownership chain verify (locatario.usuario_id = user.id)
      → supabaseAdmin UPDATE parcelas SET status='paga', data_pagamento=today
  → { status: 200 }
  → PortalDashboard re-fetches getParcelasPortal(ct.id) → table updates to Paga

Proprietário side (passive, no realtime):
  → Next navigation to /dashboard/contratos/[id]
  → Parcelas.js useEffect → getParcelasByContrato() → shows Paga status
  → No live push (Realtime UPDATE limitation documented, acceptable)
```

---

## Suggested Build Order (Dependency-Aware)

**Step 1 — Design Tokens (globals.css)** — zero dependencies, everything builds on top
- Add `--rt-*` and `--rd-*` tokens to `:root`
- Add `romma-modal-backdrop` and `romma-scroll-area` @utility classes
- Add `images.remotePatterns` to `next.config.mjs`
- Risk: zero (additive only, no existing code changes)

**Step 2 — Schema Migrations** — must land before any feature reading/writing new columns
- `foto_url TEXT` on `unidades`
- `nome/sobrenome/telefone` on `proprietarios` (conditional on what's already there)
- Deploy to Supabase before writing dependent code

**Step 3 — Storage Bucket Setup** — depends on nothing; must exist before upload code
- Create `unidades-fotos` bucket in Supabase dashboard
- Configure bucket RLS (public SELECT, INSERT/DELETE for authenticated proprietário)

**Step 4 — Cadastro de Proprietário expansion** — isolated, depends only on step 2 (proprietarios schema)
- `src/app/signup/page.js`: new fields, masks, validations, success banner
- `src/actions/auth.js`: persist new fields
- Can be done in parallel with steps 3/5 if working in a branch

**Step 5 — UnifiedUnidadeModal + Storage upload** — depends on steps 1, 2, 3
- Create `src/components/features/UnifiedUnidadeModal.js`
- Modify `criarUnidade` / `editarUnidade` to accept `foto_url`
- Update `getUnidades()` SELECT
- Modify `Unidades.js` to use the new modal
- Apply tokens from step 1 to the Unidades screen

**Step 6 — Edifícios drill-in + modal reuse** — depends on step 5 (UnifiedUnidadeModal must exist)
- Modify `GestaoEdificios.js`: unit click → `UnifiedUnidadeModal mode="edit"`
- Apply tokens to Edifícios screen

**Step 7 — Dashboard + Contratos screen refino** — depends on step 1 (tokens); no backend changes
- Dashboard: ocupação block, cash-flow chart, atalhos rápidos
- Contratos: search, "vencendo" filter, countdown, progress bar, archive section
- No new Server Actions — queries already exist

**Step 8 — Renovar Contrato** — depends on step 7 (Parcelas screen in progress)
- Add `renovarContrato` to `src/actions/contratos.js`
- Add renovar modal and financial summary + timeline to `Parcelas.js`

**Step 9 — Portal PIX + Payment Sync** — depends on step 1 (tokens); independent of steps 5-8
- Create `src/actions/portal.js` with `confirmarPagamentoPix`
- Expand `PortalDashboard.js`: próximo vencimento, PIX modal, confirm flow
- Expand `ParcelsTable.js`: comprovante button stub (triggers step 10)

**Step 10 — Receipt PDF** — depends on step 9 (portal data in state; PIX flow exists)
- `npm install jspdf`
- Add `handleDownloadPDF` to `ParcelsTable.js`
- Pass `contrato` + `locatario` props down from `PortalDashboard`

**Step 11 — Public /unidades page** — depends on steps 2 + 3 (foto_url in DB and Storage URLs working)
- Update `UnidadePublicaCard.js` and `UnidadeDetailSheet.js` to render `foto_url`
- Update `getUnidadesDisponiveis` SELECT in `queries-server.js`
- Add tabs by edificio, sort, bottom-sheet, simular animation

**Scroll + modal cross-cutting fixes** — thread into each step, or do a final sweep:
- `min-height: 0` in layout shells (apply in step 1 or with each layout touched)
- `romma-modal-backdrop` on every modal (apply as each screen is refactored)

---

## Anti-Patterns to Avoid in v1.5

**Anti-Pattern 1: Importing supabaseAdmin in a Client Component**
Upload uses `supabase-browser` (anon key + user JWT + Storage RLS). The URL string is what crosses to the Server Action. Never proxy supabaseAdmin to the browser.

**Anti-Pattern 2: Calling gerar-parcelas Edge Function for contract renewal**
The Edge Function reads `data_inicio`→`data_fim` and regenerates ALL parcelas via upsert. This would collide with existing `paga` parcelas and is semantically wrong for append-mode renewal. Use direct `supabaseAdmin INSERT` of only the new parcelas in the Server Action.

**Anti-Pattern 3: Realtime subscription for PIX sync**
The known Supabase Realtime limitation (UPDATE not propagating via RLS for parcelas) makes this unreliable in production. The re-fetch-after-mutation pattern is correct. Do not add a Realtime channel for parcela status.

**Anti-Pattern 4: Per-component CSS variable declarations**
All `--rt-*` and `--rd-*` tokens belong in `globals.css`. Feature components consume via `var(--rt-body)` etc. in inline `style={{}}`. Never define a token inside a component.

**Anti-Pattern 5: Separate delete-then-upload for photo replacement**
On edit, if user picks a new photo, do: upload new → get new publicUrl → call `editarUnidade({ foto_url: newUrl })`. Then optionally delete the old file from Storage client-side. Never leave a dangling Storage file as a blocker for the DB update — the DB write is more important than Storage cleanup.

**Anti-Pattern 6: Calling gerarParcelas (Edge Function) after renovarContrato**
The Edge Function is not designed for partial/append generation. The `renovarContrato` Server Action handles its own parcela INSERT. No Edge Function call needed.

---

## Integration Points Summary

| Feature | Existing Files Modified | New Files Created | Schema Change |
|---------|------------------------|-------------------|---------------|
| Storage foto capa | `actions/unidades.js`, `queries-client.js`, `queries-server.js`, `next.config.mjs` | Migration `foto_url` | YES — `unidades.foto_url TEXT` |
| UnifiedUnidadeModal | `features/Unidades.js`, `features/GestaoEdificios.js` | `features/UnifiedUnidadeModal.js` | No |
| Renovar Contrato | `actions/contratos.js`, `features/Parcelas.js` | No | No |
| PIX sync | `features/portal/PortalDashboard.js`, `features/portal/ParcelsTable.js` | `actions/portal.js` | No |
| Receipt PDF | `features/portal/ParcelsTable.js` | No (jspdf dynamic import) | No |
| Typography/density tokens | `app/globals.css`, all feature components iteratively | No | No |
| Cadastro Proprietário | `app/signup/page.js`, `actions/auth.js` | Conditional migration for proprietarios | Conditional |

---

*Architecture research for: Romma v1.5 System Improvement & Design Augmentation*
*Researched: 2026-06-13 — grounded in direct inspection of: `src/actions/unidades.js`, `src/actions/contratos.js`, `src/actions/parcelas.js`, `supabase/functions/gerar-parcelas/index.ts`, `src/components/features/portal/PortalDashboard.js`, `src/components/features/Unidades.js`, `src/app/globals.css`, `src/app/signup/page.js`, `.planning/codebase/ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `INTEGRATIONS.md`, `CONCERNS.md`, `.planning/design/README.md`, `.planning/PROJECT.md`*
