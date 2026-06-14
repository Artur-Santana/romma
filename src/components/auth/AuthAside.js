"use client"

import Image from "next/image"
import CornerBrackets from "./CornerBrackets"

export default function AuthAside() {
  return (
    <div
      className="hidden lg:block relative overflow-hidden"
      style={{ borderRight: "1px solid var(--border-2)" }}
    >
      <Image
        src="/hero-building.png"
        alt="Edifício"
        fill
        style={{ objectFit: "cover", filter: "grayscale(0.3) contrast(1.1) brightness(0.62)" }}
        priority
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg,rgba(0,0,0,0.25) 0%,rgba(0,0,0,0.88) 100%)" }}
      />
      <CornerBrackets />
      {/* Wordmark — top:36px left:36px right:36px */}
      <div style={{ position: "absolute", top: 36, left: 36, right: 36 }}>
        <div className="flex items-center gap-2.5">
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--primary-hover)",
              letterSpacing: "2px",
            }}
          >
            CONSOLE
          </span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 26,
              fontWeight: 700,
              color: "var(--fg-1)",
              letterSpacing: "-0.5px",
            }}
          >
            ROMMA
          </span>
        </div>
      </div>
      {/* Copyblock — bottom:56px left:36px right:36px */}
      <div style={{ position: "absolute", bottom: 56, left: 36, right: 36 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
          <span
            className="inline-block"
            style={{ width: 24, height: 1, background: "var(--primary-hover)" }}
          />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "var(--primary-hover)",
            }}
          >
            ESPAÇOS COMERCIAIS
          </span>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: "-2.6px",
            lineHeight: 1,
            color: "var(--fg-1)",
            margin: 0,
          }}
        >
          CONTROLE INABALÁVEL DE CADA
          <span style={{ color: "var(--primary-hover)" }}>.</span>
          ATIVO
        </h1>
        <p
          className="r-body"
          style={{ maxWidth: 360, color: "var(--fg-2)", marginTop: 16 }}
        >
          Gerencie contratos, locatários e parcelas em um único sistema integrado.
        </p>
      </div>
    </div>
  )
}
