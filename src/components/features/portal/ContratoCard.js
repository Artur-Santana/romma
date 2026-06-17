import { fmtBRL, fmtData } from "@/lib/utils"

export default function ContratoCard({ contrato }) {
  return (
    <section className="border border-border-3 bg-surface">
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border-3">
        <div className="px-5 py-5">
          <span className="font-mono text-[10px] text-fg-4 tracking-[1.2px] uppercase block">UNIDADE</span>
          <span className="font-display font-bold text-[20px] leading-tight text-fg-1 block mt-2">
            {contrato.unidades?.nome ?? "—"}
          </span>
        </div>
        <div className="px-5 py-5">
          <span className="font-mono text-[10px] text-fg-4 tracking-[1.2px] uppercase block">VALOR MENSAL</span>
          <span className="font-display font-bold text-[20px] leading-tight text-fg-1 block mt-2">
            {fmtBRL(contrato.unidades?.valor_mensal)}
          </span>
        </div>
        <div className="px-5 py-5">
          <span className="font-mono text-[10px] text-fg-4 tracking-[1.2px] uppercase block">INÍCIO</span>
          <span className="font-display font-bold text-[20px] leading-tight text-fg-1 block mt-2">
            {fmtData(contrato.data_inicio)}
          </span>
        </div>
        <div className="px-5 py-5">
          <span className="font-mono text-[10px] text-fg-4 tracking-[1.2px] uppercase block">FIM</span>
          <span className="font-display font-bold text-[20px] leading-tight text-fg-1 block mt-2">
            {fmtData(contrato.data_fim)}
          </span>
        </div>
      </div>
    </section>
  )
}
