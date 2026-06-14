"use client"

const TONES = {
  danger:  { bg: "rgba(147,0,10,0.20)",   border: "var(--danger-fg)", mark: "!" },
  success: { bg: "rgba(16,185,129,0.13)", border: "var(--success)",   mark: "✓" },
  warning: { bg: "var(--warning-bg)",      border: "var(--warning)",   mark: "·" },
}

export default function AuthBanner({ tone = "danger", code, body }) {
  const { bg, border, mark } = TONES[tone]
  return (
    <div
      style={{
        background: bg,
        borderLeft: `2px solid ${border}`,
        padding: "12px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          border: `1px solid ${border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 700,
            color: border,
          }}
        >
          {mark}
        </span>
      </div>
      <div>
        <div className="r-label" style={{ color: border, marginBottom: 4 }}>
          {code}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--fg-2)",
            lineHeight: 1.45,
          }}
        >
          {body}
        </div>
      </div>
    </div>
  )
}
