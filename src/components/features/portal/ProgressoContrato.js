export default function ProgressoContrato({ parcelas, contrato }) {
  const total = parcelas.length
  const pagas = parcelas.filter(p => p.status === 'paga').length
  const pct = total > 0 ? Math.round((pagas / total) * 100) : 0

  function tileBg(status) {
    if (status === 'paga') return 'var(--success)'
    if (status === 'pendente') return 'var(--warning)'
    if (status === 'vencida') return 'var(--danger-fg)'
    return 'var(--surface-hi)'
  }

  return (
    <div style={{ border: "1px solid var(--border-3)", background: "var(--surface)", padding: "var(--rd-panel)" }}>
      <span className="eyebrow eyebrow--indigo" style={{ marginBottom: 12 }}>Progresso do Contrato</span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
        <span className="r-metric" style={{ fontSize: 40 }}>
          {pagas}<span style={{ fontSize: 18, color: "var(--fg-4)", fontFamily: "var(--font-display)", fontWeight: 700 }}>/{total}</span>
        </span>
        <span className="r-meta">parcelas pagas</span>
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        {parcelas.map(p => (
          <div
            key={p.id}
            style={{ flex: 1, height: 24, background: tileBg(p.status) }}
            title={`Parcela ${p.numero}: ${p.status}`}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
        <span className="r-meta">{contrato.unidades?.nome ?? "—"}</span>
        <span className="r-meta" style={{ color: pct === 100 ? "var(--success)" : "var(--warning)" }}>
          {pct}% adimplente
        </span>
      </div>
    </div>
  )
}
