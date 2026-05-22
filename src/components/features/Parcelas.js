"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getParcelasByContrato, getContratos, getLocatarios, getUnidades } from "@/lib/queries-client"
import { cn, fmtData } from "@/lib/utils"
import StatusBadge from "@/components/ui/StatusBadge"
import { Button } from "@/components/ui/button"
import { marcarParcelaComoPaga } from "@/actions/parcelas"

const COL = "60px 1fr 1fr 1fr 1.2fr 120px"
const gridStyle = { gridTemplateColumns: COL }

function HeaderCell({ children }) {
  return (
    <div className="px-5 py-3 font-mono text-[10px] font-bold tracking-[1.4px] uppercase text-fg-4">
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
    <div className="romma-page bg-background min-h-full px-12 pt-12 pb-20">

      {/* Back */}
      <Button
        variant="outline"
        onClick={() => router.push("/dashboard/contratos")}
        className="border-border-3 bg-transparent text-fg-3 font-mono text-[10px] uppercase tracking-[1.2px] font-bold rounded-none mb-10 h-auto py-[10px] px-5"
      >
        ← Contratos
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-3 mb-12">
        <span className="eyebrow eyebrow--indigo">SISTEMA.02 · PARCELAS</span>
        <h2 className="font-display font-bold text-[48px] leading-none tracking-[-2.4px] text-fg-1 m-0">
          Parcelas.
        </h2>
        {(locatario || unidade) && (
          <span className="font-mono text-[12px] text-fg-3">
            {locatario?.nome_razao_social ?? "—"} · {unidade?.nome ?? "—"}
          </span>
        )}
        <span className="font-mono text-[12px] text-fg-4">
          {pagas} pagas · {pendentes} pendentes · {parcelas.length} total
        </span>
      </div>

      {erro && (
        <div className="px-4 py-[10px] mb-6 bg-[var(--danger-bg2)] border border-danger-fg font-mono text-[12px] text-danger-fg">
          {erro}
        </div>
      )}

      {/* Table */}
      <div className="border border-border-3 bg-surface mb-8">
        <div style={gridStyle} className="grid bg-[oklch(0.26_0_0)] border-b border-border-3">
          <HeaderCell>#</HeaderCell>
          <HeaderCell>Fechamento</HeaderCell>
          <HeaderCell>Vencimento</HeaderCell>
          <HeaderCell>Pagamento</HeaderCell>
          <HeaderCell>Status</HeaderCell>
          <HeaderCell>Ação</HeaderCell>
        </div>

        {parcelas.length === 0 && (
          <div className="px-5 py-12 text-center font-mono text-[12px] text-fg-4 tracking-[0.5px]">
            Nenhuma parcela encontrada.
          </div>
        )}

        {parcelas.map((parcela, i) => (
          <div
            key={parcela.id}
            style={gridStyle}
            className={cn("grid items-center", i > 0 ? "border-t border-border-3" : "")}
          >
            <div className="px-5 py-[14px]">
              <span className="font-mono text-[12px] text-fg-2 font-bold">
                {String(parcela.numero).padStart(2, "0")}
              </span>
            </div>

            <div className="px-5 py-[14px]">
              <span className="font-mono text-[11px] text-fg-3">
                {fmtData(parcela.data_fechamento)}
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
              {(parcela.status === "pendente" || parcela.status === "vencida") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => marcarComoPaga(parcela)}
                  className="border-success text-success font-mono text-[10px] uppercase tracking-[1px] font-bold rounded-none h-auto py-2 px-4"
                >
                  Marcar Paga
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
