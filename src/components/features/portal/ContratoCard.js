import { fmtBRL, fmtData } from "@/lib/utils"
import StatusBadge from "@/components/ui/StatusBadge"

export default function ContratoCard({ contrato }) {
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
    </section>
  )
}
