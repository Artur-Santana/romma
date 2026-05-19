"use client";

import { useState, useEffect } from "react";

export default function TopStrip() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timestamp = time.toISOString().replace("T", " ").slice(0, 19) + "Z";

  return (
    <div
      style={{
        height: 24,
        background: "oklch(0.218 0 0 / 0.95)",
        borderBottom: "1px solid var(--border-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--fg-3)",
          letterSpacing: 1,
        }}
      >
        INTEGRATED_SYSTEM_NODE: 0X449F
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--fg-3)",
            letterSpacing: 0.5,
          }}
        >
          {timestamp}
        </span>
        <div
          style={{
            width: 6,
            height: 6,
            background: "var(--success)",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--fg-3)",
            letterSpacing: 1,
          }}
        >
          STATUS: SYNCHRONIZED
        </span>
      </div>
    </div>
  );
}
