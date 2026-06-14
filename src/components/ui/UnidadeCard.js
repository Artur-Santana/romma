"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-browser"

/* ── Signed URL hook ───────────────────────────────────────────────────── */
function useFotoSignedUrl(fotoUrl) {
  // For static /public paths, seed the initial value directly to avoid
  // a setState-in-effect call that would trigger a cascading render.
  const [signedUrl, setSignedUrl] = useState(
    () => (fotoUrl && fotoUrl.startsWith("/")) ? fotoUrl : null
  )

  useEffect(() => {
    if (!fotoUrl) return
    if (fotoUrl.startsWith("/")) return  // already seeded by useState initializer
    let cancelled = false
    const supabase = createClient()
    supabase.storage
      .from("unidades-fotos")
      .createSignedUrl(fotoUrl, 3600)
      .then(({ data, error }) => {
        if (!cancelled && !error && data?.signedUrl) setSignedUrl(data.signedUrl)
      })
    return () => { cancelled = true }
  }, [fotoUrl])

  return signedUrl
}

/* ── Status badge ──────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const isAlugada = status === "alugada"
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: "0.5px",
      textTransform: "uppercase",
      padding: "2px 6px",
      background: isAlugada
        ? "oklch(0.339 0.1793 301.68 / 0.20)"
        : "oklch(0.696 0.17 162.5 / 0.15)",
      color: isAlugada ? "var(--fg-1)" : "var(--success)",
      flexShrink: 0,
    }}>
      {isAlugada ? "Alugada" : "Disponível"}
    </span>
  )
}

/* ── UnidadeCard — Variante B ──────────────────────────────────────────── */
export default function UnidadeCard({ unidade, onEditar, onDeletar }) {
  const fotoResolvida = useFotoSignedUrl(unidade.foto_url)

  // Format value: always show on dashboard (owner view)
  function fmtValor(v) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency", currency: "BRL", maximumFractionDigits: 0
    }).format(v ?? 0)
  }

  const edificioNome = unidade.edificios?.nome ?? ""
  const area = unidade.area_m2 ? `${unidade.area_m2} m²` : ""
  const subtitulo = [edificioNome, area].filter(Boolean).join(" · ")

  return (
    <div style={{
      border: "1px solid var(--border-3)",
      background: "var(--surface)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Cover photo */}
      {fotoResolvida && (
        <div style={{ height: 140, overflow: "hidden", flexShrink: 0 }}>
          <img
            src={fotoResolvida}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      {/* Card body */}
      <div style={{
        padding: "var(--rd-panel)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}>
        {/* Name line + badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              className="r-subhead"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "var(--fg-1)",
              }}
            >
              {unidade.nome}
            </div>
            {subtitulo && (
              <div className="r-meta" style={{ marginTop: 2, color: "var(--fg-4)" }}>
                {subtitulo}
              </div>
            )}
          </div>
          <StatusBadge status={unidade.status} />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border-3)" }} />

        {/* Value line + actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            {unidade.valor_visivel ? (
              <>
                <span className="r-data" style={{ fontSize: 14, color: "var(--fg-1)" }}>
                  {fmtValor(unidade.valor_mensal)}
                </span>
                <span className="r-meta" style={{ color: "var(--fg-4)" }}>/mês</span>
              </>
            ) : (
              <span className="r-meta" style={{ color: "var(--fg-5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Valor sob consulta
              </span>
            )}
          </div>

          {/* Micro action buttons */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => onEditar(unidade)}
              style={{
                all: "unset", cursor: "pointer",
                fontFamily: "var(--font-mono)",
                fontSize: 10, fontWeight: 700,
                color: "var(--fg-3)",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                padding: "5px 9px",
                border: "1px solid var(--border-3)",
              }}
            >
              Editar
            </button>
            <button
              onClick={() => onDeletar(unidade)}
              style={{
                all: "unset", cursor: "pointer",
                fontFamily: "var(--font-mono)",
                fontSize: 10, fontWeight: 700,
                color: "var(--danger-fg)",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                padding: "5px 9px",
                border: "1px solid color-mix(in oklch, var(--destructive) 30%, transparent)",
              }}
            >
              Remover
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
