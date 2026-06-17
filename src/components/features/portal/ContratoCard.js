import { fmtBRL, fmtData } from "@/lib/utils"

export default function ContratoCard({ contrato }) {
  const summary = [
    { label: "Unidade",      value: contrato.unidades?.nome ?? "—" },
    { label: "Valor Mensal", value: fmtBRL(contrato.unidades?.valor_mensal) },
    { label: "Início",       value: fmtData(contrato.data_inicio) },
    { label: "Fim",          value: fmtData(contrato.data_fim) },
  ]

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", border: "1px solid var(--border-3)" }}>
      {summary.map((s, i) => (
        <div
          key={s.label}
          style={{
            padding: "var(--rd-cell)",
            borderRight: i < 3 ? "1px solid var(--border-3)" : "none",
          }}
        >
          <div className="r-label" style={{ marginBottom: 8 }}>{s.label}</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, letterSpacing: "-0.4px", color: "var(--fg-1)" }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  )
}
