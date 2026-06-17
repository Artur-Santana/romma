# Phase 25: Portal do Locatário — PIX & Recibo - Pattern Map

**Mapped:** 2026-06-17
**Files analyzed:** 8 new/modified files
**Analogs found:** 8 / 8

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/actions/parcelas.js` (add `confirmarPagamentoLocatario`) | server-action | request-response | `src/actions/parcelas.js` `marcarParcelaComoPaga` (same file) | exact |
| `test/unit/actions/parcelas.test.js` (add `confirmarPagamentoLocatario` describe) | test | — | `test/unit/actions/parcelas.test.js` existing `marcarParcelaComoPaga` describe | exact |
| `src/lib/queries-client.js` (add `getTodasParcelasPortal`) | utility | CRUD | `src/lib/queries-client.js` `getParcelasPortal` lines 141–150 (same file) | exact |
| `src/components/features/portal/PortalDashboard.js` (extend) | component | request-response | self (existing file) | exact |
| `src/components/features/portal/ContratoCard.js` (extend) | component | transform | self (existing file) | exact |
| `src/components/features/portal/ParcelsTable.js` (extend) | component | transform | self (existing file) | exact |
| `src/components/features/portal/VencimentoDestaque.js` (NEW) | component | transform | `src/components/features/portal/ContratoCard.js` | role-match |
| `src/components/features/portal/PixModal.js` (NEW) | component | request-response | `src/components/ui/ConfirmDialog.js` + `src/components/features/LocatariosDesktop.js` lines 342–394 | role-match |

---

## Pattern Assignments

### `src/actions/parcelas.js` — add `confirmarPagamentoLocatario`

**Analog:** `src/actions/parcelas.js` `marcarParcelaComoPaga` (lines 1–46)

**File header / imports pattern** (lines 1–7):
```javascript
'use server'

import supabaseAdmin from '@/lib/supabaseAdmin'
import { createServer } from '@/lib/supabase-server'
import { isProprietario } from '@/lib/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
```
Note: The new action does NOT import `isProprietario` — the Locatário guard checks `usuario_id` directly instead. The `UUID_RE` constant is already in the file — do NOT redeclare it; the existing declaration covers both exports.

**Auth guard pattern for Locatário** — NEW local guard, does NOT call `isProprietario`:
```javascript
async function authGuardLocatario() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { err: { status: 401, erroMessage: 'Não autenticado.' } }
  return { user }
}
```

**Core 3-hop ownership pattern** — mirrors existing 4-hop, chain inverted to Locatário side:
```javascript
export async function confirmarPagamentoLocatario(id) {
  const { err, user } = await authGuardLocatario()
  if (err) return err

  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }

  // Hop 1 — parcela existe?
  const { data: parcela, error: e1 } = await supabaseAdmin
    .from('parcelas').select('contrato_id').eq('id', id).single()
  if (e1 || !parcela) return { status: 404, erroMessage: 'Parcela não encontrada.' }

  // Hop 2 — contrato existe?
  const { data: contrato, error: e2 } = await supabaseAdmin
    .from('contratos').select('locatario_id').eq('id', parcela.contrato_id).single()
  if (e2 || !contrato) return { status: 404, erroMessage: 'Parcela não encontrada.' }

  // Hop 3 — locatário pertence ao usuário autenticado?
  const { data: locatario, error: e3 } = await supabaseAdmin
    .from('locatarios').select('usuario_id').eq('id', contrato.locatario_id).single()
  if (e3 || !locatario || locatario.usuario_id !== user.id)
    return { status: 404, erroMessage: 'Parcela não encontrada.' }

  const { error } = await supabaseAdmin
    .from('parcelas')
    .update({ status: 'paga', data_pagamento: new Date().toISOString().split('T')[0] })
    .eq('id', id)
    .in('status', ['pendente', 'vencida'])
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}
```

**Key differences from `marcarParcelaComoPaga`:**
- Guard is `authGuardLocatario` (no `isProprietario` call)
- Chain is 3 hops (parcela → contrato → locatario) instead of 4 (parcela → contrato → unidade → edificio)
- Ownership check: `locatario.usuario_id !== user.id` (client-side compare) instead of `.eq('proprietario_id', user.id)` filter
- Cross-tenant and hop failures all return 404 — same masking pattern

---

### `test/unit/actions/parcelas.test.js` — add `confirmarPagamentoLocatario` describe block

**Analog:** existing `marcarParcelaComoPaga` describe block (lines 72–115) + `setupOwnerSingles4` / `setupCrossTenantSingles4` helpers (lines 37–60)

**Imports — no change needed:** existing file already imports everything required.

**New import to add at top of file:**
```javascript
import { marcarParcelaComoPaga, confirmarPagamentoLocatario } from '@/actions/parcelas'
```

**3-hop helper pattern** — mirrors `setupOwnerSingles4`/`setupCrossTenantSingles4` structure exactly:
```javascript
function setupLocatarioOwnerSingles3(userId) {
  // Hop 1: parcelas → contrato_id
  mockAdmin.single.mockResolvedValueOnce({ data: { contrato_id: 'c-id-1' }, error: null })
  // Hop 2: contratos → locatario_id
  mockAdmin.single.mockResolvedValueOnce({ data: { locatario_id: 'l-id-1' }, error: null })
  // Hop 3: locatarios → usuario_id (matches user)
  mockAdmin.single.mockResolvedValueOnce({ data: { usuario_id: mockUser.id }, error: null })
}

function setupLocatarioCrossTenantSingles3() {
  mockAdmin.single.mockResolvedValueOnce({ data: { contrato_id: 'c-id-other' }, error: null })
  mockAdmin.single.mockResolvedValueOnce({ data: { locatario_id: 'l-id-other' }, error: null })
  mockAdmin.single.mockResolvedValueOnce({ data: { usuario_id: 'outro-usuario-uuid' }, error: null })
}
```

**describe block pattern** — mirrors `describe('marcarParcelaComoPaga', ...)` structure:
```javascript
describe('confirmarPagamentoLocatario', () => {
  beforeEach(() => {
    resetAll()
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    // NOTE: mockIsProprietario NOT configured here — Locatário guard does not call isProprietario
  })

  it('happy path — locatário dono, marca como paga (200)', async () => {
    setupLocatarioOwnerSingles3()
    setupUpdateThenable()
    const result = await confirmarPagamentoLocatario(validId)
    expect(result).toEqual({ status: 200 })
  })

  it('cross-tenant — usuario_id diferente → 404, update não executado', async () => {
    setupLocatarioCrossTenantSingles3()
    const result = await confirmarPagamentoLocatario(validId)
    expect(result).toEqual({ status: 404, erroMessage: 'Parcela não encontrada.' })
    expect(mockAdmin.update).not.toHaveBeenCalled()
  })

  it('não autenticado → 401', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await confirmarPagamentoLocatario(validId)
    expect(result.status).toBe(401)
  })

  it('UUID inválido → 400', async () => {
    const result = await confirmarPagamentoLocatario('not-a-uuid')
    expect(result).toEqual({ status: 400, erroMessage: 'ID inválido.' })
  })

  it('parcela inexistente (hop 1 null) → 404', async () => {
    mockAdmin.single.mockResolvedValueOnce({ data: null, error: null })
    const result = await confirmarPagamentoLocatario(validId)
    expect(result).toEqual({ status: 404, erroMessage: 'Parcela não encontrada.' })
  })

  it('parcela já paga — .in(status) filtra → update no-op, retorna 200', async () => {
    setupLocatarioOwnerSingles3()
    setupUpdateThenable()
    const result = await confirmarPagamentoLocatario(validId)
    expect(result).toEqual({ status: 200 })
  })
})
```

**`setupUpdateThenable` is already defined** in the file (lines 64–70) — reuse as-is, do not duplicate.

---

### `src/lib/queries-client.js` — add `getTodasParcelasPortal`

**Analog:** `getParcelasPortal` (lines 141–150, same file)

**Existing function to copy from** (lines 141–150):
```javascript
export async function getParcelasPortal(contratoId) {
    const { data, error } = await supabase
        .from('parcelas')
        .select('id, numero, data_vencimento, data_pagamento, status')
        .eq('contrato_id', contratoId)
        .neq('status', 'futura')
        .order('data_vencimento', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
}
```

**New function — add immediately after `getParcelasPortal`:**
```javascript
export async function getTodasParcelasPortal(contratoId) {
    const { data, error } = await supabase
        .from('parcelas')
        .select('id, numero, data_vencimento, data_fechamento, data_pagamento, status')
        .eq('contrato_id', contratoId)
        .order('data_vencimento', { ascending: true })
    if (error) throw new Error(error.message)
    return data ?? []
}
```

**Two differences from `getParcelasPortal`:**
1. No `.neq('status', 'futura')` — returns all statuses for progress counters (D-08)
2. Adds `data_fechamento` to select — needed for PDF recibo (PORT-07)
3. Order ascending (not descending) — easiest to find next vencimento as `[0]` after filtering

---

### `src/components/features/portal/PortalDashboard.js` — extend state and render tree

**Analog:** self (lines 1–77)

**State extension pattern** — add `todasParcelas` alongside existing state declarations (lines 13–17):
```javascript
const [locatario, setLocatario] = useState(null)
const [contrato, setContrato] = useState(null)
const [parcelas, setParcelas] = useState([])        // kept for existing use
const [todasParcelas, setTodasParcelas] = useState([])  // NEW — includes futura
const [loading, setLoading] = useState(true)
const [erro, setErro] = useState(null)
```

**fetchData extension** — add `getTodasParcelasPortal` call after existing `getParcelasPortal` (lines 30–31):
```javascript
const parc = await getParcelasPortal(ct.id)
setParcelas(parc ?? [])
const todasParc = await getTodasParcelasPortal(ct.id)
setTodasParcelas(todasParc ?? [])
```

**Render tree extension** — add `VencimentoDestaque` above `ContratoCard` in the happy-path branch (lines 68–74):
```javascript
<>
  <VencimentoDestaque
    parcelas={todasParcelas}
    contrato={contrato}
    onPagar={(parcela) => { /* open PixModal */ }}
  />
  <div className="mt-8">
    <ContratoCard contrato={contrato} parcelas={todasParcelas} />
  </div>
  <ParcelsTable
    parcelas={todasParcelas}
    locatario={locatario}
    contrato={contrato}
    onPagar={(parcela) => { /* open PixModal */ }}
  />
</>
```

**Toast import pattern** — copy from `src/components/features/Contratos.js` line 14:
```javascript
import { toast } from "sonner"
```
Use `toast.success("Pagamento registrado")` on successful confirmation (IC-01 step 7).

**Re-fetch after payment** — re-call `getTodasParcelasPortal` directly after action success (no cache invalidation layer):
```javascript
const todasParc = await getTodasParcelasPortal(contrato.id)
setTodasParcelas(todasParc ?? [])
```

---

### `src/components/features/portal/ContratoCard.js` — add progresso row

**Analog:** self (lines 1–52)

**Imports — no change** to existing:
```javascript
import { fmtBRL, fmtData } from "@/lib/utils"
import StatusBadge from "@/components/ui/StatusBadge"
```

**Prop signature change** — accept `parcelas` as new prop:
```javascript
export default function ContratoCard({ contrato, parcelas = [] }) {
```

**Progress row — add after closing `</div>` of the grid (after line 49), inside `<section>`:**
```javascript
{/* Progress row */}
{parcelas.length > 0 && (() => {
  const total = parcelas.length
  const pagas = parcelas.filter(p => p.status === 'paga').length
  const pct = Math.round((pagas / total) * 100)
  return (
    <div className="mt-4">
      <div
        className="w-full bg-border-3"
        style={{ height: 6 }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progresso do contrato: ${pagas} parcelas pagas de ${total}`}
      >
        <div className="bg-indigo h-full origin-left" style={{ width: pct + '%' }} />
      </div>
      <div className="flex gap-4 mt-2">
        <span className="font-mono text-[11px] text-fg-4">{pagas} pagas · {total} total</span>
        <span className={`font-mono text-[11px] ${pct === 100 ? 'text-success' : 'text-highlight'}`}>
          · {pct}% adimplente
        </span>
      </div>
    </div>
  )
})()}
```

---

### `src/components/features/portal/ParcelsTable.js` — add Ação column

**Analog:** self (lines 1–53)

**Imports — add `cn` (already imported) and the action callback:**
```javascript
import StatusBadge from "@/components/ui/StatusBadge"
import { fmtData, cn } from "@/lib/utils"
```

**Prop signature change:**
```javascript
export default function ParcelsTable({ parcelas, locatario, contrato, onPagar }) {
```

**Grid column update** (line 10) — add 5th column:
```javascript
// BEFORE:
className="grid grid-cols-[60px_1fr_1fr_1.2fr] border-b border-border-3 bg-[oklch(0.26_0_0)]"
// AFTER:
className="grid grid-cols-[60px_1fr_1fr_1fr_1.4fr] border-b border-border-3 bg-[oklch(0.26_0_0)]"
```
Apply same change to inner row `div` (line 25).
Add `min-w-[600px]` to the `min-w-[480px]` container (line 9) — update to `min-w-[600px]`.

**Header — add Ação col after Status header cell (line 14):**
```javascript
<div className="px-5 py-3 font-mono text-[10px] font-bold tracking-[1.4px] uppercase text-fg-4">Ação</div>
```

**Row — add action cell after StatusBadge cell (after line 46):**
```javascript
<div className="px-5 py-[14px]">
  {(parcela.status === 'pendente' || parcela.status === 'vencida') && (
    <button
      style={{ all: 'unset', cursor: 'pointer' }}
      className="font-mono text-[10px] font-bold tracking-[1px] uppercase text-indigo hover:opacity-70 transition-opacity"
      aria-label={`Pagar parcela ${String(parcela.numero).padStart(2,'0')}`}
      onClick={() => onPagar(parcela)}
    >
      [&gt;] PAGAR
    </button>
  )}
  {parcela.status === 'paga' && (
    <button
      style={{ all: 'unset', cursor: 'pointer' }}
      className="font-mono text-[10px] font-bold tracking-[1px] uppercase text-fg-4 hover:text-fg-2 transition-colors"
      aria-label={`Baixar comprovante da parcela ${String(parcela.numero).padStart(2,'0')}`}
      onClick={() => handleBaixarRecibo(parcela, locatario, contrato, parcelas.length)}
    >
      [↓] RECIBO
    </button>
  )}
  {parcela.status === 'futura' && (
    <span className="font-mono text-[10px] text-fg-5">—</span>
  )}
</div>
```

**`handleBaixarRecibo` function** — define inside component body, uses dynamic jsPDF import:
```javascript
async function handleBaixarRecibo(parcela, locatario, contrato, totalParcelas) {
  try {
    const mod = await import('jspdf')
    const JsPDF = mod.jsPDF ?? mod.default?.jsPDF ?? mod.default
    if (!JsPDF) throw new Error('jsPDF não carregou')
    const doc = new JsPDF()
    const codigoAuth = btoa(parcela.id.slice(0,8) + (parcela.data_pagamento ?? ''))
      .replace(/[^A-Z0-9]/gi,'').toUpperCase().slice(0,8)
    // PDF content per UI-SPEC Surface 5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('ROMMA — COMPROVANTE DE PAGAMENTO', 105, 15, { align: 'center' })
    doc.line(20, 22, 190, 22)
    // ... (see UI-SPEC Surface 5 for full y-position layout)
    doc.save(`recibo-parcela-${String(parcela.numero).padStart(2,'0')}.pdf`)
  } catch (e) {
    setErroPDF('Não foi possível gerar o comprovante. Tente novamente.')
  }
}
```
Note: `setErroPDF` requires adding `const [erroPDF, setErroPDF] = useState(null)` to component state.

---

### `src/components/features/portal/VencimentoDestaque.js` (NEW)

**Analog:** `src/components/features/portal/ContratoCard.js` — same portal section pattern (eyebrow + data display + Tailwind classes)

**Imports pattern** — copy from ContratoCard.js line 1, add `cn`:
```javascript
import { fmtBRL, fmtData, cn } from "@/lib/utils"
```

**Component signature:**
```javascript
export default function VencimentoDestaque({ parcelas, contrato, onPagar }) {
```

**Logic pattern** — derive `proximaPagavel` from parcelas prop (no useEffect, pure derivation):
```javascript
const pagaveis = parcelas.filter(p => p.status === 'pendente' || p.status === 'vencida')
const proximaPagavel = pagaveis.sort(
  (a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento)
)[0] ?? null
if (!proximaPagavel) return null  // hidden when no payable installment

const diasRestantes = Math.ceil(
  (new Date(proximaPagavel.data_vencimento) - new Date()) / 86400000
)
const totalParcelas = parcelas.length
```

**Render pattern** — copy border-left accent style from ContratoCard's `<section>` and apply destaque variant per UI-SPEC Surface 1:
```javascript
return (
  <section className="mt-8 border-l-4 border-l-highlight bg-surface p-6 flex flex-col gap-3">
    <span className="eyebrow eyebrow--indigo">PRÓXIMO VENCIMENTO</span>
    <span className="font-display font-bold text-[32px] leading-none tracking-[-1.6px] text-fg-1">
      {fmtBRL(contrato.unidades?.valor_mensal)}
    </span>
    <span className={cn(
      "font-mono text-[11px]",
      diasRestantes < 0 ? "text-danger-fg" : diasRestantes <= 7 ? "text-warning" : "text-fg-3"
    )}>
      Parcela {proximaPagavel.numero}/{totalParcelas} ·{" "}
      {diasRestantes < 0
        ? `${Math.abs(diasRestantes)} dias em atraso`
        : `${diasRestantes} dias restantes`}
    </span>
    <button
      style={{ all: 'unset', cursor: 'pointer' }}
      className="bg-indigo text-fg-1 font-mono font-bold text-[11px] tracking-[1.5px] uppercase px-5 py-3 hover:opacity-90 transition-opacity w-full sm:w-auto mt-2"
      onClick={() => onPagar(proximaPagavel)}
    >
      [&gt;] PAGAR AGORA
    </button>
  </section>
)
```

---

### `src/components/features/portal/PixModal.js` (NEW)

**Analog:** `src/components/ui/ConfirmDialog.js` (modal structure) + `src/components/features/LocatariosDesktop.js` lines 342–394 (modal in portal context with loading state)

**Imports pattern** — copy from ConfirmDialog.js + add action + toast:
```javascript
'use client'

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { fmtBRL, fmtData } from "@/lib/utils"
import { confirmarPagamentoLocatario } from "@/actions/parcelas"
import { toast } from "sonner"
```

**PIX_CODE_CONST** — define at module top (D-01):
```javascript
const PIX_CODE_CONST = "00020126580014br.gov.bcb.pix0136..."  // static string, Claude's Discretion for actual value
```

**Component signature:**
```javascript
export default function PixModal({ open, parcela, contrato, onClose, onSucesso }) {
```

**Guard render pattern** — copy from ConfirmDialog.js line 15:
```javascript
if (!open || !parcela) return null
```

**State pattern** — single object per project convention:
```javascript
const [modal, setModal] = useState({ loading: false, erro: null, copiado: false })
```
Reset on close: `setModal({ loading: false, erro: null, copiado: false })`

**Escape key pattern** — useEffect keyboard listener (no existing codebase analog for Escape, implement fresh):
```javascript
useEffect(() => {
  function onKey(e) {
    if (e.key === 'Escape' && !modal.loading) onClose()
  }
  document.addEventListener('keydown', onKey)
  return () => document.removeEventListener('keydown', onKey)
}, [modal.loading, onClose])
```

**Backdrop pattern** — copy from LocatariosDesktop.js line 345 but WITHOUT click-to-close on backdrop (IC-04: click on backdrop does NOT close):
```javascript
<div className="romma-modal-backdrop z-[100]">
  <div
    onClick={e => e.stopPropagation()}
    className="bg-surface border border-border-3 w-full max-w-md p-7 flex flex-col gap-5"
  >
```

**Confirm handler pattern** — mirror Server Action call pattern from Contratos.js lines 148–152:
```javascript
async function handleConfirmar() {
  setModal(m => ({ ...m, loading: true, erro: null }))
  const res = await confirmarPagamentoLocatario(parcela.id)
  if (res.status === 200) {
    setModal({ loading: false, erro: null, copiado: false })
    onClose()
    onSucesso()
    toast.success("Pagamento registrado")
  } else {
    setModal(m => ({ ...m, loading: false, erro: res.erroMessage ?? "Erro ao confirmar pagamento. Tente novamente." }))
  }
}
```

**Copy handler pattern:**
```javascript
async function handleCopiar() {
  try {
    await navigator.clipboard.writeText(PIX_CODE_CONST)
    setModal(m => ({ ...m, copiado: true }))
    setTimeout(() => setModal(m => ({ ...m, copiado: false })), 2000)
  } catch {
    setModal(m => ({ ...m, copiado: false }))
    // IC-03: no crash, button resets silently
  }
}
```

**Button disabled/loading states** — copy from LocatariosDesktop.js line 387–389:
```javascript
<button
  disabled={modal.loading}
  className={cn("...", modal.loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer")}
>
  {modal.loading ? "[···] CONFIRMANDO" : "[✓] CONFIRMAR"}
</button>
```

**Demo note — REQUIRED by PORT-05** (must appear verbatim):
```javascript
<p className="font-mono text-[11px] text-fg-4 italic border-l-2 border-warning pl-3">
  Este é um ambiente de demonstração. O pagamento real não é processado. Clique em confirmar para registrar o pagamento.
</p>
```

**Error display pattern** — copy from LocatariosDesktop.js line 382:
```javascript
{modal.erro && (
  <span className="font-mono text-[11px] text-danger-fg">{modal.erro}</span>
)}
```

---

## Shared Patterns

### Authentication (Locatário side)
**Source:** `src/actions/parcelas.js` `authGuard` function (lines 9–15) — but adapted: remove `isProprietario` call
**Apply to:** `confirmarPagamentoLocatario` only
```javascript
async function authGuardLocatario() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { err: { status: 401, erroMessage: 'Não autenticado.' } }
  return { user }
}
```

### Server Action return contract
**Source:** `src/actions/parcelas.js` lines 44–45 + project CLAUDE.md
**Apply to:** `confirmarPagamentoLocatario`
```javascript
// Success:
return { status: 200 }
// Error (note: erroMessage — NOT errorMessage):
return { status: 4xx|5xx, erroMessage: '...' }
```

### UUID validation
**Source:** `src/actions/parcelas.js` line 7 + line 21
**Apply to:** `confirmarPagamentoLocatario` — `UUID_RE` is already declared in `parcelas.js`, do NOT redeclare in the same file
```javascript
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
```

### 404 masking (cross-tenant)
**Source:** `src/actions/parcelas.js` lines 25, 29, 33, 37
**Apply to:** all 3 hops of `confirmarPagamentoLocatario`
```javascript
// ALL hop failures return 404, never 403 — prevents resource enumeration
return { status: 404, erroMessage: 'Parcela não encontrada.' }
```

### Tailwind portal styling (exception to inline+CSS-vars)
**Source:** `src/components/features/portal/PortalDashboard.js`, `ContratoCard.js`, `ParcelsTable.js`
**Apply to:** ALL portal components (VencimentoDestaque, PixModal, and extensions to existing portal files)
- Use Tailwind classes: `bg-surface`, `text-fg-1`, `border-border-3`, `text-indigo`, `text-success`, `text-warning`, `text-danger-fg`, `text-highlight`
- Do NOT use `style={{ color: "var(--fg-1)" }}` — use Tailwind class equivalents

### Button reset pattern
**Source:** `src/app/globals.css` comment "Button reset pattern" — used in portal table rows
**Apply to:** all non-shadcn buttons in portal (action buttons in ParcelsTable, VencimentoDestaque CTA)
```javascript
style={{ all: 'unset', cursor: 'pointer' }}
```

### Modal backdrop
**Source:** `src/components/ui/ConfirmDialog.js` line 22, `src/app/globals.css` lines 361–370
**Apply to:** `PixModal.js`
```javascript
className="romma-modal-backdrop z-[100]"
// CSS defined in globals.css:
// position: fixed; inset: 0; z-index: 50; background: oklch(0 0 0 / 0.70);
// display: flex; align-items: center; justify-content: center; padding: 16px;
```

### Toast success
**Source:** `src/components/features/Contratos.js` lines 14, 150
**Apply to:** `PortalDashboard.js` (after successful payment re-fetch)
```javascript
import { toast } from "sonner"
toast.success("Pagamento registrado")
```

### Query null safety
**Source:** `src/lib/queries-client.js` lines 149–150
**Apply to:** `getTodasParcelasPortal`
```javascript
if (error) throw new Error(error.message)
return data ?? []
```

### Supabase builder chain (update with `.in`)
**Source:** `src/actions/parcelas.js` lines 39–44
**Apply to:** `confirmarPagamentoLocatario` update step
```javascript
const { error } = await supabaseAdmin
  .from('parcelas')
  .update({ status: 'paga', data_pagamento: new Date().toISOString().split('T')[0] })
  .eq('id', id)
  .in('status', ['pendente', 'vencida'])
if (error) return { status: 500, erroMessage: error.message }
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `public/pix-qr.png` | static asset | — | Binary image asset — no code pattern applicable; place in `public/` for direct `/pix-qr.png` URL access |

**jsPDF dynamic import** — no existing dynamic import in codebase (`await import(...)` pattern is new to this project). Use defensive destructuring pattern from RESEARCH.md Pitfall 1:
```javascript
const mod = await import('jspdf')
const JsPDF = mod.jsPDF ?? mod.default?.jsPDF ?? mod.default
```

---

## Metadata

**Analog search scope:** `src/actions/`, `src/components/features/portal/`, `src/components/ui/`, `src/lib/`, `test/unit/actions/`, `test/helpers/`
**Files scanned:** 9
**Pattern extraction date:** 2026-06-17
