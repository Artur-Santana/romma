'use client'

import { useState } from "react"
import StatusBadge from "@/components/ui/StatusBadge"
import { fmtData, fmtBRL } from "@/lib/utils"

const GRID = "56px 1fr 1fr 1fr 110px"

function gerarCodigoAuth(parcelaId, dataPagamento) {
  return btoa(parcelaId.slice(0, 8) + (dataPagamento ?? ''))
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase()
    .slice(0, 8)
}

export default function ParcelsTable({ parcelas, locatario, contrato }) {
  const [erroPDF, setErroPDF] = useState(null)

  async function handleBaixarRecibo(parcela) {
    try {
      const mod = await import('jspdf')
      const JsPDF = mod.jsPDF ?? mod.default?.jsPDF ?? mod.default
      if (!JsPDF) throw new Error('jsPDF não carregou')
      const doc = new JsPDF()
      const codigoAuth = gerarCodigoAuth(parcela.id, parcela.data_pagamento)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('ROMMA — COMPROVANTE DE PAGAMENTO', 105, 15, { align: 'center' })
      doc.line(20, 22, 190, 22)

      doc.setFontSize(10)
      doc.text('DADOS DA PARCELA', 20, 32)
      doc.setFont('helvetica', 'normal')
      doc.text(`Locatário:    ${locatario?.nome_razao_social ?? '—'}`, 20, 40)
      doc.text(`Unidade:      ${contrato?.unidades?.nome ?? '—'}`, 20, 48)
      doc.text(`Parcela:      ${parcela.numero} de ${parcelas.length}`, 20, 56)
      doc.text(`Valor mensal: ${fmtBRL(contrato?.unidades?.valor_mensal)}`, 20, 64)

      doc.setFont('helvetica', 'bold')
      doc.text('DATAS', 20, 76)
      doc.setFont('helvetica', 'normal')
      const fmtPDF = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
      doc.text(`Fechamento:   ${fmtPDF(parcela.data_fechamento)}`, 20, 84)
      doc.text(`Vencimento:   ${fmtPDF(parcela.data_vencimento)}`, 20, 92)
      doc.text(`Pagamento:    ${fmtPDF(parcela.data_pagamento)}`, 20, 100)

      doc.setFont('helvetica', 'bold')
      doc.text('PAGAMENTO', 20, 112)
      doc.setFont('helvetica', 'normal')
      doc.text('Forma:              PIX', 20, 120)
      doc.text(`Código de auth.:    ${codigoAuth}`, 20, 128)

      doc.line(20, 145, 190, 145)
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text('Este documento é gerado automaticamente pelo sistema Romma.', 20, 152)
      doc.text('Código de autenticação identifica unicamente este comprovante.', 20, 158)

      doc.save(`recibo-parcela-${String(parcela.numero).padStart(2, '0')}.pdf`)
      setErroPDF(null)
    } catch (e) {
      setErroPDF('Não foi possível gerar o comprovante. Tente novamente.')
    }
  }

  return (
    <section data-testid="parcelas-table" aria-label="HISTÓRICO DE PARCELAS" style={{ marginTop: 32 }}>
      <span className="eyebrow eyebrow--indigo" style={{ marginBottom: 14 }}>Histórico de Parcelas</span>
      <div style={{ overflowX: "auto", marginTop: 14 }}>
        <div className="r-panel" style={{ overflowX: "auto" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: GRID, background: "var(--surface-hi)", borderBottom: "1px solid var(--border-3)", minWidth: 480 }}>
            {["#", "Vencimento", "Pagamento", "Status", "Comprovante"].map(h => (
              <span key={h} className="r-label" style={{ padding: "11px var(--rd-row-x)", fontSize: 10 }}>{h}</span>
            ))}
          </div>
          {/* Empty */}
          {parcelas.length === 0 && (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <span className="r-meta">Nenhuma parcela registrada para este contrato.</span>
            </div>
          )}
          {/* Rows */}
          {parcelas.map((p, i) => (
            <div
              key={p.id}
              style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "center", borderTop: i > 0 ? "1px solid var(--border-3)" : "none", minWidth: 480 }}
            >
              <span className="r-data" style={{ padding: "var(--rd-row-y) var(--rd-row-x)", fontWeight: 700 }}>
                {String(p.numero).padStart(2, "0")}
              </span>
              <span className="r-data" style={{ padding: "var(--rd-row-y) var(--rd-row-x)", fontSize: 13, color: p.status === 'vencida' ? "var(--danger-fg)" : "var(--fg-3)" }}>
                {fmtData(p.data_vencimento)}
              </span>
              <span className="r-data" style={{ padding: "var(--rd-row-y) var(--rd-row-x)", fontSize: 13, color: p.data_pagamento ? "var(--success)" : "var(--fg-5)" }}>
                {p.data_pagamento ? fmtData(p.data_pagamento) : "—"}
              </span>
              <span style={{ padding: "var(--rd-row-y) var(--rd-row-x)" }}>
                <StatusBadge status={p.status} />
              </span>
              <span style={{ padding: "var(--rd-row-y) var(--rd-row-x)" }}>
                {p.status === 'paga'
                  ? (
                    <button
                      onClick={() => handleBaixarRecibo(p)}
                      className="r-ghostbtn"
                      style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--fg-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}
                      aria-label={`Baixar comprovante parcela ${p.numero}`}
                    >
                      ⤓ Baixar
                    </button>
                  )
                  : <span className="r-meta" style={{ color: "var(--fg-5)" }}>—</span>
                }
              </span>
            </div>
          ))}
        </div>
      </div>
      {erroPDF && (
        <p style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--danger-fg)" }}>{erroPDF}</p>
      )}
    </section>
  )
}
