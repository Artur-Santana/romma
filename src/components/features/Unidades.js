"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase-browser"
import { getEdificios, getUnidades } from "@/lib/queries-client"
import UnidadeCard from "@/components/ui/UnidadeCard"
import UnifiedUnidadeModal from "@/components/ui/UnifiedUnidadeModal"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import { deletarUnidade } from "@/actions/unidades"
import PageHeader from "@/components/ui/PageHeader"
import { Skeleton } from "@/components/ui/skeleton"

/* ── Skeleton ──────────────────────────────────────────────────────────── */
function SkeletonUnidades() {
  return (
    <div style={{ padding: "var(--rd-page-y) var(--rd-gutter)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12, marginTop: 32 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ border: "1px solid var(--border-3)", background: "var(--surface)", padding: "var(--rd-panel)" }}>
            <Skeleton className="h-32 w-full rounded-none" />
            <Skeleton className="h-4 w-3/4 mt-3 rounded-none" />
            <Skeleton className="h-3 w-1/2 mt-2 rounded-none" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Filter Select primitive ───────────────────────────────────────────── */
function FSelect({ value, onChange, children }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: "relative", flex: "0 0 200px" }}>
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          all: "unset", boxSizing: "border-box", width: "100%",
          padding: "10px 34px 10px 12px", fontSize: 13,
          fontFamily: "var(--font-mono)", color: "var(--fg-1)",
          background: "var(--surface-hi)", cursor: "pointer",
          border: `1px solid ${focused ? "var(--primary)" : "var(--border-3)"}`,
          transition: "border-color var(--dur-fast)"
        }}
      >
        {children}
      </select>
      <span style={{
        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
        pointerEvents: "none", fontFamily: "var(--font-mono)", fontSize: 10,
        color: "var(--fg-4)"
      }}>▾</span>
    </div>
  )
}

/* ── Monetary formatters ───────────────────────────────────────────────── */
function fmtBRLk(v) {
  if (v >= 1000) {
    const k = v / 1000
    const formatted = k % 1 === 0
      ? k.toLocaleString("pt-BR")
      : k.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    return `R$ ${formatted}k`
  }
  return `R$ ${v.toLocaleString("pt-BR")}`
}

/* ── Unidades ──────────────────────────────────────────────────────────── */
export default function Unidades() {
  const [unidades, setUnidades] = useState([])
  const [listaEdificios, setListaEdificios] = useState([])
  const [loadingInicial, setLoadingInicial] = useState(true)
  const [removingIds, setRemovingIds] = useState(new Set())
  const [erro, setErro] = useState(null)

  // Modal state: null | { mode: "create" | "edit", initial: unidade | null }
  const [modal, setModal] = useState(null)
  // Confirm delete state: null | unidade object
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Filter state
  const [query, setQuery] = useState("")
  const [fStatus, setFStatus] = useState("all")
  const [fEd, setFEd] = useState("all")

  async function carregarDados() {
    const [edificios, lista] = await Promise.all([
      getEdificios() ?? [],
      getUnidades() ?? [],
    ])
    const edificiosArr = edificios ?? []
    // Enrich each unidade with its edifício nome for the card subtitle
    const listaEnriquecida = (lista ?? []).map(u => ({
      ...u,
      edificios: { nome: edificiosArr.find(e => e.id === u.edificio_id)?.nome ?? "" }
    }))
    setListaEdificios(edificiosArr)
    setUnidades(listaEnriquecida)
  }

  useEffect(() => {
    async function fetchDados() {
      await carregarDados()
      setLoadingInicial(false)
    }
    fetchDados()
  }, [])

  /* ── Metrics (derived from full list) ─────────────────────────────────── */
  const totalM2 = unidades.reduce((s, u) => s + (u.area_m2 || 0), 0)
  const mrrRealizado = unidades
    .filter(u => u.status === "alugada")
    .reduce((s, u) => s + (u.valor_mensal || 0), 0)
  const potencialEmAberto = unidades
    .filter(u => u.status === "disponivel")
    .reduce((s, u) => s + (u.valor_mensal || 0), 0)
  const valoresOcultos = unidades.filter(u => !u.valor_visivel).length
  const alugadas = unidades.filter(u => u.status === "alugada").length
  const disponiveis = unidades.filter(u => u.status === "disponivel").length

  /* ── Live filter ───────────────────────────────────────────────────────── */
  const filtered = unidades.filter(u => {
    if (fEd !== "all" && u.edificio_id !== fEd) return false
    if (fStatus !== "all" && u.status !== fStatus) return false
    if (query && !u.nome.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  const filterActive = query !== "" || fStatus !== "all" || fEd !== "all"

  /* ── Delete handler ────────────────────────────────────────────────────── */
  async function handleDeletarUnidade(unidade) {
    setErro(null)
    // Best-effort Storage cleanup client-side before DB delete
    if (unidade.foto_url && !unidade.foto_url.startsWith("/")) {
      const supabase = createClient()
      await supabase.storage
        .from("unidades-fotos")
        .remove([unidade.foto_url])
        .catch(() => {})
    }
    setRemovingIds(prev => new Set([...prev, unidade.id]))
    const result = await deletarUnidade(unidade.id)
    if (result.status !== 200) {
      setErro(result.erroMessage)
      setRemovingIds(prev => { const n = new Set(prev); n.delete(unidade.id); return n })
      return
    }
    toast.success("Unidade removida")
    setTimeout(() => {
      carregarDados()
      setRemovingIds(prev => { const n = new Set(prev); n.delete(unidade.id); return n })
    }, 220)
  }

  if (loadingInicial) return <SkeletonUnidades />

  return (
    <div className="romma-page r-fade" style={{
      padding: "var(--rd-page-y) var(--rd-gutter)",
      paddingBottom: 64,
      minHeight: "100%",
    }}>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <PageHeader
        eyebrow="U.LIST · UNIDADES"
        title="Unidades."
        subtitle={`${disponiveis} disponíveis · ${alugadas} alugadas`}
        cta={{
          label: "Nova Unidade",
          code: "U+",
          onClick: () => setModal({ mode: "create", initial: null })
        }}
      />

      {/* ── Error line (delete errors) ───────────────────────────────────── */}
      {erro && (
        <div style={{
          background: "var(--danger-bg2)", borderLeft: "2px solid var(--danger-fg)",
          padding: "10px 14px", fontFamily: "var(--font-mono)",
          fontSize: 12, color: "var(--danger-fg)", marginBottom: 16
        }}>
          {erro}
        </div>
      )}

      {/* ── Metrics bar ─────────────────────────────────────────────────── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        border: "1px solid var(--border-3)",
        marginBottom: "var(--rd-block)",
      }}>
        {[
          {
            l: "Área total",
            v: totalM2.toLocaleString("pt-BR") + " m²",
            s: unidades.length + " unidades",
            gold: false,
          },
          {
            l: "MRR realizado",
            v: fmtBRLk(mrrRealizado),
            s: alugadas + " alugadas",
            gold: false,
          },
          {
            l: "Potencial em aberto",
            v: fmtBRLk(potencialEmAberto),
            s: disponiveis + " disponíveis",
            gold: true,
          },
          {
            l: "Valores ocultos",
            v: String(valoresOcultos),
            s: "não exibidos no site",
            gold: false,
          },
        ].map((m, i) => (
          <div
            key={m.l}
            style={{
              padding: "14px var(--rd-cell)",
              borderRight: i < 3 ? "1px solid var(--border-3)" : "none",
            }}
          >
            <div
              className="r-label"
              style={{
                fontSize: 9.5, marginBottom: 7,
                color: m.gold ? "var(--highlight)" : "var(--fg-4)",
              }}
            >
              {m.l}
            </div>
            <div style={{
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26,
              letterSpacing: "-1px",
              color: m.gold ? "var(--highlight)" : "var(--fg-1)",
            }}>
              {m.v}
            </div>
            <div className="r-meta" style={{ marginTop: 4 }}>{m.s}</div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 8, marginBottom: "var(--rd-block-sm)",
        flexWrap: "wrap", alignItems: "center",
      }}>
        {/* Search input */}
        <div style={{ position: "relative", flex: "0 0 240px" }}>
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-5)",
            pointerEvents: "none",
          }}>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar unidade..."
            style={{
              all: "unset", boxSizing: "border-box", width: "100%",
              padding: "9px 12px 9px 30px", fontSize: 13,
              fontFamily: "var(--font-body)", color: "var(--fg-1)",
              background: "var(--surface-hi)",
              border: "1px solid var(--border-3)",
            }}
          />
        </div>

        {/* Status toggle buttons */}
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { id: "all", l: "Todos" },
            { id: "disponivel", l: "Disponível" },
            { id: "alugada", l: "Alugada" },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setFStatus(s.id)}
              style={{
                all: "unset", cursor: "pointer",
                padding: "8px 12px",
                fontFamily: "var(--font-mono)", fontSize: 10,
                letterSpacing: "0.5px", textTransform: "uppercase",
                border: `1px solid ${fStatus === s.id ? "var(--indigo)" : "var(--border-3)"}`,
                background: fStatus === s.id ? "oklch(0.339 0.179 301.68 / 0.18)" : "transparent",
                color: fStatus === s.id ? "var(--fg-1)" : "var(--fg-4)",
              }}
            >
              {s.l}
            </button>
          ))}
        </div>

        {/* Edifício select */}
        <FSelect value={fEd} onChange={(e) => setFEd(e.target.value)}>
          <option value="all">Todos os edifícios</option>
          {listaEdificios.map(ed => (
            <option key={ed.id} value={ed.id}>{ed.nome}</option>
          ))}
        </FSelect>

        {/* Result count — only when a filter is active */}
        {filterActive && (
          <span className="r-meta" style={{ color: "var(--fg-4)" }}>
            {filtered.length} resultado(s)
          </span>
        )}
      </div>

      {/* ── Card grid ───────────────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 12,
        alignItems: "start",
      }}>
        {filtered.length === 0 && (
          <div style={{
            padding: "40px 24px", textAlign: "center", gridColumn: "1 / -1",
          }}>
            <span className="r-meta">
              {unidades.length === 0
                ? "Nenhuma unidade cadastrada. Clique em Nova Unidade para começar."
                : "Nenhuma unidade corresponde aos filtros."}
            </span>
          </div>
        )}
        {filtered.map(unidade => {
          const isRemoving = removingIds.has(unidade.id)
          return (
            <div
              key={unidade.id}
              style={{
                opacity: isRemoving ? 0 : 1,
                transform: isRemoving ? "scale(0.97)" : "scale(1)",
                transition: "opacity 220ms ease, transform 220ms ease",
              }}
            >
              <UnidadeCard
                unidade={unidade}
                onEditar={(u) => setModal({ mode: "edit", initial: u })}
                onDeletar={(u) => setConfirmDelete(u)}
              />
            </div>
          )
        })}
      </div>

      {/* ── UnifiedUnidadeModal ──────────────────────────────────────────── */}
      {modal && (
        <UnifiedUnidadeModal
          mode={modal.mode}
          initial={modal.initial}
          edificios={listaEdificios}
          onClose={() => setModal(null)}
          onSaved={() => { carregarDados(); setModal(null) }}
        />
      )}

      {/* ── ConfirmDialog (delete) ───────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Remover unidade?"
        body={`A unidade ${confirmDelete?.nome} será removida permanentemente. Esta ação não pode ser desfeita.`}
        confirmLabel="Remover Unidade"
        cancelLabel="Cancelar"
        danger={true}
        onConfirm={() => { handleDeletarUnidade(confirmDelete); setConfirmDelete(null) }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
