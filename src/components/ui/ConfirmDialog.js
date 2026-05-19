"use client";

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = true,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const accentColor = danger ? "var(--danger)" : "var(--indigo)";
  const accentBg    = danger ? "var(--danger-bg)" : "var(--indigo)";
  const eyebrowMod  = danger ? "eyebrow--danger" : "eyebrow--indigo";
  const eyebrowText = danger ? "AÇÃO DESTRUTIVA" : (confirmLabel ?? "Confirmação");

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "oklch(0 0 0 / 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 480,
          background: "var(--background)",
          border: `1px solid ${accentColor}`,
          padding: 32,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <span className={`eyebrow ${eyebrowMod}`}>{eyebrowText}</span>
        <div
          style={{
            fontFamily: "var(--font-display-arch)",
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: -1.2,
            color: "var(--fg-1)",
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: "var(--fg-2)",
          }}
        >
          {body}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              border: "1px solid var(--border-3)",
              background: "transparent",
              padding: "14px 0",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: "var(--fg-2)",
              cursor: "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              border: "none",
              background: accentBg,
              padding: "14px 0",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: danger ? "var(--danger)" : "var(--fg-1)",
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
