import StatusBadge from "@/components/ui/StatusBadge"
import { fmtData, cn } from "@/lib/utils"

export default function ParcelsTable({ parcelas }) {
  return (
    <section data-testid="parcelas-table" aria-label="HISTÓRICO DE PARCELAS" className="mt-10">
      <span className="eyebrow eyebrow--indigo">HISTÓRICO DE PARCELAS</span>
      <div className="mt-4 overflow-x-auto">
        <div className="border border-border-3 bg-surface min-w-[480px]">
          <div className="grid grid-cols-[60px_1fr_1fr_1.2fr] border-b border-border-3 bg-[oklch(0.26_0_0)]">
            <div className="px-5 py-3 font-mono text-[10px] font-bold tracking-[1.4px] uppercase text-fg-4">#</div>
            <div className="px-5 py-3 font-mono text-[10px] font-bold tracking-[1.4px] uppercase text-fg-4">Vencimento</div>
            <div className="px-5 py-3 font-mono text-[10px] font-bold tracking-[1.4px] uppercase text-fg-4">Pagamento</div>
            <div className="px-5 py-3 font-mono text-[10px] font-bold tracking-[1.4px] uppercase text-fg-4">Status</div>
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
                "grid grid-cols-[60px_1fr_1fr_1.2fr] items-center",
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
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
