export default function RealtimeDot({ label, compact = false }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span style={{ position: "relative", width: 8, height: 8, flexShrink: 0 }}>
        <span
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--success)",
            animation: "rommaPulse 2s ease-in-out infinite",
          }}
        />
        <span
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--success)",
          }}
        />
      </span>
      {label && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: compact ? 9 : 10,
            color: "var(--fg-2)",
            textTransform: "uppercase",
            letterSpacing: compact ? 0.5 : 1,
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
