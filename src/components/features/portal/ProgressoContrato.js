import { cn } from "@/lib/utils"

export default function ProgressoContrato({ parcelas, contrato }) {
  const total = parcelas.length
  const pagas = parcelas.filter(p => p.status === 'paga').length
  const pct = total > 0 ? Math.round((pagas / total) * 100) : 0

  function tileColor(status) {
    if (status === 'paga') return 'bg-success'
    if (status === 'pendente') return 'bg-[var(--warning)]'
    if (status === 'vencida') return 'bg-danger-fg'
    return 'bg-border-3'
  }

  return (
    <section className="border border-border-3 bg-surface p-6 flex flex-col gap-4">
      <span className="eyebrow eyebrow--indigo">PROGRESSO DO CONTRATO</span>

      <div className="flex items-baseline gap-1">
        <span className="font-display font-bold text-[48px] leading-none tracking-[-2px] text-fg-1">
          {pagas}
        </span>
        <span className="font-mono text-[12px] text-fg-3">/{total} parcelas pagas</span>
      </div>

      <div className="flex flex-wrap gap-[5px]" role="img" aria-label={`${pagas} de ${total} parcelas pagas`}>
        {parcelas.map((p) => (
          <div
            key={p.id}
            className={cn("rounded-sm", tileColor(p.status))}
            style={{ width: 22, height: 22 }}
            title={`Parcela ${p.numero}: ${p.status}`}
          />
        ))}
      </div>

      <span className="font-mono text-[11px] text-fg-4">
        {contrato.unidades?.nome ?? "—"}
        <span className={cn("ml-2", pct === 100 ? "text-success" : "text-[var(--warning)]")}>
          · {pct}% adimplente
        </span>
      </span>
    </section>
  )
}
