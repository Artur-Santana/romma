'use client'

import { useState } from "react"
import StatusBadge from "@/components/ui/StatusBadge"
import { fmtData, fmtBRL, cn } from "@/lib/utils"

function gerarCodigoAuth(parcelaId, dataPagamento) {
  return btoa(parcelaId.slice(0, 8) + (dataPagamento ?? ''))
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase()
    .slice(0, 8)
}

export default function ParcelsTable({ parcelas, locatario, contrato, onPagar }) {
  const [erroPDF, setErroPDF] = useState(null)

  async function handleBaixarRecibo(parcela, totalParcelas) {
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
      doc.text(`Parcela:      ${parcela.numero} de ${totalParcelas}`, 20, 56)
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
    <section data-testid="parcelas-table" aria-label="HISTÓRICO DE PARCELAS" className="mt-10">
      <span className="eyebrow eyebrow--indigo">HISTÓRICO DE PARCELAS</span>
      <div className="mt-4 overflow-x-auto">
        <div className="border border-border-3 bg-surface min-w-[600px]">
          <div className="grid grid-cols-[60px_1fr_1fr_1fr_1.4fr] border-b border-border-3 bg-[oklch(0.26_0_0)]">
            <div className="px-5 py-3 font-mono text-[10px] font-bold tracking-[1.4px] uppercase text-fg-4">#</div>
            <div className="px-5 py-3 font-mono text-[10px] font-bold tracking-[1.4px] uppercase text-fg-4">Vencimento</div>
            <div className="px-5 py-3 font-mono text-[10px] font-bold tracking-[1.4px] uppercase text-fg-4">Pagamento</div>
            <div className="px-5 py-3 font-mono text-[10px] font-bold tracking-[1.4px] uppercase text-fg-4">Status</div>
            <div className="px-5 py-3 font-mono text-[10px] font-bold tracking-[1.4px] uppercase text-fg-4">Ação</div>
          </div>
          {parcelas.length === 0 && (
            <div className="px-5 py-12 text-center font-mono text-[12px] text-fg-4 tracking-[0.5px]">
              Nenhuma parcela registrada para este contrato.
            </div>
          )}
          {parcelas.map((parcela, i) => (
            <div
              key={parcela.id}
              className={cn(
                "grid grid-cols-[60px_1fr_1fr_1fr_1.4fr] items-center",
                i > 0 ? "border-t border-border-3" : ""
              )}
            >
              <div className="px-5 py-[14px]">
                <span className="font-mono text-[12px] text-fg-2 font-bold">
                  {String(parcela.numero).padStart(2, "0")}
                </span>
              </div>
              <div className="px-5 py-[14px]">
                <span className={cn("font-mono text-[11px]", parcela.status === "vencida" ? "text-danger-fg" : "text-fg-3")}>
                  {fmtData(parcela.data_vencimento)}
                </span>
              </div>
              <div className="px-5 py-[14px]">
                <span className={cn("font-mono text-[11px]", parcela.data_pagamento ? "text-success" : "text-fg-5")}>
                  {parcela.data_pagamento ? fmtData(parcela.data_pagamento) : "—"}
                </span>
              </div>
              <div className="px-5 py-[14px]">
                <StatusBadge status={parcela.status} />
              </div>
              <div className="px-5 py-[14px]">
                {(parcela.status === 'pendente' || parcela.status === 'vencida') && (
                  <button
                    style={{ all: 'unset', cursor: 'pointer' }}
                    className="font-mono text-[10px] font-bold tracking-[1px] uppercase text-indigo hover:opacity-70 transition-opacity"
                    aria-label={`Pagar parcela ${String(parcela.numero).padStart(2, '0')}`}
                    onClick={() => onPagar(parcela)}
                  >
                    [&gt;] PAGAR
                  </button>
                )}
                {parcela.status === 'paga' && (
                  <button
                    style={{ all: 'unset', cursor: 'pointer' }}
                    className="font-mono text-[10px] font-bold tracking-[1px] uppercase text-fg-4 hover:text-fg-2 transition-colors"
                    aria-label={`Baixar comprovante da parcela ${String(parcela.numero).padStart(2, '0')}`}
                    onClick={() => handleBaixarRecibo(parcela, parcelas.length)}
                  >
                    [↓] RECIBO
                  </button>
                )}
                {!['pendente', 'vencida', 'paga'].includes(parcela.status) && (
                  <span className="font-mono text-[10px] text-fg-5">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {erroPDF && (
        <p className="mt-2 font-mono text-[11px] text-danger-fg">{erroPDF}</p>
      )}
    </section>
  )
}
