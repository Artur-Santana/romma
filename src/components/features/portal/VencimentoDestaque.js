import { fmtBRL, fmtData, cn } from "@/lib/utils"

export default function VencimentoDestaque({ parcelas, contrato, onPagar }) {
  const pagaveis = parcelas.filter(p => p.status === 'pendente' || p.status === 'vencida')
  const proximaPagavel = pagaveis.sort(
    (a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento)
  )[0] ?? null

  if (!proximaPagavel) return null

  const totalParcelas = parcelas.length
  const diasRestantes = Math.ceil(
    (new Date(proximaPagavel.data_vencimento + 'T12:00:00') - new Date()) / 86400000
  )
  const vencida = proximaPagavel.status === 'vencida'

  return (
    <section
      className="border-l-4 border-l-indigo bg-surface p-6 flex flex-col gap-3 relative"
      style={{ borderLeftColor: 'var(--indigo)' }}
      aria-label={`Próximo vencimento: parcela ${proximaPagavel.numero} de ${totalParcelas}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="eyebrow eyebrow--indigo">PRÓXIMO VENCIMENTO</span>
        <span className={cn(
          "font-mono text-[9px] font-bold tracking-[1.2px] uppercase px-2 py-[3px]",
          vencida
            ? "bg-[var(--danger-bg2)] text-danger-fg border border-danger-fg"
            : "bg-[oklch(0.38_0.08_45)] text-[var(--warning)] border border-[var(--warning)]"
        )}>
          {vencida ? "VENCIDA" : "PENDENTE"}
        </span>
      </div>

      <span className="font-display font-bold text-[38px] sm:text-[48px] leading-none tracking-[-2px] text-fg-1">
        {fmtBRL(contrato.unidades?.valor_mensal)}
      </span>

      <span className="font-mono text-[11px] text-fg-3">
        Parcela {proximaPagavel.numero}/{totalParcelas} · vence {fmtData(proximaPagavel.data_vencimento)}
      </span>

      <span className={cn(
        "font-mono text-[11px] font-bold",
        vencida ? "text-danger-fg" : diasRestantes <= 7 ? "text-[var(--warning)]" : "text-fg-4"
      )}>
        {vencida
          ? `⚠ ${Math.abs(diasRestantes)} dia(s) em atraso`
          : `⏱ ${diasRestantes} dia(s) restantes`}
      </span>

      <button
        style={{ all: 'unset', cursor: 'pointer' }}
        className="bg-indigo text-fg-1 font-mono font-bold text-[11px] tracking-[1.5px] uppercase px-5 py-[11px] hover:opacity-90 transition-opacity mt-2 text-center"
        onClick={() => onPagar(proximaPagavel)}
        aria-label="Pagar próxima parcela via PIX"
      >
        PIX &nbsp; PAGAR AGORA &nbsp;→
      </button>
    </section>
  )
}
