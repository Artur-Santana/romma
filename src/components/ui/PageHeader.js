"use client"

export default function PageHeader({ eyebrow, title, subtitle, cta }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 48 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span className="eyebrow eyebrow--indigo">{eyebrow}</span>
        <h2 className="font-display" style={{
          fontWeight: 700, fontSize: 48, letterSpacing: -2.4,
          color: "var(--fg-1)", margin: 0, lineHeight: 1
        }}>{title}</h2>
        {subtitle && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)", letterSpacing: 0.3 }}>
            {subtitle}
          </span>
        )}
      </div>
      {cta && (
        <button
          onClick={cta.onClick}
          style={{
            all: "unset", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 20px",
            border: "1px solid var(--indigo)",
            background: "oklch(0.339 0.179 301.68 / 0.08)",
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--indigo)", letterSpacing: 1 }}>
            {cta.code}
          </span>
          <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--fg-1)" }}>
            {cta.label}
          </span>
        </button>
      )}
    </div>
  )
}
