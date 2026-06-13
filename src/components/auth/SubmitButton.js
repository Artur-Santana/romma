"use client"

export default function SubmitButton({ isLoad, isSuccess, idleLabel, loadLabel, successLabel }) {
  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <button
        type="submit"
        disabled={isLoad}
        style={{
          all: "unset",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "17px 22px",
          background: isSuccess ? "var(--success)" : "var(--primary)",
          cursor: isLoad ? "default" : "pointer",
          boxShadow: isLoad || isSuccess ? "none" : "0 0 16px 0 var(--primary-glow)",
          transition: "background var(--dur-base), box-shadow var(--dur-base)",
          boxSizing: "border-box",
          color: "var(--fg-1)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            letterSpacing: "1px",
          }}
        >
          {isLoad ? "[···]" : isSuccess ? "[OK]" : "[>]"}
        </span>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          {isLoad ? loadLabel : isSuccess ? successLabel : idleLabel}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            letterSpacing: "1px",
          }}
        >
          {isLoad ? "" : isSuccess ? "200" : "ENTER"}
        </span>
      </button>
      {isLoad && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: 2,
            width: "40%",
            background: "var(--chart-1)",
            animation: "rBar 1s linear infinite",
          }}
        />
      )}
    </div>
  )
}
