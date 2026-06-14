"use client"

import AuthAside from "./AuthAside"

function TopStrip() {
  return (
    <div
      className="flex items-center justify-between shrink-0"
      style={{
        height: 28,
        background: "rgba(18,18,18,0.95)",
        borderBottom: "1px solid var(--border-2)",
        padding: "0 20px",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: "0.5px",
        color: "var(--fg-4)",
        zIndex: 2,
      }}
    >
      <span>INTEGRATED_SYSTEM_NODE: 0X449F</span>
      <div className="hidden lg:flex items-center gap-4">
        <span>GRID.OS.ALPHA</span>
        <span className="flex items-center gap-1.5">
          <span className="r-dot"><i /><i /></span>
          ONLINE
        </span>
      </div>
    </div>
  )
}

function BottomMeta() {
  return (
    <div
      className="flex justify-between items-center shrink-0"
      style={{
        padding: "10px 20px",
        borderTop: "1px solid var(--border-1)",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: "0.5px",
        color: "var(--fg-5)",
      }}
    >
      <span>ROMMA © 2026 · CONSOLE v2.4.1</span>
      <span className="hidden lg:inline">SESSION_ID: 0XFF8A-2310 // TLS 1.3</span>
    </div>
  )
}

export default function AuthFrame({ children }) {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TopStrip />
      <main
        className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] flex-1 overflow-hidden"
      >
        <AuthAside />
        <div
          className="r-scroll"
          style={{
            overflowY: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 56px",
          }}
        >
          {children}
        </div>
      </main>
      <BottomMeta />
    </div>
  )
}
