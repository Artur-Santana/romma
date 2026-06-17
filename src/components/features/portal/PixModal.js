'use client'

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { fmtBRL, fmtData } from "@/lib/utils"
import { confirmarPagamentoLocatario } from "@/actions/parcelas"

const PIX_CODE_CONST = "00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540510.005802BR5911ROMMA DEMO6009SAO PAULO62070503***6304ABCD"

export default function PixModal({ open, parcela, contrato, onClose, onSucesso }) {
  if (!open || !parcela) return null

  const [modal, setModal] = useState({ loading: false, erro: null, copiado: false, copiouErro: false })

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && !modal.loading) onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [modal.loading, onClose])

  async function handleCopiar() {
    try {
      await navigator.clipboard.writeText(PIX_CODE_CONST)
      setModal(m => ({ ...m, copiado: true, copiouErro: false }))
      setTimeout(() => setModal(m => ({ ...m, copiado: false })), 2000)
    } catch {
      setModal(m => ({ ...m, copiouErro: true, copiado: false }))
      setTimeout(() => setModal(m => ({ ...m, copiouErro: false })), 2000)
    }
  }

  async function handleConfirmar() {
    setModal(m => ({ ...m, loading: true, erro: null }))
    const res = await confirmarPagamentoLocatario(parcela.id)
    if (res.status === 200) {
      setModal({ loading: false, erro: null, copiado: false, copiouErro: false })
      onClose()
      onSucesso()
    } else {
      setModal(m => ({ ...m, loading: false, erro: res.erroMessage ?? "Erro ao confirmar pagamento. Tente novamente." }))
    }
  }

  function handleFechar() {
    setModal({ loading: false, erro: null, copiado: false, copiouErro: false })
    onClose()
  }

  return (
    <div className="romma-modal-backdrop z-[100]" aria-modal="true" role="dialog">
      <div onClick={e => e.stopPropagation()} className="bg-surface border border-border-3 w-full max-w-md p-7 flex flex-col gap-5 mx-4">

        {/* Header */}
        <div className="flex flex-col gap-1">
          <span className="eyebrow eyebrow--indigo">PAGAMENTO VIA PIX</span>
          <span className="font-display font-bold text-[32px] leading-none tracking-[-1.6px] text-fg-1">
            {fmtBRL(contrato?.unidades?.valor_mensal)}
          </span>
          <span className="font-mono text-[11px] text-fg-3">
            Parcela {parcela.numero} · Vencimento: {fmtData(parcela.data_vencimento)}
          </span>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <img
            src="/pix-qr.png"
            alt="QR Code PIX estático"
            className="w-[160px] sm:w-[200px] h-auto block"
          />
        </div>

        {/* Código copia-e-cola */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] font-bold tracking-[1.4px] uppercase text-fg-4">CÓDIGO PIX</span>
          <div className="bg-background border border-border-3 px-4 py-3">
            <span className="font-mono text-[11px] text-fg-3 break-all select-all">{PIX_CODE_CONST}</span>
          </div>
          <button
            style={{ all: "unset", cursor: "pointer" }}
            className={cn(
              "font-mono text-[11px] font-bold tracking-[1px] uppercase px-4 py-2 border transition-colors w-fit",
              modal.copiado
                ? "border-success text-success"
                : modal.copiouErro
                ? "border-danger-fg text-danger-fg"
                : "border-border-3 text-fg-3 hover:text-fg-1 hover:border-fg-3"
            )}
            onClick={handleCopiar}
            disabled={modal.loading}
          >
            {modal.copiado ? "[✓] COPIADO" : modal.copiouErro ? "[!] ERRO AO COPIAR" : "[>] COPIAR CÓDIGO"}
          </button>
        </div>

        {/* Nota de demo — OBRIGATÓRIO PORT-05 */}
        <p className="font-mono text-[11px] text-fg-4 italic border-l-2 border-warning pl-3">
          Este é um ambiente de demonstração. O pagamento real não é processado. Clique em confirmar para registrar o pagamento.
        </p>

        {/* Erro inline */}
        {modal.erro && (
          <span className="font-mono text-[11px] text-danger-fg">{modal.erro}</span>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            style={{ all: "unset", cursor: "pointer" }}
            className="font-mono text-[11px] text-fg-4 border border-border-3 px-5 py-3 hover:text-fg-2 hover:border-fg-4 transition-colors text-center"
            onClick={handleFechar}
            disabled={modal.loading}
          >
            CANCELAR
          </button>
          <button
            style={{ all: "unset", cursor: "pointer" }}
            className={cn(
              "bg-indigo font-mono font-bold text-[11px] tracking-[1.5px] uppercase px-5 py-3 text-fg-1 text-center transition-opacity",
              modal.loading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90 cursor-pointer"
            )}
            onClick={handleConfirmar}
            disabled={modal.loading}
          >
            {modal.loading ? "[···] CONFIRMANDO" : "[✓] CONFIRMAR"}
          </button>
        </div>

      </div>
    </div>
  )
}
