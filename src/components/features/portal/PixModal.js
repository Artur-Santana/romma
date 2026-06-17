'use client'

import { useState, useEffect, useMemo } from "react"
import { fmtBRL, fmtData } from "@/lib/utils"
import { confirmarPagamentoLocatario } from "@/actions/parcelas"

// Deterministic faux-QR — 25×25 crisp module grid seeded from string
function FauxQR({ seed = "romma", size = 148 }) {
  const n = 25
  const cells = useMemo(() => {
    let s = 0
    for (let i = 0; i < seed.length; i++) s = (s * 131 + seed.charCodeAt(i)) >>> 0
    const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff }
    const arr = []
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const finder = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7)
      arr.push(finder ? null : rnd() > 0.5)
    }
    return arr
  }, [seed])

  const u = size / n
  const Finder = ({ top, left }) => (
    <div style={{ position: "absolute", top, left, width: size * 7 / n, height: size * 7 / n, border: `${u}px solid #0a0a0c`, boxSizing: "border-box" }}>
      <div style={{ position: "absolute", inset: u, background: "#0a0a0c" }} />
    </div>
  )

  return (
    <div style={{ position: "relative", width: size, height: size, background: "#fff", flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: u, display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, gridTemplateRows: `repeat(${n}, 1fr)`, width: size - 2 * u, height: size - 2 * u }}>
        {cells.map((on, i) => <div key={i} style={{ background: on ? "#0a0a0c" : "transparent" }} />)}
      </div>
      <Finder top={u} left={u} />
      <Finder top={u} left={size - u - size * 7 / n} />
      <Finder top={size - u - size * 7 / n} left={u} />
    </div>
  )
}

export default function PixModal({ open, parcela, contrato, onClose, onSucesso }) {
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === "Escape" && !loading) onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, loading, onClose])

  if (!open || !parcela) return null

  const valor = contrato?.unidades?.valor_mensal ?? 0
  const pixCode = "00020126580014BR.GOV.BCB.PIX0136romma-2026-c1-p12520400005303986540" + String(valor) + "5802BR5909ROMMA LTDA6009SAO PAULO62070503***6304A1B2"
  const totalParcelas = 12

  async function handleCopiar() {
    try {
      await navigator.clipboard.writeText(pixCode)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch { /* clipboard denied */ }
  }

  async function handleConfirmar() {
    setLoading(true)
    setErro(null)
    const res = await confirmarPagamentoLocatario(parcela.id)
    setLoading(false)
    if (res.status === 200) {
      onClose()
      onSucesso()
    } else {
      setErro(res.erroMessage ?? "Erro ao confirmar pagamento. Tente novamente.")
    }
  }

  function handleFechar() {
    if (loading) return
    setErro(null)
    setCopiado(false)
    onClose()
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) handleFechar() }}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "oklch(0 0 0 / 0.74)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "rFade 200ms var(--ease-crisp)" }}
      aria-modal="true"
      role="dialog"
    >
      <div className="r-scroll" style={{ width: "100%", maxWidth: 420, background: "var(--surface)", border: "1px solid var(--indigo)", maxHeight: "92%", overflowY: "auto" }}>
        <div style={{ padding: 26 }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <span className="eyebrow eyebrow--indigo" style={{ marginBottom: 6 }}>Pagamento via PIX</span>
              <h3 className="r-section">Parcela {String(parcela.numero).padStart(2, "0")}/{totalParcelas}</h3>
            </div>
            <button
              onClick={handleFechar}
              style={{ all: "unset", cursor: "pointer", width: 30, height: 30, border: "1px solid var(--border-3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-3)", fontFamily: "var(--font-mono)", fontSize: 14, flexShrink: 0 }}
            >✕</button>
          </div>

          {/* QR + valor */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <FauxQR seed={pixCode} />
            <div style={{ textAlign: "center" }}>
              <div className="r-label" style={{ marginBottom: 6 }}>Valor a pagar</div>
              <div className="r-metric" style={{ fontSize: 36, color: "var(--indigo)" }}>{fmtBRL(valor)}</div>
            </div>
          </div>

          {/* PIX copia e cola */}
          <div style={{ border: "1px solid var(--border-3)", background: "var(--surface-hi)", padding: "12px 14px", marginBottom: 16 }}>
            <div className="r-label" style={{ marginBottom: 8 }}>PIX Copia e Cola</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="r-data" style={{ fontSize: 11, color: "var(--fg-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{pixCode}</span>
              <button
                onClick={handleCopiar}
                className="r-ghostbtn"
                style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: copiado ? "var(--success)" : "var(--indigo)", letterSpacing: "0.5px", textTransform: "uppercase", flexShrink: 0 }}
              >
                {copiado ? "✓ Copiado" : "Copiar"}
              </button>
            </div>
          </div>

          {/* Nota */}
          <span className="r-meta" style={{ display: "block", textAlign: "center", marginBottom: 16 }}>
            Ao confirmar, o painel do proprietário é atualizado automaticamente para{" "}
            <span style={{ color: "var(--success)" }}>Pago</span>.{" "}
            (Processamento de pagamento ainda não implementado.)
          </span>

          {/* Erro inline */}
          {erro && (
            <span className="r-meta" style={{ display: "block", color: "var(--danger-fg)", marginBottom: 12, textAlign: "center" }}>{erro}</span>
          )}

          {/* Confirmar button */}
          <button
            onClick={handleConfirmar}
            disabled={loading}
            style={{ all: "unset", boxSizing: "border-box", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "15px 22px", width: "100%", background: "var(--indigo)", color: "var(--fg-1)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12, letterSpacing: "1.2px", textTransform: "uppercase", opacity: loading ? 0.6 : 1 }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88" }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.opacity = "1" }}
          >
            <span style={{ fontFamily: "var(--font-mono)", opacity: 0.85 }}>{loading ? "[···]" : "[✓]"}</span>
            <span>{loading ? "Confirmando..." : "Já efetuei o pagamento"}</span>
            <span style={{ fontFamily: "var(--font-mono)", opacity: 0.85 }}>200</span>
          </button>

        </div>
      </div>
    </div>
  )
}
