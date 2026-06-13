# Pitfalls Research

**Domain:** Adding new capabilities to shipped Next.js 16 + Supabase multi-tenant rental system
**Milestone:** v1.5 — System Improvement & Design Augmentation
**Researched:** 2026-06-13
**Confidence:** HIGH — all findings grounded in the actual codebase (actions/, lib/, globals.css, Edge Function), design handoff README, and PROJECT.md known-debt log.

---

## Critical Pitfalls

### Pitfall 1: Storage RLS — Proprietário IDOR via Public Bucket

**What goes wrong:**
A Supabase Storage bucket created as "Public" bypasses RLS entirely. Any authenticated user (including a Locatário who knows or guesses the object path) can read another proprietário's cover photos, or a second proprietário in multi-tenant mode can read/overwrite the first's files by constructing the path.

The cover-photo feature will store images under a path like `unidade-covers/<unidade_id>/cover.jpg`. Without storage.objects RLS, a Locatário browsing the portal can construct that URL and fetch the image directly.

**Why it happens:**
Developers create a bucket as "Public" for simplicity (avoids signed-URL generation), not realising Public buckets skip ALL storage.objects policies. The Supabase dashboard defaults to Public when creating via UI.

**How to avoid:**
- Create the bucket as **Private**.
- Add storage.objects SELECT policy: `auth.uid() IN (SELECT proprietarios.usuario_id FROM proprietarios JOIN edificios ON edificios.proprietario_id = proprietarios.usuario_id JOIN unidades ON unidades.edificio_id = edificios.id WHERE unidades.id = (storage.foldername(name))[1]::uuid)`.
- For the public `/unidades` page that must show cover photos to anonymous visitors: use Supabase's `createSignedUrl` called from a Server Component (not client), cached for the request, OR store photos in a separate `public-covers` bucket with a policy restricting writes to proprietário only while allowing anon reads — the latter is simpler for a TCC single-tenant instance.
- The `deletarUnidade` Server Action (src/actions/unidades.js line 68) currently does `supabaseAdmin.from('unidades').delete()` with no storage cleanup. Add `supabaseAdmin.storage.from('unidade-covers').remove([...])` inside the same Server Action before the DB delete.

**Warning signs:**
- Bucket created via Supabase dashboard without explicitly setting policies.
- Cover photo URL in the browser dev tools shows `<project>.supabase.co/storage/v1/object/public/...` — if `public` is in the path, the bucket is public and any URL is guessable.
- `next/image` remotePatterns added for the raw Supabase Storage domain without considering whether the bucket should be public.

**Phase to address:**
Storage phase (Unidades photo upload). Must be the first task of that phase, before writing any upload logic.

---

### Pitfall 2: Storage — next/image remotePatterns Missing or Overly Broad

**What goes wrong:**
`next/image` requires explicit `remotePatterns` in `next.config.js`. Without the pattern for the Supabase Storage URL, every `<Image src="https://...supabase.co/storage/...">` throws a build/runtime error and the image is never shown. Developers add the pattern only to discover that `hostname: '*.supabase.co'` is overly broad and Vercel warns about it.

**Why it happens:**
The pattern must match exactly — the Supabase project URL is `vfymttcajeyhrmsyhrtj.supabase.co`, so `hostname` must be `vfymttcajeyhrmsyhrtj.supabase.co`, not a wildcard.

**How to avoid:**
Add to `next.config.js`:
```js
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'vfymttcajeyhrmsyhrtj.supabase.co',
      port: '',
      pathname: '/storage/v1/object/**',
    },
  ],
},
```
If signed URLs are used, the path segment `/sign/` replaces `/public/` — make sure the pathname glob covers both: `/storage/v1/object/**`.

**Warning signs:**
- `Error: Invalid src prop on next/image, hostname "vfymttcajeyhrmsyhrtj.supabase.co" is not configured` in the console.
- Images load in local dev (where next/image is more lenient with unoptimized) but fail in production on Vercel.

**Phase to address:**
Storage phase, immediately after bucket creation and before wiring `<Image>` components.

---

### Pitfall 3: Storage — Orphaned Files on Unit Delete

**What goes wrong:**
`deletarUnidade` deletes the Unidades DB row but leaves the cover photo in Storage. Over time Storage fills with unreferenced files. Worse: if the same UUID is somehow reused (extremely unlikely with UUIDs but the pattern is bad), a new unit picks up the old photo.

**Why it happens:**
The current action (src/actions/unidades.js line 68) does not know about Storage — it was written before Storage existed for this project.

**How to avoid:**
Extend `deletarUnidade` to call `supabaseAdmin.storage.from('unidade-covers').list('<unidade_id>/')` then `remove()` before the DB delete. Wrap both in a try-catch; log Storage removal errors but do not block the DB delete (Storage orphan is survivable; failed DB delete is not).

**Warning signs:**
- Supabase Storage dashboard shows objects under paths for deleted unidade IDs.
- No Storage.remove() call adjacent to the unidades.delete() call in the action.

**Phase to address:**
Storage phase, as part of writing the upload Server Action (write deletion cleanup at the same time).

---

### Pitfall 4: Renovar Contrato — Non-Atomic Parcelas Generation Made Worse

**What goes wrong:**
The existing `criarContrato` + `gerarParcelas` flow is already non-atomic (PROJECT.md known debt: "criarContrato + gerarParcelas não atômicos"). `renovarContrato` adds a third step: extend `data_fim` on the contrato row, then call `gerar-parcelas` Edge Function to append new parcelas. If the Edge Function call fails after `data_fim` is updated, the contrato shows a longer term but has no parcelas for the extended period — a permanent inconsistency.

The existing Edge Function uses `upsert({ onConflict: 'contrato_id,numero' })` which is idempotent on number — this is good. But `renovarContrato` will extend `data_fim` and call the Edge Function with the original contrato dates. The Edge Function re-reads `data_fim` from the DB, so if the update succeeded it will generate the right set. However it re-generates ALL parcelas from the start, and any existing paid parcelas get upserted with `status: 'futura'` — overwriting the paid status.

**Why it happens:**
The Edge Function was designed for initial generation. Re-calling it for renewal overwrites historical parcela status. A naive approach of calling the same function for renewal is tempting because it already exists.

**How to avoid:**
Write `renovarContrato` as a dedicated Server Action that:
1. Validates the contrato belongs to the calling proprietário (same ownership chain: parcela → contrato → unidade → edificio → proprietario_id).
2. Updates `data_fim` on contratos.
3. Calls a NEW Edge Function endpoint `renovar-parcelas` (or a new export of the same function) that accepts `contrato_id` + `nova_data_fim` and only inserts parcelas with `numero > MAX(existing numero)` for that contrato, skipping re-generation of existing rows.
4. If the Edge Function call fails, expose the error to the user with a "retry" option — do NOT silently swallow.

Alternatively: skip the Edge Function entirely for renewal and generate the extension parcelas directly in the Server Action using `supabaseAdmin`, since the action already has service-role access. This eliminates the two-step non-atomicity.

**Warning signs:**
- The renewal Server Action calls `gerarParcelas(contratoId)` (the existing function) after updating `data_fim`.
- No check for `MAX(numero)` before inserting new parcelas.
- Paid parcelas showing `status: 'futura'` after a renewal.

**Phase to address:**
Contratos/Parcelas renewal phase. The inline generation approach (skip the Edge Function re-call) is strongly preferred to avoid the two-failure-mode risk.

---

### Pitfall 5: Renovar Contrato — Timezone Bug on Date Extension

**What goes wrong:**
PROJECT.md documents that the project already hit a UTC-3 timezone bug (`getTodayLocal vs toISOString`). The renewal date math extends `data_fim` by +N months. Using `new Date(contrato.data_fim)` and then `setMonth(m + 6)` in the browser/Node environment produces a date in UTC midnight. When persisted as `toISOString().split('T')[0]`, Brazilian users working at midnight UTC-3 see the date shift one day.

More concretely: `data_fim = '2026-12-31'`. `new Date('2026-12-31')` parses as `2026-12-31T00:00:00.000Z` which is `2026-12-30T21:00:00` in UTC-3. Adding 6 months produces `2027-06-30T21:00:00 UTC-3` → `2027-07-01T00:00:00 UTC` → `toISOString().split('T')[0]` = `'2027-07-01'` — one day wrong.

**Why it happens:**
JavaScript `new Date('YYYY-MM-DD')` treats bare date strings as UTC midnight (not local midnight). All subsequent arithmetic inherits the UTC base.

**How to avoid:**
Parse dates as local by appending `T12:00:00` (noon avoids DST edge case): `new Date(dateString + 'T12:00:00')`. This is the same pattern the project already uses in `getTodayLocal`. Apply consistently in `renovarContrato`. Alternatively do all date math as pure string manipulation (split year/month/day, do integer arithmetic, reformat) without ever constructing a Date object.

**Warning signs:**
- `new Date(contrato.data_fim)` anywhere in the renewal code without `T12:00:00` suffix.
- Test: create a contract ending 2026-12-31, renew by 6 months, check if `data_fim` becomes `2027-06-30` or `2027-07-01`.

**Phase to address:**
Contratos/Parcelas renewal phase. Add date test cases covering month-end boundaries.

---

### Pitfall 6: PIX Payment Sync — Locatário IDOR on Parcelas Update

**What goes wrong:**
The "Pagar Agora" modal lets the Locatário confirm payment, which must trigger a `marcarParcelaComoPaga` equivalent from the portal. The existing `marcarParcelaComoPaga` Server Action (src/actions/parcelas.js) requires `isProprietario(supabase)` — a Locatário call will return 403. A new portal-side payment action is needed.

The risk: if the new portal action does not verify that the parcela being marked belongs to the authenticated Locatário's own contrato, any Locatário who knows another parcela's UUID can mark it as paid — IDOR. The current v1.1 IDOR closure (MT-03) covers Proprietário write paths; the Locatário write path for payment is NEW and has no precedent in the codebase.

**Why it happens:**
The pattern in existing Locatário queries (getParcelasPortal, getContratoAtivoByLocatario) is read-only. The first Locatário write action is payment confirmation. Developers may copy the proprietário action pattern and forget to swap the ownership check.

**How to avoid:**
Create `src/actions/portal.js` with `marcarParcelaComoPagaPortal(parcelaId)`:
1. Auth: `supabase.auth.getUser()` — if no user, 401.
2. `isProprietario` check — if TRUE, reject (404, not 403, to avoid leaking that this endpoint exists for proprietários).
3. Ownership chain: `parcelas → contrato → locatario → usuario_id`. Fetch `parcelas.contrato_id`, then `contratos.locatario_id`, then check `locatarios.usuario_id === user.id`. Use `supabaseAdmin` for the read (bypasses RLS for the ownership check, same pattern as proprietário actions). Only proceed if the chain matches.
4. Update with `supabaseAdmin.from('parcelas').update({status:'paga', data_pagamento: today}).eq('id', parcelaId).in('status', ['pendente','vencida'])`.

Do NOT accept `data_pagamento` from the client — always use server-side today's date (UTC date is fine for payment recording).

**Warning signs:**
- The portal payment action calls `supabaseAdmin.from('parcelas').update(...)` without a prior ownership chain check.
- The action uses the anon client (supabase-browser) with RLS to enforce ownership — RLS on `parcelas` is not currently written for Locatário writes, so it may silently allow any authenticated user to update any row.
- No test case: "Locatário A attempts to pay Locatário B's parcela."

**Phase to address:**
Portal payment phase. Write the IDOR test (Playwright or unit) as the first acceptance criterion, before writing the happy path.

---

### Pitfall 7: Multi-Tenant Regression — New Write Paths Missing proprietario_id Scope

**What goes wrong:**
v1.1 closed IDOR for ALL existing write paths (MT-03). v1.5 adds new write paths: cover photo upload (unidade), renovar contrato, portal payment confirmation. Each new path must independently re-verify the ownership chain. The risk is "borrowing" a simpler pattern from an early file (e.g., a path that only checks `isProprietario` without verifying the specific resource belongs to that proprietário) because the developer sees the 403 guard and assumes that's enough.

The ownership chain for each new path:
- Cover photo upload: `unidade_id → edificio.proprietario_id === user.id` (same as editarUnidade — use that as the reference).
- Renovar contrato: `contrato_id → unidade → edificio.proprietario_id === user.id` (same as cancelarContrato — use that as the reference).
- Portal payment: `parcela_id → contrato → locatario.usuario_id === user.id` (no precedent — must be written fresh).

**Why it happens:**
Each v1.1 write action required a full ownership chain. Developers under deadline pressure add only `isProprietario` as the guard and miss the resource-level check, which is the actual IDOR vector.

**How to avoid:**
Every new Server Action file must follow the ownership chain pattern. Before writing the action logic, write the chain as comments: "// 1. auth, 2. isProprietario, 3. fetch resource, 4. verify resource.proprietario_id === user.id." Treat missing step 3+4 as a blocker. Reviewer checklist: grep new action files for `.eq('proprietario_id', user.id)` — if absent, the chain is broken.

**Warning signs:**
- New Server Action contains `authGuard()` but no subsequent `eq('proprietario_id', user.id)` call.
- New portal action contains `isProprietario` check (wrong — Locatários are NOT proprietários).
- Any action that accepts a resource ID from the client and updates/deletes it without verifying ownership.

**Phase to address:**
Every phase that adds a new write path. The IDOR checklist must be in each phase's acceptance criteria.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Call existing `gerarParcelas` Edge Function for contract renewal | No new code | Overwrites paid parcela status with 'futura' on upsert | Never — write a dedicated renewal path |
| Public Storage bucket for cover photos | No signed-URL generation needed | Anonymous read of any file path; no RLS enforcement | Only if a separate policy allows anon reads on the public page bucket explicitly |
| Skip Storage file cleanup in deletarUnidade | Simpler action | Orphaned files accumulate; Storage quota used | Never for production; acceptable in TCC dev seed only |
| Import supabaseAdmin in a Client Component to skip the Server Action round-trip | Fewer files | Service role key exposed in browser bundle | Never |
| Use `toISOString()` directly for date arithmetic without noon-offset | Familiar API | UTC-3 timezone shifts dates by one day at midnight | Never in Brazil-timezone app |
| PDF generation with a heavy SSR library (e.g., pdfmake loaded in `page.js`) | Single import | SSR crash ("window is not defined") on first render | Never — PDF libs require 'use client' or dynamic import with `ssr: false` |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Storage upload | Upload file directly from Client Component using anon key | Upload via Server Action using supabaseAdmin; return URL to client |
| Supabase Storage + next/image | Use raw storage URL without adding remotePatterns | Add exact hostname `vfymttcajeyhrmsyhrtj.supabase.co` to next.config.js remotePatterns |
| Client-side PDF (jsPDF / @react-pdf/renderer) | Import at module level in a Server Component or layout.js | Dynamic import with `ssr: false` inside a 'use client' component: `const { jsPDF } = await import('jspdf')` |
| Supabase Realtime + payment sync | Assume proprietário dashboard updates live when Locatário pays | Realtime UPDATE events on parcelas may be filtered by RLS (known limitation). Set UX expectation: propriétario sees update on reload, not in real time. Document in UI |
| supabaseAdmin in new actions | Copy action file and keep supabaseAdmin import without 'server-only' guard | The lib file already has `import 'server-only'` — the guard works only if you import from `@/lib/supabaseAdmin`. Never re-export from a client-accessible file |
| Edge Function CORS for renewal | Add a new Edge Function endpoint and forget to add its origin to ALLOWED_ORIGINS | Copy the CORS pattern from gerar-parcelas/index.ts — the APP_URL env var already handles it |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching full parcelas list for timeline on every keystroke filter | Search input causes N re-fetches | Filter client-side over already-loaded data (existing pattern in codebase) | At ~200+ parcelas per contract |
| Loading PDF library (jsPDF ~300KB) on every portal page load | Portal slow initial load | Dynamic import with `ssr: false` + lazy load triggered by button click, not page mount | Immediately — every user |
| Unoptimized cover photo (original camera resolution) served via next/image without size constraints | Dashboard unidade grid slow to load | Enforce max upload size (2MB) client-side before upload + set `width` and `height` on `<Image>` components | At ~10+ units with photos |
| Supabase Storage `list()` inside render loop | N×M list calls for N buildings × M units | Batch: fetch all cover photo URLs once, map by unidade_id | At ~5+ buildings |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Locatário portal payment action without ownership chain | IDOR — Locatário marks another user's parcela as paid | Ownership chain: parcela → contrato → locatario.usuario_id === auth user | 
| Storage bucket set to Public | Anonymous file read; guessable paths expose all unit photos | Create bucket as Private; use signed URLs or separate public bucket with explicit anon-read policy only |
| supabaseAdmin imported in a 'use client' file | Service role key shipped in browser bundle | `import 'server-only'` in supabaseAdmin.js already prevents this at build time — do not bypass with dynamic require() |
| PDF receipt generation including internal IDs or raw UUID | Information leakage; UUIDs could be used to probe other records | Use sequential display numbers (parcela.numero) and masked locatário info in PDF; never include raw UUIDs in downloadable files |
| Cover photo upload accepting any MIME type | Storage of executable/malicious files | Validate `file.type.startsWith('image/')` AND `file.size < 2_000_000` client-side BEFORE upload; validate again server-side via Server Action before calling storage.upload |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Animation `opacity:0` as fill-mode final state | UI element disappears permanently in print, screenshot, or paused render — documented in design README | Always animate FROM hidden TO visible; set `animation-fill-mode: forwards` only on entrance, use `animation-fill-mode: none` or cleanup with JS on exit animations |
| Tailwind v4 token rollout applied only to some screens | Inconsistent type scale — design handoff's 8-token scale (metric/title/section/subhead/body/data/label/meta) visible on some screens but not others | Add the 8 tokens as CSS custom properties in globals.css in ONE commit; apply across all screens in that same phase before shipping |
| Form mask cursor-jump on controlled input | User types "123" and cursor jumps to end | Use `e.target.setSelectionRange` to restore cursor position after mask transformation, or use an uncontrolled input with a ref-based mask |
| Modal using `position:absolute` inside a flex container on mobile | Modal clips at container edge, not centered on viewport | Use `position:fixed; inset:0` — documented in design README; double-check existing modals were not converted during v1.1 scroll fix |
| "min-height:0" scroll fix applied to wrong element | Scroll still broken in new screens | The fix must be on the SCROLLABLE flex child (not the parent). Chain: `html, body { height: 100% }` → layout wrapper `height: 100%` → scroll container `flex: 1; min-height: 0; overflow-y: auto` |
| PIX payment modal showing raw "payment not processed" note in small print | Banca demo looks unfinished | Make the payment-simulation note explicit and well-styled — "Ao confirmar, o painel do proprietário exibirá esta parcela como Paga. O processamento real do PIX ocorre fora do sistema." This is a feature of the TCC scope, not a limitation to hide |
| CPF→CNPJ re-mask on type toggle re-formats value incorrectly | Digits from CPF mask (11 digits) fed into CNPJ mask (14 digits) produce wrong output | On type toggle, strip all non-digits first, then apply the new mask. Schema stores digits-only (CLAUDE.md confirmed); strip on submit too |

---

## "Looks Done But Isn't" Checklist

- [ ] **Storage upload:** Verify bucket is Private AND storage.objects RLS policy exists before calling it "done". Check in Supabase dashboard, not just by testing happy path.
- [ ] **Cover photo deletion:** Open Supabase Storage dashboard, delete a unidade, confirm the file is gone. The DB row deletion succeeding is not enough.
- [ ] **Renovar contrato:** Verify that parcelas marked as 'paga' BEFORE renewal still show `status: 'paga'` AFTER renewal. Upsert must not overwrite paid parcelas.
- [ ] **Portal payment IDOR:** Playwright test — log in as Locatário A, attempt to call marcarParcelaComoPagaPortal with a parcela_id belonging to Locatário B's contract. Expect 404 (not 200, not 403).
- [ ] **Proprietário payment visibility:** After Locatário pays, reload the dashboard's parcelas view (not just the portal). Confirm status shows 'paga'. This confirms the DB update, not just local state.
- [ ] **PDF in production:** "Baixar PDF" button works on Vercel (not just local dev). Dynamic import with ssr:false can silently fail in edge/serverless if the library bundle is too large — test on production URL.
- [ ] **next/image cover photos on Vercel:** Cover photos load on romma-alpha.vercel.app, not just localhost. remotePatterns must be in next.config.js and deployed.
- [ ] **Mobile scroll fix:** Open new screens on an actual 375px viewport (or device). Scroll past the fold. The bottom nav bar (new in v1.5) must remain visible (not scrolled off).
- [ ] **Tailwind v4 token rollout:** Run a visual check on ALL 11 screens after the typography token phase. Look for any screen still using the old hard-coded px values (18px data, 10px label were the documented offenders).
- [ ] **Form masks — submit strips to digits:** Submit a Locatário form with a masked CPF "123.456.789-01" and verify that the DB `documento` column stores `12345678901`, not the masked string. Check via Supabase table editor.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Public bucket deployed to production | MEDIUM | Supabase dashboard → Storage → bucket settings → set to Private → add RLS policies → no re-deploy needed (Supabase-side change) |
| Paid parcelas overwritten by renewal upsert | HIGH | Write a one-off Supabase SQL migration to restore status from a backup or from data_pagamento (if not null → set status 'paga'); communicate to users |
| supabaseAdmin key leaked in bundle | CRITICAL | Rotate SUPABASE_ROLE_KEY immediately in Supabase dashboard + Vercel env vars; re-deploy; audit logs |
| orphaned Storage files (missed cleanup) | LOW | Run a Supabase Storage cleanup script: list all objects, compare with unidades table, delete objects with no matching unidade_id |
| Timezone-shifted data_fim on renewals | MEDIUM | Data correction migration: `UPDATE contratos SET data_fim = data_fim - interval '1 day' WHERE data_fim was affected`; requires knowing the affected date range |
| Modal not centered on mobile (position:absolute) | LOW | CSS-only fix: change to `position:fixed; inset:0`; no backend change |
| Animation opacity:0 disappearing in print | LOW | Add `@media print { * { animation: none !important; opacity: 1 !important; } }` to globals.css |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Storage Public bucket IDOR | Storage / Unidades cover photo phase (first task) | Supabase dashboard shows bucket is Private + RLS policy exists |
| next/image remotePatterns missing | Storage / Unidades cover photo phase | Cover photos load on romma-alpha.vercel.app |
| Orphaned Storage files on delete | Storage / Unidades cover photo phase | Delete a unit, check Storage dashboard for orphan |
| Renovar contrato non-atomicity | Contratos/Parcelas renovation phase | Paid parcelas retain 'paga' status after renewal |
| Timezone bug on date extension | Contratos/Parcelas renovation phase | Unit test: extend 2026-12-31 by 6 months → expect 2027-06-30 |
| PIX Locatário IDOR | Portal payment phase (write IDOR test first) | Playwright: cross-tenant parcela update attempt returns 404 |
| Multi-tenant regression on new write paths | Every phase with a new write path | Grep new action files: each has `.eq('proprietario_id', user.id)` or equivalent ownership chain |
| PDF SSR crash | Portal PDF/receipt phase | `npm run build` succeeds; PDF generates on Vercel URL |
| Tailwind v4 token rollout regressions | Global typography/density phase (apply all tokens in one commit) | Visual check all 11 screens; no hard-coded px type sizes remain |
| Animation opacity:0 fill state | Global typography/density phase + any animation work | Screenshot/print check on completed screens |
| Form mask cursor jump + digits-only storage | Locatários masks phase | Input test: type into masked field; DB shows digits only after submit |
| Mobile scroll + modal centering regressions | Global scroll/modal fix phase (early) | Test new screens on 375px; bottom nav visible; modals center on viewport |
| Realtime stale read (proprietário post-payment) | Portal payment phase | Document in UX (tooltip/note); no code fix available without Realtime policy change |

---

## Sources

- Codebase: `src/actions/parcelas.js`, `src/actions/contratos.js`, `src/actions/unidades.js` — ownership chain patterns, existing IDOR closures
- Codebase: `supabase/functions/gerar-parcelas/index.ts` — upsert behavior, date handling
- Codebase: `src/lib/queries-client.js` — Locatário read patterns (read-only precedent)
- `.planning/PROJECT.md` — known debt (non-atomic criarContrato+gerarParcelas, Realtime UPDATE limitation, timezone fix history)
- `.planning/design/README.md` — animation fill-state warning, scroll fix `min-height:0`, modal `position:fixed` requirement, mask formats, digits-only storage
- `src/app/globals.css` — confirmed `--radius: 0`, token structure, hardcoded literals that break on light themes (documented inline as pitfalls in the file itself)
- Supabase Storage docs (official): bucket access types, storage.objects RLS, signed URLs
- Next.js 16 docs: `remotePatterns` config, dynamic import with `ssr: false`

---
*Pitfalls research for: Adding v1.5 features to Romma (Next.js 16 + Supabase multi-tenant rental TCC)*
*Researched: 2026-06-13*
