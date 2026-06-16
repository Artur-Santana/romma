# Phase 22: Contratos & Parcelas — Renovação - Pattern Map

**Mapped:** 2026-06-16
**Files analyzed:** 3
**Analogs found:** 3 / 3

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/features/Contratos.js` | component (feature) | CRUD + client-filter | `src/components/features/Contratos.js` (self — extend) + `console3.jsx:29-217` (design) | exact |
| `src/components/features/Parcelas.js` | component (feature) | CRUD + event-driven (register payment) | `src/components/features/Parcelas.js` (self — redesign) + `console3.jsx:220-387` (design) | exact |
| `src/actions/contratos.js` | server action | CRUD (UPDATE + batch INSERT) | `src/actions/contratos.js:79-162` (`cancelarContrato`/`encerrarContrato`) + `src/actions/parcelas.js:17-46` (ownership chain) | exact |

---

## Pattern Assignments

### `src/components/features/Contratos.js` (component, CRUD + client-filter)

**Primary analog:** `src/components/features/Contratos.js` (current file — extend in place)
**Design analog:** `console3.jsx` lines 29–217 (`ContratosScreen`, variant B)

#### Imports pattern (Contratos.js lines 1–15 — keep all, no additions needed)
```js
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getContratos, getLocatarios, getUnidades, getEdificios } from "@/lib/queries-client"
import { fmtData, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import StatusBadge from "@/components/ui/StatusBadge"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import PageHeader from "@/components/ui/PageHeader"
import { gerarParcelas, criarContrato, cancelarContrato, encerrarContrato } from "@/actions/contratos"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
```
Add `fmtBRL` to the utils import (already exported from `src/lib/utils.js` lines 8–10).

#### State additions (new state vars, insert alongside existing ones at Contratos.js lines 65–71)
```js
const [q, setQ] = useState("")
const [onlyVencendo, setOnlyVencendo] = useState(false)
const [showArquivo, setShowArquivo] = useState(false)
```

#### Helper functions (copy from console3.jsx lines 39–61, adapt to real data)
```js
// daysLeft: use real Date() (no D.TODAY mock)
const daysLeft = (c) => Math.ceil((new Date(c.data_fim) - new Date()) / 86400000)

// pctElapsed: copy verbatim from console3.jsx:54
const pctElapsed = (c) => {
  const a = new Date(c.data_inicio), b = new Date(c.data_fim), n = new Date()
  return Math.max(4, Math.min(100, Math.round(((n - a) / (b - a)) * 100)))
}

// nameOf: uses join fields already in getContratos() result (queries-client.js:21)
const nameOf = (c) =>
  (c.locatarios?.nome_razao_social ?? "") + " " + (c.unidades?.nome ?? "")

// isExpiring: already exists at Contratos.js:41-45 — keep unchanged

// Derived lists (extend the existing ativos/encerrados block at lines 180–182)
const vencendoCount = contratosAtivos.filter(isExpiring).length
const arquivo = contratos.filter(c => c.status !== "ativo")  // encerrado + cancelado
const view = contratosAtivos.filter(c => {
  if (onlyVencendo && !isExpiring(c)) return false
  if (q && !nameOf(c).toLowerCase().includes(q.toLowerCase())) return false
  return true
})
```

#### Search + filter bar (console3.jsx lines 86–93 → translate to codebase style)
```jsx
{/* Search + Vencendo filter — place above cards/table, below showForm block */}
<div className="flex gap-2 mb-6 flex-wrap items-center">
  <div style={{ position: "relative", flex: "0 0 260px" }}>
    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-5)" }}>⌕</span>
    <Input
      value={q}
      onChange={e => setQ(e.target.value)}
      placeholder="Buscar por locatário ou unidade..."
      className="bg-surface-hi border-border-3 text-fg-1 font-body text-[13px] rounded-none pl-8"
    />
  </div>
  <button
    onClick={() => setOnlyVencendo(v => !v)}
    style={{
      all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center",
      gap: 7, padding: "9px 14px",
      fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.5px",
      textTransform: "uppercase",
      border: `1px solid ${onlyVencendo ? "var(--warning)" : "var(--border-3)"}`,
      background: onlyVencendo ? "var(--warning-bg)" : "transparent",
      color: onlyVencendo ? "var(--warning)" : "var(--fg-4)"
    }}
  >
    <span style={{ width: 6, height: 6, background: "var(--warning)" }} />
    Vencendo · {vencendoCount}
  </button>
  {(q || onlyVencendo) && (
    <span className="font-mono text-[11px] text-fg-4">{view.length} resultado(s)</span>
  )}
</div>
```

#### Desktop cards grid (console3.jsx lines 95–134 → codebase style)
```jsx
{/* Desktop: cards grid — hidden on mobile */}
<div className="romma-desktop-only" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 12 }}>
  {view.length === 0 && (
    <div className="py-10 text-center" style={{ gridColumn: "1 / -1" }}>
      <span className="font-mono text-[12px] text-fg-4">Nenhum contrato corresponde aos filtros.</span>
    </div>
  )}
  {view.map((contrato, i) => {
    const loc = contrato.locatarios   // already in join result
    const uni = contrato.unidades     // already in join result
    const edi = edificios.find(e => e.id === uni?.edificio_id)
    const exp = isExpiring(contrato)
    const pct = pctElapsed(contrato)
    const isRemoving = removingIds.has(contrato.id)
    return (
      <div
        key={contrato.id}
        style={{
          border: `1px solid ${exp ? "var(--warning)" : "var(--border-3)"}`,
          background: "var(--surface)", padding: "var(--rd-panel)",
          display: "flex", flexDirection: "column", gap: 14,
          opacity: isRemoving ? 0 : 1,
          transform: isRemoving ? "scale(0.98)" : "scale(1)",
          transition: "opacity 220ms ease, transform 220ms ease"
        }}
      >
        {/* top: ref + locatário + unidade/edifício + badge */}
        {/* middle: datas + progress bar (4px height) */}
        {/* bottom: valor mensal + actions (Ver → / Cancelar / Encerrar) */}
      </div>
    )
  })}
</div>
```

Progress bar inside card (console3.jsx line 121):
```jsx
<div style={{ height: 4, background: "var(--surface-hi)" }}>
  <div style={{ height: "100%", width: `${pct}%`, background: exp ? "var(--warning)" : "var(--primary-hover)" }} />
</div>
```

Countdown label (console3.jsx line 119):
```jsx
<span style={{ color: exp ? "var(--warning)" : "var(--fg-4)" }}>
  {daysLeft(contrato)} dias → {fmtData(contrato.data_fim)}
</span>
```

#### Mobile rows (console3.jsx lines 152–158 → replace current desktop-only table)
```jsx
{/* Mobile: clickable rows — hidden on desktop */}
<div className="romma-mobile-only border border-border-3 bg-surface mb-8">
  {view.map((contrato, i) => {
    const loc = contrato.locatarios
    const uni = contrato.unidades
    const exp = isExpiring(contrato)
    return (
      <div
        key={contrato.id}
        onClick={() => router.push(`/dashboard/contratos/${contrato.id}`)}
        style={{ padding: "12px 16px", borderTop: i > 0 ? "1px solid var(--border-3)" : "none",
          display: "flex", flexDirection: "column", gap: 6, cursor: "pointer" }}
      >
        <div className="flex justify-between items-center">
          <span className="text-[14px] font-medium text-fg-1">{loc?.nome_razao_social ?? "—"}</span>
          <StatusBadge status={exp ? "vencendo" : contrato.status} />
        </div>
        <span className="font-mono text-[11px] text-fg-4">
          {uni?.nome ?? "—"} · {fmtData(contrato.data_inicio)}→{fmtData(contrato.data_fim)}
        </span>
      </div>
    )
  })}
</div>
```

#### Archive toggle (console3.jsx lines 179–214 → extend existing callout at Contratos.js:433-445)
```jsx
{/* Archive callout — replace disabled button with onClick */}
<div className="flex justify-between items-center px-6 py-4 border border-border-3 text-fg-3">
  <span className="font-mono text-[11px] tracking-[0.5px]">
    Contratos encerrados são preservados como histórico imutável.
  </span>
  <button
    onClick={() => setShowArquivo(v => !v)}
    style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11,
      fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
      color: showArquivo ? "var(--indigo)" : "var(--fg-3)" }}
  >
    {showArquivo ? "⌃ Ocultar Arquivo" : `Ver Arquivo (${arquivo.length}) →`}
  </button>
</div>

{showArquivo && (
  <div className="mt-4">
    <span className="eyebrow eyebrow--indigo mb-3 block">Arquivo · Contratos Encerrados</span>
    <div className="border border-border-3 bg-surface">
      {arquivo.map((c, i) => {
        const loc = locatarios.find(l => l.id === c.locatario_id) ?? c.locatarios
        const uni = unidades.find(u => u.id === c.unidade_id) ?? c.unidades
        const edi = edificios.find(e => e.id === uni?.edificio_id)
        return (
          <div key={c.id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 12, padding: "12px 20px",
            borderTop: i > 0 ? "1px solid var(--border-3)" : "none",
            opacity: 0.78   // canonical archive opacity
          }}>
            {/* left: ARQ_NNN + locatário + unidade·edifício·datas */}
            {/* right: StatusBadge + Ver → button */}
          </div>
        )
      })}
    </div>
  </div>
)}
```

#### Removal animation pattern (Contratos.js lines 142–155 — keep unchanged)
```js
// Optimistic remove: set removingIds → setTimeout 200ms → filter/refetch
setRemovingIds(prev => new Set([...prev, contrato.id]))
// ...after action succeeds:
setTimeout(() => {
  Promise.all([getContratos(), getUnidades()]).then(([c, u]) => {
    setContratos(c ?? [])
    setUnidades(u ?? [])
  })
  setRemovingIds(prev => { const n = new Set(prev); n.delete(contrato.id); return n })
}, 200)
```

---

### `src/components/features/Parcelas.js` (component, CRUD + event-driven)

**Primary analog:** `src/components/features/Parcelas.js` (self — full redesign)
**Design analog:** `console3.jsx` lines 220–387 (`ContratoDetailScreen`, variant B)

#### Imports (keep current Parcelas.js lines 1–10, add)
```js
import { fmtBRL } from "@/lib/utils"
import { renovarContrato } from "@/actions/contratos"
```

#### State additions (alongside existing useState vars)
```js
const [showRenew, setShowRenew] = useState(false)
const [renewMonths, setRenewMonths] = useState(12)   // custom input fallback
```

#### carregar() function — keep existing pattern (Parcelas.js lines 31–48), no change needed
The join data (`unidades(nome)`, edificio via `getEdificios()`, locatario) is already fetched. For grade-resumo, `unidade.valor_mensal` is the value source (D-10: no valor column on parcelas).

#### Grade-resumo (5-col summary grid, console3.jsx lines 265–273)
```jsx
{/* Grade-resumo: 5 cols desktop, 2×3 mobile */}
{contrato && unidade && (
  <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    border: "1px solid var(--border-3)",
    marginBottom: "var(--rd-block, 32px)"
  }}>
    {[
      { label: "Unidade", value: unidade?.nome ?? "—" },
      { label: "Edifício", value: unidade?.edificios?.nome ?? "—" },
      { label: "Valor mensal", value: fmtBRL(unidade?.valor_mensal) },
      { label: "Início", value: fmtData(contrato?.data_inicio) },
      { label: "Término", value: fmtData(contrato?.data_fim) },
    ].map((s, i) => (
      <div key={s.label} style={{
        padding: "14px 16px",
        background: "var(--surface)",
        borderRight: i < 4 ? "1px solid var(--border-3)" : "none"
      }}>
        <div className="font-mono text-[10px] text-fg-4 uppercase tracking-[1px] mb-2">{s.label}</div>
        <div className="font-display font-bold text-[18px] text-fg-1 tracking-[-0.4px]">{s.value}</div>
      </div>
    ))}
  </div>
)}
```
Mobile override: `gridTemplateColumns: "1fr 1fr"` + `borderTop` on i >= 2 cells + `borderRight` on even cells only.

#### Resumo financeiro (4-col, console3.jsx lines 276–289)
```jsx
{/* Resumo financeiro — derive all values from parcelas state + unidade.valor_mensal */}
{(() => {
  const valor = unidade?.valor_mensal ?? 0
  const totalContrato = parcelas.length * valor
  const totalPago = parcelas.filter(p => p.status === "paga").length * valor
  const vencidas = parcelas.filter(p => p.status === "vencida")
  const emAberto = parcelas.filter(p =>
    p.status === "pendente" || p.status === "vencida" || p.status === "futura"
  ).length * valor
  const inadimplencia = vencidas.length * valor
  const metrics = [
    { l: "Valor do contrato", v: fmtBRL(totalContrato), s: `${parcelas.length} parcelas` },
    { l: "Total recebido", v: fmtBRL(totalPago), s: `${pagas} pagas`, ok: true },
    { l: "Em aberto", v: fmtBRL(emAberto), s: `${parcelas.length - pagas} parcelas`, gold: true },
    { l: "Inadimplência", v: vencidas.length > 0 ? fmtBRL(inadimplencia) : "R$0",
      s: `${vencidas.length} vencida(s)`, danger: vencidas.length > 0 },
  ]
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", border: "1px solid var(--border-3)", marginBottom: 20 }}>
      {metrics.map((m, i) => (
        <div key={m.l} style={{
          padding: "14px 16px",
          background: m.danger ? "var(--danger-bg2)" : "transparent",
          borderRight: i < 3 ? "1px solid var(--border-3)" : "none"
        }}>
          <div className="font-mono text-[9.5px] uppercase tracking-[1px] mb-2"
            style={{ color: m.danger ? "var(--danger-fg)" : m.gold ? "var(--highlight)" : m.ok ? "var(--success)" : "var(--fg-4)" }}>
            {m.l}
          </div>
          <div className="font-display font-bold text-[24px] tracking-[-1px]"
            style={{ color: m.danger ? "var(--danger-fg)" : m.gold ? "var(--highlight)" : m.ok ? "var(--success)" : "var(--fg-1)" }}>
            {m.v}
          </div>
          <div className="font-mono text-[11px] text-fg-4 mt-1">{m.s}</div>
        </div>
      ))}
    </div>
  )
})()}
```
After `marcarComoPaga` succeeds: `setParcelas(await getParcelasByContrato(contratoId) ?? [])` already refetches — resumo financeiro recalculates automatically from React state (no extra query needed).

#### Progress bar of parcelas (console3.jsx lines 296–298)
```jsx
{/* Parcelas progress bar — 6px cells, 3px gap, color by status */}
<div className="flex items-center justify-between mb-4">
  <div>
    <span className="eyebrow eyebrow--indigo mb-1 block">SISTEMA.PARCELAS</span>
    <h2 className="font-display font-bold text-[18px] text-fg-1">Cronograma de Parcelas</h2>
  </div>
  <span className="font-mono text-[11px] text-fg-4">{pagas}/{parcelas.length} pagas</span>
</div>
<div style={{ display: "flex", gap: 3, marginBottom: 24 }}>
  {parcelas.map(p => (
    <div key={p.id} style={{
      flex: 1, height: 6,
      background: p.status === "paga" ? "var(--success)"
        : p.status === "vencida" ? "var(--danger)"
        : p.status === "pendente" ? "var(--warning)"
        : "var(--surface-hi)"
    }} />
  ))}
</div>
```

#### Timeline vertical (console3.jsx lines 300–327 — variant B)
Replace current `<table>` / grid at Parcelas.js lines 98–163:
```jsx
<div className="border border-border-3 bg-surface p-6">
  {parcelas.map((parcela, i) => {
    const col = parcela.status === "paga" ? "var(--success)"
      : parcela.status === "vencida" ? "var(--danger)"
      : parcela.status === "pendente" ? "var(--warning)"
      : "var(--fg-5)"
    return (
      <div key={parcela.id} style={{ display: "flex", gap: 16 }}>
        {/* Left: dot + vertical line */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{
            width: 12, height: 12, flexShrink: 0, marginTop: 3,
            background: parcela.status === "futura" ? "transparent" : col,
            border: parcela.status === "futura" ? "1px solid var(--fg-5)" : "none"
            // NOTE: square, not circle — project rule (Obsidian Blueprint)
          }} />
          {i < parcelas.length - 1 && (
            <span style={{ flex: 1, width: 1, background: "var(--border-3)", minHeight: 28 }} />
          )}
        </div>
        {/* Right: label + badge + registrar button + meta */}
        <div style={{ flex: 1, paddingBottom: i < parcelas.length - 1 ? 18 : 0 }}>
          <div className="flex justify-between items-center gap-2">
            <span className="font-display font-bold text-[15px] text-fg-1">
              Parcela {String(parcela.numero).padStart(2, "0")}
            </span>
            <div className="flex items-center gap-2">
              {(parcela.status === "pendente" || parcela.status === "vencida") && (
                <button
                  onClick={() => marcarComoPaga(parcela)}
                  style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)",
                    fontSize: 10, fontWeight: 700, color: "var(--success)", letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    border: "1px solid color-mix(in oklch, var(--success) 40%, transparent)",
                    padding: "5px 9px" }}
                >
                  ✓ Registrar
                </button>
              )}
              <StatusBadge status={parcela.status} />
            </div>
          </div>
          <div className="font-mono text-[11px] text-fg-4 mt-1 flex gap-4 flex-wrap">
            <span>Venc · <span style={{ color: parcela.status === "vencida" ? "var(--danger-fg)" : "var(--fg-3)" }}>{fmtData(parcela.data_vencimento)}</span></span>
            <span>Pago · <span style={{ color: parcela.data_pagamento ? "var(--success)" : "var(--fg-5)" }}>{parcela.data_pagamento ? fmtData(parcela.data_pagamento) : "—"}</span></span>
            <span style={{ color: "var(--fg-2)" }}>{fmtBRL(unidade?.valor_mensal)}</span>
          </div>
        </div>
      </div>
    )
  })}
</div>
```

#### Header with "Renovar" button (console3.jsx line 258–263)
```jsx
{/* Header row — add alongside existing badge */}
<div className="flex justify-between items-end mb-12 gap-4 flex-wrap">
  <div className="flex flex-col gap-3">
    <span className="eyebrow eyebrow--indigo">CONTRATO · REF_C_001</span>
    <h2 className="font-display font-bold text-[28px] sm:text-[48px] leading-none tracking-[-2.4px] text-fg-1 m-0">
      {locatario?.nome_razao_social ?? "—"}
    </h2>
  </div>
  <div className="flex items-center gap-2">
    <StatusBadge status={contrato?.status} />
    <button
      onClick={() => setShowRenew(true)}
      style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700,
        fontSize: 11, letterSpacing: "1px", textTransform: "uppercase",
        color: "var(--fg-2)", border: "1px solid var(--border-3)", padding: "9px 14px" }}
    >
      Renovar
    </button>
  </div>
</div>
```

#### Modal de renovação (console3.jsx lines 346–384)
```jsx
{showRenew && (
  <div
    onClick={e => { if (e.target === e.currentTarget) setShowRenew(false) }}
    style={{ position: "fixed", inset: 0, zIndex: 60, background: "oklch(0 0 0 / 0.72)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      animation: "rFade 200ms var(--ease-crisp) both" }}
  >
    <div style={{ background: "var(--surface)", border: "1px solid var(--border-2)",
      width: "100%", maxWidth: 500, maxHeight: "90%", overflowY: "auto" }}>
      <div style={{ padding: 28 }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <span className="eyebrow eyebrow--indigo mb-1 block">Renovação</span>
            <h3 className="font-display font-bold text-[20px] text-fg-1">Renovar Contrato</h3>
          </div>
          <button onClick={() => setShowRenew(false)}
            style={{ all: "unset", cursor: "pointer", width: 30, height: 30,
              border: "1px solid var(--border-3)", display: "flex", alignItems: "center",
              justifyContent: "center", color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>
            ✕
          </button>
        </div>
        {/* Current end date */}
        <p className="font-body text-[13px] text-fg-2 mb-4">
          Término atual: <strong style={{ color: "var(--fg-1)" }}>{fmtData(contrato?.data_fim)}</strong>. Estenda o prazo:
        </p>
        {/* Quick options grid (+6/+12/+24) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[6, 12, 24].map(m => (
            <button key={m} onClick={() => handleRenovar(m)}
              style={{ all: "unset", cursor: "pointer", textAlign: "center",
                padding: "16px 10px", border: "1px solid var(--border-3)",
                background: "var(--surface-hi)" }}>
              <div className="font-display font-bold text-[20px] text-fg-1">+{m}</div>
              <div className="font-mono text-[11px] text-fg-4 mt-1">meses</div>
            </button>
          ))}
        </div>
        {/* Custom months input */}
        <div className="flex gap-2 items-center">
          <Input
            type="number" min={1} max={36}
            value={renewMonths}
            onChange={e => setRenewMonths(Number(e.target.value))}
            className="bg-surface-hi border-border-3 text-fg-1 font-mono text-[16px] rounded-none w-24"
          />
          <span className="font-mono text-[11px] text-fg-4">meses customizado</span>
          <Button
            onClick={() => handleRenovar(renewMonths)}
            className="bg-indigo text-fg-1 font-body font-bold text-[12px] tracking-[1px] uppercase px-5 py-[10px] rounded-none ml-auto"
          >
            Confirmar
          </Button>
        </div>
        <p className="font-mono text-[11px] text-fg-4 mt-4">
          O cronograma de parcelas será estendido automaticamente até o novo término.
        </p>
      </div>
    </div>
  </div>
)}
```

#### handleRenovar function (in Parcelas.js)
```js
async function handleRenovar(meses) {
  setShowRenew(false)
  const result = await renovarContrato(contrato.id, meses)
  if (result.status === 200) {
    toast.success(`Contrato renovado`)
    // Re-fetch parcelas + contrato to update grade-resumo live
    const [p, contratos] = await Promise.all([
      getParcelasByContrato(contratoId),
      getContratos(),
    ])
    setParcelas(p ?? [])
    const c = (contratos ?? []).find(x => x.id === contratoId)
    if (c) setContrato(c)
  } else {
    setErro(result.erroMessage)
  }
}
```

---

### `src/actions/contratos.js` (server action — add `renovarContrato`)

**Primary analog:** `cancelarContrato` (contratos.js lines 79–120) for authGuard + UUID_RE + ownership chain structure
**Secondary analog:** `marcarParcelaComoPaga` (parcelas.js lines 17–46) for 4-step ownership chain pattern

#### Auth + validation header (copy from contratos.js lines 1–17 — already present in file)
```js
"use server"
// authGuard, UUID_RE, STATUS_CONTRATO already declared at top of file
// Import supabaseAdmin — already imported
```

#### `renovarContrato` full pattern (new export, append to contratos.js)
```js
export async function renovarContrato(id, meses) {
  const { err, user } = await authGuard()
  if (err) return err

  // 1. Validate inputs
  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }
  const m = Number(meses)
  if (!m || m < 1 || m > 36) return { status: 400, erroMessage: 'Número de meses inválido (1–36).' }

  // 2. Ownership chain: contrato → unidade → edificio.proprietario_id = user.id
  //    (same 3-step pattern as cancelarContrato lines 85-98)
  const { data: contrato, error: fetchErr } = await supabaseAdmin
    .from('contratos').select('unidade_id, data_fim').eq('id', id).single()
  if (fetchErr || !contrato) return { status: 404, erroMessage: 'Contrato não encontrado.' }

  const { data: unidade, error: fetchUnidadeErr } = await supabaseAdmin
    .from('unidades').select('edificio_id').eq('id', contrato.unidade_id).single()
  if (fetchUnidadeErr || !unidade) return { status: 404, erroMessage: 'Contrato não encontrado.' }

  const { data: edificio, error: fetchEdificioErr } = await supabaseAdmin
    .from('edificios').select('id').eq('id', unidade.edificio_id).eq('proprietario_id', user.id).single()
  if (fetchEdificioErr || !edificio) return { status: 404, erroMessage: 'Contrato não encontrado.' }

  // 3. Calculate nova_data_fim — T12:00:00 avoids UTC shift (SC-5 rule)
  const d = new Date(contrato.data_fim + 'T12:00:00')
  d.setMonth(d.getMonth() + m)
  const nova_data_fim = d.toISOString().slice(0, 10)

  // 4. UPDATE contratos.data_fim
  const { error: updateErr } = await supabaseAdmin
    .from('contratos').update({ data_fim: nova_data_fim }).eq('id', id)
  if (updateErr) return { status: 500, erroMessage: updateErr.message }

  // 5. Fetch last parcela to find next fechamento start point
  const { data: lastParc, error: lastParcErr } = await supabaseAdmin
    .from('parcelas')
    .select('numero, data_fechamento')
    .eq('contrato_id', id)
    .order('numero', { ascending: false })
    .limit(1)
    .single()
  if (lastParcErr || !lastParc) return { status: 500, erroMessage: 'Erro ao buscar última parcela.' }

  // 6. Generate new parcelas month by month until nova_data_fim
  const novasParcelas = []
  let numero = lastParc.numero + 1
  // Next fechamento = 1st of the month after last fechamento
  let fechBase = new Date(lastParc.data_fechamento + 'T12:00:00')
  fechBase.setMonth(fechBase.getMonth() + 1)
  fechBase.setDate(1)
  const fim = new Date(nova_data_fim + 'T12:00:00')

  while (fechBase <= fim) {
    const fech = fechBase.toISOString().slice(0, 10)
    const venc = new Date(fechBase)
    venc.setDate(venc.getDate() + 7)
    novasParcelas.push({
      contrato_id: id,
      numero,
      data_fechamento: fech,
      data_vencimento: venc.toISOString().slice(0, 10),
      status: 'futura',
    })
    numero++
    fechBase.setMonth(fechBase.getMonth() + 1)
  }

  if (novasParcelas.length === 0) return { status: 200 } // edge: no new months needed

  // 7. Batch INSERT
  const { error: insertErr } = await supabaseAdmin.from('parcelas').insert(novasParcelas)
  if (insertErr) return { status: 500, erroMessage: insertErr.message }

  return { status: 200 }
}
```

---

## Shared Patterns

### Authentication guard
**Source:** `src/actions/contratos.js` lines 11–17 (canonical; also identically in `parcelas.js:9-15`)
**Apply to:** `renovarContrato` (new export in same file — reuse existing `authGuard` closure, no redeclaration needed)
```js
async function authGuard() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { err: { status: 401, erroMessage: 'Não autenticado.' } }
  if (!await isProprietario(supabase)) return { err: { status: 403, erroMessage: 'Sem permissão.' } }
  return { user }
}
```

### Ownership chain (4-step)
**Source:** `src/actions/parcelas.js` lines 22–37 (most complete example: parcela→contrato→unidade→edificio)
**Apply to:** `renovarContrato` uses 3-step (contrato→unidade→edificio) — same as `cancelarContrato` lines 85–98
```js
// Step pattern (each step returns 404 on missing, never leaks which record is missing):
const { data: X, error: Xerr } = await supabaseAdmin.from('T').select('col').eq('id', val).single()
if (Xerr || !X) return { status: 404, erroMessage: 'Contrato não encontrado.' }
```

### Error display in components
**Source:** `src/components/features/Contratos.js` lines 289–293 and `Parcelas.js` lines 92–96
```jsx
{erro && (
  <div className="px-4 py-[10px] mb-6 bg-[var(--danger-bg2)] border border-danger-fg font-mono text-[12px] text-danger-fg">
    {erro}
  </div>
)}
```

### Toast on success
**Source:** `src/components/features/Contratos.js` lines 109, 150, 167
```js
toast.success("Contrato cancelado")   // simple string
// For renovation, use dynamic string:
toast.success(`Contrato renovado`)
```

### Form state (single object)
**Source:** `src/components/features/Contratos.js` lines 66, 85–87
```js
const [form, setForm] = useState({ data_inicio: "", data_fim: "", ... })
function resetForm() { setForm({ data_inicio: "", ... }) }
// Update: setForm({ ...form, key: value })
```

### CSS tokens in use (verified in `src/app/globals.css`)
| Token | Value | Use in Phase 22 |
|---|---|---|
| `--warning` | `oklch(0.769 0.165 70.08)` | card border, countdown, progress fill when expiring |
| `--warning-bg` | `oklch(0.21 0.02 70)` | vencendo toggle button background |
| `--success` | `oklch(0.696 0.17 162.5)` | paga status, total recebido color |
| `--danger-fg` | `oklch(0.826 0.073 22.5)` | vencida data color, cancelar button |
| `--danger-bg2` | `oklch(0.27 0.13 27.38)` | inadimplência cell background |
| `--surface-hi` | `oklch(0.218 0 0)` | progress bar track, card inputs |
| `--border-3` | `oklch(0.387 0 0 / 0.4)` | all grid borders, card borders |
| `--primary-hover` | (derived from primary+0.25 lightness) | progress fill when not expiring |
| `--highlight` | (via `--ds-highlight`) | "Em aberto" label and value color |
| `--ease-crisp` | `cubic-bezier(0.22, 1, 0.36, 1)` | modal rFade animation |
| `rFade` | keyframe in globals.css | modal entry animation (already exists) |

### `romma-desktop-only` / `romma-mobile-only` utility classes
**Source:** `src/app/globals.css` (utility classes, verified present)
**Apply to:** Contratos.js — use `romma-desktop-only` on card grid, `romma-mobile-only` on row list

---

## Do NOT Replicate

| Anti-pattern | Source | Why |
|---|---|---|
| Tailwind utility classes for layout | `Locatarios.js` | Project canon uses inline styles + CSS vars for layout; Tailwind only for spacing/typography utilities via `cn()` |
| 4-space indentation | `locatarios.js` (action) | Project uses 2-space indent |
| Single-quote strings | `unidades.js`, `parcelas.js` (actions) | Project uses double quotes in components |
| Inline `authGuard` check | `gerarParcelas` in contratos.js lines 164–168 | Use the declared `authGuard()` function |
| `supabaseAdmin` imported in client component | N/A | Server-only; import only in `src/actions/` |
| `middleware.js` | N/A | File is `src/proxy.js` in this project |
| Re-calling Edge Function for parcelas | `gerarParcelas` export | `renovarContrato` must INSERT directly via `supabaseAdmin` (SC-5 rule) |

---

## No Analog Found

None. All three files have direct analogs (two are self-extends, one is a new export in an existing file). Design reference `console3.jsx` covers all visual patterns.

---

## Metadata

**Analog search scope:** `src/components/features/`, `src/actions/`, `src/lib/`, `.planning/design/js/`
**Files scanned:** 8 (Contratos.js, Parcelas.js, contratos.js action, parcelas.js action, queries-client.js, utils.js, globals.css, console3.jsx)
**Pattern extraction date:** 2026-06-16
