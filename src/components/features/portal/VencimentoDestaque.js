import { fmtBRL, cn } from "@/lib/utils"

export default function VencimentoDestaque({ parcelas, contrato, onPagar }) {
  const pagaveis = parcelas.filter(p => p.status === 'pendente' || p.status === 'vencida')
  const proximaPagavel = pagaveis.sort(
    (a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento)
  )[0] ?? null

  if (!proximaPagavel) return null

  const totalParcelas = parcelas.length
  const diasRestantes = Math.ceil(
    (new Date(proximaPagavel.data_vencimento) - new Date()) / 86400000
  )

  return (
    <section
      className="mt-8 border-l-4 border-l-highlight bg-surface p-6 flex flex-col gap-3"
      aria-label={`Próximo vencimento: ${fmtBRL(contrato.unidades?.valor_mensal)}, parcela ${proximaPagavel.numero} de ${totalParcelas}, vencimento em ${diasRestantes < 0 ? `${Math.abs(diasRestantes)} dias em atraso` : `${diasRestantes} dias`}`}
    >
      <span className="eyebrow eyebrow--indigo">PRÓXIMO VENCIMENTO</span>
      <span className="font-display font-bold text-[32px] leading-none tracking-[-1.6px] text-fg-1">
        {fmtBRL(contrato.unidades?.valor_mensal)}
      </span>
      <span className={cn(
        "font-mono text-[11px]",
        diasRestantes < 0 ? "text-danger-fg" : diasRestantes <= 7 ? "text-warning" : "text-fg-3"
      )}>
        Parcela {proximaPagavel.numero}/{totalParcelas} ·{" "}
        {diasRestantes < 0
          ? `${Math.abs(diasRestantes)} dias em atraso`
          : `${diasRestantes} dias restantes`}
      </span>
      <button
        style={{ all: 'unset', cursor: 'pointer' }}
        className="bg-indigo text-fg-1 font-mono font-bold text-[11px] tracking-[1.5px] uppercase px-5 py-3 hover:opacity-90 transition-opacity w-full sm:w-auto mt-2 cursor-pointer"
        onClick={() => onPagar(proximaPagavel)}
        aria-label="Pagar próxima parcela"
      >
        [&gt;] PAGAR AGORA
      </button>
    </section>
  )
}
