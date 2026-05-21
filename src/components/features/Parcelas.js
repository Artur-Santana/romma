"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getParcelasByContrato, getContratos, getLocatarios, getUnidades } from "@/lib/queries-client"
import { fmtData } from "@/lib/utils"
import StatusBadge from "@/components/ui/StatusBadge"
import { marcarParcelaComoPaga } from "@/actions/parcelas"

const COL = "60px 1fr 1fr 1fr 1.2fr 120px"

function HeaderCell({ children }) {
  return (
    <div style={{
      padding: "12px 20px",
      fontFamily: "var(--font-mono)",
      fontSize: 10, fontWeight: 700,
      letterSpacing: 1.4, textTransform: "uppercase",
      color: "var(--fg-4)",
    }}>
      {children}
    </div>
  )
}

export default function Parcelas({ contratoId }) {
  const router = useRouter()
  const [parcelas, setParcelas] = useState([])
  const [contrato, setContrato] = useState(null)
  const [locatario, setLocatario] = useState(null)
  const [unidade, setUnidade] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    async function carregar() {
      const [p, contratos, locatarios, unidades] = await Promise.all([
        getParcelasByContrato(contratoId),
        getContratos(),
        getLocatarios(),
        getUnidades(),
      ])
      setParcelas(p ?? [])
      const c = (contratos ?? []).find(x => x.id === contratoId)
      if (c) {
        setContrato(c)
        setLocatario((locatarios ?? []).find(l => l.id === c.locatario_id) ?? c.locatarios)
        setUnidade((unidades ?? []).find(u => u.id === c.unidade_id) ?? c.unidades)
      }
    }
    carregar()
  }, [contratoId])

  async function marcarComoPaga(parcela) {
    const result = await marcarParcelaComoPaga(parcela.id)
    if (result.status === 200) {
      setErro(null)
      setParcelas(await getParcelasByContrato(contratoId))
    } else {
      setErro(result.erroMessage)
    }
  }

  const pagas = parcelas.filter(p => p.status === "paga").length
  const pendentes = parcelas.filter(p => p.status === "pendente" || p.status === "vencida").length

  return (
    <div className="romma-page" style={{ padding: "48px 48px 80px", background: "var(--background)", minHeight: "100%" }}>

      {/* Back */}
      <button
        onClick={() => router.push("/dashboard/contratos")}
        style={{
          border: "1px solid var(--border-3)", background: "transparent",
          padding: "10px 20px", marginBottom: 40,
          fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
          letterSpacing: 1.2, textTransform: "uppercase", color: "var(--fg-3)",
          cursor: "pointer",
        }}
      >
        ← Contratos
      </button>

      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
        <span className="eyebrow eyebrow--indigo">SISTEMA.02 · PARCELAS</span>
        <h2 className="font-display" style={{ fontWeight: 700, fontSize: 48, letterSpacing: -2.4, color: "var(--fg-1)", margin: 0, lineHeight: 1 }}>
          Parcelas.
        </h2>
        {(locatario || unidade) && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)" }}>
            {locatario?.nome_razao_social ?? "—"} · {unidade?.nome ?? "—"}
          </span>
        )}
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-4)" }}>
          {pagas} pagas · {pendentes} pendentes · {parcelas.length} total
        </span>
      </div>

      {erro && (
        <div style={{ padding: "10px 16px", marginBottom: 24, background: "var(--danger-bg2)", border: "1px solid var(--danger)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--danger)" }}>
          {erro}
        </div>
      )}

      {/* Table */}
      <div style={{ border: "1px solid var(--border-3)", background: "var(--surface)", marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: COL, background: "oklch(0.26 0 0)", borderBottom: "1px solid var(--border-3)" }}>
          <HeaderCell>#</HeaderCell>
          <HeaderCell>Fechamento</HeaderCell>
          <HeaderCell>Vencimento</HeaderCell>
          <HeaderCell>Pagamento</HeaderCell>
          <HeaderCell>Status</HeaderCell>
          <HeaderCell>Ação</HeaderCell>
        </div>

        {parcelas.length === 0 && (
          <div style={{ padding: "48px 20px", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-4)", letterSpacing: 0.5 }}>
            Nenhuma parcela encontrada.
          </div>
        )}

        {parcelas.map((parcela, i) => (
          <div
            key={parcela.id}
            style={{
              display: "grid", gridTemplateColumns: COL,
              borderTop: i > 0 ? "1px solid var(--border-3)" : 0,
              alignItems: "center",
            }}
          >
            <div style={{ padding: "14px 20px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-2)", fontWeight: 700 }}>
                {String(parcela.numero).padStart(2, "0")}
              </span>
            </div>

            <div style={{ padding: "14px 20px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>
                {fmtData(parcela.data_fechamento)}
              </span>
            </div>

            <div style={{ padding: "14px 20px" }}>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 11,
                color: parcela.status === "vencida" ? "var(--danger)" : "var(--fg-3)",
              }}>
                {fmtData(parcela.data_vencimento)}
              </span>
            </div>

            <div style={{ padding: "14px 20px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: parcela.data_pagamento ? "var(--success)" : "var(--fg-5)" }}>
                {parcela.data_pagamento ? fmtData(parcela.data_pagamento) : "—"}
              </span>
            </div>

            <div style={{ padding: "14px 20px" }}>
              <StatusBadge status={parcela.status} />
            </div>

            <div style={{ padding: "14px 20px" }}>
              {(parcela.status === "pendente" || parcela.status === "vencida") && (
                <button
                  onClick={() => marcarComoPaga(parcela)}
                  style={{
                    border: "1px solid var(--success)", background: "transparent",
                    padding: "8px 16px", cursor: "pointer",
                    fontFamily: "var(--font-mono)", fontSize: 10,
                    fontWeight: 700, letterSpacing: 1, color: "var(--success)",
                    textTransform: "uppercase",
                  }}
                >
                  Marcar Paga
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
