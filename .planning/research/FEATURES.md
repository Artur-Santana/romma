# Feature Landscape — Romma v1.5 System Improvement & Design Augmentation

**Domain:** Single-instance corporate rental management — new screen features + global UI refino
**Researched:** 2026-06-13
**Confidence:** HIGH (driven by the authoritative design spec in .planning/design/README.md; no external guessing needed)
**Scope:** Strictly NEW v1.5 deltas. Features already shipped in v1.0/v1.1 are not re-analyzed.

---

## Feature Analysis

### 1. Renovar Contrato

**Category:** Table Stakes (for a rental management system to feel complete at banca)
**Complexity:** MEDIUM

**What it does:** From the Contrato · Parcelas screen, the Proprietário opens a modal and extends an active contract's `data_fim` by +6, +12, or +24 months via quick-select buttons, OR enters a custom number of months. The Edge Function `gerar-parcelas` (already exists) is invoked to append new Parcelas continuing from the last `numero` in the existing schedule.

**Expected states and behavior:**

- Quick-select buttons (+6, +12, +24) and a custom months input are mutually exclusive: selecting a quick button pre-fills the input; editing the input deselects the button.
- On confirm: Server Action calculates new `data_fim = old_data_fim + N months`, calls `gerar-parcelas` with the `contrato_id` — but only to generate parcelas from `old_data_fim + 1 day` onward. The Edge Function currently generates from `data_inicio`; the renovation action must pass the correct start offset OR the Edge Function must be called in a way that avoids re-creating already-existing parcelas. **Critical design decision:** either (a) update `data_fim` first then invoke `gerar-parcelas` in append mode if the function supports it, or (b) compute and INSERT new parcelas directly in the Server Action using the same closing-date logic (dia 1 of each subsequent month, vencimento = fechamento + 7 days, status = `futura`). Option (b) is safer given that the existing function generates the full schedule from `data_inicio` and has no "start from parcela N" parameter — a direct INSERT avoids calling it at all and avoids duplicate parcelas.
- `numero` sequence: new parcelas must continue from `MAX(numero) + 1` for that `contrato_id`.
- Closing-date rule for appended parcelas: `fechamento = dia 1 do mês`, `vencimento = fechamento + 7 days`, `status = 'futura'` — identical to the logic already in `gerar-parcelas` for parcelas 2+.
- After success: modal closes, `data_fim` updates in the grade-resumo, Parcelas timeline extends with the new rows, resumo financeiro recalculates totals, toast "Contrato renovado com sucesso".

**Edge cases — must define expected behavior for each:**

| Case | Expected behavior |
|------|-------------------|
| Custom months = 0 | Confirm button disabled; inline validation message "Insira ao menos 1 mês" |
| Custom months negative | Same as 0 — disabled + message |
| Custom months = non-integer (e.g. 1.5) | Field rejects non-numeric input; if typed, round down or reject |
| Max months not defined by spec | Suggest UI cap at 60 months (5 years) to prevent absurd schedules; treat as a soft warning, not a hard block — Proprietário can override |
| Contrato already has overdue (vencida) parcelas | Renovation proceeds normally — overdue parcelas are not cleared, only new ones appended. The financial summary shows them as inadimplência. No implicit cure. |
| Contrato status not `ativo` | Server Action must reject the request (return 400); modal should not be accessible from archived/cancelled contracts anyway — guard both at UI and server level |
| Data_fim already in the past | Edge case: a contract that expired but wasn't cancelled. Renovation should extend from `data_fim` into the future, appending parcelas from that reference date, not from today. The computed parcelas starting month must be after `old_data_fim`. |
| gerar-parcelas Edge Function unavailable | If using the edge function path, surface the error as a toast and do not commit `data_fim` update (keep atomic). If using direct INSERT path, wrap in a transaction-like pattern (update data_fim + insert parcelas in the same Server Action, reject all on error). |

**Dependencies on existing features:**
- `gerar-parcelas` Edge Function (Deno) — understand its interface before deciding approach (b) vs approach (a)
- `contratos` table: `data_fim` column updated via Server Action (supabaseAdmin)
- `parcelas` table: `contrato_id`, `numero`, `data_fechamento`, `data_vencimento`, `data_pagamento`, `status` columns
- Multi-tenant RLS: Server Action must scope the contrato fetch by `proprietario_id` before allowing update (IDOR guard, same pattern as cancelarContrato)
- Contrato · Parcelas page (`/dashboard/contratos/[id]`) must re-fetch data after renewal

---

### 2. Arquivo de Contratos Encerrados

**Category:** Table Stakes (history preservation is an expectation in any management system)
**Complexity:** LOW

**What it does:** Within the Contratos screen, a toggleable section lists contracts with `status IN ('encerrado', 'cancelado')`. Section is collapsed by default. Shows a count badge ("N encerrados") on the toggle trigger. Records are never deleted — status-only lifecycle is already the convention.

**Expected states and behavior:**

- Default: section collapsed, count badge visible ("3 encerrados")
- Toggle: click/tap expands the section, displaying archived contracts in the same card format as active ones but visually muted (lower opacity or a "Encerrado"/"Cancelado" badge instead of a status dot)
- Each archived contract card shows: Locatário name, Unidade name, `data_inicio`, `data_fim`, status badge, days-to-expiry replaced by the actual end date in a muted style
- No actions on archived cards: no "Renovar", no "Cancelar". Read-only display. A "Ver Parcelas" link/button navigating to `/dashboard/contratos/[id]` is useful and acceptable.
- Search/filter: the existing busca (tenant/unit name) and "Vencendo" filter apply only to the active contracts section. The archive section is unsorted initially; optionally sorted by `data_fim` descending (most recently ended first) — this is the natural useful order.
- Count: uses the same query as active contracts but filtered by status. Can be a single query that returns all and the client splits them, or two separate queries. Client-side split over a single loaded dataset is simpler.

**Edge cases:**

| Case | Expected behavior |
|------|-------------------|
| Zero archived contracts | Toggle not rendered (no "0 encerrados" button). Archive section does not appear. |
| All contracts are archived (none active) | Active section shows empty state; archive section always accessible |
| Contract was cancelled mid-term (parcelas still pending) | Contract appears in archive; its parcelas are still readable in the detail view; no special warning needed in the archive list |

**Dependencies on existing features:**
- `contratos` table with `status` ENUM — already has `encerrado`/`cancelado` values
- Existing query in `queries-client.js` or `queries-server.js` that fetches contratos — needs to include status filter or return all and let client split
- Contrato card component — reused with a read-only mode or reduced action set
- No new backend tables or columns needed

---

### 3. Foto de Capa da Unidade

**Category:** Differentiator (adds visual richness to both public listing and dashboard; exceeds typical TCC scope)
**Complexity:** MEDIUM-HIGH

**What it does:** In the Unidade modal (unified criar/editar), the Proprietário can upload a cover photo, preview it, replace it, or remove it. A "usar foto de exemplo" option sets a default architectural image. The URL is persisted in the `unidades` table (new column: `foto_capa_url`). Public listing cards and dashboard unit cards render the photo. Fallback for units without a photo: a placeholder with the Edifício name or a generic blueprint icon.

**Expected states and behavior:**

**Upload zone:**
- Drag-and-drop area + click-to-browse. On file selected: preview renders immediately via `URL.createObjectURL(file)` (client-side preview before upload).
- Accepted formats: JPEG, PNG, WebP. Max size recommendation: 5 MB (Supabase Storage default limit configurable). If file exceeds limit, show inline error "Imagem muito grande (máx 5 MB)".
- "Usar foto de exemplo" button sets a predefined URL (e.g. `/public/assets/hero-building.png` or a Supabase Storage asset) — no upload needed for this path.

**After photo exists (edit mode):**
- Show current photo as thumbnail (not the upload zone).
- Two actions: "Trocar foto" (re-opens file picker / zone) and "Remover foto" (sets `foto_capa_url = null`).
- Trocar: selecting a new file replaces the preview client-side; on save, the old file in Storage should be deleted and replaced (or a new path uploaded and the old orphaned — for simplicity at TCC scope, new upload + update URL is acceptable; orphan cleanup is pós-TCC).

**Persistence — Supabase Storage:**
- Bucket: `unidades-fotos` (public bucket for read access, authenticated for write)
- Path: `{proprietario_id}/{unidade_id}/capa.{ext}` — namespaced by proprietario prevents cross-tenant access, fixed filename means replacing is automatic (upload to same path = overwrite).
- Upload: `supabase.storage.from('unidades-fotos').upload(path, file, { upsert: true })` — upsert avoids errors on replace.
- After upload: call `supabase.storage.from('unidades-fotos').getPublicUrl(path)` to get the URL; persist in `unidades.foto_capa_url`.
- Remove: `supabase.storage.from('unidades-fotos').remove([path])` then set `foto_capa_url = null`.

**Display — public listing (/unidades):**
- Cards render `foto_capa_url` via `next/image` with `fill` or fixed dimensions. `sizes` prop must be set for responsive loading.
- Fallback: `onError` replaces src with a placeholder, OR render a styled div with the Edifício initial + muted background when `foto_capa_url` is null.
- "Consulte o Proprietário" masking (`valor_visivel = false`) is independent of photo — photo always shows regardless of value visibility.

**Display — dashboard cards (Unidades screen):**
- Same logic: photo if available, placeholder if not.
- Edit modal pre-fills `foto_capa_url` so the current photo shows in "edit" state.

**Edge cases:**

| Case | Expected behavior |
|------|-------------------|
| Upload fails (network error) | Toast error; `foto_capa_url` not updated; previous photo (if any) preserved |
| Storage bucket does not exist | Server Action or setup step must ensure bucket exists (create on first use or in migration) |
| `next/image` remote domain not whitelisted | Must add Supabase Storage hostname to `next.config.js` `images.remotePatterns` |
| Unidade deleted while photo exists | Orphaned file in Storage — acceptable for TCC scope; note as known debt |
| Two browser tabs edit the same unidade | Last write wins — no conflict resolution needed at TCC scope |
| foto_capa_url is null on public listing | Render placeholder; must never cause a broken `<img>` tag or a 404 that breaks layout |

**New schema change needed:** `ALTER TABLE unidades ADD COLUMN foto_capa_url TEXT;` — nullable, no default.

**Dependencies on existing features:**
- Unified criar/editar modal for Unidades (new in v1.5, but its own feature)
- Supabase Storage — requires bucket configuration in Supabase dashboard or via migration
- `next.config.js` `images.remotePatterns` — must add Supabase Storage domain
- `unidades` table — new column
- Multi-tenant: Storage path namespaced by `proprietario_id` enforces isolation; RLS on Storage bucket should restrict write to authenticated + own path

---

### 4. Busca / Filtros / Ordenação

**Category:** Table Stakes (any list view in a management system is expected to be searchable)
**Complexity:** LOW per screen (client-side over loaded data is the correct pattern here)

**Approach decision:** Client-side filtering over already-loaded data. Romma has a single Proprietário managing at most dozens of records in each collection — server-side filtering adds round-trips with no benefit at this data scale. All existing query functions return full datasets; filtering is a client-side `Array.filter` + `Array.sort` over the result. This matches the existing codebase pattern noted in CLAUDE.md ("Filtros/busca/ordenação podem ser client-side").

#### 4a. Unidades — dashboard screen

**Filters:**
- Busca por nome: `unidade.nome.toLowerCase().includes(query.toLowerCase())` — live filter on every keystroke (no debounce needed at this scale)
- Filtro de status: segmented/select — "Todos" / "Disponível" / "Alugada" — matches `unidade.status` ENUM values exactly
- Filtro por edifício: dropdown of edifício names — matches `unidade.edificio_id`

**Filter composition:** all three filters apply simultaneously (AND logic). Example: busca="Sala" + status="disponivel" + edifício="Torre A" → intersection.

**Empty state when filters return nothing:** "Nenhuma unidade encontrada para os filtros aplicados." with a "Limpar filtros" link.

**Edge cases:**
- Busca is blank: all records shown (no filter applied)
- Edifício dropdown populated from the same loaded dataset — if `edificios` query is separate, ensure it loads before filtering is available
- Filters persist within the session (local state) but reset on page navigation — do not persist to URL params unless explicitly specified

#### 4b. Contratos — dashboard screen

**Filters:**
- Busca por locatário/unidade: matches against `locatario.nome_razao_social` OR `unidade.nome` (the query must join/expand these when loading)
- Filtro "Vencendo" (≤7 dias): checkbox or toggle — shows only contracts where `data_fim` is within 7 days of today and status = `ativo`. Uses the same `getTodayLocal` helper already in the codebase to avoid UTC-3 off-by-one.

**Important:** the "Vencendo" filter applies only to active contracts. Archived contracts in the "Arquivo de encerrados" section are never flagged as "Vencendo."

**Edge cases:**
- "Vencendo" + busca query: both apply (AND). A contract vencendo+7d that matches the search term appears; one that doesn't match the search term is hidden.
- Date comparison: `data_fim` in DB is a date string (ISO). Compare using `getTodayLocal()` on the client — same pattern already used in dashboard metrics.

#### 4c. Locatários — dashboard screen

**Filters:**
- Busca por nome, e-mail ou documento: matches against `locatario.nome_razao_social`, `locatario.email`, AND `locatario.documento` — OR logic within the three fields. A single search box covers all three.
- Documento matching: user may type with or without mask characters (dots, dashes, slashes). Strip non-digits before comparing against `documento` (which is stored as digits-only per schema).

**Edge cases:**
- Partial document match: searching "123" matches any documento containing "123" — acceptable for a small dataset
- Empty results: "Nenhum locatário encontrado." with "Limpar busca" link

#### 4d. Página pública /unidades — Abas por edifício + Ordenação

**Tabs:** One tab per Edifício (name + count of available units in that building) + "Todos" tab. Tabs filter by `unidade.edificio_id`. Count badge shows only available units (`status = 'disponivel'`), not total.

**Ordenação (sort):**
- "Relevância" — default order (insertion order / id asc is fine; no algorithmic ranking needed)
- "Menor valor" — sort ascending by `valor_mensal`, nulls (masked values) last
- "Maior valor" — sort descending by `valor_mensal`, nulls last
- "Maior área" — sort descending by `area_m2`

**Masked value sorting:** units where `valor_visivel = false` have their `valor_mensal` hidden from the display but the value exists in DB. For the public listing, `valor_mensal` is already masked server-side — the sort by value may not be possible client-side if the masked value is withheld. Options: (a) send `valor_mensal = null` for masked units and sort nulls last; (b) sort by `valor_mensal` server-side and only mask the display value. Option (b) is better UX but requires a sort query parameter to the server. For TCC scope, option (a) (client-side, nulls last) is acceptable.

**Abas + Realtime:** Tab filtering must not break the existing Realtime subscription. The subscription should remain active regardless of active tab; when a unit disappears (rental event), it should vanish from its tab and the "Todos" count should update.

**Dependencies on existing features:**
- `useUnidadesRealtime.js` — must not be re-implemented; apply tab/sort filter on top of its returned data
- `valor_visivel` masking must be preserved in all sorted/filtered views
- Existing query returns `unidades` joined with `edificios` — `edificio.nome` needed for tab labels

---

### 5. Máscaras de Formulário

**Category:** Table Stakes (Brazilian government document numbers without formatting are unreadable and error-prone)
**Complexity:** LOW

**Masks required:**
- CPF: `000.000.000-00` (11 digits → formatted as `NNN.NNN.NNN-NN`)
- CNPJ: `00.000.000/0000-00` (14 digits → formatted as `NN.NNN.NNN/NNNN-NN`)
- Telefone: `(11) 99999-9999` (10 or 11 digits → `(NN) NNNNN-NNNN` for mobile, `(NN) NNNN-NNNN` for landline)

**Scope of application:**
- Locatário modal (convidar + editar): documento (CPF or CNPJ depending on `tipo`), telefone
- Cadastro de Proprietário (/signup): telefone
- Login/portal forms: no masks needed (email + password)

**Behavior rules:**

**Input masking:**
- Mask is applied on every `onChange` event: strip all non-digit characters from the input value, then re-insert the formatting characters at the correct positions.
- The raw value stored in state and submitted to the server must be digits only (strip mask before saving). This matches the schema: `documento` stored as digits-only.
- Cursor position: after re-masking, the cursor should remain at the logical position after the last typed digit. This is the trickiest part of manual masking; a library (`react-input-mask`, `imask`, or similar) handles this automatically.

**Paste behavior:**
- On paste, strip non-digit characters from pasted content, then apply mask. A user pasting "123.456.789-00" should see "123.456.789-00" (re-masked from stripped "12345678900").
- Pasting a full document number should result in a correctly masked value with the cursor at the end.

**Backspace/delete behavior:**
- Deleting a formatting character (dot, dash, slash) should delete the preceding digit, not just the formatting character. Libraries handle this; manual implementation must account for it.

**PF/PJ type toggle (documento re-format):**
- When `tipo` switches from `pf` → `pj`: current input is stripped to digits and re-masked as CNPJ format. If the digit count doesn't match the new format length (e.g. 11 digits when switching to CNPJ which needs 14), the field clears or shows a validation error.
- When `tipo` switches from `pj` → `pf`: same logic in reverse.
- The field label should update: "CPF" ↔ "CNPJ".
- Expected behavior when switching with partial input: clear the document field on toggle to avoid partial-digit confusion. This is the lowest-friction option.

**Validation (separate from masking):**
- CPF: must pass mod-11 check digit algorithm. Do not validate on every keystroke — validate on blur or on submit.
- CNPJ: must pass CNPJ check digit algorithm. Same timing.
- Telefone: minimum 10 digits (DDD + 8 digits for landline) to maximum 11 digits (DDD + 9 digits for mobile). Validate on blur/submit.
- Invalid document: inline error message below the field. Do not block typing.

**Library recommendation:** `imask` (IMask.js) or `react-input-mask`. Both are mature, handle cursor position correctly, and support Brazilian document masks out of the box. `imask` is more actively maintained as of 2025. Alternatively, a lightweight custom hook using `onKeyDown`/`onChange` is feasible given the fixed mask patterns — but cursor correction is manual work. For TCC timeline, use a library.

**Edge cases:**

| Case | Expected behavior |
|------|-------------------|
| User types letters | Characters are silently rejected (digits only accepted) |
| Paste includes letters (e.g. "CPF: 123.456.789-00") | Strip non-digits before masking; result: "123.456.789-00" |
| Toggle PF→PJ with a full CPF already typed | Document field clears; placeholder updates to CNPJ format |
| Server receives masked value instead of digits | Server Action must strip mask before DB insert — add a `stripMask` helper used before all Supabase calls |
| Telefone with 10 digits (landline) | Mask shows `(NN) NNNN-NNNN`; 11 digits shows `(NN) NNNNN-NNNN`; mask adjusts dynamically after 10th digit |

**Dependencies on existing features:**
- Locatário modal (convidar/editar) — mask is added to existing `documento` and `telefone` fields
- Cadastro de Proprietário form (new in v1.5) — `telefone` field
- Server Actions `criarLocatario`, `editarLocatario`, `criarProprietario` — must strip mask before DB write

---

### 6. Fluxo PIX de Pagamento (Portal)

**Category:** Differentiator (most TCC portals show history only; initiating payment from the portal is above baseline)
**Complexity:** MEDIUM

**What it does:** In the Portal do Locatário, on a Parcela with status `pendente` or `vencida`, the Locatário clicks "Pagar Agora". A modal opens showing a static QR Code image and a copy-paste PIX code string. The modal includes a note making explicit that payment processing is not real ("Ao confirmar, o painel do proprietário registrará esta parcela como paga. O pagamento real deve ser efetuado via seu banco."). The Locatário clicks "Confirmar pagamento" → the parcela is marked as `paga` with `data_pagamento = today` → modal closes → the portal UI refreshes to show the parcela as Paga → the Proprietário's dashboard also reflects the change.

**QR Code:** A static QR image (not a real BR Code payload). Per spec: "usa QR estático único" — a single fixed image asset. The PIX code string is a static placeholder string. The UI must be explicit that this is illustrative only.

**Sincronização Proprietário ↔ Locatário:**
- When the Locatário confirms payment, the Server Action calls `supabaseAdmin` to update `parcelas.status = 'paga'` and `parcelas.data_pagamento = today` — same mutation that the Proprietário uses when marking paid from the dashboard.
- Because both sides read from the same `parcelas` table, the Proprietário's dashboard will reflect the change on its next data fetch (page refresh or re-query). The design spec says this sync must work "via Supabase" — this is already satisfied by writing to the same table.
- Optional enhancement: if the Proprietário has the contract detail page open, a Supabase Realtime subscription on `parcelas` could push the update in real time without refresh. This is achievable (INSERT/UPDATE from admin bypasses the known RLS issue which only affects UPDATE on `unidades`). Whether to implement Realtime on `parcelas` is a complexity-vs-value call; a simple re-fetch on focus is acceptable for TCC.

**Modal states:**
1. Initial: QR image + PIX code + copy button + disclaimer note + "Confirmar pagamento" CTA + "Cancelar"
2. Copying PIX code: button shows "Copiado ✓" for 2 seconds then resets — standard clipboard copy pattern
3. Loading (after Confirmar): button disabled, spinner
4. Success: modal closes, toast "Pagamento registrado com sucesso", parcela row updates to Paga status
5. Error: toast error, modal remains open, user can retry

**Accessibility of "Confirmar pagamento":** The action is irreversible (marking a parcela as paid cannot be undone from the portal). The disclaimer note must be visible before the confirm button. No second confirmation modal — the disclaimer in the modal body is sufficient.

**Receipt (Comprovante):** Separate feature (see section 6a below).

**Edge cases:**

| Case | Expected behavior |
|------|-------------------|
| Parcela already `paga` | "Pagar Agora" button not shown; "Baixar Comprovante" shown instead |
| Parcela status `futura` | "Pagar Agora" not shown; future installments are not yet payable |
| Multiple `pendente` parcelas exist | Each has its own "Pagar Agora"; paying one does not auto-pay others |
| Locatário has no active contract | Portal shows "Nenhum contrato ativo" — modal never reachable |
| Server error on confirm | Toast error; `status` remains unchanged; user can retry |
| Locatário pays via bank but doesn't click confirm | Parcela remains `pendente` — the Proprietário must manually mark it paid from the dashboard. This is expected and documented by the disclaimer. |

**Dependencies on existing features:**
- `parcelas` table with `status`, `data_pagamento` columns — existing
- Server Action to mark parcela as paga — already exists for the Proprietário side; reuse or create a portal-scoped version that enforces the Locatário can only pay their own parcelas (RLS + auth check)
- Portal auth: Locatário session must be passed to the Server Action
- RLS: Locatário can read their own parcelas (already implemented); the write must also be scoped correctly — supabaseAdmin is used in Server Actions, so RLS bypass; the Server Action must verify the parcela belongs to the authenticated Locatário's contrato before updating

#### 6a. Comprovante / Recibo PDF

**Category:** Differentiator
**Complexity:** MEDIUM

**What it does:** On a `paga` Parcela in the Portal, a "Baixar Comprovante" button opens a receipt modal showing: valor, número da parcela (X/total), Locatário nome/documento, Unidade nome, Edifício nome, `data_pagamento`, `data_vencimento`, forma de pagamento (PIX), and a pseudo authentication code. A "Baixar PDF" button generates and downloads a PDF client-side.

**PDF generation approach:** Client-side PDF generation avoids a server endpoint. Options:
- `jsPDF` + `html2canvas`: renders the receipt modal's HTML to a canvas then to PDF. Simple but produces a rasterized PDF (not text-searchable). Acceptable for TCC.
- `@react-pdf/renderer`: generates vector PDFs with React components. Better output quality, but adds a larger dependency (~200 KB gzip). Best choice if PDF quality matters for banca impression.
- Print CSS + `window.print()`: zero dependencies, prints the receipt modal as PDF via the browser's print dialog. Simplest approach; no library needed. Works on all browsers. For TCC scope this is the pragmatic choice.

**Recommendation for TCC:** `window.print()` with print-specific CSS that hides everything except the receipt content and formats it for A4. Zero dependencies. Reliable. The "Baixar PDF" button triggers `window.print()`.

**Authentication code:** A static or pseudo-random string generated at receipt render time (e.g. `RMM-{contrato_id.slice(0,8)}-{parcela_numero}-{date}`). Not cryptographically meaningful — purely cosmetic for banca demonstration.

**Edge cases:**

| Case | Expected behavior |
|------|-------------------|
| Parcela not `paga` | "Baixar Comprovante" button not rendered |
| `data_pagamento` is null despite status `paga` | Defensive: show "Data não registrada". This should not happen if marking logic always sets `data_pagamento`. |
| Print dialog cancelled by user | No-op; receipt modal remains open |

**Dependencies on existing features:**
- Parcelas data including joined contrato + unidade + locatário fields
- Portal data-fetching must include all fields needed for the receipt
- If using `@react-pdf/renderer`, must add to package.json

---

### 7. Resumo Financeiro + Registrar Pagamento (Detalhe do Contrato)

**Category:** Table Stakes (financial summary is expected in any rental management tool)
**Complexity:** LOW-MEDIUM

**What it does:** In the Contrato · Parcelas screen (`/dashboard/contratos/[id]`), a summary panel shows: Valor Total do Contrato, Total Recebido, Em Aberto, and Inadimplência (overdue). When the Proprietário registers a payment, these numbers update in real time (client-side recompute after mutation).

**Calculation logic:**

| Metric | Formula |
|--------|---------|
| Valor Total do Contrato | `COUNT(parcelas) × valor_mensal` OR `SUM(valor expected per parcela)` — both are equivalent since Romma doesn't support variable installment values |
| Total Recebido | `SUM(valor_mensal) WHERE parcela.status = 'paga'` |
| Em Aberto | `SUM(valor_mensal) WHERE parcela.status IN ('pendente', 'futura')` |
| Inadimplência | `SUM(valor_mensal) WHERE parcela.status = 'vencida'` |

**Important:** `valor_mensal` lives in `contratos` or `unidades`, not in individual `parcelas`. The parcela row does not have its own amount column — all parcelas of a contract have the same value. Verify this in the schema: `parcelas` has no `valor` column. The amount must be read from `contratos.unidade → unidades.valor_mensal`.

**Inadimplência highlight:** If `COUNT(vencidas) > 0`, the Inadimplência number and its label render with `--danger` color token and a warning icon. If zero, the row is rendered normally (not hidden — show R$ 0,00 in neutral color so the user knows it's accounted for).

**Live update on payment registration:**
- Proprietário clicks "Registrar pagamento" on a `pendente` or `vencida` parcela → Server Action marks it `paga` → on success, client re-fetches parcelas (or does optimistic update) → resumo financeiro recomputes client-side from the updated parcela array → toast "Pagamento registrado".
- Recompute is a pure function over the parcela array: `computeResumoFinanceiro(parcelas, valorMensal)`. No additional server call needed for the summary — it derives from parcela statuses.

**Edge cases:**

| Case | Expected behavior |
|------|-------------------|
| All parcelas `futura` | Total Recebido = R$ 0; Em Aberto = total do contrato; Inadimplência = R$ 0 |
| Contract renovated (more parcelas added) | Summary recalculates automatically from full parcela list including new ones |
| valor_mensal changed after contract creation | Parcelas were generated based on the value at creation time; if `valor_mensal` on `unidades` changed since, the summary should use the value at the time of contract creation OR a stored value. This is ambiguous in current schema — `contratos` does not store `valor_mensal`; it references `unidade.valor_mensal` which is mutable. For TCC, use current `unidade.valor_mensal` and note this as known debt. |

**Dependencies on existing features:**
- Existing "Registrar pagamento" functionality on Parcelas — already exists in v1.1; this feature adds the summary panel on top
- `/dashboard/contratos/[id]` page + data fetching (parcelas joined to contrato + unidade)
- `getTodayLocal` helper for determining `vencida` status client-side (or rely on DB status which may be stale between status update cron if one exists — the existing app uses date-driven logic, so trust the `status` column)

---

### 8. Cadastro de Proprietário — Tela Completa

**Category:** Table Stakes (already shipped as minimal in v1.1; v1.5 expands to match the design spec)
**Complexity:** LOW

**What it does:** The `/signup` screen (already exists in v1.1 as a minimal form) is expanded to include: nome, sobrenome, email, telefone (com máscara), senha, confirmar senha. Single-instance model: if a Proprietário row already exists, the form redirects to /login with a message "Sistema já configurado."

**Validations (all required):**
- Nome: obrigatório, não pode ser só espaços, mín 2 caracteres
- Sobrenome: obrigatório, mín 2 caracteres
- Email: formato válido (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Telefone: mín 10 dígitos após strip de máscara (DDD + 8 dígitos), máx 11
- Senha: mín 6 caracteres (Supabase Auth minimum) — display inline strength hint is optional for TCC
- Confirmar senha: must match `senha` field exactly. Validate on blur of the confirmar field and on submit.

**Error display:** Below each invalid field (inline, not alert box). On submit with errors, scroll to first error.

**Success flow:** `supabase.auth.signUp` → insert into proprietario table via Server Action → banner "Verifique seu e-mail" (if email confirmation is on in Supabase) OR redirect to `/dashboard` (if email confirmation is off). The existing v1.1 implementation handles the auth flow; v1.5 adds the nome/sobrenome/telefone fields and validation.

**"Instance already configured" guard:** Server-side check before rendering the form (in the Server Component). If `SELECT COUNT(*) FROM proprietarios > 0`, redirect to `/login?msg=configurado`. This prevents a second browser tab from registering a second Proprietário.

**Edge cases:**

| Case | Expected behavior |
|------|-------------------|
| Confirmar senha filled before senha | Validate on submit only — avoid premature error before user types senha |
| Supabase email confirmation enabled | Show "Verifique seu e-mail" banner; do not redirect to dashboard yet |
| Signup succeeds but proprietario INSERT fails | User is created in auth.users but has no proprietario row. They can't access the dashboard (`is_proprietario` returns false). Recovery: delete the auth user and retry, OR have a fallback "complete setup" page. Note as known debt for TCC scope. |
| Telefone mask: user leaves field with 9 digits | Validation error on submit: "Telefone inválido (mín 10 dígitos)" |

**Schema note:** Current `proprietarios` table is not documented in CLAUDE.md — it stores `usuario_id` FK and presumably `nome`. The v1.5 form adds nome + sobrenome + telefone fields. The Server Action must be updated to INSERT these columns, which means a schema migration may be needed if the columns don't exist yet.

**Dependencies on existing features:**
- `/signup` route (already exists)
- `supabaseAdmin` for existence check + insert
- Telefone mask (Feature 5 above)
- Existing `is_proprietario` RPC must work after INSERT — verify the function checks the right table/column

---

## Feature Dependencies Map

```
Foto de Capa (3)
    └── requires ──> Unified criar/editar Unidade modal (v1.5 UI refino)
    └── requires ──> Supabase Storage bucket (new infra)
    └── requires ──> next.config.js remotePatterns update
    └── requires ──> schema migration: unidades.foto_capa_url

Renovar Contrato (1)
    └── requires ──> contrato detail page (/dashboard/contratos/[id]) (existing)
    └── requires ──> parcelas table + numero sequence (existing)
    └── decision ──> gerar-parcelas Edge Function interface review (may use direct INSERT instead)
    └── guards ──> multi-tenant IDOR check (same as cancelarContrato pattern)

PIX Flow (6)
    └── requires ──> Portal auth (existing)
    └── requires ──> parcelas write scoped to Locatário's contrato (new Server Action or extended existing)
    └── enhances ──> Resumo Financeiro (7) — sync via same DB row

Comprovante PDF (6a)
    └── requires ──> PIX Flow confirm (6) — receipt only on paga parcelas
    └── requires ──> portal data fetch includes contrato + locatário + unidade + edifício

Resumo Financeiro (7)
    └── requires ──> parcelas full list with status (existing query)
    └── requires ──> unidades.valor_mensal accessible from contrato detail query

Máscaras (5)
    └── required by ──> Cadastro de Proprietário (8) — telefone field
    └── required by ──> Locatário modal — CPF/CNPJ + telefone
    └── enhances ──> form validation accuracy

Cadastro Proprietário (8)
    └── requires ──> /signup route (existing, but needs expansion)
    └── requires ──> Máscaras (5) — telefone
    └── requires ──> schema check: proprietarios table columns

Busca/Filtros (4)
    └── requires ──> Arquivo de Encerrados (2) — filter scope separation on Contratos screen
    └── requires ──> Foto de Capa (3) — public listing sort must handle null foto_capa_url gracefully
    └── requires ──> Abas por edifício on /unidades — must not break useUnidadesRealtime hook

Arquivo de Encerrados (2)
    └── requires ──> existing contratos query returns all statuses (minor query change)
    └── no new schema or infra needed
```

---

## Table Stakes vs Differentiators Summary

| Feature | Category | Complexity | Phase Priority |
|---------|----------|------------|----------------|
| Busca/Filtros — Unidades dashboard | Table Stakes | LOW | P1 |
| Busca/Filtros — Contratos dashboard | Table Stakes | LOW | P1 |
| Busca/Filtros — Locatários | Table Stakes | LOW | P1 |
| Arquivo de Contratos Encerrados | Table Stakes | LOW | P1 |
| Resumo Financeiro (Contrato Detalhe) | Table Stakes | LOW | P1 |
| Máscaras CPF/CNPJ/Telefone | Table Stakes | LOW | P1 |
| Cadastro Proprietário — tela completa | Table Stakes | LOW | P1 |
| Renovar Contrato | Table Stakes | MEDIUM | P2 |
| Busca/Filtros — Página pública (abas + sort) | Table Stakes | LOW-MEDIUM | P2 |
| PIX Payment Flow (portal) | Differentiator | MEDIUM | P2 |
| Foto de Capa da Unidade | Differentiator | MEDIUM-HIGH | P2 |
| Comprovante PDF | Differentiator | MEDIUM | P3 |

---

## Anti-Features (Explicitly Out of Scope)

| Feature | Why Excluded | Note |
|---------|-------------|------|
| QR BR Code real (payload PIX) | Requires BR Code spec implementation + bank validation — functionality out of TCC scope | Use static QR image |
| Expandir contrato (add units) | Removed from spec at client request | Do not implement |
| Processamento real de pagamento | No payment gateway integration in TCC | UI must be explicit about simulation |
| Favoritar unidade / "X pessoas vendo agora" | Removed from spec | Do not implement |
| Medidor de adimplência por Locatário | Removed from spec | Do not implement |
| "Falar com o Proprietário" no portal | Removed from spec | Do not implement |
| Reajuste IGP-M | Removed from spec | Do not implement |
| Orfãos de Storage cleanup | No file management on unit delete | Note as known debt |
| Server-side search/filter | Not needed at Romma's data scale | Client-side is correct approach |
| Multi-step signup wizard | TCC scope — single form is sufficient | |
| Realtime on parcelas (proprietário view) | Nice-to-have; re-fetch on focus is sufficient | Optional enhancement if time permits |

---

## Testable Requirement Checklist

Each feature produces a verifiable outcome:

**Renovar Contrato:**
- [ ] Confirming +6 months updates `data_fim` by exactly 6 calendar months
- [ ] New parcelas have `numero` continuing from `MAX(numero)+1` of the contract
- [ ] New parcelas have `status = 'futura'`, `data_fechamento = dia 1 do mês`, `data_vencimento = fechamento + 7 days`
- [ ] Custom input of 0 or negative disables the confirm button
- [ ] Renewing a contract with overdue parcelas does not clear those parcelas
- [ ] Renovar action on a non-ativo contract returns HTTP 400

**Arquivo de Encerrados:**
- [ ] Toggle button shows count "N encerrados"
- [ ] Section hidden by default; visible after clicking toggle
- [ ] No action buttons (Renovar, Cancelar) rendered on archived contract cards
- [ ] "Ver Parcelas" link navigates to `/dashboard/contratos/[id]`
- [ ] Zero archived contracts: toggle button not rendered

**Foto de Capa:**
- [ ] Selecting a file shows preview immediately (before save)
- [ ] After save, `unidades.foto_capa_url` is populated with a Supabase Storage public URL
- [ ] "Usar foto de exemplo" sets a predefined URL without file upload
- [ ] "Remover foto" sets `foto_capa_url = null` and removes Storage file
- [ ] Public listing renders unit photo; units without photo show placeholder
- [ ] `next/image` renders without 404 or domain errors

**Busca/Filtros:**
- [ ] Busca on Unidades filters by `nome` on every keystroke
- [ ] Status filter "Disponível" shows only `status = 'disponivel'` units
- [ ] Edifício filter shows only units of selected `edificio_id`
- [ ] All three Unidade filters apply simultaneously (AND)
- [ ] Contratos "Vencendo" filter shows only contracts with `data_fim` within 7 days
- [ ] Locatários busca matches against nome, email, AND documento (OR logic)
- [ ] Documento search works when user types digits-only (without mask characters)
- [ ] Public tabs show count of available (not total) units per edifício
- [ ] Sort "Menor valor" orders units ascending by `valor_mensal`, masked units last

**Máscaras:**
- [ ] Typing 11 digits in CPF field formats as `NNN.NNN.NNN-NN`
- [ ] Typing 14 digits in CNPJ field formats as `NN.NNN.NNN/NNNN-NN`
- [ ] Switching tipo PF→PJ clears the documento field and updates label to "CNPJ"
- [ ] Pasting "123.456.789-00" into CPF field results in "123.456.789-00"
- [ ] Server Action receives digits-only value (mask stripped before submit)
- [ ] Invalid CPF (fails mod-11) shows inline error on blur

**PIX Flow:**
- [ ] "Pagar Agora" visible only on parcelas with status `pendente` or `vencida`
- [ ] Modal shows static QR image + PIX code + disclaimer note
- [ ] "Copiar código" copies PIX string to clipboard; button shows "Copiado ✓" for 2 seconds
- [ ] Confirmar marks `parcelas.status = 'paga'` and sets `data_pagamento = today`
- [ ] After confirm, portal parcela row updates to Paga status
- [ ] After confirm, Proprietário dashboard reflects the parcela as Paga on next load

**Comprovante PDF:**
- [ ] "Baixar Comprovante" button visible only on parcelas with `status = 'paga'`
- [ ] Receipt modal shows: valor, parcela X/total, locatário, unidade, edifício, data_pagamento, data_vencimento, forma PIX, auth code
- [ ] "Baixar PDF" triggers browser print dialog (or downloads a file)
- [ ] Receipt modal does not show "Pagar Agora" button

**Resumo Financeiro:**
- [ ] Total Recebido = SUM of valor_mensal for all `paga` parcelas
- [ ] Em Aberto = SUM for `pendente` + `futura` parcelas
- [ ] Inadimplência = SUM for `vencida` parcelas, highlighted in `--danger` color if > 0
- [ ] After Registrar Pagamento, all four numbers update without page reload

**Cadastro Proprietário:**
- [ ] Form has fields: nome, sobrenome, email, telefone (masked), senha, confirmar senha
- [ ] Submit with empty required field shows inline validation error
- [ ] Senha < 6 chars shows "Mínimo 6 caracteres"
- [ ] Confirmar senha mismatch shows "Senhas não coincidem"
- [ ] If Proprietário already exists, page redirects to `/login?msg=configurado` before form renders
- [ ] Successful signup creates auth.users entry + proprietario table row

---

## Sources

- `.planning/design/README.md` — authoritative design spec (HIGH confidence)
- `.planning/PROJECT.md` — existing features inventory, schema, business rules (HIGH confidence)
- `CLAUDE.md` — schema, conventions, parcela generation logic, terminology (HIGH confidence)
- Supabase Storage documentation — upload/getPublicUrl/remove API patterns (MEDIUM confidence, cross-referenced with Supabase JS v2 docs)
- IMask.js documentation — Brazilian document mask patterns (MEDIUM confidence)
- jsPDF / @react-pdf/renderer / window.print() tradeoffs — standard web PDF generation approaches (MEDIUM confidence)
