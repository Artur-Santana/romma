import { fmtBRL, fmtData, cn } from "@/lib/utils"
import StatusBadge from "@/components/ui/StatusBadge"

export default function ContratoCard({ contrato, parcelas = [] }) {
  return (
    <section className="border border-border-3 bg-surface p-7">
      <span className="eyebrow eyebrow--indigo">CONTRATO ATIVO</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
        <div>
          <span className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase block">
            UNIDADE
          </span>
          <span className="font-display font-bold text-[24px] leading-tight text-fg-1 block mt-1">
            {contrato.unidades?.nome ?? "—"}
          </span>
        </div>
        <div>
          <span className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase block">
            VALOR MENSAL
          </span>
          <span className="font-display font-bold text-[24px] leading-tight text-fg-1 block mt-1">
            {fmtBRL(contrato.unidades?.valor_mensal)}
          </span>
        </div>
        <div>
          <span className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase block">
            INÍCIO
          </span>
          <span className="font-display font-bold text-[24px] leading-tight text-fg-1 block mt-1">
            {fmtData(contrato.data_inicio)}
          </span>
        </div>
        <div>
          <span className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase block">
            FIM
          </span>
          <span className="font-display font-bold text-[24px] leading-tight text-fg-1 block mt-1">
            {fmtData(contrato.data_fim)}
          </span>
        </div>
        <div>
          <span className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase block">
            STATUS
          </span>
          <div className="mt-1">
            <StatusBadge status={contrato.status} />
          </div>
        </div>
      </div>
      {parcelas.length > 0 && (() => {
        const total = parcelas.length
        const pagas = parcelas.filter(p => p.status === 'paga').length
        const pct = Math.round((pagas / total) * 100)
        return (
          <div className="mt-4">
            <div
              className="w-full bg-border-3"
              style={{ height: 6 }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progresso do contrato: ${pagas} parcelas pagas de ${total}`}
            >
              <div className="bg-indigo h-full origin-left" style={{ width: pct + '%' }} />
            </div>
            <div className="flex gap-4 mt-2">
              <span className="font-mono text-[11px] text-fg-4">{pagas} pagas · {total} total</span>
              <span className={cn("font-mono text-[11px]", pct === 100 ? "text-success" : "text-highlight")}>
                · {pct}% adimplente
              </span>
            </div>
          </div>
        )
      })()}
    </section>
  )
}
