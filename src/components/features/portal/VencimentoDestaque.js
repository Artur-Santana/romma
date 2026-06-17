import { fmtBRL, fmtData } from "@/lib/utils"
import StatusBadge from "@/components/ui/StatusBadge"

export default function VencimentoDestaque({ parcelas, contrato, onPagar }) {
  const pagaveis = parcelas.filter(p => p.status === 'pendente' || p.status === 'vencida')
  const proxima = pagaveis.sort(
    (a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento)
  )[0] ?? null

  if (!proxima) return (
    <div style={{ border: "1px solid var(--success)", background: "oklch(0.696 0.17 162.5 / 0.08)", padding: "var(--rd-panel)", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
      <span className="eyebrow eyebrow--indigo" style={{ color: "var(--success)" }}>Em dia</span>
      <span className="r-section">Nenhuma parcela em aberto.</span>
      <span className="r-meta">Todas as parcelas deste ciclo foram pagas.</span>
    </div>
  )

  const total = parcelas.length
  const dias = Math.ceil(
    (new Date(proxima.data_vencimento + 'T12:00:00') - new Date()) / 86400000
  )
  const vencida = proxima.status === 'vencida'

  return (
    <div style={{ border: "1px solid var(--indigo)", background: "oklch(0.339 0.179 301.68 / 0.08)", padding: "var(--rd-panel)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span className="eyebrow eyebrow--indigo" style={{ marginBottom: 8 }}>Próximo Vencimento</span>
          <div className="r-metric" style={{ fontSize: 40 }}>{fmtBRL(contrato.unidades?.valor_mensal)}</div>
          <div className="r-meta" style={{ marginTop: 6 }}>
            Parcela {proxima.numero}/{total} · vence {fmtData(proxima.data_vencimento)}
          </div>
        </div>
        <StatusBadge status={proxima.status} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: vencida ? "var(--danger-fg)" : "var(--warning)" }}>
          ⏱ {Math.abs(dias)} dia(s) {vencida ? "em atraso" : "restantes"}
        </span>
        <button
          style={{ all: "unset", boxSizing: "border-box", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "var(--indigo)", color: "var(--fg-1)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12, letterSpacing: "1.2px", textTransform: "uppercase" }}
          onClick={() => onPagar(proxima)}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          aria-label="Pagar próxima parcela via PIX"
        >
          <span style={{ fontFamily: "var(--font-mono)", opacity: 0.85 }}>PIX</span>
          <span>Pagar Agora</span>
          <span style={{ fontFamily: "var(--font-mono)", opacity: 0.85 }}>→</span>
        </button>
      </div>
    </div>
  )
}
